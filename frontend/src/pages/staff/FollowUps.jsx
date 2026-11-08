import { useT } from "../../i18n/useLanguage.js"
import { useState } from "react"
import { PageIntro, Field, Icon } from "../../components/Controls/Controls.jsx"
import { CustomerRow } from "../../features/customers/components/CustomerRow.jsx"

export function AllFollowups({ customers, onOpen, }) {
    const t = useT();
    const [status, setStatus] = useState("Semua");
    const [goal, setGoal] = useState("Semua tujuan");
    const [owner, setOwner] = useState("Semua PIC");
    const [search, setSearch] = useState("");
    const filtered = customers.filter((c) => (status === "Semua" || c.status === status) &&
        `${c.name} ${c.package}`.toLowerCase().includes(search.toLowerCase()) &&
        (goal === "Semua tujuan" || c.goal === goal) &&
        (owner === "Semua PIC" || c.owner === owner));
    return (<>
      <PageIntro eyebrow="SMART FOLLOW-UP" title={t("Semua follow-up")} subtitle="Kelola seluruh tindak lanjut member dari satu tempat."/>
      <section className="card full-list">
        <div className="status-tabs">
          {[
            "Semua",
            "Perlu ditinjau",
            "Menunggu balasan",
            "Ditunda",
            "Selesai",
            "Diblokir",
            ...new Set(customers.filter(c=>["Mendatang","Dalam penanganan"].includes(c.status)).map(c=>c.status)),
        ].map((s) => (<button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
              {t(s)}
              <span>
                {t(customers.filter((c) => s === "Semua" || c.status === s)
                .length)}
              </span>
            </button>))}
        </div>
        <div className="list-tools">
          <Field icon="search" value={search} onChange={setSearch} placeholder={t("Cari nama atau paket")}/>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value={"Semua tujuan"}>{t("Semua tujuan")}</option>
            <option value={"Perpanjangan"}>{t("Perpanjangan")}</option>
            <option value={"Trial"}>{t("Trial")}</option>
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value={"Semua PIC"}>{t("Semua PIC")}</option>
            {[...new Set(customers.map(c=>c.owner))].map(name=><option key={name} value={name}>{t(name)}</option>)}
          </select>
        </div>
        {status === "Diblokir" && (<div className="info-banner">
            <span>{t("i")}</span>
            <p>
              <strong>{t("Pengiriman dinonaktifkan untuk tugas diblokir.")}</strong>{t(" ")}
              {t("Tinjau alasan pembatasan pada detail member sebelum mengambil tindakan. ")}</p>
          </div>)}
        <div className="customer-list">
          {filtered.map((c) => (<CustomerRow key={c.id} customer={c} onOpen={onOpen}/>))}
        </div>
        {!filtered.length && (<div className="empty">
            <span>
              <Icon name="check"/>
            </span>
            <h3>{t("Tidak ada tugas dalam status ini")}</h3>
            <p>{t("Perubahan status akan langsung muncul di daftar.")}</p>
          </div>)}
      </section>
    </>);
}
