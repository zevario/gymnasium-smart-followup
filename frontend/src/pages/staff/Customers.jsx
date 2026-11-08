import { useT } from "../../i18n/useLanguage.js"
import { useState } from "react"
import { PageIntro, Field, Avatar, Badge, Icon } from "../../components/Controls/Controls.jsx"

export function Customers({ customers, onOpen, }) {
    const t = useT();
    const [search, setSearch] = useState("");
    const shown = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return (<>
      <PageIntro eyebrow="DATA CONTOH" title={t("Pelanggan")} subtitle="Lihat status membership dan preferensi kontak setiap member."/>
      <section className="card members-card">
        <div className="member-tools">
          <Field icon="search" value={search} onChange={setSearch} placeholder={t("Cari member")}/>
          <span>{t(shown.length)} {t("member ditampilkan")}</span>
        </div>
        <div className="table-head">
          <span>{t("Member")}</span>
          <span>{t("Status membership")}</span>
          <span>{t("Kunjungan terakhir")}</span>
          <span>{t("Izin kontak")}</span>
          <span>{t("PIC")}</span>
          <span />
        </div>
        {shown.map((c, i) => (<button className="member-row" key={c.id} onClick={() => onOpen(c)}>
            <span className="customer-main">
              <Avatar initials={c.initials}/>
              <span>
                <strong>{t(c.name)}</strong>
                <small>{t(c.package)}</small>
              </span>
            </span>
            <Badge tone={c.blockReason ? "warning" : "active"}>
              {t(c.blockReason
                ? "Perlu ditinjau"
                : i === 1 || i === 4
                    ? "Trial aktif"
                    : "Aktif")}
            </Badge>
            <span>{t(i % 2 ? "13 Okt 2026" : "12 Okt 2026")}</span>
            <span className={c.permission === "Aktif"
                ? "permission-active"
                : "permission-off"}>
              <i />
              {t(c.permission)}
            </span>
            <span>{t(c.owner)}</span>
            <Icon name="chevron" size={16}/>
          </button>))}
      </section>
    </>);
}
