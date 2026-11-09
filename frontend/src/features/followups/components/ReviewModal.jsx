import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';

import { Icon } from '../../../shared/components/Icon.jsx';

import { Button } from '../../../shared/components/Button.jsx';
import { ModalShell } from '../../../shared/components/ModalShell.jsx';

export function ReviewModal({ customer, draft, close, send }) {
  const t = useT();
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);
  return (
    <ModalShell title={t('Tinjau pesan sebelum dikirim')} close={close}>
      <div className="modal-body">
        <div className="review-summary">
          <div>
            <small>{t('Penerima')}</small>
            <strong>{t(customer.name)}</strong>
            <span>{t(customer.phone)}</span>
          </div>
          <div>
            <small>{t('Tujuan')}</small>
            <strong>
              {t('Informasi ')}
              {t(customer.goal.toLowerCase())}
            </strong>
            <span>{t('WhatsApp · simulasi')}</span>
          </div>
        </div>
        <label className="message-review">
          {t('Pesan yang akan dikirim ')}
          <textarea value={draft} readOnly rows={6} />
        </label>
        <div className="source-box">
          <strong>{t('Fakta sumber dan izin')}</strong>
          <span>
            <Icon name="check" size={14} /> {t(customer.package)} {t('·')}
            {t(' ')}
            {t(customer.context)}
          </span>
          <span>
            <Icon name="check" size={14} /> {t('Izin WhatsApp aktif · jeda kontak terpenuhi ')}
          </span>
        </div>
        <label className="check-label">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>{t('Saya sudah memeriksa penerima dan isi pesan')}</span>
        </label>
        <p className="demo-note">{t('Mode demo — tidak ada pesan sungguhan yang dikirim. ')}</p>
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={close}>
          {t('Kembali ')}
        </Button>
        <Button
          disabled={!checked || sending}
          onClick={() => {
            setSending(true);
            window.setTimeout(send, 700);
          }}
        >
          {t(sending ? 'Mengirim simulasi...' : 'Kirim simulasi')}
        </Button>
      </div>
    </ModalShell>
  );
}
