import { useEffect, useMemo, useState } from 'react';
import translations from './translations.js';
import I18nContext from './I18nContext.js';

const LANGUAGE_KEY = 'gymnasyum_language';
const validationFieldLabels = {
  name: 'Nama',
  email: 'Email',
  password: 'Kata sandi',
  role: 'Peran',
  phone: 'Nomor telepon',
  whatsapp: 'Nomor WhatsApp',
  address: 'Alamat',
  notes: 'Catatan',
  membership_package: 'Paket membership',
  membership_start: 'Tanggal mulai membership',
  membership_end: 'Tanggal berakhir membership',
  contact_permission: 'Izin kontak',
  pic_id: 'PIC',
  status: 'Status',
  title: 'Nama kegiatan',
  description: 'Deskripsi',
  type: 'Tipe kegiatan',
  starts_at: 'Waktu mulai',
  ends_at: 'Waktu selesai',
  customer_id: 'Pelanggan',
  schedule_id: 'Jadwal',
  assigned_to: 'PIC',
  channel: 'Metode komunikasi',
  note: 'Catatan aktivitas',
  result: 'Hasil',
  draft_message: 'Draft pesan',
  scheduled_at: 'Waktu reminder',
};

const translateValidationMessage = (message) => {
  const fieldLabel = (field) => (
    validationFieldLabels[field.split('.').pop()] || field.replaceAll('_', ' ')
  );
  let match = message.match(/^"([^"]+)" is required$/);
  if (match) return `${fieldLabel(match[1])} wajib diisi.`;

  match = message.match(/^"([^"]+)" is not allowed to be empty$/);
  if (match) return `${fieldLabel(match[1])} tidak boleh kosong.`;

  match = message.match(/^"([^"]+)" must be a valid email$/);
  if (match) return `${fieldLabel(match[1])} harus berupa alamat email yang valid.`;

  match = message.match(/^"([^"]+)" must be a valid (date|uri)$/);
  if (match) {
    const type = match[2] === 'date' ? 'tanggal' : 'tautan';
    return `${fieldLabel(match[1])} harus berupa ${type} yang valid.`;
  }

  match = message.match(/^"([^"]+)" must be (?:a|an) (string|number|integer|boolean|array|object)$/);
  if (match) {
    const types = {
      string: 'teks',
      number: 'angka',
      integer: 'bilangan bulat',
      boolean: 'nilai benar atau salah',
      array: 'daftar',
      object: 'objek',
    };
    return `${fieldLabel(match[1])} harus berupa ${types[match[2]]}.`;
  }

  match = message.match(/^"([^"]+)" must be one of \[(.+)\]$/);
  if (match) {
    const options = match[2].split(',').map((option) => option.trim()).join(', ');
    return `${fieldLabel(match[1])} harus salah satu dari: ${options}.`;
  }

  match = message.match(/^"([^"]+)" length must be at least (\d+) characters long$/);
  if (match) {
    return `${fieldLabel(match[1])} harus memiliki minimal ${match[2]} karakter.`;
  }

  match = message.match(/^"([^"]+)" length must be less than or equal to (\d+) characters long$/);
  if (match) {
    return `${fieldLabel(match[1])} maksimal ${match[2]} karakter.`;
  }

  return '';
};

const getInitialLanguage = () => {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
  return savedLanguage === 'en' ? 'en' : 'id';
};

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = nextLanguage === 'en' ? 'en' : 'id';
    window.localStorage.setItem(LANGUAGE_KEY, normalizedLanguage);
    setLanguageState(normalizedLanguage);
  };

  const value = useMemo(() => {
    const locale = language === 'en' ? 'en-US' : 'id-ID';
    const t = (key, values = {}) => {
      const template = translations[language][key]
        || (language === 'id' ? translateValidationMessage(key) : '')
        || key;
      return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (
        Object.hasOwn(values, name) ? String(values[name]) : match
      ));
    };
    const translateReason = (reason) => {
      if (!reason) return '';
      const monthNumbers = {
        Jan: 1,
        Feb: 2,
        Mar: 3,
        Apr: 4,
        May: 5,
        Jun: 6,
        Jul: 7,
        Aug: 8,
        Sep: 9,
        Oct: 10,
        Nov: 11,
        Dec: 12,
      };
      const localizeDate = (value) => {
        const match = value.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
        const month = match && monthNumbers[match[2]];
        if (!match || !month) return value;
        const date = new Date(Date.UTC(Number(match[3]), month - 1, Number(match[1])));
        return new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }).format(date);
      };

      return reason.split(/(?<=\.)\s+/).map((sentence) => {
        let match = sentence.match(/^Membership berakhir pada (.+)\.$/);
        if (match) {
          return t('Membership berakhir pada {{date}}.', {
            date: localizeDate(match[1]),
          });
        }

        match = sentence.match(/^Kunjungan terakhir (.+)\.$/);
        if (match) {
          return t('Kunjungan terakhir {{date}}.', {
            date: localizeDate(match[1]),
          });
        }

        match = sentence.match(/^(\d+) reminder sebelumnya belum mendapat respons\.$/);
        if (match) {
          return t('{{count}} reminder sebelumnya belum mendapat respons.', {
            count: match[1],
          });
        }

        match = sentence.match(/^(\d+) kunjungan dalam 30 hari terakhir\.$/);
        if (match) {
          return t('{{count}} kunjungan dalam 30 hari terakhir.', {
            count: match[1],
          });
        }

        return t(sentence);
      }).join(' ');
    };

    return {
      language,
      locale,
      setLanguage,
      t,
      translateReason,
      formatDate: (value, options = {}) => {
        if (!value) return t('Belum ditentukan');
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? t('Belum ditentukan')
          : new Intl.DateTimeFormat(locale, options).format(date);
      },
      formatDateTime: (value, options = {}) => {
        if (!value) return t('Belum ditentukan');
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? t('Belum ditentukan')
          : new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
            ...options,
          }).format(date);
      },
      formatNumber: (value) => new Intl.NumberFormat(locale).format(value),
    };
  }, [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
