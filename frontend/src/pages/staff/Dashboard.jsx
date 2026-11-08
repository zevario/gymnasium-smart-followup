import { useT } from "../../i18n/useLanguage.js"
import { useState } from "react"
import { todayQueue, priorityLabel } from "../../features/followups/services/followupRules.js"
import { PageIntro, Icon, Field, Avatar } from "../../components/Controls/Controls.jsx"
import { Button } from "../../components/Button/Button.jsx"
import { CustomerRow } from "../../features/customers/components/CustomerRow.jsx"

export function Today({ customers, onOpen, onAll, live=false }) {
    const t = useT();
    const [search, setSearch] = useState("");
    const [goal, setGoal] = useState("Semua");
    const [priority, setPriority] = useState("Semua prioritas");
    const [owner, setOwner] = useState("Semua PIC");
    const queue = live ? customers.filter(c=>c.canPrepare) : todayQueue(customers);
    const recommendation = queue[0];
    const blockedCustomers = customers.filter((c) => c.permission !== "Aktif" || c.blockReason);
    const filtered = queue.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) &&
        (goal === "Semua" || c.goal === goal) &&
        (priority === "Semua prioritas" || priority === priorityLabel(c.score)) &&
        (owner === "Semua PIC" || c.owner === owner));
    const reset = () => {
        setSearch("");
        setGoal("Semua");
        setPriority("Semua prioritas");
        setOwner("Semua PIC");
    };
    return (<>
      <PageIntro eyebrow="RUANG KERJA · GYMNASYUM BINTARO" title={t("Follow-up yang tepat, di waktu yang tepat.")} subtitle="Fokus pada member yang paling membutuhkan perhatian hari ini." right={<span className="freshness">
            <span className="pulse"/>
            {t(live?"Terhubung ke server":"Data diperbarui 09.02 WIB ")}</span>}/>
      <section className="kpi-grid">
        {[
            ["Perlu ditindaklanjuti", queue.length, "Tugas aktif hari ini"],
            [
                "Prioritas tinggi",
                queue.filter((c) => c.score >= 70).length,
                "Skor 70 atau lebih",
            ],
            [
                "Menunggu balasan",
                customers.filter((c) => c.status === "Menunggu balasan").length,
                live?"Dalam antrean lokasi":"Dalam data demo",
            ],
            [
                "Selesai",
                customers.filter((c) => c.status === "Selesai").length,
                "Oleh seluruh tim",
            ],
        ].map((x, i) => (<article className="kpi" key={x[0]}>
            <span className={`kpi-icon kpi-${i}`}>
              <Icon name={i === 0
                ? "list"
                : i === 1
                    ? "spark"
                    : i === 2
                        ? "clock"
                        : "check"}/>
            </span>
            <div>
              <small>{t(x[0])}</small>
              <strong>{t(x[1])}</strong>
              <p>{t(x[2])}</p>
            </div>
          </article>))}
      </section>
      <div className="dashboard-grid">
        <section className="card worklist-card">
          <div className="card-head">
            <div>
              <h2>{t("Prioritas hari ini")}</h2>
              <p>{t("Diurutkan berdasarkan skor dan tenggat")}</p>
            </div>
            <span className="count">{t(filtered.length)} {t("member")}</span>
          </div>
          <div className="toolbar">
            <Field icon="search" value={search} onChange={setSearch} placeholder={t("Cari nama member")}/>
            <div className="segmented">
              {["Semua", "Perpanjangan", "Trial"].map((x) => (<button className={goal === x ? "selected" : ""} onClick={() => setGoal(x)} key={x}>
                  {t(x)}
                </button>))}
            </div>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value={"Semua prioritas"}>{t("Semua prioritas")}</option>
              <option value={"Tinggi"}>{t("Tinggi")}</option>
              <option value={"Sedang"}>{t("Sedang")}</option>
              <option value={"Rendah"}>{t("Rendah")}</option>
            </select>
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value={"Semua PIC"}>{t("Semua PIC")}</option>
              {[...new Set(customers.map(c=>c.owner))].map(name=><option key={name} value={name}>{t(name)}</option>)}
            </select>
          </div>
          {filtered.length ? (<div className="customer-list">
              {filtered.map((c) => (<CustomerRow key={c.id} customer={c} onOpen={onOpen}/>))}
            </div>) : (<div className="empty">
              <span>
                <Icon name="check" size={24}/>
              </span>
              <h3>
                {t(queue.length
                ? "Tidak ada follow-up yang cocok"
                : "Antrean hari ini sudah selesai")}
              </h3>
              <p>
                {t(queue.length
                ? "Coba ubah pencarian atau filter."
                : "Tugas menunggu balasan, ditunda, dan mendatang tersedia di Semua follow-up.")}
              </p>
              {queue.length > 0 && (<Button variant="secondary" onClick={reset}>
                  {t("Atur ulang filter ")}</Button>)}
            </div>)}
        </section>
        <aside className="right-column">
          <section className="recommendation">
            <div className="rec-label">
              <Icon name="spark" size={16}/> {t("REKOMENDASI BERIKUTNYA ")}</div>
            <h2>
              {t(recommendation
            ? `Mulai dari ${recommendation.name.split(" ")[0]}`
            : "Semua sudah ditangani")}
            </h2>
            <p>
              {t(recommendation
            ? `${recommendation.package} · ${recommendation.context}. Skor ${recommendation.score}, tertinggi dalam antrean yang layak dihubungi.`
            : "Tidak ada tugas layak kontak yang jatuh tempo hari ini.")}
            </p>
            {recommendation && (<>
                <div className="rec-facts">
                  <span>
                    <Icon name="calendar" size={16}/>
                    {t(recommendation.deadline)}
                  </span>
                </div>
                <Button onClick={() => onOpen(recommendation)}>
                  {t("Tinjau follow-up ")}<Icon name="chevron" size={16}/>
                </Button>
              </>)}
            <small>{t("Pesan AI selalu ditinjau sebelum dikirim.")}</small>
          </section>
          {!live && <section className="card mini-card">
            <div className="card-head">
              <div>
                <h2>{t("Aktivitas tim")}</h2>
                <p>{t("Hari ini")}</p>
              </div>
              <button className="text-button" onClick={onAll}>
                {t("Lihat semua ")}</button>
            </div>
            <div className="timeline compact">
              <div>
                <Avatar initials="AP"/>
                <p>
                  <strong>{t("Alya")}</strong> {t("menyelesaikan follow-up Arif ")}<small>{t("8 menit lalu")}</small>
                </p>
              </div>
              <div>
                <Avatar initials="FJ"/>
                <p>
                  <strong>{t("Fajar")}</strong> {t("mencatat balasan dari Bagas ")}<small>{t("26 menit lalu")}</small>
                </p>
              </div>
            </div>
          </section>}
          <section className="attention">
            <span className="attention-icon">{t("!")}</span>
            <div>
              <strong>{t("Perlu perhatian")}</strong>
              <p>
                {t(blockedCustomers.length)} {t("tugas diblokir karena izin kontak atau data paket. ")}</p>
            </div>
            <button disabled={!blockedCustomers.length} onClick={() => onOpen(blockedCustomers[0])}>
              <Icon name="chevron"/>
            </button>
          </section>
        </aside>
      </div>
    </>);
}
