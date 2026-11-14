import { useEffect, useRef } from 'react';
import { Bell, MapPin, X, ChevronRight, Check, Clock } from 'lucide-react';
import { Button } from '../../../shared/components/Button.jsx';
import { kinds, states } from '../memberLabels.js';

export function CustomerInfoDialog({ kind, person, onClose, onRequests }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  const notifications = kind === 'notifications';
  return (
    <dialog
      ref={ref}
      className={
        notifications
          ? 'customer-popup customer-notification-panel'
          : 'customer-popup location-dialog'
      }
      aria-labelledby="customer-info-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          onClose();
      }}
    >
      {notifications ? (
        <>
          <div className="notification-heading">
            <div className="notification-title">
              <span className="notification-bell">
                <Bell size={20} />
              </span>
              <div>
                <strong id="customer-info-title">Notifikasi</strong>
                <p>Aktivitas dan pengingat Anda</p>
              </div>
            </div>
            <button
              className="notification-close"
              autoFocus
              aria-label="Tutup informasi"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="notification-toolbar">
            <span className="notification-count">
              {person.requests.length} pembaruan permintaan
            </span>
          </div>
          {person.requests.length ? (
            <div className="notification-list">
              {person.requests.map((r) => (
                <button key={r.id} className="notification-item" onClick={onRequests}>
                  <span className="notification-avatar">
                    <Bell size={18} />
                  </span>
                  <span className="notification-copy">
                    <span className="notification-item-title">
                      <strong>{kinds[r.kind]}</strong>
                    </span>
                    <span className="notification-description">{r.response || r.note}</span>
                    <time className="notification-time">
                      <Clock size={12} />
                      {new Date(r.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      WIB
                    </time>
                    <span className="notification-item-footer">
                      <small>{states[r.state]}</small>
                      <span>
                        Lihat detail <ChevronRight size={12} />
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="notification-empty">
              <span className="notification-empty-icon">
                <Bell size={26} />
              </span>
              <strong>Belum ada notifikasi</strong>
              <p>Perkembangan permintaan dan jawaban petugas akan tampil di sini.</p>
            </div>
          )}
          <div className="customer-popup-footer">
            <Button variant="secondary" onClick={onRequests}>
              Lihat semua permintaan <ChevronRight size={15} />
            </Button>
          </div>
          <p className="notification-footnote">Pembaruan layanan untuk akun Anda.</p>
        </>
      ) : (
        <>
          <div className="location-dialog-header">
            <div>
              <span className="location-eyebrow">LOKASI LAYANAN ANDA</span>
              <h2 id="customer-info-title">Lokasi aktif</h2>
            </div>
            <button
              className="location-dialog-close"
              autoFocus
              aria-label="Tutup informasi"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="location-dialog-body">
            <div className="location-hero">
              <span className="location-hero-icon">
                <MapPin size={24} />
              </span>
              <div>
                <h3>Gymnasyum Bintaro</h3>
                <p>Smart Follow-up · Member Relations</p>
              </div>
              <span className="location-selected">
                <Check size={12} />
                Aktif
              </span>
            </div>
            <p className="location-description">
              Lokasi layanan akun Anda untuk pengajuan trial, paket, reservasi, dan bantuan petugas.
            </p>
            <dl className="customer-location-facts">
              <div>
                <dt>Zona waktu</dt>
                <dd>WIB · Asia/Jakarta</dd>
              </div>
              <div>
                <dt>Jam follow-up</dt>
                <dd>09.00–18.00 WIB</dd>
              </div>
            </dl>
            <div className="location-access">
              <span className="avatar">
                {person.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div>
                <strong>{person.name}</strong>
                <span>Customer · Gymnasyum Bintaro</span>
              </div>
              <Check size={16} />
            </div>
          </div>
          <div className="location-dialog-footer">
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button onClick={onRequests}>
              Hubungi petugas <ChevronRight size={15} />
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}
