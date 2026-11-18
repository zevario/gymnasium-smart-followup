"""Draft pesan WhatsApp dengan Google Gemini, dengan template cadangan.

Prinsip (Project Plan, risiko 3 dan 4):
- Model hanya menyusun KALIMAT. Semua fakta (nama, kelas, jam, paket, sisa sesi, tanggal)
  dikirim terstruktur dan dicek ulang: angka di draft harus berasal dari fakta.
- Bila kunci API tidak ada, kuota habis, jaringan putus, atau draft gagal dicek,
  layanan mengembalikan template yang pasti benar. Admin tetap meninjau sebelum mengirim.
- Draft yang sama di-cache agar panggilan ke Gemini (kuota gratis) tetap sedikit.

Konfigurasi (environment atau file ai/.env, JANGAN di-commit):
  GEMINI_API_KEY   kunci dari Google AI Studio (kosong = selalu template)
  GEMINI_MODEL     nama model, default gemini-3.5-flash-lite (tersedia untuk pengguna baru, cukup untuk pesan pendek)
  GEMINI_TIMEOUT   detik, default 12 (harus di bawah DRAFT_TIMEOUT_MS backend, 15 detik)
"""
from __future__ import annotations

import json
import os
import re
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo

import httpx
from pydantic import BaseModel, ConfigDict, Field

WIB = ZoneInfo("Asia/Jakarta")
LOCATION = "Gymnasyum Bintaro"
DEFAULT_MODEL = "gemini-3.5-flash-lite"
MAX_CHARS = 480            # pilot.schema.js membatasi pesan 5–500 karakter
DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
          "September", "Oktober", "November", "Desember"]


def _load_local_env() -> None:
    """Baca ai/.env sederhana (KEY=VALUE) tanpa menimpa environment yang sudah ada."""
    path = Path(__file__).resolve().parents[1] / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


_load_local_env()


class DraftRequest(BaseModel):
    """Fakta terstruktur dari backend. Hanya data yang memang ada di database website."""
    model_config = ConfigDict(extra="ignore")

    kind: Literal["schedule_reminder", "package_reminder", "followup_trial", "followup_renewal"]
    customerName: str = Field(min_length=1, max_length=100)
    priority: Literal["low", "medium", "high"] | None = None
    staffName: str | None = Field(None, max_length=100)
    className: str | None = Field(None, max_length=120)          # schedules.title
    classStartsAt: datetime | None = None                         # schedules.starts_at
    packageName: str | None = Field(None, max_length=120)          # packages.name
    remainingSessions: int | None = Field(None, ge=0)             # total_sessions - used_sessions
    expiresAt: date | None = None                                  # customer_packages.expires_at
    trialDate: date | None = None                                  # tanggal trial (follow-up trial)


def _date(d: date) -> str:
    return f"{DAYS[d.weekday()]}, {d.day} {MONTHS[d.month - 1]} {d.year}"


def _time(t: datetime) -> str:
    local = t.astimezone(WIB) if t.tzinfo else t
    return f"{local:%H.%M} WIB"


def facts_of(req: DraftRequest) -> dict[str, str]:
    """Fakta dalam bentuk kalimat yang boleh dipakai model (sudah dalam WIB dan bahasa Indonesia)."""
    f = {"nama customer": req.customerName.strip(), "lokasi": LOCATION}
    if req.staffName:
        f["nama petugas"] = req.staffName.strip()
    if req.className:
        f["kelas"] = req.className.strip()
    if req.classStartsAt:
        start = req.classStartsAt.astimezone(WIB) if req.classStartsAt.tzinfo else req.classStartsAt
        f["jadwal kelas"] = f"{_date(start.date())} pukul {_time(req.classStartsAt)}"
    if req.packageName:
        f["paket"] = req.packageName.strip()
    if req.remainingSessions is not None:
        f["sisa sesi"] = f"{req.remainingSessions} sesi"
    if req.expiresAt:
        # Paket yang sudah lewat tidak boleh disebut "akan berakhir".
        ended = req.expiresAt < datetime.now(WIB).date()
        f["paket sudah berakhir" if ended else "paket berakhir"] = _date(req.expiresAt)
    if req.trialDate:
        f["tanggal trial"] = _date(req.trialDate)
    return f


GOALS = {
    "schedule_reminder": "Ingatkan jadwal kelas besok dan minta konfirmasi kehadiran. "
                         "Tawarkan bantuan menjadwal ulang bila berhalangan.",
    "package_reminder": "Beri tahu bahwa paket akan segera berakhir sementara masih ada sisa sesi, "
                        "lalu tawarkan bantuan menjadwalkan sesi yang tersisa.",
    "followup_trial": "Ucapkan terima kasih sudah mencoba trial dengan menyebut tanggal trial dari fakta, "
                      "tanyakan pengalamannya, lalu tawarkan bantuan bila ingin melanjutkan latihan.",
    "followup_renewal": "Beri tahu tanggal paket berakhir dan tawarkan bantuan bila ingin melanjutkan. "
                        "Bila fakta berisi 'paket sudah berakhir', tulis bahwa paket sudah berakhir, "
                        "jangan 'akan berakhir'.",
}
TONE = {
    "high": "Customer perlu perhatian lebih: buat lebih personal dan tawarkan bantuan secara aktif.",
    "medium": "Nada ramah dan biasa.",
    "low": "Cukup pengingat singkat dan ringan.",
    None: "Nada ramah dan biasa.",
}
SYSTEM = (
    "Kamu membantu petugas front desk Gymnasyum Bintaro (gym dan private coaching untuk ibu-ibu, "
    "lansia, dan segmen menengah ke atas) menyusun draft pesan WhatsApp. Petugas akan meninjau "
    "draft sebelum mengirim.\n"
    "Aturan:\n"
    "1. Bahasa Indonesia yang sopan dan hangat, sapa dengan 'Kak' diikuti nama customer.\n"
    "2. Pakai HANYA fakta yang diberikan. Jangan menambah tanggal, jam, angka, harga, promo, "
    "diskon, tautan, atau nomor telepon.\n"
    "3. Jangan memberi saran medis atau program latihan, dan jangan menyebut prioritas, skor, atau AI.\n"
    "4. Jangan memakai keterangan waktu relatif seperti kemarin, tadi, lusa, minggu lalu, atau "
    "bulan lalu; sebut tanggal dari fakta. Kata 'besok' hanya untuk pengingat jadwal kelas.\n"
    "5. Maksimal 3 kalimat dan 400 karakter, paling banyak satu emoji.\n"
    "6. Balas HANYA dengan isi pesan, tanpa pembuka, tanda kutip, atau penjelasan."
)


def build_prompt(req: DraftRequest) -> str:
    facts = "\n".join(f"- {k}: {v}" for k, v in facts_of(req).items())
    return f"Tujuan pesan: {GOALS[req.kind]}\nNada: {TONE[req.priority]}\nFakta:\n{facts}"


def template(req: DraftRequest) -> str:
    """Template cadangan: selalu benar karena hanya menyusun fakta."""
    f = facts_of(req)
    hi = f"Halo Kak {f['nama customer']}, kami dari {LOCATION}."
    if req.kind == "schedule_reminder":
        what = f"kelas {f['kelas']}" if "kelas" in f else "jadwal latihan Kakak"
        when = f" pada {f['jadwal kelas']}" if "jadwal kelas" in f else ""
        return (f"{hi} Mengingatkan {what}{when}. Mohon konfirmasi kehadirannya ya, "
                "dan kabari kami bila perlu menjadwal ulang.")
    if req.kind == "package_reminder":
        pkg = f"paket {f['paket']}" if "paket" in f else "paket Kakak"
        left = f" masih ada {f['sisa sesi']}" if "sisa sesi" in f else " masih ada sisa sesi"
        end = f" dan berakhir pada {f['paket berakhir']}" if "paket berakhir" in f else " dan segera berakhir"
        return f"{hi} Di {pkg}{left}{end}. Kami siap membantu menjadwalkan sesi yang tersisa."
    if req.kind == "followup_trial":
        when = f" pada {f['tanggal trial']}" if "tanggal trial" in f else ""
        trial = f['paket'] if "paket" in f else "trial"
        return (f"{hi} Terima kasih sudah mencoba {trial}{when}. Bagaimana pengalaman latihannya? "
                "Kami siap membantu bila Kakak ingin melanjutkan.")
    pkg = f"paket {f['paket']}" if "paket" in f else "paket Kakak"
    if "paket sudah berakhir" in f:
        end = f" sudah berakhir pada {f['paket sudah berakhir']}"
    else:
        end = f" berakhir pada {f['paket berakhir']}" if "paket berakhir" in f else " akan segera berakhir"
    return f"{hi} {pkg[0].upper() + pkg[1:]}{end}. Apakah Kakak ingin dibantu untuk melanjutkan?"


NUMBER = re.compile(r"\d+")
FORBIDDEN = re.compile(r"(https?://|www\.|\bRp\b|rupiah|diskon|promo|potongan harga|\+?62\d{6,}|\b08\d{6,})",
                       re.IGNORECASE)
RELATIVE_TIME = re.compile(r"\b(kemarin|tadi|lusa|minggu lalu|bulan lalu|pekan lalu|hari ini)\b", re.IGNORECASE)


def check(message: str, req: DraftRequest) -> str | None:
    """Alasan penolakan, atau None bila draft aman dipakai."""
    if not message or len(message) > MAX_CHARS:
        return "panjang pesan di luar batas"
    first = req.customerName.strip().split()[0].lower()
    if first not in message.lower():
        return "nama customer tidak disebut"
    if FORBIDDEN.search(message):
        return "mengandung harga, promo, tautan, atau nomor telepon"
    # Waktu relatif bisa salah (mis. trial seminggu lalu disebut "kemarin"); angka tidak menangkapnya.
    relative = RELATIVE_TIME.search(message)
    if relative or (req.kind != "schedule_reminder" and re.search(r"\bbesok\b", message, re.IGNORECASE)):
        return "memakai waktu relatif: " + (relative.group(0) if relative else "besok")
    if "paket sudah berakhir" in facts_of(req) and re.search(r"\b(akan|segera)\b[^.?!]*berakhir", message,
                                                             re.IGNORECASE):
        return "menyebut paket yang sudah berakhir sebagai 'akan berakhir'"
    allowed = set(NUMBER.findall(" ".join(facts_of(req).values())))
    invented = sorted(set(NUMBER.findall(message)) - allowed)
    if invented:
        return "angka di luar fakta: " + ", ".join(invented)
    return None


def call_gemini(prompt: str) -> str:
    """Satu panggilan generateContent (REST v1beta). Melempar exception bila gagal."""
    key = os.environ["GEMINI_API_KEY"]
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    response = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json={
            "systemInstruction": {"parts": [{"text": SYSTEM}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1024},
        },
        timeout=float(os.environ.get("GEMINI_TIMEOUT", "12")),
    )
    response.raise_for_status()
    parts = response.json()["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts).strip().strip('"').strip()


@lru_cache(maxsize=512)
def _generate(payload: str) -> tuple[str, str, str | None]:
    req = DraftRequest.model_validate_json(payload)
    if not os.environ.get("GEMINI_API_KEY"):
        return template(req), "template", "GEMINI_API_KEY belum diisi"
    prompt = build_prompt(req)
    try:
        message = call_gemini(prompt)
        reason = check(message, req)
        if reason:
            # Satu kali perbaikan: kesalahan seperti "kemarin" biasanya hilang bila alasannya disebut.
            message = call_gemini(f"{prompt}\n\nDraft sebelumnya ditolak karena {reason}. "
                                  "Tulis ulang dengan mematuhi semua aturan.")
            reason = check(message, req)
    except Exception as error:  # jaringan, kuota (429), kunci salah, atau respons tak terduga
        return template(req), "template", f"Gemini tidak tersedia ({type(error).__name__})"
    if reason:
        return template(req), "template", f"draft Gemini ditolak: {reason}"
    return message, "gemini", None


def draft(req: DraftRequest) -> dict:
    message, source, reason = _generate(req.model_dump_json())
    return {"message": message, "source": source,
            "model": os.environ.get("GEMINI_MODEL", DEFAULT_MODEL) if source == "gemini" else None,
            "reason": reason}


def status() -> dict:
    return {"provider": "gemini", "configured": bool(os.environ.get("GEMINI_API_KEY")),
            "model": os.environ.get("GEMINI_MODEL", DEFAULT_MODEL), "fallback": "template"}


if __name__ == "__main__":
    # python -m api.genai  -> cek kunci dan buat satu contoh draft dengan Gemini asli
    sample = DraftRequest(kind="schedule_reminder", customerName="Rina Pramesti", priority="high",
                          className="Group Class Regular", classStartsAt="2026-11-20T08:00:00+07:00")
    print(json.dumps(status(), indent=2))
    print(json.dumps(draft(sample), indent=2, ensure_ascii=False))
