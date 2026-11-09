import { NotificationPanel } from './NotificationPanel.jsx';
import { useT } from '../../shared/i18n/useLanguage.js';
import { useState, useEffect, useRef } from 'react';
import { mayEditTask } from '../../features/auth/services/access.js';
import { canContact } from '../../features/followups/services/followupRules.js';

import { Icon } from '../../shared/components/Icon.jsx';

export function Notifications({ account, customers, onOpen }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const storageKey = `gymnasyum-notifications-read:${account.email}`;
  const [read, setRead] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const items = customers
    .filter(
      (customer) =>
        (account.live
          ? account.roleCode === 'spv' || customer.ownerId === account.id
          : mayEditTask(account, customer.owner)) &&
        customer.status === 'Perlu ditinjau' &&
        canContact(customer),
    )
    .map((customer) => ({
      id: `${customer.id}:${customer.status}:${customer.deadline}:${customer.owner}`,
      customer,
    }));
  const unread = items.filter((item) => !read.includes(item.id)).length;
  const markRead = (ids) => {
    const next = [...new Set([...read, ...ids])];
    setRead(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Keep read state for this session. */
    }
  };
  useEffect(() => {
    const outside = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return (
    <div
      className="notification-container"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="icon-button"
        aria-label={t(`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`)}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen(!open)}
      >
        <Icon name="bell" />
        {unread > 0 && <i />}
      </button>
      {open && (
        <NotificationPanel
          setOpen={setOpen}
          trigger={trigger}
          unread={unread}
          items={items}
          markRead={markRead}
          read={read}
          onOpen={onOpen}
          account={account}
        />
      )}
    </div>
  );
}
