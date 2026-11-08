import { useT } from "../../../i18n/useLanguage.js"
import { useContext, useState } from "react"
import { AccountContext } from "../../auth/context/AccountContext.js"
import { permissions, mayEditTask } from "../../auth/services/access.js"
import { canContact, priorityLabel, followupDelay } from "../services/followupRules.js"
import { Icon, Badge, Avatar } from "../../../components/Controls/Controls.jsx"
import { Button } from "../../../components/Button/Button.jsx"
import { ModalShell } from "../../../components/ModalShell/ModalShell.jsx"

export function DetailDrawer({ customer: c, onClose, update, notify, }) {
    const t = useT();
    const user = useContext(AccountContext);
    const { supervisor } = permissions(user);
    const ownTask = mayEditTask(user, c.owner);
    const canClaim = c.owner === "Belum ditugaskan" && permissions(user).operational;
    const [assignReason, setAssignReason] = useState("");
    const [tab, setTab] = useState("Ringkasan");
    const [tone, setTone] = useState("Ramah");
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [delayDate, setDelayDate] = useState("2026-10-16T10:00");
    const [newOwner, setNewOwner] = useState("Fajar");
    const eligible = canContact(c);
    const blocked = c.status === "Diblokir" ||
        c.permission !== "Aktif" ||
        Boolean(c.blockReason);
    const isDimas = c.name === "Dimas Saputra";
    const generate = (selectedTone = tone) => {
        if (!ownTask)
            return;
        setLoading(true);
        window.setTimeout(() => {
            const name = c.name.split(" ")[0];
            const sender = user?.name.split(" ")[0] ?? c.owner;
            const context = c.goal === "Trial"
                ? `Terima kasih sudah mencoba ${c.package}. Bagaimana pengalaman latihannya?`
                : `Mengenai ${c.package}: ${c.context.toLowerCase()}.`;
            setDraft(selectedTone === "Formal"
                ? `Selamat pagi, Bapak/Ibu ${name}. Saya ${sender} dari Gymnasyum Bintaro. ${context} Apakah Anda berkenan menerima informasi ${c.goal === "Trial" ? "membership" : "perpanjangan"}?`
                : selectedTone === "Ringkas"
                    ? `Halo Kak ${name}, ${context} Mau info ${c.goal === "Trial" ? "membership" : "perpanjangan"} di Gymnasyum Bintaro?`
                    : `Halo Kak ${name}, saya ${sender} dari Gymnasyum Bintaro. ${context} Saya siap membantu jika Kakak ingin tahu pilihan ${c.goal === "Trial"
                        ? "membership setelah trial"
                        : "perpanjangan paket"}.`);
            setLoading(false);
        }, 650);
    };
    return (<div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={t(`Detail ${c.name}`)}>
        <div className="drawer-header">
          <button className="back-button" onClick={onClose}>
            <Icon name="arrow"/> {t("Kembali ")}</button>
          <div>
            <Badge tone={blocked ? "warning" : "active"}>{t(c.status)}</Badge>
            <button className="icon-button" onClick={onClose} aria-label={t("Tutup")}>
              <Icon name="close"/>
            </button>
          </div>
        </div>
        <div className="drawer-content">
          <div className="customer-hero">
            <Avatar initials={c.initials}/>
            <div>
              <h2>{t(c.name)}</h2>
              <p>
                {t(c.package)} {t("· ")}{t(c.goal)}
              </p>
            </div>
            <button className="more-button">{t("•••")}</button>
          </div>
          <div className="contact-line">
            <span>{t(c.phone)}</span>
            <span className={c.permission === "Aktif"
            ? "permission-active"
            : "permission-off"}>
              <i />
              {t(c.permission === "Aktif"
            ? "Izin WhatsApp aktif"
            : "Izin WhatsApp ditarik")}
            </span>
          </div>
          {blocked && (<div className="blocked-banner">
              <span>{t("!")}</span>
              <div>
                <strong>{t("Follow-up diblokir")}</strong>
                <p>{t(c.blockReason)}</p>
              </div>
            </div>)}
          <div className="detail-tabs">
            <button className={tab === "Ringkasan" ? "active" : ""} onClick={() => setTab("Ringkasan")}>
              {t("Ringkasan ")}</button>
            <button className={tab === "Riwayat" ? "active" : ""} onClick={() => setTab("Riwayat")}>
              {t("Riwayat ")}<span>{t((c.history?.length ?? 0) + 2)}</span>
            </button>
          </div>
          {tab === "Ringkasan" ? (<>
              <section className="detail-section">
                <div className="section-title">
                  <h3>{t("Ringkasan member")}</h3>
                  <Badge tone="demo">{t("Data membership")}</Badge>
                </div>
                <div className="summary-grid">
                  <div>
                    <small>{t("Paket target")}</small>
                    <strong>{t(c.package)}</strong>
                    <span>{t(c.context)}</span>
                  </div>
                  <div>
                    <small>{t("Kunjungan terakhir")}</small>
                    <strong>
                      {t(c.goal === "Trial" ? "13 Okt 2026" : "12 Okt 2026")}
                    </strong>
                    <span>
                      {t(c.goal === "Trial" ? "Kunjungan trial" : "Check-in demo")}
                    </span>
                  </div>
                  <div>
                    <small>{t("Kontak terakhir")}</small>
                    <strong>{t(c.lastContact ?? "10 Okt 2026")}</strong>
                    <span>
                      {t(c.nextEligible
                ? `Kontak berikutnya: ${c.nextEligible}`
                : "Kontak demo sebelumnya")}
                    </span>
                  </div>
                  <div>
                    <small>{t("PIC")}</small>
                    <strong>{t(c.owner)}</strong>
                    <span>{t("Member Relations")}</span>
                  </div>
                </div>
                <div className="data-source">
                  <span>{t("Sumber: Data membership")}</span>
                  <span>{t("Diperbarui 09.02 WIB")}</span>
                </div>
              </section>
              {!isDimas && (<details className="priority-explain">
                  <summary>
                    <span>
                      <Icon name="chart" size={17}/> {t("Mengapa diprioritaskan? ")}</span>
                    <strong>
                      {t(c.score)} {t("· ")}{t(priorityLabel(c.score))}{t(" ")}
                      <Icon name="chevron" size={15}/>
                    </strong>
                  </summary>
                  <div>
                    <div className="score-parts">
                      {[
                    ["Urgensi", String(Math.min(c.score, 40))],
                    ["Konteks", String(Math.max(0, c.score - 40))],
                ].map((x) => (<span key={x[0]}>
                          <small>{t(x[0])}</small>
                          <strong>{t("+")}{t(x[1])}</strong>
                        </span>))}
                    </div>
                    <p>{t("Skor berbasis aturan, bukan prediksi peluang membeli.")}</p>
                  </div>
                </details>)}
              <section className="eligibility">
                <h3>{t("Kelayakan kontak")}</h3>
                <div>
                  <span>
                    <Icon name={c.permission === "Aktif" ? "check" : "close"} size={14}/>{t(" ")}
                    {t("Izin ")}{t(c.permission === "Aktif" ? "aktif" : "ditarik")}
                  </span>
                  <span>
                    <Icon name={eligible ? "check" : "clock"} size={14}/>{t(" ")}
                    {t(c.nextEligible
                ? `Jeda aktif hingga ${c.nextEligible}`
                : eligible
                    ? `Jeda ${followupDelay()} hari terpenuhi`
                    : `Kontak nonaktif · ${c.status}`)}
                  </span>
                  <span>
                    <Icon name="clock" size={14}/> {t("Jam kontak 09.00–18.00 WIB ")}</span>
                </div>
              </section>
              {eligible && (ownTask || canClaim) && (<>
                  {canClaim && (<div className="claim-box">
                      <div>
                        <strong>{t("Follow-up ini belum memiliki PIC")}</strong>
                        <p>{t("Ambil tugas untuk mulai menyiapkan pesan.")}</p>
                      </div>
                      <Button onClick={() => {
                        update(c.id, { owner: user.name.split(" ")[0] });
                        notify(`Follow-up ${c.name} ditugaskan kepada Anda`);
                    }}>
                        {t("Ambil follow-up ")}</Button>
                    </div>)}
                  <section className="composer">
                    <div className="composer-head">
                      <div>
                        <span className="ai-icon">
                          <Icon name="spark" size={17}/>
                        </span>
                        <div>
                          <h3>{t("Asisten pesan AI")}</h3>
                          <p>{t("Susun draft dari fakta member yang tersedia.")}</p>
                        </div>
                      </div>
                      {draft && (<>
                          <Badge tone="blue">{t("Draft AI")}</Badge>
                          <Badge tone="warning">{t("Perlu ditinjau")}</Badge>
                        </>)}
                    </div>
                    <div className="tone-row">
                      <span>{t("Nada pesan")}</span>
                      <div className="segmented">
                        {["Ramah", "Ringkas", "Formal"].map((x) => (<button className={tone === x ? "selected" : ""} key={x} onClick={() => {
                        setTone(x);
                        if (draft)
                            generate(x);
                    }}>
                            {t(x)}
                          </button>))}
                      </div>
                    </div>
                    {!draft ? (<div className="draft-empty">
                        <Icon name="spark" size={22}/>
                        <p>
                          {t("Draft akan menggunakan data paket, tanggal berakhir, dan konteks interaksi. ")}</p>
                        <Button onClick={() => generate()} disabled={loading ||
                        !ownTask}>
                          {loading ? (<>
                              <span className="spinner"/> {t("Menyusun draft... ")}</>) : ("Buat draft pesan")}
                        </Button>
                      </div>) : (<>
                        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5}/>
                        <div className="draft-meta">
                          <span>{t(draft.length)} {t("/ 500 karakter")}</span>
                          <button onClick={() => {
                        navigator.clipboard?.writeText(draft);
                        notify("Draft disalin ke papan klip");
                    }}>
                            <Icon name="copy" size={14}/> {t("Salin ")}</button>
                        </div>
                        <div className="facts">
                          <small>{t("Fakta yang digunakan")}</small>
                          <span>{t(c.package)}</span>
                          <span>{t(c.context)}</span>
                          <span>{t("Lokasi Bintaro")}</span>
                        </div>
                        <div className="composer-actions">
                          <Button variant="secondary" onClick={() => generate()}>
                            {t("Buat ulang ")}</Button>
                          <Button onClick={() => setModal("review")}>
                            {t("Tinjau pesan ")}</Button>
                        </div>
                      </>)}
                  </section>
                </>)}
            </>) : (<History customer={c}/>)}
        </div>
        {!ownTask && !canClaim && <p className="task-readonly">{t("Mode baca: tugas ini milik ")}{t(c.owner)}{t(". Hubungi supervisor untuk pengalihan PIC.")}</p>}
        <div className="drawer-footer">
          <Button variant="secondary" onClick={() => setModal("delay")} disabled={blocked || !ownTask}>
            {t("Tunda ")}</Button>
          <Button variant="secondary" disabled={!supervisor} onClick={() => { if (supervisor)
        setModal("assign"); }}>
            {t("Alihkan PIC ")}</Button>
          <Button variant="dark" disabled={!ownTask} onClick={() => { if (ownTask)
        setModal("result"); }}>
            {t("Catat hasil ")}</Button>
        </div>
      </aside>
      {modal === "review" && ownTask && (<ReviewModal customer={c} draft={draft} close={() => setModal(null)} send={() => {
                if (!ownTask || !canContact(c))
                    return;
                update(c.id, {
                    status: "Menunggu balasan",
                    lastContact: "14 Okt 2026 · 10.00 WIB",
                    nextEligible: `${14 + followupDelay()} Okt 2026 · 10.00 WIB`,
                    history: [
                        `14 Okt · 10.00 WIB — Simulasi pesan ditinjau dan dikirim oleh ${c.owner}. Menunggu balasan; jeda kontak hingga ${14 + followupDelay()} Okt · 10.00 WIB.`,
                        ...(c.history ?? []),
                    ],
                });
                setModal(null);
                notify("Simulasi terkirim. Tidak ada pesan sungguhan yang dikirim.");
            }}/>)}
      {modal === "delay" && ownTask && (<ActionModal title={t("Tunda follow-up")} close={() => setModal(null)} submit="Simpan penundaan" onSubmit={() => {
                update(c.id, {
                    status: "Ditunda",
                    deadline: new Date(delayDate).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    history: [
                        `Ditunda hingga ${delayDate.replace("T", " ")}`,
                        ...(c.history ?? []),
                    ],
                });
                setModal(null);
                notify("Penundaan tersimpan sesuai waktu pilihan");
            }}>
          <label>
            {t("Tanggal dan waktu ")}<input type="datetime-local" required min="2026-10-14T10:01" value={delayDate} onChange={(e) => setDelayDate(e.target.value)}/>
          </label>
          <label>
            {t("Alasan penundaan ")}<textarea required placeholder={t("Tuliskan alasan untuk tim")} rows={3}/>
          </label>
        </ActionModal>)}
      {modal === "assign" && supervisor && (<ActionModal title={t("Alihkan PIC")} close={() => setModal(null)} submit="Alihkan" onSubmit={() => {
                if (!supervisor || !assignReason.trim())
                    return;
                update(c.id, {
                    owner: newOwner,
                    history: [`PIC dialihkan ke ${newOwner} oleh ${user?.name}. Alasan: ${assignReason.trim()}`, ...(c.history ?? [])],
                });
                setModal(null);
                notify(`PIC berhasil dialihkan ke ${newOwner}`);
            }}>
          <label>
            {t("Pilih PIC ")}<select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
              <option value={"Fajar"}>{t("Fajar")}</option>
              <option value={"Nisa"}>{t("Nisa")}</option>
              <option value={"Alya"}>{t("Alya")}</option>
            </select>
          </label>
          <label>{t("Alasan pengalihan")}<textarea required value={assignReason} onChange={(event) => setAssignReason(event.target.value)}/></label>
          <p className="modal-note">
            {t("PIC baru akan melihat tugas ini pada daftar follow-up mereka. ")}</p>
        </ActionModal>)}
      {modal === "result" && ownTask && (<ResultModal close={() => setModal(null)} onSubmit={(result, transaction) => {
                const optout = result === "Minta berhenti dihubungi";
                update(c.id, {
                    transaction,
                    history: [
                        `14 Okt — Hasil: ${result}${transaction ? ` · Transaksi ${transaction}` : ""}`,
                        ...(c.history ?? []),
                    ],
                    status: optout ? "Diblokir" : "Selesai",
                    permission: optout ? "Ditarik" : c.permission,
                    blockReason: optout
                        ? "Member meminta berhenti dihubungi. Pengiriman selanjutnya dinonaktifkan."
                        : c.blockReason,
                });
                setModal(null);
                notify("Hasil follow-up berhasil dicatat");
            }}/>)}
    </div>);
}

export function History({ customer }) {
    const t = useT();
    const events = [
        ...(customer.history ?? []),
        `14 Okt · 09.02 — Tugas ${customer.goal.toLowerCase()} dibuat: ${customer.context}.`,
        `Data membership — ${customer.package}. PIC: ${customer.owner}.`,
    ];
    return (<section className="history">
      <h3>{t("Riwayat aktivitas")}</h3>
      {events.map((event, i) => (<div key={i}>
          <span>
            <i />
          </span>
          <p>
            <strong>{t(event)}</strong>
          </p>
        </div>))}
    </section>);
}

export function ReviewModal({ customer, draft, close, send, }) {
    const t = useT();
    const [checked, setChecked] = useState(false);
    const [sending, setSending] = useState(false);
    return (<ModalShell title={t("Tinjau pesan sebelum dikirim")} close={close}>
      <div className="modal-body">
        <div className="review-summary">
          <div>
            <small>{t("Penerima")}</small>
            <strong>{t(customer.name)}</strong>
            <span>{t(customer.phone)}</span>
          </div>
          <div>
            <small>{t("Tujuan")}</small>
            <strong>{t("Informasi ")}{t(customer.goal.toLowerCase())}</strong>
            <span>{t("WhatsApp · simulasi")}</span>
          </div>
        </div>
        <label className="message-review">
          {t("Pesan yang akan dikirim ")}<textarea value={draft} readOnly rows={6}/>
        </label>
        <div className="source-box">
          <strong>{t("Fakta sumber dan izin")}</strong>
          <span>
            <Icon name="check" size={14}/> {t(customer.package)} {t("·")}{t(" ")}
            {t(customer.context)}
          </span>
          <span>
            <Icon name="check" size={14}/> {t("Izin WhatsApp aktif · jeda kontak terpenuhi ")}</span>
        </div>
        <label className="check-label">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}/>
          <span>{t("Saya sudah memeriksa penerima dan isi pesan")}</span>
        </label>
        <p className="demo-note">
          {t("Mode demo — tidak ada pesan sungguhan yang dikirim. ")}</p>
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={close}>
          {t("Kembali ")}</Button>
        <Button disabled={!checked || sending} onClick={() => {
            setSending(true);
            window.setTimeout(send, 700);
        }}>
          {t(sending ? "Mengirim simulasi..." : "Kirim simulasi")}
        </Button>
      </div>
    </ModalShell>);
}

export function ActionModal({ title, close, submit, onSubmit, children, }) {
    const t = useT();
    return (<ModalShell title={t(title)} close={close}>
      <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
        }}>
        <div className="modal-body form-stack">{t(children)}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            {t("Batal ")}</Button>
          <Button type="submit">{t(submit)}</Button>
        </div>
      </form>
    </ModalShell>);
}

export function ResultModal({ close, onSubmit, }) {
    const t = useT();
    const [result, setResult] = useState("Membalas");
    const [transaction, setTransaction] = useState("");
    const options = [
        "Membalas",
        "Tertarik",
        "Tidak tertarik",
        "Perpanjangan terverifikasi",
        "Tidak dapat dihubungi",
        "Minta berhenti dihubungi",
    ];
    return (<ModalShell title={t("Catat hasil follow-up")} close={close}>
      <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(result, result === "Perpanjangan terverifikasi" ? transaction : undefined);
        }}>
        <div className="modal-body form-stack">
          <label>
            {t("Hasil ")}<select value={result} onChange={(e) => setResult(e.target.value)}>
              {options.map((x) => (<option key={x} value={x}>{t(x)}</option>))}
            </select>
          </label>
          {result === "Perpanjangan terverifikasi" && (<label>
              {t("Referensi transaksi demo ")}<input required value={transaction} onChange={(e) => setTransaction(e.target.value)} pattern=".*\S.*" placeholder={t("Contoh: TRX-DEMO-001")}/>
            </label>)}
          {result === "Minta berhenti dihubungi" && (<div className="warning-box">
              {t("Tindakan ini akan menonaktifkan pengiriman pesan berikutnya untuk member ini. ")}</div>)}
          <label>
            {t("Catatan ")}<textarea rows={3} placeholder={t("Tambahkan konteks untuk tim (opsional)")}/>
          </label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            {t("Batal ")}</Button>
          <Button type="submit">{t("Simpan hasil")}</Button>
        </div>
      </form>
    </ModalShell>);
}
