import { initialsOf } from '../utils/text.js';

export const roles = {
  staff: 'Admin/CS & Sales',
  spv: 'Supervisor / Manajer Operasional',
  admin: 'Administrator Sistem',
};

/** Shapes a pilot API user into the account object the shared layouts expect. */
export function displayUser(user) {
  return {
    ...user,
    live: true,
    roleCode: user.role,
    role: roles[user.role],
    initials: initialsOf(user.name),
  };
}
