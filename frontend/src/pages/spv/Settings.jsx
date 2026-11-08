import { useT } from "../../i18n/useLanguage.js"
import { useContext, useState } from "react"
import { AccountContext } from "../../features/auth/context/AccountContext.js"
import { permissions } from "../../features/auth/services/access.js"
import { followupDelay } from "../../features/followups/services/followupRules.js"
import { PageIntro, Avatar, Badge } from "../../components/Controls/Controls.jsx"
import { Button } from "../../components/Button/Button.jsx"

export function Settings({ notify }) {
    const t = useT();
    const user = useContext(AccountContext);
    const readOnly = !permissions(user).supervisor;
    const [tab, setTab] = useState("Aturan follow-up");
    const [delay, setDelay] = useState(followupDelay);
    return (<>
      <PageIntro eyebrow="PENGATURAN" title={t("Pengaturan Smart Follow-up")} subtitle="Sesuaikan aturan operasional dan akses tim untuk lokasi ini."/>
      {readOnly && <p className="settings-readonly-note">{t("Pengaturan ini hanya dapat diubah oleh Supervisor. Hubungi supervisor untuk mengajukan perubahan.")}</p>}
      <fieldset disabled={readOnly} className="settings-access">
      <div className="settings-layout">
        <div className="settings-tabs">
          <button className={tab === "Aturan follow-up" ? "active" : ""} onClick={() => setTab("Aturan follow-up")}>
            {t("Aturan follow-up ")}</button>
          <button disabled title={t("Pengelolaan akun tersedia untuk Administrator Sistem")} className={tab === "Tim & peran" ? "active" : ""} onClick={() => setTab("Tim & peran")}>
            {t("Tim & peran ")}</button>
        </div>
        {tab === "Aturan follow-up" ? (<section className="card settings-card">
            <div className="setting-section">
              <h2>{t("Waktu dan batas kontak")}</h2>
              <p>
                {t("Aturan ini membantu tim menghubungi member pada waktu yang sesuai. ")}</p>
              <div className="form-grid">
                <label>
                  {t("Jam operasional ")}<div className="dual-input">
                    <input defaultValue="09.00"/>
                    <span>{t("hingga")}</span>
                    <input defaultValue="18.00"/>
                  </div>
                </label>
                <label>
                  {t("Zona waktu ")}<select defaultValue="Asia/Jakarta">
                    <option value={"Asia/Jakarta"}>{t("Asia/Jakarta")}</option>
                    <option value={"Asia/Makassar"}>{t("Asia/Makassar")}</option>
                    <option value={"Asia/Jayapura"}>{t("Asia/Jayapura")}</option>
                  </select>
                </label>
                <label>
                  {t("Jeda minimum kontak ")}<select value={delay} onChange={(event) => setDelay(Number(event.target.value))}>
                    {[3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{t(days)} {t("hari")}</option>)}
                  </select>
                </label>
                <label>
                  {t("Maks. kontak proaktif ")}<div className="suffix-input">
                    <input defaultValue="3"/>
                    <span>{t("per 7 hari berjalan")}</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="setting-section">
              <h2>{t("Siklus follow-up")}</h2>
              <p>{t("Tentukan kapan tugas dibuat dan berakhir.")}</p>
              <div className="rule-list">
                <div>
                  <span className="rule-icon">{t("T")}</span>
                  <strong>{t("Trial")}</strong>
                  <p>
                    {t("Kontak pertama ")}<b>{t("24 jam")}</b> {t("· kedua ")}<b>{t("72 jam")}</b> {t("· berakhir ")}<b>{t("14 hari")}</b>
                  </p>
                  <Button variant="ghost">{t("Ubah")}</Button>
                </div>
                <div>
                  <span className="rule-icon">{t("P")}</span>
                  <strong>{t("Perpanjangan")}</strong>
                  <p>
                    {t("Kontak pada ")}<b>{t("H-7")}</b> {t("dan ")}<b>{t("H-2")}</b> {t("· berakhir ")}<b>{t("H+7")}</b>
                  </p>
                  <Button variant="ghost">{t("Ubah")}</Button>
                </div>
              </div>
              <label className="attempts">
                {t("Maksimum percobaan per siklus")}{t(" ")}
                <select defaultValue="2">
                  <option value={"1"}>{t("1")}</option>
                  <option value={"2"}>{t("2")}</option>
                  <option value={"3"}>{t("3")}</option>
                </select>
              </label>
            </div>
            <div className="settings-footer">
              <p>{t("Konfigurasi contoh untuk validasi operasional")}</p>
              <Button onClick={() => {
                if (!readOnly) {
                    try {
                        localStorage.setItem("gymnasyum-followup-days", String(delay));
                        notify("Pengaturan demo berhasil disimpan");
                    }
                    catch {
                        notify("Pengaturan gagal disimpan di browser");
                    }
                }
            }}>
                {t("Simpan perubahan ")}</Button>
            </div>
          </section>) : (<section className="card settings-card">
            <div className="setting-section">
              <div className="card-head">
                <div>
                  <h2>{t("Tim Gymnasyum Bintaro")}</h2>
                  <p>{t("Kelola tanggung jawab dan akses staf.")}</p>
                </div>
                <Button>{t("Tambah anggota")}</Button>
              </div>
              <div className="team-list">
                {[
                [
                    "AP",
                    "Alya Putri",
                    "alya.putri@gymnasyum.demo",
                    "Member Relations",
                ],
                [
                    "FJ",
                    "Fajar Nugraha",
                    "fajar.n@gymnasyum.demo",
                    "Member Relations",
                ],
                ["NA", "Nisa Amalia", "nisa.a@gymnasyum.demo", "Manager"],
                ["RK", "Raka Kurnia", "raka.k@gymnasyum.demo", "Admin"],
            ].map((r) => (<div key={r[1]}>
                    <span className="customer-main">
                      <Avatar initials={r[0]}/>
                      <span>
                        <strong>{t(r[1])}</strong>
                        <small>{t(r[2])}</small>
                      </span>
                    </span>
                    <Badge tone="neutral">{t(r[3])}</Badge>
                    <Button variant="ghost">{t("Kelola")}</Button>
                  </div>))}
              </div>
            </div>
          </section>)}
      </div>
      </fieldset>
    </>);
}
