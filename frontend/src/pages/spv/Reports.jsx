import { useT } from "../../i18n/useLanguage.js"
import { useContext, useState } from "react"
import { AccountContext } from "../../features/auth/context/AccountContext.js"
import { permissions } from "../../features/auth/services/access.js"
import { PageIntro, Badge, Avatar } from "../../components/Controls/Controls.jsx"

const reportRecords = Array.from({ length: 96 }, (_, i) => ({
    day: 14 - (i % 30),
    goal: i % 2 ? "Trial" : "Perpanjangan",
    owner: ["Alya Putri", "Fajar Nugraha", "Nisa Amalia"][i % 3],
    transaction: i % 11 === 0 ? `TRX-DEMO-${String(i + 1).padStart(3, "0")}` : undefined,
    stage: i % 11 === 0
        ? 5
        : i % 7 === 0
            ? 4
            : i % 5 === 0
                ? 3
                : i % 3 === 0
                    ? 2
                    : i % 13 === 0
                        ? 0
                        : 1,
}));

export function Reports() {
    const t = useT();
    const user = useContext(AccountContext);
    const { supervisor } = permissions(user);
    const [range, setRange] = useState("7 hari terakhir");
    const [goal, setGoal] = useState("Perpanjangan");
    const records = reportRecords.filter((r) => (supervisor || r.owner === user?.name) && r.goal === goal && r.day >= (range === "7 hari terakhir" ? 8 : -15));
    const stages = [
        "Dihubungi",
        "Terkirim",
        "Dibaca",
        "Membalas",
        "Tertarik",
        "Pembelian terverifikasi",
    ];
    const totals = stages.map((_, i) => records.filter((r) => r.stage >= i).length);
    const days = Array.from({ length: range === "7 hari terakhir" ? 7 : 30 }, (_, i) => 14 - i).reverse();
    const daily = days.map((day) => records.filter((r) => r.day === day && r.stage >= 1).length);
    return (<>
      <PageIntro eyebrow={supervisor ? "LAPORAN TIM · DATA DEMO" : "AKTIVITAS SAYA · DATA DEMO"} title={t("Ringkasan follow-up")} subtitle="Pantau progres follow-up dan hasil konversi member." right={<div className="report-filters">
            <select aria-label={t("Tujuan laporan")} className="date-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value={"Perpanjangan"}>{t("Perpanjangan")}</option>
              <option value={"Trial"}>{t("Trial")}</option>
            </select>
            <select aria-label={t("Periode laporan")} className="date-select" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value={"7 hari terakhir"}>{t("7 hari terakhir")}</option>
              <option value={"30 hari terakhir"}>{t("30 hari terakhir")}</option>
            </select>
          </div>}/>
      <div className="report-kpis">
        {[
            ["Follow-up terkirim", totals[1]],
            ["Balasan diterima", totals[3]],
            ["Minat tercatat", totals[4]],
            ["Pembelian terverifikasi", totals[5]],
        ].map((x) => (<div className="card" key={x[0]}>
            <small>{t(x[0])}</small>
            <strong>{t(x[1])}</strong>
            <span>
              {t(goal)} {t("· ")}{t(range)}
            </span>
          </div>))}
      </div>
      <div className="report-grid">
        <section className="card funnel-card">
          <div className="card-head">
            <div>
              <h2>{t("Funnel tindak lanjut")}</h2>
              <p>
                {t(goal)} {t("· ")}{t(range)} {t("· hingga 14 Okt 2026 ")}</p>
            </div>
            <Badge tone="demo">{t("Data demo")}</Badge>
          </div>
          <div className="funnel">
            {stages.map((label, i) => (<div key={label}>
                <span>{t(label)}</span>
                <div>
                  <i style={{
                width: `${totals[0] ? (totals[i] / totals[0]) * 100 : 0}%`,
            }}/>
                </div>
                <strong>{t(totals[i])}</strong>
              </div>))}
          </div>
          <p className="chart-note">
            {t("Riwayat demo periode terpilih, terpisah dari antrean hari ini. Pembelian terverifikasi memiliki referensi transaksi sintetis. ")}</p>
        </section>
        <section className="card chart-card">
          <div className="card-head">
            <div>
              <h2>{t("Pengiriman harian")}</h2>
              <p>
                {t(goal)} {t("· total ")}{t(totals[1])} {t("terkirim ")}</p>
            </div>
          </div>
          <div className={`bar-chart ${days.length > 7 ? "chart-month" : ""}`}>
            {days.map((day, i) => (<div key={day} title={t(`${day > 0 ? `${day} Okt` : `${30 + day} Sep`}: ${daily[i]} terkirim`)}>
                <span>
                  <i style={{
                height: `${(daily[i] / Math.max(1, ...daily)) * 100}%`,
            }}/>
                </span>
                <strong>{t(daily[i])}</strong>
                <small>{t(day > 0 ? `${day}` : `${30 + day}`)}</small>
              </div>))}
          </div>
          <div className="legend">
            <span>
              <i />
              {t(goal)} {t("· tanggal Sep / Okt 2026 ")}</span>
          </div>
        </section>
      </div>
      <section className="card staff-table">
        <div className="card-head">
          <div>
            <h2>{t("Aktivitas staf")}</h2>
            <p>
              {t(goal)} {t("· ")}{t(range)}
            </p>
          </div>
        </div>
        <div className="table-head">
          <span>{t("Staf")}</span>
          <span>{t("Ditugaskan")}</span>
          <span>{t("Terkirim")}</span>
          <span>{t("Balasan")}</span>
          <span>{t("Terverifikasi")}</span>
        </div>
        {["Alya Putri", "Fajar Nugraha", "Nisa Amalia"].filter((owner) => supervisor || owner === user?.name).map((owner) => {
            const rows = records.filter((r) => r.owner === owner);
            return (<div className="staff-row" key={owner}>
              <span className="customer-main">
                <Avatar initials={owner
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}/>
                <strong>{t(owner)}</strong>
              </span>
              {[
                    rows.length,
                    rows.filter((r) => r.stage >= 1).length,
                    rows.filter((r) => r.stage >= 3).length,
                    rows.filter((r) => r.stage >= 5).length,
                ].map((n, i) => (<span key={i}>{t(n)}</span>))}
            </div>);
        })}
      </section>
    </>);
}
