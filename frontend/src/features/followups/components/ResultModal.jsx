import { useT } from '../../../shared/i18n/useLanguage.js';
import { useState } from 'react';

import { Button } from '../../../shared/components/Button.jsx';
import { ModalShell } from '../../../shared/components/ModalShell.jsx';

export function ResultModal({ close, onSubmit }) {
  const t = useT();
  const [result, setResult] = useState('Membalas');
  const [transaction, setTransaction] = useState('');
  const options = [
    'Membalas',
    'Tertarik',
    'Tidak tertarik',
    'Perpanjangan terverifikasi',
    'Tidak dapat dihubungi',
    'Minta berhenti dihubungi',
  ];
  return (
    <ModalShell title={t('Catat hasil follow-up')} close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(result, result === 'Perpanjangan terverifikasi' ? transaction : undefined);
        }}
      >
        <div className="modal-body form-stack">
          <label>
            {t('Hasil ')}
            <select value={result} onChange={(e) => setResult(e.target.value)}>
              {options.map((x) => (
                <option key={x} value={x}>
                  {t(x)}
                </option>
              ))}
            </select>
          </label>
          {result === 'Perpanjangan terverifikasi' && (
            <label>
              {t('Referensi transaksi demo ')}
              <input
                required
                value={transaction}
                onChange={(e) => setTransaction(e.target.value)}
                pattern=".*\S.*"
                placeholder={t('Contoh: TRX-DEMO-001')}
              />
            </label>
          )}
          {result === 'Minta berhenti dihubungi' && (
            <div className="warning-box">
              {t('Tindakan ini akan menonaktifkan pengiriman pesan berikutnya untuk member ini. ')}
            </div>
          )}
          <label>
            {t('Catatan ')}
            <textarea rows={3} placeholder={t('Tambahkan konteks untuk tim (opsional)')} />
          </label>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            {t('Batal ')}
          </Button>
          <Button type="submit">{t('Simpan hasil')}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
