"""
generate_data.py (v0.5)
Membuat dataset sintetis untuk proyek Smart Reminder & Follow-up (Gymnasyum).

Sejak v0.5 simulasi mengikuti website tim pada commit 3a95e87 (repo zevario/gymnasium-smart-followup):
- Paket bersesi dari tabel `packages` (6 paket, sama dengan katalog di migrasi
  1794055029669_add-packages-and-predictions.js).
- Sesi berkurang hanya saat kehadiran `present`/`late` (package.service.js consumeSession).
  Paket reguler mulai berlaku pada sesi pertama; paket trial berlaku sejak dibeli.
  Paket menjadi `used_up` saat sesi habis dan `expired` sehari setelah `expires_at`.
- Reminder jadwal 24 jam sebelum kelas (reminder 2 jam nonaktif secara default),
  pengingat paket H-7 bila masih ada sesi, dan No Response setelah 48 jam
  (reminder-scheduler.service.js).
- Delapan fitur dihitung persis seperti `collectFeatures()` di
  backend/src/modules/predictions/prediction.repository.js, sehingga backend bisa
  mengirim fiturnya apa adanya ke Inference API.

Keluaran (folder data/raw):
  customers.csv, packages.csv, customer_packages.csv, schedules.csv,
  attendance.csv, reminders.csv
  priority_dataset.csv        -> dataset untuk model (fitur + label)
  priority_dataset_debug.csv  -> sama, ditambah poin dan label sebelum noise
                                 (HANYA untuk pengecekan, jangan jadi fitur)

Aturan label mengikuti docs/aturan_label.md (versi 0.5). Versi sebelumnya ada di archive/.

Cara menjalankan (dari folder ai, dengan .venv aktif):
    python src/generate_data.py
"""

import random
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
from faker import Faker

# ----------------------------------------------------------------------
# PENGATURAN (ubah di sini bila perlu)
# ----------------------------------------------------------------------
SEED = 42
N_CUSTOMERS = 1200
SIM_START = date(2026, 3, 1)          # awal simulasi
SIM_END = date(2026, 10, 31)          # akhir simulasi
JOIN_LAST = date(2026, 9, 15)         # customer paling akhir bergabung
MAX_SAMPLES_PER_CUSTOMER = 3          # jumlah baris data per customer (maks)
MIN_GAP_BETWEEN_SAMPLES = 10          # jarak minimal antar tanggal acuan (hari)
MIN_HISTORY_DAYS = 3                  # riwayat minimal sebelum tanggal acuan (trial hanya berlaku 7 hari)
CHURN_TAIL_DAYS = 30                  # customer yang berhenti tetap 'active' dan ikut diklasifikasi
NOISE_RATE = 0.065                    # 5-8% label digeser satu tingkat
NO_RESPONSE_HOURS = 48                # reminder-scheduler.service.js: No Response setelah 48 jam
P_LATE = 0.08                         # dari yang hadir, sebagian tercatat 'late'
P_FIRST_TRIAL = 0.35                  # customer baru yang mulai dari paket trial
REFERENCE_HOUR = 12                   # jam "sekarang" pada tanggal acuan (reminder pukul 09.00 sudah terkirim)

# Tipe keterlibatan laten (TIDAK dijadikan fitur)
# share = proporsi customer; p_absent = peluang tidak hadir; p_resched = peluang izin/reschedule
# (status 'excused'); p_respond = peluang membalas reminder; bpw = booking per minggu;
# resp_hours = rata-rata jam membalas; p_renew = peluang membeli paket berikutnya.
PROFILES = {
    "rajin":  dict(share=0.45, p_absent=0.04, p_resched=0.05, p_respond=0.88,
                   bpw=2.4, resp_hours=3.0, p_renew=0.92),
    "sedang": dict(share=0.35, p_absent=0.16, p_resched=0.12, p_respond=0.60,
                   bpw=1.6, resp_hours=10.0, p_renew=0.75),
    "kurang": dict(share=0.20, p_absent=0.38, p_resched=0.22, p_respond=0.30,
                   bpw=0.9, resp_hours=24.0, p_renew=0.45),
}

# Katalog = INSERT INTO packages di migrasi 1794055029669 (nama, kategori, sesi, masa berlaku).
PACKAGES = [
    dict(package_id=1, name="Group Class Regular 4 Sesi", category="group_class",
         session_count=4, validity_days=45, weight=20),
    dict(package_id=2, name="Group Class Regular 8 Sesi", category="group_class",
         session_count=8, validity_days=45, weight=18),
    dict(package_id=3, name="Group Class Regular 12 Sesi", category="group_class",
         session_count=12, validity_days=60, weight=10),
    dict(package_id=4, name="Personal Training Junior Coach 8 Sesi", category="personal_training",
         session_count=8, validity_days=45, weight=15),
    dict(package_id=5, name="Trial Personal Training Junior Coach", category="trial",
         session_count=1, validity_days=7, weight=0),   # hanya sebagai paket pertama
    dict(package_id=6, name="Open Gym 4 Sesi", category="open_gym",
         session_count=4, validity_days=30, weight=17),
]
PKG_BY_ID = {p["package_id"]: p for p in PACKAGES}
TRIAL = PKG_BY_ID[5]
REGULAR = [p for p in PACKAGES if p["category"] != "trial"]

PERSONAS = ["ibu-ibu", "lansia", "menengah ke atas"]   # hanya untuk gaya bahasa GenAI
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

# Nama fitur sama persis dengan kolom yang dikirim backend (prediction.repository.js).
FEATURES = [
    "visits30Days", "daysSinceLastVisit", "attendanceRatio", "reschedules",
    "noResponses", "responseRatio", "remainingSessions", "daysToExpiry",
]

rng = random.Random(SEED)
fake = Faker("id_ID")
Faker.seed(SEED)


# ----------------------------------------------------------------------
# SIMULASI RIWAYAT
# ----------------------------------------------------------------------
def pick_profile():
    r, acc = rng.random(), 0.0
    for name, p in PROFILES.items():
        acc += p["share"]
        if r <= acc:
            return name
    return "sedang"


def jitter(value, spread=0.25, lo=0.01, hi=0.99):
    """Variasi antar-individu supaya customer satu tipe tidak identik."""
    return min(hi, max(lo, value * rng.uniform(1 - spread, 1 + spread)))


def make_reminder(cid, rem_id, rtype, ref_id, send_date, prm):
    """Reminder terkirim pukul 09.00-09.45; tanpa balasan dalam 48 jam -> no_response."""
    sent_at = datetime.combine(send_date, datetime.min.time()).replace(hour=9) + timedelta(
        minutes=rng.randint(0, 45))
    responded_at, status = None, "no_response"
    if rng.random() < prm["p_respond"]:
        hours = rng.expovariate(1.0 / prm["resp_hours"]) + 0.1
        if hours < NO_RESPONSE_HOURS:
            responded_at = sent_at + timedelta(hours=hours)
            status = "responded"
    return dict(reminder_id=rem_id, customer_id=cid, reminder_type=rtype, ref_id=ref_id,
                sent_at=sent_at, responded_at=responded_at, status=status)


def attend_status(prm):
    """Status kehadiran untuk satu booking (enum attendances.status di website)."""
    r = rng.random()
    if r < prm["p_resched"]:
        return "excused"           # backend menghitung 'excused' sebagai reschedule
    if r < prm["p_resched"] + prm["p_absent"]:
        return "absent"
    return "late" if rng.random() < P_LATE else "present"


def simulate():
    customers, cust_pkgs, schedules, attendance, reminders = [], [], [], [], []
    ids = dict(pkg=1, sched=1, rem=1)

    def new_reminder(cid, rtype, ref_id, send_date, prm):
        reminders.append(make_reminder(cid, f"R{ids['rem']:06d}", rtype, ref_id, send_date, prm))
        ids["rem"] += 1

    for i in range(1, N_CUSTOMERS + 1):
        cid = f"C{i:04d}"
        ptype = pick_profile()
        base = PROFILES[ptype]
        prm = dict(
            p_absent=jitter(base["p_absent"]), p_resched=jitter(base["p_resched"], hi=0.5),
            p_respond=jitter(base["p_respond"]), bpw=base["bpw"] * rng.uniform(0.8, 1.2),
            resp_hours=base["resp_hours"] * rng.uniform(0.7, 1.4), p_renew=base["p_renew"],
        )
        join_date = SIM_START + timedelta(days=rng.randint(0, (JOIN_LAST - SIM_START).days))
        customers.append(dict(
            customer_id=cid, name=fake.name(), phone=fake.phone_number(),
            join_date=join_date, persona=rng.choice(PERSONAS),
            engagement_type=ptype,  # kolom laten: JANGAN dipakai sebagai fitur
        ))

        purchase, first, last_end = join_date, True, join_date
        while purchase <= SIM_END:
            pkg = TRIAL if first and rng.random() < P_FIRST_TRIAL else rng.choices(
                REGULAR, weights=[p["weight"] for p in REGULAR])[0]
            first = False
            cp_id = f"CP{ids['pkg']:05d}"
            ids["pkg"] += 1
            trial = pkg["category"] == "trial"
            started = purchase if trial else None
            expires = purchase + timedelta(days=pkg["validity_days"]) if trial else None
            used, used_up_on = 0, None

            d = purchase + timedelta(days=rng.randint(0, 3))
            while d <= SIM_END and used < pkg["session_count"] and (expires is None or d <= expires):
                sid = f"S{ids['sched']:06d}"
                ids["sched"] += 1
                if d - timedelta(days=1) >= join_date:
                    new_reminder(cid, "schedule_24h", sid, d - timedelta(days=1), prm)
                status = attend_status(prm)
                schedules.append(dict(schedule_id=sid, customer_id=cid, customer_package_id=cp_id,
                                      scheduled_date=d))
                attendance.append(dict(schedule_id=sid, customer_id=cid, class_date=d, status=status))
                if status in ("present", "late"):
                    used += 1
                    if started is None:          # paket reguler mulai berlaku pada sesi pertama
                        started = d
                        expires = d + timedelta(days=pkg["validity_days"])
                    if used == pkg["session_count"]:
                        used_up_on = d
                d += timedelta(days=max(1, round(rng.expovariate(prm["bpw"] / 7.0))))

            # Pengingat paket H-7: hanya bila paket masih aktif dan masih punya sesi pada H-7.
            if expires is not None and (used_up_on is None or used_up_on >= expires - timedelta(days=7)):
                h7 = expires - timedelta(days=7)
                if join_date <= h7 <= SIM_END:
                    new_reminder(cid, "package_h7", cp_id, h7, prm)

            end = used_up_on or (expires if expires is not None else min(d, SIM_END))
            cust_pkgs.append(dict(
                customer_package_id=cp_id, customer_id=cid, package_id=pkg["package_id"],
                category=pkg["category"], total_sessions=pkg["session_count"],
                purchase_date=purchase, started_at=started, expires_at=expires,
                used_up_on=used_up_on,
            ))
            last_end = max(last_end, end)
            if rng.random() > prm["p_renew"]:
                break
            purchase = end + timedelta(days=rng.randint(0, 10))

        customers[-1]["last_activity"] = last_end

    return customers, cust_pkgs, schedules, attendance, reminders


# ----------------------------------------------------------------------
# FITUR (sama dengan backend) DAN LABEL
# ----------------------------------------------------------------------
def features_at(ref, att, rems, pkgs, uses_by_pkg):
    """Fitur SEBAGAI DARI tanggal acuan; hanya data sebelum 'sekarang' (mencegah kebocoran)."""
    now = datetime.combine(ref, datetime.min.time()).replace(hour=REFERENCE_HOUR)
    past = [a for a in att if a["class_date"] < ref]
    attended = [a for a in past if a["status"] in ("present", "late")]
    visits30 = sum(1 for a in attended if a["class_date"] >= ref - timedelta(days=30))
    last_visit = max((a["class_date"] for a in attended), default=None)

    sent = [r for r in rems if r["sent_at"] < now]
    responses = sum(1 for r in sent if r["responded_at"] is not None and r["responded_at"] < now)
    no_responses = sum(1 for r in sent if r["status"] == "no_response"
                       and r["sent_at"] + timedelta(hours=NO_RESPONSE_HOURS) <= now)

    # Paket aktif: sudah dibeli, sesi belum habis, belum lewat masa berlaku.
    active = []
    for p in pkgs:
        if p["purchase_date"] > ref:
            continue
        if p["used_up_on"] is not None and p["used_up_on"] < ref:
            continue
        if p["expires_at"] is not None and p["expires_at"] < ref:
            continue
        started = p["started_at"] if p["started_at"] is not None and p["started_at"] < ref else None
        if p["category"] == "trial":
            started = p["started_at"]
        used = sum(1 for d in uses_by_pkg.get(p["customer_package_id"], []) if d < ref)
        expires = p["expires_at"] if started is not None else None
        active.append(dict(p, used=used, expires_now=expires))
    pkg = min(active, key=lambda p: (p["expires_now"] is None, p["expires_now"] or date.max,
                                     p["purchase_date"]), default=None)

    return dict(
        visits30Days=visits30,
        daysSinceLastVisit=None if last_visit is None else (ref - last_visit).days,
        attendanceRatio=round(len(attended) / len(past), 4) if past else None,
        reschedules=sum(1 for a in past if a["status"] == "excused"),
        noResponses=no_responses,
        responseRatio=round(responses / len(sent), 4) if sent else None,
        remainingSessions=None if pkg is None else pkg["total_sessions"] - pkg["used"],
        daysToExpiry=None if pkg is None or pkg["expires_now"] is None
        else (pkg["expires_now"] - ref).days,
        package_category=None if pkg is None else pkg["category"],   # metadata EDA, bukan fitur
    )


def compute_points(f):
    """docs/aturan_label.md bagian 5 (v0.5)."""
    pts = 0
    v = f["visits30Days"]
    pts += 2 if v == 0 else (1 if v <= 2 else 0)
    ds = f["daysSinceLastVisit"]
    pts += 1 if ds is None else (2 if ds > 14 else (1 if ds >= 7 else 0))
    ar = f["attendanceRatio"]
    if ar is not None:
        pts += 2 if ar < 0.6 else (1 if ar < 0.8 else 0)
    rr = f["responseRatio"]
    if rr is not None:
        pts += 3 if rr < 0.30 else (1 if rr <= 0.60 else 0)
    pts += 1 if f["noResponses"] >= 3 else 0
    pts += 1 if f["reschedules"] >= 3 else 0
    rem, exp = f["remainingSessions"], f["daysToExpiry"]
    if rem is None:
        pts += 2                                   # tidak punya paket aktif: peluang perpanjangan
    elif exp is not None and exp <= 7 and rem > 0:
        pts += 3                                   # sesi akan hangus dalam 7 hari
    elif rem <= 1:
        pts += 1                                   # paket hampir habis
    return pts


def points_to_label(pts):
    return "High" if pts >= 8 else ("Medium" if pts >= 4 else "Low")


def add_noise(label):
    if rng.random() >= NOISE_RATE:
        return label
    if label in ("Low", "High"):
        return "Medium"
    return rng.choice(["Low", "High"])


def build_dataset(customers, cust_pkgs, schedules, attendance, reminders):
    att_by_c, rem_by_c, pkg_by_c, uses_by_pkg = {}, {}, {}, {}
    pkg_of_sched = {s["schedule_id"]: s["customer_package_id"] for s in schedules}
    for a in attendance:
        att_by_c.setdefault(a["customer_id"], []).append(a)
        if a["status"] in ("present", "late"):
            uses_by_pkg.setdefault(pkg_of_sched[a["schedule_id"]], []).append(a["class_date"])
    for r in reminders:
        rem_by_c.setdefault(r["customer_id"], []).append(r)
    for p in cust_pkgs:
        pkg_by_c.setdefault(p["customer_id"], []).append(p)

    rows = []
    for c in customers:
        cid = c["customer_id"]
        # Backend mengklasifikasi SEMUA customer aktif setiap siklus, jadi tanggal acuan diambil
        # acak sepanjang masa keanggotaan, termasuk sampai 30 hari setelah aktivitas terakhir.
        first = c["join_date"] + timedelta(days=MIN_HISTORY_DAYS)
        last = min(SIM_END - timedelta(days=1), c["last_activity"] + timedelta(days=CHURN_TAIL_DAYS))
        if first > last:
            continue
        span = (last - first).days
        cands = [first + timedelta(days=rng.randint(0, span)) for _ in range(12)]
        chosen = []
        for d in cands:
            if all(abs((d - x).days) >= MIN_GAP_BETWEEN_SAMPLES for x in chosen):
                chosen.append(d)
            if len(chosen) >= MAX_SAMPLES_PER_CUSTOMER:
                break

        for ref in sorted(chosen):
            f = features_at(ref, att_by_c.get(cid, []), rem_by_c.get(cid, []),
                            pkg_by_c.get(cid, []), uses_by_pkg)
            pts = compute_points(f)
            rule_label = points_to_label(pts)
            rows.append(dict(customer_id=cid, reference_date=ref, **f, label_points=pts,
                             label_rule=rule_label, label=add_noise(rule_label)))
    return pd.DataFrame(rows)


# ----------------------------------------------------------------------
def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    parts = simulate()
    customers, cust_pkgs, schedules, attendance, reminders = parts

    pd.DataFrame(customers).to_csv(OUT_DIR / "customers.csv", index=False)
    pd.DataFrame(PACKAGES).drop(columns=["weight"]).to_csv(OUT_DIR / "packages.csv", index=False)
    pd.DataFrame(cust_pkgs).to_csv(OUT_DIR / "customer_packages.csv", index=False)
    pd.DataFrame(schedules).to_csv(OUT_DIR / "schedules.csv", index=False)
    pd.DataFrame(attendance).to_csv(OUT_DIR / "attendance.csv", index=False)
    pd.DataFrame(reminders).to_csv(OUT_DIR / "reminders.csv", index=False)
    old = OUT_DIR / "reschedules.csv"   # v0.4: reschedule kini status 'excused' di attendance.csv
    if old.exists():
        old.unlink()

    ds = build_dataset(*parts)
    assert (ds["daysToExpiry"].dropna() >= 0).all(), "paket aktif tidak boleh sudah lewat"
    for col in ("attendanceRatio", "responseRatio"):
        assert ds[col].dropna().between(0, 1).all(), col
    ds.to_csv(OUT_DIR / "priority_dataset_debug.csv", index=False)
    ds.drop(columns=["label_points", "label_rule"]).to_csv(OUT_DIR / "priority_dataset.csv", index=False)

    print("=== RINGKASAN ===")
    print(f"Customer          : {len(customers)}")
    print(f"Paket dibeli      : {len(cust_pkgs)}")
    print(f"Booking/jadwal    : {len(schedules)}")
    print(f"Reminder          : {len(reminders)}")
    print(f"Baris dataset     : {len(ds)}")
    print("\nDistribusi label (setelah noise):")
    print((ds['label'].value_counts(normalize=True).reindex(['Low', 'Medium', 'High']) * 100).round(1).astype(str) + " %")
    print("\nDistribusi label sebelum noise:")
    print((ds['label_rule'].value_counts(normalize=True).reindex(['Low', 'Medium', 'High']) * 100).round(1).astype(str) + " %")
    print(f"\nLabel berubah karena noise: {(ds['label'] != ds['label_rule']).mean() * 100:.1f} %")
    print("\nBaris per kategori paket aktif:")
    print(ds["package_category"].fillna("tanpa paket aktif").value_counts().to_string())
    print("\nNilai kosong per fitur:")
    print(ds[FEATURES].isna().sum()[lambda s: s > 0].to_string())
    print(f"\nFile tersimpan di: {OUT_DIR}")


if __name__ == "__main__":
    main()
