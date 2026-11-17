import { CustomerInfoDialog } from '../components/CustomerInfoDialog.jsx';
import { CustomerProfile } from '../components/CustomerProfile.jsx';
import { CustomerHeaderActions } from '../components/CustomerHeaderActions.jsx';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  X,
  UserRound,
  CalendarDays,
  GraduationCap,
  Layers,
  BadgeCheck,
  Receipt,
  Bell,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { kinds, states } from '../memberLabels.js';
import { LocationPin } from '../../../shared/components/LocationPin.jsx';
import {
  isDesktopViewport,
  isMobileViewport,
  MOBILE_MEDIA_QUERY,
} from '../../../shared/utils/viewport.js';
import './customerPortal.css';

const sections = [
  ['Profil saya', UserRound],
  ['Jadwal saya', CalendarDays],
  ['Kursus saya', GraduationCap],
  ['Paket saya', Layers],
  ['Keanggotaan', BadgeCheck],
  ['Tagihan', Receipt],
  ['Notifikasi', Bell],
  ['Formulir persetujuan', FileText],
  ['Layanan & bantuan', MessageSquare],
];
const filters = [
  [],
  ['Mendatang', 'Riwayat'],
  ['Mendatang', 'Berlangsung', 'Selesai', 'Dibatalkan'],
  ['Aktif', 'Kedaluwarsa'],
  ['Aktif', 'Menunggu', 'Kedaluwarsa', 'Dibatalkan'],
  ['Belum dibayar', 'Riwayat transaksi', 'Metode pembayaran'],
];
const day = (v) =>
  new Date(v).toLocaleDateString('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' });
const moment = (v) =>
  new Date(v).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
const statement =
  'Saya telah membaca petunjuk penggunaan fasilitas dan akan mengikuti arahan petugas saat mengikuti kegiatan.';
const timed = ['booking', 'course', 'membership'];
function Input({ name, label, value, type = 'text', required = false, ...rest }) {
  return (
    <label>
      {label}
      <input name={name} defaultValue={value} type={type} required={required} {...rest} />
    </label>
  );
}

export function CustomerCenter({ person, commit, refresh, logout, demo = false }) {
  const [page, setPage] = useState(0),
    [tab, setTab] = useState(0),
    [kind, setKind] = useState('help'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [type, setType] = useState('all');
  const [navOpen, setNavOpen] = useState(isDesktopViewport);
  const [infoDialog, setInfoDialog] = useState(null);
  const openInfo = (kind) => {
    if (isMobileViewport()) setNavOpen(false);
    setInfoDialog(kind);
  };
  const navigationRef = useRef(null);
  const settings = person.settings || {},
    requests = person.requests;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA_QUERY);
    const resize = () => setNavOpen(!query.matches);
    query.addEventListener('change', resize);
    return () => query.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!navOpen || isDesktopViewport()) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    navigationRef.current?.querySelector('button')?.focus();
    const trap = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const buttons = [...navigationRef.current.querySelectorAll('button')];
      const first = buttons[0],
        last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', trap);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', trap);
      previous?.focus();
    };
  }, [navOpen]);
  const [failed, setFailed] = useState(false);
  const go = (p) => {
    setPage(p);
    if (isMobileViewport()) setNavOpen(false);
    setTab(0);
    setMessage('');
  };
  const apply = (k) => {
    go(8);
    setKind(k);
  };
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await action();
      setMessage('Tersimpan.');
    } catch (e) {
      setFailed(true);
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const save =
    (path, method, transform = (x) => x) =>
    (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      run(async () => {
        await commit(path, method, transform(data));
        if (path === 'requests' || path === 'credentials') form.reset();
      });
    };
  const list = (rows, empty) =>
    rows.length ? (
      rows.map((r) => (
        <article className="customer-record" key={r.id}>
          <header className="customer-record-heading">
            <strong>{r.kind ? kinds[r.kind] : r.package}</strong>
            {r.state && (
              <span className={'customer-status customer-status-' + r.state}>
                {states[r.state]}
              </span>
            )}
          </header>
          {r.kind && <p>{r.note}</p>}
          <p>
            {r.starts_at
              ? moment(r.starts_at) + ' – ' + moment(r.ends_at) + ' WIB'
              : r.date
                ? (r.goal === 'trial' ? 'Trial selesai pada ' : 'Tanggal akhir paket · ') +
                  day(r.date)
                : day(r.created_at)}
          </p>
          {r.response && (
            <p>
              <strong>Jawaban petugas</strong> · {r.response}
            </p>
          )}
          {r.amount > 0 && (
            <p>
              Rp {r.amount.toLocaleString('id-ID')} · {r.paid_at ? 'Lunas' : 'Belum dibayar'}
            </p>
          )}
          {(r.state === 'pending' ||
            (r.state === 'confirmed' &&
              timed.includes(r.kind) &&
              Date.parse(r.starts_at) > now &&
              !r.paid_at)) && (
            <button
              disabled={busy}
              onClick={() => run(() => commit('requests/' + r.id + '/cancel', 'POST', {}))}
            >
              Batalkan permintaan
            </button>
          )}
        </article>
      ))
    ) : (
      <p className="member-empty">{empty}</p>
    );
  const active = (r) => !['declined', 'cancelled'].includes(r.state);
  const filterTabs = filters[page] || [];
  return (
    <main
      className={
        'customer-portal center ' + (navOpen ? 'customer-nav-open' : 'customer-nav-closed')
      }
    >
      {navOpen && (
        <button
          type="button"
          className="customer-nav-backdrop"
          aria-label="Tutup menu customer"
          onClick={() => setNavOpen(false)}
        />
      )}
      {infoDialog && (
        <CustomerInfoDialog
          kind={infoDialog}
          person={person}
          onClose={() => setInfoDialog(null)}
          onRequests={() => {
            setInfoDialog(null);
            go(8);
          }}
        />
      )}
      <aside ref={navigationRef} id="customer-navigation" aria-label="Navigasi customer">
        <div className="brand">
          <img
            className="brand-logo"
            src="/images/gymnasyum-logo.png"
            alt=""
            width="40"
            height="40"
          />
          <span>
            <strong>gymnasyum</strong>
            <small>MEMBER RELATIONS</small>
          </span>
          <button
            className="customer-drawer-close secondary"
            aria-label="Tutup menu"
            onClick={() => setNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <button
          type="button"
          className="location location-trigger customer-location"
          aria-haspopup="dialog"
          aria-label="Lihat lokasi aktif Gymnasyum Bintaro"
          onClick={() => openInfo('location')}
        >
          <span className="location-pin">
            <LocationPin />
          </span>
          <span className="location-trigger-copy">
            <small>
              <span className="location-dot" />
              Lokasi aktif
            </small>
            <strong>Gymnasyum Bintaro</strong>
          </span>
          <ChevronRight size={15} />
        </button>
        <nav className="nav" aria-label="Menu customer">
          {sections.map(([label, Icon], i) => (
            <button
              key={label}
              className={page === i ? 'active' : undefined}
              title={label}
              aria-label={label}
              aria-current={page === i ? 'page' : undefined}
              onClick={() => go(i)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button
          className="secondary customer-logout"
          aria-label="Keluar"
          title="Keluar"
          onClick={() => run(logout)}
        >
          <LogOut size={20} /> <span>Keluar</span>
        </button>
      </aside>
      <div className="member-content">
        <header className="member-topbar">
          <div className="customer-breadcrumb">
            <button
              className="customer-nav-toggle secondary"
              aria-label={navOpen ? 'Tutup navigasi' : 'Buka navigasi'}
              aria-expanded={navOpen}
              aria-controls="customer-navigation"
              onClick={() => setNavOpen(!navOpen)}
            >
              {navOpen ? (
                <ChevronLeft size={20} />
              ) : (
                <>
                  <ChevronRight className="customer-desktop-arrow" size={20} />
                  <Menu className="customer-mobile-menu" size={20} />
                </>
              )}
            </button>
            <span className="customer-breadcrumb-parent">Portal customer</span>
            <ChevronRight className="customer-breadcrumb-parent" size={14} />
            <strong>{sections[page][0]}</strong>
          </div>
          <CustomerHeaderActions
            person={person}
            demo={demo}
            onProfile={() => go(0)}
            onRequests={() => openInfo('notifications')}
            onLogout={() => run(logout)}
          />
        </header>
        <div className="customer-page-title">
          <h1>{sections[page][0]}</h1>
        </div>
        {message && (
          <p
            className={'customer-feedback ' + (failed ? 'is-error' : '')}
            role={failed ? 'alert' : 'status'}
          >
            {message}
          </p>
        )}
        {page !== 0 && (
          <p className="customer-subtitle">
            {
              [
                '',
                'Kelola reservasi dan lihat riwayat kegiatan Anda.',
                'Pantau pengajuan dan jadwal kursus.',
                'Lihat masa berlaku paket dan ajukan perpanjangan.',
                'Pantau status keanggotaan Anda.',
                'Lihat tagihan dan pembayaran yang dikonfirmasi petugas.',
                'Atur pilihan komunikasi yang Anda izinkan.',
                'Baca dan simpan persetujuan penggunaan fasilitas.',
                'Ajukan layanan dan ikuti jawaban dari petugas.',
              ][page]
            }
          </p>
        )}
        {filterTabs.length > 0 && (
          <div className="member-tabs segmented" role="group" aria-label={sections[page][0]}>
            {filterTabs.map((f, i) => (
              <button
                className={tab === i ? 'selected' : undefined}
                key={f}
                aria-pressed={tab === i}
                onClick={() => setTab(i)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        {page === 0 && (
          <CustomerProfile
            commit={commit}
            person={person}
            settings={settings}
            save={save}
            busy={busy}
            demo={demo}
          />
        )}
        {page === 1 && (
          <section>
            <label>
              Jenis kegiatan
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Semua jenis</option>
                <option value="booking">Reservasi</option>
                <option value="course">Kursus</option>
                <option value="trial">Trial</option>
              </select>
            </label>
            {list(
              requests
                .filter(
                  (r) =>
                    ['booking', 'course'].includes(r.kind) &&
                    (type === 'all' || type === r.kind) &&
                    (active(r) && Date.parse(r.ends_at) > now) === !tab,
                )
                .concat(
                  tab && (type === 'all' || type === 'trial')
                    ? person.cycles.filter((c) => c.goal === 'trial')
                    : [],
                ),
              'Belum ada kegiatan pada jadwal ini.',
            )}
            <div className="customer-record-actions">
              <button onClick={() => apply('booking')}>Ajukan reservasi</button>
              <button className="secondary" onClick={() => apply('trial')}>
                Ajukan trial
              </button>
            </div>
          </section>
        )}
        {page === 2 && (
          <section>
            {list(
              requests.filter(
                (r) =>
                  r.kind === 'course' &&
                  (active(r)
                    ? Date.parse(r.starts_at) > now
                      ? 0
                      : Date.parse(r.ends_at) > now
                        ? 1
                        : 2
                    : 3) === tab,
              ),
              'Belum ada kursus pada kategori ini.',
            )}
            <div className="customer-record-actions">
              <button onClick={() => apply('course')}>Ajukan kursus</button>
            </div>
          </section>
        )}
        {page === 3 && (
          <section>
            {list(
              person.cycles.filter(
                (c) => c.goal === 'renewal' && dayKey(c.date) >= dayKey(now) === !tab,
              ),
              'Belum ada paket pada kategori ini.',
            )}
            <div className="customer-record-actions">
              <button onClick={() => apply('package')}>Ajukan paket</button>
              <button className="secondary" onClick={() => apply('renewal')}>
                Perpanjang paket
              </button>
            </div>
          </section>
        )}
        {page === 4 && (
          <section>
            {list(
              requests.filter(
                (r) =>
                  r.kind === 'membership' &&
                  (r.state === 'pending'
                    ? 1
                    : !active(r)
                      ? 3
                      : Date.parse(r.ends_at) > now
                        ? 0
                        : 2) === tab,
              ),
              'Belum ada keanggotaan pada kategori ini.',
            )}
            <div className="customer-record-actions">
              <button onClick={() => apply('membership')}>Ajukan keanggotaan</button>
            </div>
          </section>
        )}
        {page === 5 && (
          <section>
            {tab === 2 ? (
              <form onSubmit={save('settings', 'PATCH')}>
                <label>
                  Metode pilihan
                  <select name="method" defaultValue={settings.method || ''} required>
                    <option value="">Pilih metode</option>
                    <option>Tunai</option>
                    <option>Transfer</option>
                  </select>
                </label>
                <button disabled={busy}>Simpan pilihan</button>
              </form>
            ) : (
              list(
                requests.filter(
                  (r) =>
                    r.state === 'confirmed' && r.amount > 0 && Boolean(r.paid_at) === Boolean(tab),
                ),
                tab
                  ? 'Belum ada pembayaran yang dikonfirmasi petugas.'
                  : 'Tidak ada tagihan tertunda.',
              )
            )}
          </section>
        )}
        {page === 6 && (
          <section className="customer-notification-settings">
            <h2>Promo dan penawaran</h2>
            <form
              onSubmit={save('settings', 'PATCH', (d) => ({
                promoEmail: !!d.promoEmail,
                promoSms: !!d.promoSms,
              }))}
            >
              {[
                ['promoEmail', 'Email'],
                ['promoSms', 'SMS'],
              ].map(([key, label]) => (
                <label key={key} className="customer-preference-row">
                  <span>
                    <strong>{label}</strong>
                    <small>Terima informasi promo dan penawaran melalui {label}.</small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={'Izinkan promosi melalui ' + label}
                    name={key}
                    defaultChecked={settings[key]}
                  />
                </label>
              ))}
              <div className="customer-settings-footer">
                <button disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan preferensi'}</button>
              </div>
            </form>
          </section>
        )}
        {page === 7 && (
          <section className="customer-waiver">
            <header className="customer-waiver-heading">
              <span className="customer-heading-icon">
                <FileText size={22} />
              </span>
              <h2>Persetujuan penggunaan fasilitas</h2>
            </header>
            <p className="customer-waiver-statement">{statement}</p>
            <p
              className={'customer-waiver-status ' + (person.acknowledged_at ? 'is-approved' : '')}
            >
              {person.acknowledged_at
                ? 'Disetujui pada ' + moment(person.acknowledged_at)
                : 'Menunggu persetujuan'}
            </p>
            <div className="customer-waiver-actions">
              {!person.acknowledged_at && (
                <button
                  disabled={busy}
                  onClick={() => run(() => commit('acknowledge', 'POST', {}))}
                >
                  Saya menyetujui
                </button>
              )}{' '}
              <a
                download="persetujuan-gymnasyum.txt"
                href={
                  'data:text/plain;charset=utf-8,' +
                  encodeURIComponent(
                    [
                      person.name,
                      statement,
                      person.acknowledged_at
                        ? 'Disetujui pada ' + moment(person.acknowledged_at) + ' WIB'
                        : 'Belum disetujui',
                    ].join('\n'),
                  )
                }
              >
                Unduh formulir
              </a>
            </div>
          </section>
        )}
        {page === 8 && (
          <div className="customer-service-layout">
            <section className="customer-service-form">
              <h2>Ajukan layanan</h2>
              <p className="customer-subtitle">
                Petugas akan memeriksa ketersediaan dan menjawab permintaan Anda.
              </p>
              <form
                onSubmit={save('requests', 'POST', (d) => {
                  if (d.starts_at) {
                    d.starts_at = new Date(d.starts_at + ':00+07:00').toISOString();
                    d.ends_at = new Date(d.ends_at + ':00+07:00').toISOString();
                    if (
                      Date.parse(d.starts_at) <= now ||
                      Date.parse(d.ends_at) <= Date.parse(d.starts_at)
                    )
                      throw new Error(
                        'Waktu mulai harus di masa depan dan waktu selesai harus setelah waktu mulai.',
                      );
                  }
                  return d;
                })}
              >
                <label>
                  Layanan
                  <select
                    aria-label="Layanan"
                    name="kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {Object.entries(kinds).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                {timed.includes(kind) && (
                  <>
                    <Input label="Mulai (WIB)" type="datetime-local" name="starts_at" required />
                    <Input label="Selesai (WIB)" type="datetime-local" name="ends_at" required />
                  </>
                )}
                <label>
                  Detail permintaan
                  <textarea
                    name="note"
                    required
                    minLength={2}
                    maxLength={500}
                    placeholder="Ceritakan kebutuhan Anda, misalnya paket yang diminati atau pertanyaan untuk petugas."
                    onInvalid={(e) =>
                      e.currentTarget.setCustomValidity(
                        'Tuliskan detail permintaan, minimal 2 karakter.',
                      )
                    }
                    onInput={(e) => e.currentTarget.setCustomValidity('')}
                  />
                </label>
                {requests.some((r) => r.kind === kind && r.state === 'pending') && (
                  <p className="customer-pending-hint">
                    Permintaan {kinds[kind].toLowerCase()} masih menunggu petugas. Buka riwayat
                    permintaan untuk memeriksa atau membatalkannya.
                  </p>
                )}
                <button
                  disabled={busy || requests.some((r) => r.kind === kind && r.state === 'pending')}
                >
                  Kirim permintaan
                </button>
              </form>
            </section>
            <section className="customer-service-history">
              <header className="customer-section-heading">
                <h2>Riwayat permintaan</h2>
                <button className="secondary" disabled={busy} onClick={() => run(refresh)}>
                  Perbarui status
                </button>
              </header>
              {list(requests, 'Belum ada permintaan.')}
            </section>
            <section className="customer-service-summary">
              <h2>Riwayat trial terkonfirmasi</h2>
              {list(
                person.cycles.filter((c) => c.goal === 'trial'),
                'Belum ada trial yang dikonfirmasi petugas.',
              )}
            </section>
            <section className="customer-service-summary">
              <h2>Masa berlaku paket terkonfirmasi</h2>
              {list(
                person.cycles.filter((c) => c.goal === 'renewal'),
                'Belum ada paket yang dikonfirmasi petugas.',
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
function dayKey(v) {
  return new Date(new Date(v).getTime() + 7 * 3600000).toISOString().slice(0, 10);
}
