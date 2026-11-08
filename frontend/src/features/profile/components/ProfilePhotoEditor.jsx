import { useT } from "../../../i18n/useLanguage.js";
import { useEffect, useRef, useState } from "react";
import { defaultProfilePhoto, profileAvatars } from "../utils/profilePhoto.js"
const avatarNames = ["Rambut pendek", "Rambut ikal berkacamata", "Rambut pendek berkacamata", "Hijab", "Rambut panjang", "Rambut bob"];
async function readPhoto(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Pilih foto JPG, PNG, atau WEBP.");
    if (file.size > 5 * 1024 * 1024)
        throw new Error("Ukuran foto maksimal 5 MB.");
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        const context = canvas.getContext("2d");
        if (!context)
            throw new Error("Foto belum dapat diproses. Coba lagi.");
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 512, 512);
        context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
        return canvas.toDataURL("image/jpeg", 0.85);
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
export default function ProfilePhotoEditor({ photo, name, onSave, onClose }) {
    const t = useT();
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const requestRef = useRef(0);
    const [tab, setTab] = useState(profileAvatars.includes(photo) ? "avatar" : "upload");
    const [avatarDraft, setAvatarDraft] = useState(profileAvatars.includes(photo) ? photo : defaultProfilePhoto);
    const [uploadDraft, setUploadDraft] = useState(profileAvatars.includes(photo) ? "" : photo);
    const [dragging, setDragging] = useState(false);
    const draft = tab === "avatar" ? avatarDraft : uploadDraft;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const requests = requestRef;
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { requests.current++; dialog.close(); };
    }, []);
    const selectPhoto = async (file) => {
        if (!file)
            return;
        const request = ++requestRef.current;
        setBusy(true);
        setError("");
        try {
            const result = await readPhoto(file);
            if (request === requestRef.current)
                setUploadDraft(result);
        }
        catch (cause) {
            if (request === requestRef.current)
                setError(cause instanceof Error ? cause.message : "Foto tidak dapat dibaca. Pilih foto lain.");
        }
        finally {
            if (request === requestRef.current)
                setBusy(false);
        }
    };
    const close = () => { dialogRef.current?.close(); onClose(); };
    return <dialog ref={dialogRef} className="photo-editor" aria-labelledby="photo-editor-title" onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => event.stopPropagation()} onClick={(event) => {
            if (event.target !== event.currentTarget)
                return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
                close();
        }}>
    <div className="modal-header">
      <div><h2 id="photo-editor-title">{t("Ubah Foto Profil")}</h2><p className="photo-editor-subtitle">{t("Pilih karakter avatar atau upload foto Anda sendiri.")}</p></div>
      <button type="button" aria-label={t("Tutup edit foto profil")} onClick={close}>{t("×")}</button>
    </div>
    <div className="photo-editor-body">
      <div className="photo-tabs" role="tablist" aria-label={t("Sumber foto profil")}>
        {["avatar", "upload"].map((value, index) => <button key={value} type="button" role="tab" id={`photo-tab-${value}`} aria-controls={`photo-panel-${value}`} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} disabled={busy} onClick={() => { setTab(value); setError(""); setDragging(false); }} onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                    return;
                event.preventDefault();
                const next = event.key === "Home" ? "avatar" : event.key === "End" ? "upload" : index === 0 ? "upload" : "avatar";
                setTab(next);
                setError("");
                document.getElementById(`photo-tab-${next}`)?.focus();
            }}>{t(value === "avatar" ? "Karakter Avatar" : "Upload Foto Sendiri")}</button>)}
      </div>
      <div role="tabpanel" id="photo-panel-avatar" aria-labelledby="photo-tab-avatar" hidden={tab !== "avatar"}>
        <div className="photo-avatar-options" aria-label={t("Pilihan avatar")}>
          {profileAvatars.map((src, index) => <button key={src} type="button" disabled={busy} aria-label={t(avatarNames[index])} aria-pressed={avatarDraft === src} onClick={() => { setAvatarDraft(src); setError(""); }}>
            <img src={src} alt={t("")} width={84} height={84}/>
          </button>)}
        </div>
      </div>
      <div role="tabpanel" id="photo-panel-upload" aria-labelledby="photo-tab-upload" hidden={tab !== "upload"} className="photo-upload-panel">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
            void selectPhoto(event.target.files?.[0]);
            event.target.value = "";
        }}/>
        <button type="button" className={`photo-dropzone ${dragging ? "is-dragging" : ""}`} disabled={busy} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); if (!busy)
        setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!busy)
        void selectPhoto(event.dataTransfer.files[0]); }}>
          {uploadDraft ? <img className="photo-editor-preview" src={uploadDraft} alt={t(`Pratinjau foto ${name}`)} width={128} height={128}/> :
            <span className="photo-upload-icon" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 19 6-6 4 4 3-7 4 9"/></svg></span>}
          <strong>{t(busy ? "Memproses foto…" : uploadDraft ? "Ganti foto" : "Klik atau geser foto ke sini")}</strong>
          <span className="photo-editor-hint">{t("JPG, JPEG, PNG, atau WEBP · Maksimal 5 MB")}</span>
          <span className="btn btn-secondary">{t("Pilih dari Perangkat")}</span>
        </button>
        {uploadDraft && <p className="photo-editor-hint">{t("Foto dipotong dari tengah dan tersimpan di browser ini.")}</p>}
      </div>
      {error && <p className="photo-editor-error" role="alert">{t(error)}</p>}
    </div>
    <div className="modal-actions">
      <button className="btn btn-secondary" type="button" onClick={close}>{t("Batal")}</button>
      <button className="btn btn-primary" type="button" disabled={busy || !draft || draft === photo} onClick={() => {
            try {
                onSave(draft);
                close();
            }
            catch {
                setError("Foto belum tersimpan. Penyimpanan browser mungkin penuh atau tidak tersedia. Coba foto lain.");
            }
        }}>{t(tab === "avatar" ? "Pilih Avatar" : "Simpan foto")}</button>
    </div>
  </dialog>;
}
