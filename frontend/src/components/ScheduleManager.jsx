import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  createSchedule,
  deleteSchedule,
  getAllCustomers,
  getSchedules,
  updateSchedule,
} from '../services/api';
import '../assets/styles/shared/ScheduleManager.css';
import useI18n from '../i18n/useI18n.js';

const emptyForm = {
  title: '',
  description: '',
  type: 'group_class',
  customerId: '',
  memberIds: [],
  trainerName: '',
  location: '',
  startsAt: '',
  endsAt: '',
  status: 'scheduled',
  reminder2hEnabled: false,
};

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toApiDateTime = (value) => new Date(value).toISOString();

const pad2 = (value) => String(value).padStart(2, '0');
const dateKey = (date) => (
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
);

function ScheduleDateTimeField({ id, label, value, onChange }) {
  const { t, locale } = useI18n();
  const pickerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const selectedDate = value ? value.slice(0, 10) : '';
  const selectedHour = value ? value.slice(11, 13) : '09';
  const selectedMinute = value ? value.slice(14, 16) : '00';
  const [year, month, day] = selectedDate
    ? selectedDate.split('-').map(Number)
    : [];
  const selectedDay = selectedDate
    ? new Date(year, month - 1, day)
    : null;
  const visibleDays = Array.from({ length: 42 }, (_, index) => (
    new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth(),
      1 - viewMonth.getDay() + index,
    )
  ));
  const weekdays = Array.from({ length: 7 }, (_, index) => (
    new Date(2024, 0, 7 + index).toLocaleDateString(locale, {
      weekday: 'short',
    })
  ));
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(viewMonth);
  const selectedLabel = selectedDay
    ? new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(year, month - 1, day, Number(selectedHour), Number(selectedMinute)))
    : '';

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const updateTime = (hour = selectedHour, minute = selectedMinute) => {
    if (selectedDate) onChange(`${selectedDate}T${hour}:${minute}`);
  };

  const selectDate = (date) => {
    onChange(`${dateKey(date)}T${selectedHour}:${selectedMinute}`);
  };

  return (
    <div className="schedule-date-field" ref={pickerRef}>
      <label htmlFor={`${id}-trigger`}>{label}</label>
      <button
        id={`${id}-trigger`}
        type="button"
        className="schedule-date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-picker`}
        onClick={() => {
          if (!open && selectedDay) {
            setViewMonth(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1));
          }
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        <span className={selectedLabel ? '' : 'placeholder'}>
          {selectedLabel || t('schedule.date.select')}
        </span>
        <CalendarDays size={17} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={`${id}-picker`}
          className="schedule-date-picker"
          role="dialog"
          aria-label={label}
        >
          <div className="schedule-date-picker-header">
            <button
              type="button"
              aria-label={t('schedule.date.previousMonth')}
              onClick={() => setViewMonth((current) => (
                new Date(current.getFullYear(), current.getMonth() - 1, 1)
              ))}
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              aria-label={t('schedule.date.nextMonth')}
              onClick={() => setViewMonth((current) => (
                new Date(current.getFullYear(), current.getMonth() + 1, 1)
              ))}
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="schedule-calendar-grid">
            {weekdays.map((weekday, index) => (
              <span className="schedule-calendar-weekday" key={`${weekday}-${index}`}>
                {weekday}
              </span>
            ))}
            {visibleDays.map((date) => {
              const isSelected = dateKey(date) === selectedDate;
              const outsideMonth = date.getMonth() !== viewMonth.getMonth();
              return (
                <button
                  type="button"
                  className={[
                    'schedule-calendar-day',
                    isSelected ? 'selected' : '',
                    outsideMonth ? 'outside-month' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={date.toLocaleDateString(locale, { dateStyle: 'full' })}
                  aria-pressed={isSelected}
                  key={dateKey(date)}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="schedule-date-time-fields">
            <label htmlFor={`${id}-hour`}>{t('schedule.date.hour')}</label>
            <select
              id={`${id}-hour`}
              value={selectedHour}
              disabled={!selectedDate}
              onChange={(event) => updateTime(event.target.value)}
            >
              {Array.from({ length: 24 }, (_, hour) => pad2(hour)).map((hour) => (
                <option value={hour} key={hour}>{hour}</option>
              ))}
            </select>
            <span aria-hidden="true">:</span>
            <label htmlFor={`${id}-minute`}>{t('schedule.date.minute')}</label>
            <select
              id={`${id}-minute`}
              value={selectedMinute}
              disabled={!selectedDate}
              onChange={(event) => updateTime(selectedHour, event.target.value)}
            >
              {Array.from({ length: 60 }, (_, minute) => pad2(minute)).map((minute) => (
                <option value={minute} key={minute}>{minute}</option>
              ))}
            </select>
          </div>
          <div className="schedule-date-picker-footer">
            <button type="button" onClick={() => setOpen(false)}>
              {t('schedule.date.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleManager({ title, description, canManage }) {
  const { t, formatDateTime } = useI18n();
  const memberPickerRef = useRef(null);
  const [schedules, setSchedules] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingMembers, setEditingMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);

  useEffect(() => {
    if (!memberPickerOpen) return undefined;
    const handleOutsidePointer = (event) => {
      if (!memberPickerRef.current?.contains(event.target)) {
        setMemberPickerOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMemberPickerOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [memberPickerOpen]);

  const loadData = async () => {
    try {
      const [scheduleData, customerData] = await Promise.all([
        getSchedules(),
        getAllCustomers(),
      ]);
      setSchedules(scheduleData.schedules || []);
      setCustomers(
        (customerData.customers || []).filter(
          (customer) => customer.status === 'active',
        ),
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      getSchedules(),
      getAllCustomers(),
    ])
      .then(([scheduleData, customerData]) => {
        if (!active) return;
        setSchedules(scheduleData.schedules || []);
        setCustomers(
          (customerData.customers || []).filter(
            (customer) => customer.status === 'active',
          ),
        );
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

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const startCreate = () => {
    setEditingId('');
    setForm(emptyForm);
    setEditingMembers([]);
    setMemberSearch('');
    setMemberPickerOpen(false);
    setFormOpen(true);
  };

  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditingMembers(schedule.members || []);
    setForm({
      title: schedule.title,
      description: schedule.description || '',
      type: schedule.type,
      customerId: schedule.customerId || '',
      memberIds: (schedule.members || []).map((member) => member.id),
      trainerName: schedule.trainerName || '',
      location: schedule.location || '',
      startsAt: toLocalDateTime(schedule.startsAt),
      endsAt: toLocalDateTime(schedule.endsAt),
      status: schedule.status,
      reminder2hEnabled: Boolean(schedule.reminder2hEnabled),
    });
    setMemberSearch('');
    setMemberPickerOpen(false);
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.startsAt) {
      setError('schedule.validation.startRequired');
      return;
    }
    if (!form.endsAt) {
      setError('schedule.validation.endRequired');
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt) {
      setError('schedule.validation.endBeforeStart');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        type: form.type,
        customer_id: form.type === 'personal_training' ? form.customerId : null,
        member_ids: form.type === 'group_class' ? form.memberIds : [],
        trainer_name: form.trainerName,
        location: form.location,
        starts_at: toApiDateTime(form.startsAt),
        ends_at: toApiDateTime(form.endsAt),
        status: form.status,
        reminder_2h_enabled: form.reminder2hEnabled,
      };
      if (editingId) {
        await updateSchedule(editingId, payload);
      } else {
        await createSchedule(payload);
      }
      setFormOpen(false);
      setEditingId('');
      setForm(emptyForm);
      setEditingMembers([]);
      setMemberSearch('');
      setMemberPickerOpen(false);
      setLoading(true);
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule) => {
    if (!window.confirm(t('Hapus jadwal "{{title}}"?', { title: schedule.title }))) return;
    setError('');
    setLoading(true);
    try {
      await deleteSchedule(schedule.id);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
      setLoading(false);
    }
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {canManage && (
          <button
            type="button"
            className="schedule-primary-button"
            onClick={startCreate}
          >
            {t('Tambah Jadwal')}
          </button>
        )}
      </div>

      {error && <p className="schedule-error" role="alert">{t(error)}</p>}

      {formOpen && canManage && (
        <form className="schedule-form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('Edit Jadwal') : t('Tambah Jadwal')}</h2>
          <div className="schedule-form-grid">
            <label>
              {t('Nama kegiatan')}
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                maxLength="150"
                required
              />
            </label>

            <label>
              {t('Tipe kegiatan')}
              <select
                value={form.type}
                onChange={(event) => {
                  setForm({
                    ...form,
                    type: event.target.value,
                    customerId: '',
                    memberIds: [],
                  });
                  setMemberSearch('');
                  setMemberPickerOpen(false);
                }}
              >
                <option value="group_class">{t('Kelas grup')}</option>
                <option value="personal_training">{t('Personal training')}</option>
              </select>
            </label>

            <ScheduleDateTimeField
              id="schedule-start"
              label={t('Tanggal dan waktu mulai')}
              value={form.startsAt}
              onChange={(value) => {
                updateForm('startsAt', value);
                setError('');
              }}
            />

            <ScheduleDateTimeField
              id="schedule-end"
              label={t('Tanggal dan waktu selesai')}
              value={form.endsAt}
              onChange={(value) => {
                updateForm('endsAt', value);
                setError('');
              }}
            />

            <label>
              {t('Trainer')}
              <input
                type="text"
                value={form.trainerName}
                onChange={(event) => updateForm('trainerName', event.target.value)}
                maxLength="150"
              />
            </label>

            <label>
              {t('Lokasi')}
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateForm('location', event.target.value)}
                maxLength="150"
              />
            </label>

            {form.type === 'personal_training' ? (
              <label>
                {t('Member personal training')}
                <select
                  value={form.customerId}
                  onChange={(event) => updateForm('customerId', event.target.value)}
                  required
                >
                  <option value="">{t('-- Pilih Member --')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="schedule-member-picker" ref={memberPickerRef}>
                <label htmlFor="schedule-member-search">
                  {t('Member peserta kelas')}
                  <span className="schedule-member-count">
                    {t('schedule.members.selectedCount', {
                      count: form.memberIds.length,
                    })}
                  </span>
                </label>
                <div className="schedule-member-selected">
                  {form.memberIds.map((id) => {
                    const member = customers.find((customer) => customer.id === id)
                      || editingMembers.find((customer) => customer.id === id);
                    return member ? (
                      <span className="schedule-member-chip" key={member.id}>
                        {member.name}
                        <button
                          type="button"
                          aria-label={t('schedule.members.remove', { name: member.name })}
                          onClick={() => updateForm(
                            'memberIds',
                            form.memberIds.filter((memberId) => memberId !== member.id),
                          )}
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="schedule-member-combobox">
                  <input
                    id="schedule-member-search"
                    type="search"
                    role="combobox"
                    aria-label={t('schedule.members.search')}
                    aria-expanded={memberPickerOpen}
                    aria-controls="schedule-member-options"
                    aria-autocomplete="list"
                    autoComplete="off"
                    placeholder={t('schedule.members.searchPlaceholder')}
                    value={memberSearch}
                    onFocus={() => setMemberPickerOpen(true)}
                    onChange={(event) => {
                      setMemberSearch(event.target.value);
                      setMemberPickerOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setMemberPickerOpen(false);
                    }}
                  />
                  {memberPickerOpen && (
                    <div
                      className="schedule-member-options"
                      id="schedule-member-options"
                      role="listbox"
                      aria-multiselectable="true"
                    >
                      {customers
                        .filter((customer) => customer.name
                          .toLowerCase()
                          .includes(memberSearch.trim().toLowerCase()))
                        .map((customer) => {
                          const selected = form.memberIds.includes(customer.id);
                          return (
                            <button
                              type="button"
                              className={selected ? 'selected' : ''}
                              role="option"
                              aria-selected={selected}
                              key={customer.id}
                              onClick={() => {
                                updateForm(
                                  'memberIds',
                                  selected
                                    ? form.memberIds.filter((id) => id !== customer.id)
                                    : [...form.memberIds, customer.id],
                                );
                                setMemberSearch('');
                                setMemberPickerOpen(false);
                              }}
                            >
                              <span>{customer.name}</span>
                              <span aria-hidden="true">{selected ? '✓' : ''}</span>
                            </button>
                          );
                        })}
                      {!customers.some((customer) => customer.name
                        .toLowerCase()
                        .includes(memberSearch.trim().toLowerCase())) && (
                        <p className="schedule-member-empty">
                          {t('schedule.members.noResults')}
                        </p>
                      )}
                    </div>
                  )}
                  {memberPickerOpen && (
                    <button
                      type="button"
                      className="schedule-member-close"
                      onClick={() => setMemberPickerOpen(false)}
                    >
                      {t('schedule.members.close')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <label>
              {t('Status')}
              <select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
              >
                <option value="scheduled">{t('Terjadwal')}</option>
                <option value="completed">{t('Selesai')}</option>
                <option value="cancelled">{t('Dibatalkan')}</option>
              </select>
            </label>

            <label className="schedule-checkbox-field">
              <input
                className="schedule-reminder-checkbox"
                type="checkbox"
                checked={form.reminder2hEnabled}
                onChange={(event) => updateForm(
                  'reminder2hEnabled',
                  event.target.checked,
                )}
              />
              {t('Aktifkan reminder tambahan 2 jam sebelum jadwal')}
            </label>

            <label className="schedule-description-field">
              {t('Deskripsi')}
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows="3"
              />
            </label>
          </div>
          <div className="schedule-form-actions">
            <button type="button" onClick={() => setFormOpen(false)}>
              {t('Batal')}
            </button>
            <button type="submit" className="schedule-primary-button" disabled={saving}>
              {saving ? t('Menyimpan...') : t('Simpan Jadwal')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="schedule-empty-state"><p>{t('Memuat jadwal...')}</p></div>
      ) : schedules.length === 0 ? (
        <div className="schedule-empty-state">
          <h3>{t('Jadwal Belum Tersedia')}</h3>
          <p>{t('Jadwal kelas dan personal training akan ditampilkan di sini.')}</p>
        </div>
      ) : (
        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>{t('Kegiatan')}</th>
                <th>{t('Tipe')}</th>
                <th>{t('Tanggal dan Waktu')}</th>
                <th>{t('Trainer')}</th>
                <th>{t('Member')}</th>
                <th>{t('Status')}</th>
                {canManage && <th>{t('Aksi')}</th>}
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => {
                const members = schedule.type === 'personal_training'
                  ? (schedule.customerName ? [schedule.customerName] : [])
                  : (schedule.members || []).map((member) => member.name);
                return (
                  <tr key={schedule.id}>
                    <td>
                      <strong>{schedule.title}</strong>
                      {schedule.description && (
                        <details className="schedule-details">
                          <summary>{t('Detail')}</summary>
                          <p>{schedule.description}</p>
                          <span>{t('Lokasi')}: {schedule.location || t('Belum ditentukan')}</span>
                        </details>
                      )}
                    </td>
                    <td>
                      {schedule.type === 'group_class' ? t('Kelas grup') : t('Personal training')}
                    </td>
                    <td>
                      {formatDateTime(schedule.startsAt)}
                      <br />
                      <span>{t('Sampai')} {formatDateTime(schedule.endsAt)}</span>
                    </td>
                    <td>{schedule.trainerName || t('Belum ditentukan')}</td>
                    <td>{members.length ? members.join(', ') : t('Belum ada')}</td>
                    <td>{t(schedule.status)}</td>
                    {canManage && (
                      <td className="schedule-actions">
                        <button type="button" onClick={() => startEdit(schedule)}>
                          {t('Edit')}
                        </button>
                        <button
                          type="button"
                          className="schedule-danger-button"
                          onClick={() => handleDelete(schedule)}
                        >
                          {t('Hapus')}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ScheduleManager;
