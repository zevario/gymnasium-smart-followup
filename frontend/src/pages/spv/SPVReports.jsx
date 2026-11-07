import { useEffect, useState } from 'react';
import { getReports } from '../../services/api';
import '../../assets/styles/spv/SPVReports.css';
import useI18n from '../../i18n/useI18n.js';

const todayString = () => new Date().toISOString().slice(0, 10);
const offsetDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const summaryLabels = [
  ['scheduledReminders', 'Reminder terjadwal'],
  ['sentReminders', 'Reminder terkirim'],
  ['responsesReceived', 'Respons diterima'],
  ['noResponse', 'Tanpa respons'],
  ['completedFollowups', 'Follow-up selesai'],
  ['postponedFollowups', 'Follow-up ditunda'],
  ['highPriorityMembers', 'Member prioritas tinggi'],
];

function SPVReports() {
  const { t, formatDate, formatNumber } = useI18n();
  const [from, setFrom] = useState(offsetDate(29));
  const [to, setTo] = useState(todayString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');

  const loadReport = async (periodFrom = from, periodTo = to) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReports({ from: periodFrom, to: periodTo });
      setReport(data.report);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getReports()
      .then((data) => {
        if (active) setReport(data.report);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (from > to) {
      setDateError(t('report.invalidPeriod'));
      return;
    }
    setDateError('');
    loadReport(from, to);
  };

  const maxDailySent = Math.max(
    1,
    ...(report?.trends || []).map((day) => Number(day.remindersSent) || 0),
  );

  return (
    <main className="spv-reports">
      <header className="spv-reports-heading">
        <div>
          <span className="spv-section-label">{t('DATABASE REPORTS')}</span>
          <h1>{t('Laporan Aktivitas')}</h1>
          <p>{t('Indikator dihitung dari reminder dan follow-up yang tersimpan.')}</p>
        </div>
      </header>

      <form className="spv-report-filters spv-report-panel" onSubmit={handleSubmit}>
          <label className="spv-report-date-field">
            <span>{t('Dari')}</span>
            <input
              type="date"
              max={to}
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setDateError('');
              }}
            />
          </label>
          <label className="spv-report-date-field">
            <span>{t('Sampai')}</span>
            <input
              type="date"
              min={from}
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setDateError('');
              }}
            />
          </label>
          <button type="submit" disabled={loading}>{t('Tampilkan')}</button>
      </form>
      {dateError && <p className="spv-report-error" role="alert">{t(dateError)}</p>}
      {error && <p className="spv-report-error" role="alert">{t(error)}</p>}
      {loading ? (
        <section className="spv-report-panel spv-report-state">{t('Memuat laporan...')}</section>
      ) : report ? (
          <>
            <section className="spv-report-stats" aria-label={t('Ringkasan Harian')}>
              {summaryLabels.map(([key, label]) => (
                <article className="spv-report-stat" key={key}>
                  <span>{t(label)}</span>
                  <strong>{formatNumber(report.summary[key] ?? 0)}</strong>
                </article>
              ))}
            </section>

            <section className="spv-report-panel spv-report-section">
              <header className="spv-report-section-heading">
                <h2>{t('Pengiriman Reminder Harian')}</h2>
                <p>{t('Jumlah pengiriman yang dikonfirmasi dan tersimpan per hari.')}</p>
              </header>
              {report.trends.length ? (
                <div className="spv-report-trend-chart-scroll">
                  <div className="spv-report-trend-chart" role="list">
                    {report.trends.map((day) => {
                      const sent = Number(day.remindersSent) || 0;
                      const height = Math.max(4, (sent / maxDailySent) * 100);
                      return (
                        <div
                          className="spv-report-trend-bar-group"
                          key={day.date}
                          role="listitem"
                          aria-label={t('{{count}} reminder terkirim pada {{date}}', {
                            count: formatNumber(sent),
                            date: formatDate(day.date),
                          })}
                        >
                          <strong>{formatNumber(sent)}</strong>
                          <div className="spv-report-trend-bar-track">
                            <span
                              className="spv-report-trend-bar"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span>{formatDate(day.date, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <p className="spv-report-state">{t('Tidak ada aktivitas pada periode ini.')}</p>}
            </section>

            <section className="spv-report-panel spv-report-section">
              <header className="spv-report-section-heading">
                <h2>{t('Aktivitas Staff')}</h2>
              </header>
              {report.staffActivity.length ? (
                <div className="spv-report-list">
                  {report.staffActivity.map((item) => (
                    <article className="spv-report-activity-row" key={item.userId}>
                      <div className="spv-report-person">
                        <strong>{item.name}</strong>
                        <span>{t(item.role.toUpperCase())}</span>
                      </div>
                      <span>{formatNumber(item.contacts)} {t('komunikasi')}</span>
                      <span>{formatNumber(item.statusChanges)} {t('perubahan status')}</span>
                      <span>{formatNumber(item.remindersSent)} {t('reminder dikonfirmasi terkirim')}</span>
                      <strong>{t('Total {{count}}', { count: formatNumber(item.total) })}</strong>
                    </article>
                  ))}
                </div>
              ) : <p className="spv-report-state">{t('Tidak ada aktivitas Staff pada periode ini.')}</p>}
            </section>

            <section className="spv-report-panel spv-report-section">
              <header className="spv-report-section-heading">
                <h2>{t('Tren Aktivitas Harian')}</h2>
              </header>
              {report.trends.length ? (
                <div className="spv-report-list">
                  {report.trends.map((day) => (
                    <article className="spv-report-trend-row" key={day.date}>
                      <strong>{formatDate(day.date)}</strong>
                      <span>{formatNumber(day.contacts)} {t('komunikasi')}</span>
                      <span>{formatNumber(day.followupStatusChanges)} {t('perubahan follow-up')}</span>
                      <span>{formatNumber(day.remindersSent)} {t('reminder terkirim')}</span>
                      <span>{formatNumber(day.responsesReceived)} {t('respons diterima')}</span>
                    </article>
                  ))}
                </div>
              ) : <p className="spv-report-state">{t('Tidak ada aktivitas pada periode ini.')}</p>}
            </section>

            <section className="spv-report-panel spv-report-section spv-report-data-gap">
              <header className="spv-report-section-heading">
                <h2>{t('Metrik hasil bisnis belum tersedia')}</h2>
              </header>
              <p>
                {t('Database belum mencatat minat pelanggan atau pembelian terverifikasi, dan API laporan belum menyediakan funnel dari satu kelompok follow-up. Angka tersebut tidak ditampilkan agar laporan tidak memakai data perkiraan.')}
              </p>
            </section>
          </>
      ) : (
        <section className="spv-report-panel spv-report-state">
          {t('Belum ada data')}
        </section>
      )}
    </main>
  );
}

export default SPVReports;
