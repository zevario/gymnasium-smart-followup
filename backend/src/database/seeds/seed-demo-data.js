import 'dotenv/config';
import pool from '../pool.js';
import RecommendationService from '../../modules/followups/recommendation.service.js';

const demoMembers = [
  {
    name: 'Demo Member 01',
    lastVisitDays: null,
    recentVisits: 0,
    endDays: 90,
    noResponseReminders: 2,
  },
  { name: 'Demo Member 02', lastVisitDays: 45, recentVisits: 0, endDays: 90 },
  { name: 'Demo Member 03', lastVisitDays: 60, recentVisits: 0, endDays: 90 },
  {
    name: 'Demo Member 04',
    lastVisitDays: 1,
    recentVisits: 1,
    endDays: 90,
    noResponseReminders: 2,
  },
  { name: 'Demo Member 05', lastVisitDays: 3, recentVisits: 2, endDays: 2 },
  { name: 'Demo Member 06', lastVisitDays: 45, recentVisits: 0, endDays: -5 },
  { name: 'Demo Member 07', lastVisitDays: 21, recentVisits: 1, endDays: 90 },
  { name: 'Demo Member 08', lastVisitDays: 7, recentVisits: 1, endDays: 90 },
  { name: 'Demo Member 09', lastVisitDays: 3, recentVisits: 2, endDays: 10 },
  {
    name: 'Demo Member 10',
    lastVisitDays: 3,
    recentVisits: 2,
    endDays: 90,
    noResponseReminders: 1,
  },
  { name: 'Demo Member 11', lastVisitDays: null, recentVisits: 0, endDays: 30, newMember: true },
  { name: 'Demo Member 12', lastVisitDays: null, recentVisits: 0, endDays: 30, newMember: true },
  { name: 'Demo Member 13', lastVisitDays: 25, recentVisits: 1, endDays: 90 },
  { name: 'Demo Member 14', lastVisitDays: 3, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 15', lastVisitDays: 6, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 16', lastVisitDays: 1, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 17', lastVisitDays: 3, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 18', lastVisitDays: 6, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 19', lastVisitDays: 1, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 20', lastVisitDays: 3, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 21', lastVisitDays: 6, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 22', lastVisitDays: 1, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 23', lastVisitDays: 3, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 24', lastVisitDays: 6, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 25', lastVisitDays: 1, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 26', lastVisitDays: 3, recentVisits: 2, endDays: 25 },
  { name: 'Demo Member 27', lastVisitDays: 6, recentVisits: 2, endDays: 25 },
];

const historicalScheduleOffsets = [90, 75, 60, 45, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 1];
const followupMemberIndexes = [1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15];
const timestampDaysAgo = (days, hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 0, 0, 0);
  return date;
};
const timestampDaysAhead = (days, hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
};
const dateDaysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const seedMessage = (memberNumber, code) =>
  `[DEMO-SEED] ${code} for demo member ${String(memberNumber).padStart(2, '0')}`;

const findOrCreateSchedule = async (client, adminId, schedule) => {
  const existing = await client.query(
    `SELECT id
     FROM schedules
     WHERE title = $1 AND created_by = $2
     ORDER BY created_at, id
     LIMIT 1
     FOR UPDATE`,
    [schedule.title, adminId],
  );
  if (existing.rowCount) {
    await client.query(
      `UPDATE schedules
       SET description = $1, type = $2, customer_id = $3,
           trainer_name = $4, location = $5, starts_at = $6, ends_at = $7,
           status = $8, reminder_2h_enabled = $9, updated_at = NOW()
       WHERE id = $10`,
      [
        schedule.description,
        schedule.type,
        schedule.customerId,
        schedule.trainerName,
        schedule.location,
        schedule.startsAt,
        schedule.endsAt,
        schedule.status,
        schedule.reminder2hEnabled,
        existing.rows[0].id,
      ],
    );
    return existing.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO schedules
       (title, description, type, customer_id, trainer_name, location,
        starts_at, ends_at, status, reminder_2h_enabled, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      schedule.title,
      schedule.description,
      schedule.type,
      schedule.customerId,
      schedule.trainerName,
      schedule.location,
      schedule.startsAt,
      schedule.endsAt,
      schedule.status,
      schedule.reminder2hEnabled,
      adminId,
    ],
  );
  return result.rows[0].id;
};

const addScheduleMember = async (client, scheduleId, customerId) => {
  await client.query(
    `INSERT INTO schedule_members (schedule_id, customer_id)
     VALUES ($1, $2)
     ON CONFLICT (schedule_id, customer_id) DO NOTHING`,
    [scheduleId, customerId],
  );
};

const addAttendance = async (client, { scheduleId, customerId, staffId, status, checkedInAt }) => {
  await client.query(
    `INSERT INTO attendances
       (schedule_id, customer_id, status, checked_in_at, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (schedule_id, customer_id)
     DO UPDATE SET status = EXCLUDED.status,
       checked_in_at = EXCLUDED.checked_in_at,
       notes = EXCLUDED.notes,
       recorded_by = EXCLUDED.recorded_by,
       updated_at = NOW()`,
    [scheduleId, customerId, status, checkedInAt, 'Demo seed attendance record.', staffId],
  );
};

const addReminder = async (
  client,
  {
    customerId,
    scheduleId = null,
    memberNumber,
    code,
    type = 'followup',
    status,
    scheduledAt,
    sentAt = null,
    respondedAt = null,
    leadMinutes = 1440,
    approvalStatus = 'approved',
    assignedTo,
    adminId,
    staffId,
  },
) => {
  const message = seedMessage(memberNumber, code);
  const existing = await client.query(
    `SELECT id
     FROM reminders
     WHERE customer_id = $1 AND message = $2
     ORDER BY created_at, id
     LIMIT 1
     FOR UPDATE`,
    [customerId, message],
  );
  const values = [
    customerId,
    scheduleId,
    type,
    message,
    status,
    scheduledAt,
    sentAt,
    respondedAt,
    adminId,
    leadMinutes,
    approvalStatus,
    assignedTo,
    approvalStatus === 'approved' ? adminId : null,
    approvalStatus === 'approved' ? new Date() : null,
    sentAt ? staffId : null,
  ];

  if (existing.rowCount) {
    await client.query(
      `UPDATE reminders
       SET schedule_id = $1, type = $2, channel = 'whatsapp', message = $3,
           status = $4, scheduled_at = $5, sent_at = $6, responded_at = $7,
           created_by = $8, lead_minutes = $9, approval_status = $10,
           assigned_to = $11, approved_by = $12, approved_at = $13,
           sent_by = $14, updated_at = NOW()
       WHERE id = $15`,
      [
        scheduleId,
        type,
        message,
        status,
        scheduledAt,
        sentAt,
        respondedAt,
        adminId,
        leadMinutes,
        approvalStatus,
        assignedTo,
        approvalStatus === 'approved' ? adminId : null,
        approvalStatus === 'approved' ? new Date() : null,
        sentAt ? staffId : null,
        existing.rows[0].id,
      ],
    );
    return existing.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO reminders
       (customer_id, schedule_id, type, channel, message, status, scheduled_at,
        sent_at, responded_at, created_by, lead_minutes, approval_status,
        assigned_to, approved_by, approved_at, sent_by)
     VALUES ($1, $2, $3, 'whatsapp', $4, $5, $6, $7, $8, $9, $10, $11,
             $12, $13, $14, $15)
     RETURNING id`,
    values,
  );
  return result.rows[0].id;
};

const addReminderHistory = async (
  client,
  { reminderId, customerId, staffId, adminId, message, status, sentAt, respondedAt },
) => {
  const createdAt = sentAt || timestampDaysAgo(2);
  await client.query(
    `INSERT INTO reminder_events
       (reminder_id, customer_id, event_type, new_status, approval_status,
        message_snapshot, note, performed_by, created_at)
     VALUES ($1, $2, 'created', 'scheduled', 'approved', $3,
             'Demo seed reminder created.', $4, $5)`,
    [reminderId, customerId, message, adminId, timestampDaysAgo(3)],
  );
  if (status === 'sent' || status === 'responded' || status === 'no_response') {
    await client.query(
      `INSERT INTO reminder_events
         (reminder_id, customer_id, event_type, previous_status, new_status,
          approval_status, message_snapshot, note, performed_by, created_at)
       VALUES ($1, $2, 'sent', 'scheduled', 'sent', 'approved', $3,
               'Demo seed message delivery recorded.', $4, $5)`,
      [reminderId, customerId, message, staffId, sentAt || createdAt],
    );
  }
  if (status === 'responded' || status === 'no_response') {
    await client.query(
      `INSERT INTO reminder_events
         (reminder_id, customer_id, event_type, previous_status, new_status,
          approval_status, message_snapshot, note, performed_by, created_at)
       VALUES ($1, $2, $3, 'sent', $3, 'approved', $4, $5, $6, $7)`,
      [
        reminderId,
        customerId,
        status,
        message,
        status === 'responded'
          ? 'Demo member response recorded.'
          : 'Demo reminder has no response.',
        staffId,
        respondedAt || timestampDaysAgo(1),
      ],
    );
  }
};

const ensureFollowup = async (client, { customerId, memberIndex, staffId, adminId }) => {
  const subject = `[DEMO-SEED] Follow-up ${String(memberIndex + 1).padStart(2, '0')}`;
  const contactNote = `[DEMO-SEED] Manual WhatsApp contact attempt ${String(memberIndex + 1).padStart(2, '0')}.`;
  const existing = await client.query(
    `SELECT id
     FROM followups
     WHERE customer_id = $1 AND subject = $2 AND created_by = $3
     LIMIT 1
     FOR UPDATE`,
    [customerId, subject, adminId],
  );
  if (existing.rowCount) {
    if (memberIndex % 3 !== 0) {
      await client.query(
        `INSERT INTO followup_events
           (customer_id, followup_id, pic_id, event_type, channel, note,
            result, performed_by, created_at)
         SELECT $1, $2, $3, 'activity', 'WhatsApp', $4, $5, $3, $6
         WHERE NOT EXISTS (
           SELECT 1 FROM followup_events
           WHERE followup_id = $2 AND note = $4
         )`,
        [
          customerId,
          existing.rows[0].id,
          staffId,
          contactNote,
          'Demo contact attempt; delivery is not implied.',
          timestampDaysAgo(1 + (memberIndex % 4)),
        ],
      );
    }
    return existing.rows[0].id;
  }

  const active = await client.query(
    `SELECT id
     FROM followups
     WHERE customer_id = $1
       AND status IN ('pending', 'in_progress', 'no_response', 'postponed')
     LIMIT 1`,
    [customerId],
  );
  if (active.rowCount) return null;

  const recommendation = await client.query(
    `SELECT id, priority
     FROM followup_recommendations
     WHERE customer_id = $1 AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [customerId],
  );
  if (!recommendation.rowCount) return null;

  const followupStatus = ['no_response', 'postponed', 'in_progress'][memberIndex % 3];
  const insertResult = await client.query(
    `INSERT INTO followups
       (customer_id, subject, description, status, priority, due_at,
        assigned_to, created_by, approved_by, approved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NOW())
     RETURNING id`,
    [
      customerId,
      subject,
      'Demo follow-up created from the existing rule-based recommendation.',
      followupStatus,
      recommendation.rows[0].priority === 'medium' ? 'normal' : recommendation.rows[0].priority,
      timestampDaysAhead(2),
      staffId,
      adminId,
    ],
  );
  const followupId = insertResult.rows[0].id;
  await client.query(
    `UPDATE followup_recommendations
     SET status = 'approved', followup_id = $1, assigned_to = $2,
         reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $4`,
    [followupId, staffId, adminId, recommendation.rows[0].id],
  );
  await client.query(
    `INSERT INTO followup_events
       (customer_id, followup_id, pic_id, event_type, previous_status,
        new_status, note, performed_by)
     VALUES ($1, $2, $3, 'approved', 'pending', $4,
             'Demo recommendation approved.', $5),
            ($1, $2, $3, 'assigned', NULL, $4,
             'Demo follow-up assigned to Staff.', $5)`,
    [customerId, followupId, staffId, followupStatus, adminId],
  );
  if (memberIndex % 3 !== 0) {
    await client.query(
      `INSERT INTO followup_events
         (customer_id, followup_id, pic_id, event_type, channel, note,
          result, performed_by, created_at)
       VALUES ($1, $2, $3, 'activity', 'WhatsApp', $4, $5, $3, $6)`,
      [
        customerId,
        followupId,
        staffId,
        contactNote,
        'Demo contact attempt; delivery is not implied.',
        timestampDaysAgo(1 + (memberIndex % 4)),
      ],
    );
  }
  return followupId;
};

const requireDatabaseReady = async (client) => {
  const result = await client.query(
    `SELECT current_database() AS database,
       to_regclass('public.pgmigrations') IS NOT NULL AS migration_table,
       to_regclass('public.customers') IS NOT NULL AS customers_table,
       to_regclass('public.schedules') IS NOT NULL AS schedules_table,
       to_regclass('public.schedule_members') IS NOT NULL AS schedule_members_table,
       to_regclass('public.attendances') IS NOT NULL AS attendances_table,
       to_regclass('public.reminders') IS NOT NULL AS reminders_table,
       to_regclass('public.followups') IS NOT NULL AS followups_table,
       to_regclass('public.followup_events') IS NOT NULL AS followup_events_table,
       to_regclass('public.reminder_events') IS NOT NULL AS reminder_events_table,
       to_regclass('public.followup_recommendations') IS NOT NULL AS recommendations_table`,
  );
  const missingTables = Object.entries(result.rows[0])
    .filter(([key, exists]) => key.endsWith('_table') && !exists)
    .map(([key]) => key.replace('_table', ''));
  if (!result.rows[0].migration_table || missingTables.length) {
    throw new Error(
      `Required database objects are missing (${missingTables.join(', ') || 'pgmigrations'}). Run the existing migrations before seeding demo data.`,
    );
  }
  const migrations = await client.query('SELECT name FROM pgmigrations ORDER BY run_on, name');
  const appliedMigrations = new Set(migrations.rows.map((row) => row.name));
  const requiredMigrations = [
    '1794055029658_create-gymnasyum-schema',
    '1794055029659_add-followup-events',
    '1794055029660_add-reminder-workflow',
  ];
  const missingMigrations = requiredMigrations.filter((name) => !appliedMigrations.has(name));
  if (missingMigrations.length) {
    throw new Error(
      `Required migrations are not recorded in pgmigrations: ${missingMigrations.join(', ')}`,
    );
  }
};

const seedDemoData = async () => {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await requireDatabaseReady(client);
    await client.query('BEGIN');
    transactionOpen = true;
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext('gymnasium-smart-followup-demo-seed'))`,
    );

    const adminResult = await client.query(
      `SELECT id
       FROM users
       WHERE role = 'admin' AND is_active = TRUE
       ORDER BY created_at, id
       LIMIT 1`,
    );
    const staffResult = await client.query(
      `SELECT id
       FROM users
       WHERE role = 'staff' AND is_active = TRUE
       ORDER BY created_at, id`,
    );
    if (!adminResult.rowCount) {
      throw new Error('An active Admin account is required to seed demo data.');
    }
    if (!staffResult.rowCount) {
      throw new Error(
        'At least one active Staff account is required to seed assigned demo follow-ups.',
      );
    }
    const adminId = adminResult.rows[0].id;
    const staffUsers = staffResult.rows;
    const staffFor = (index) => staffUsers[index % staffUsers.length].id;

    const members = [];
    for (let index = 0; index < demoMembers.length; index += 1) {
      const member = demoMembers[index];
      const memberNumber = index + 1;
      const email = `demo.member.${String(memberNumber).padStart(2, '0')}@example.test`;
      const customer = await client.query(
        `INSERT INTO customers
           (name, email, phone, gender, address, notes, membership_package,
            membership_start, membership_end, contact_permission, pic_id,
            status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10, 'active', $11)
         ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, phone = EXCLUDED.phone,
             membership_package = EXCLUDED.membership_package,
             membership_start = EXCLUDED.membership_start,
             membership_end = EXCLUDED.membership_end,
             contact_permission = TRUE, pic_id = EXCLUDED.pic_id,
             status = 'active', updated_at = NOW()
         RETURNING id`,
        [
          member.name,
          email,
          `081200000${String(memberNumber).padStart(3, '0')}`,
          memberNumber % 2 ? 'female' : 'male',
          `Demo address ${String(memberNumber).padStart(2, '0')}`,
          'Fictional demo member; seeded for local product demonstration.',
          memberNumber % 3 === 0 ? 'Open Gym 3 Bulan' : 'Open Gym Bulanan',
          dateDaysFromNow(member.newMember ? -3 : -180),
          dateDaysFromNow(member.endDays),
          staffFor(index),
          adminId,
        ],
      );
      members.push({
        ...member,
        id: customer.rows[0].id,
        index,
        memberNumber,
        email,
      });
    }

    const historicalSchedules = [];
    for (let index = 0; index < historicalScheduleOffsets.length; index += 1) {
      const offset = historicalScheduleOffsets[index];
      const startsAt = timestampDaysAgo(offset, 18);
      const scheduleId = await findOrCreateSchedule(client, adminId, {
        title: `[DEMO-SEED] Group class ${String(offset).padStart(2, '0')}d ago`,
        description: 'Demo historical group class.',
        type: 'group_class',
        customerId: null,
        trainerName: `Demo Trainer ${String((index % 4) + 1).padStart(2, '0')}`,
        location: 'Gymnasyum Demo Studio',
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
        status: 'completed',
        reminder2hEnabled: false,
      });
      historicalSchedules.push({ id: scheduleId, offset, index, startsAt });
    }

    for (const member of members) {
      const recentOffsets = historicalScheduleOffsets
        .filter(
          (offset) =>
            offset <= 30 && member.lastVisitDays !== null && offset >= member.lastVisitDays,
        )
        .sort((a, b) => a - b)
        .slice(0, member.recentVisits);

      for (const schedule of historicalSchedules) {
        const membershipAge = member.newMember ? 3 : 180;
        if (schedule.offset > membershipAge) continue;
        await addScheduleMember(client, schedule.id, member.id);

        let attendanceStatus = 'absent';
        if (member.lastVisitDays !== null) {
          if (schedule.offset > 30) {
            const isLastVisit = schedule.offset === member.lastVisitDays;
            const periodicVisit =
              schedule.offset > member.lastVisitDays && (schedule.index + member.index) % 3 !== 0;
            if (isLastVisit || periodicVisit) attendanceStatus = 'present';
          } else if (recentOffsets.includes(schedule.offset)) {
            attendanceStatus = schedule.index % 4 === 0 ? 'late' : 'present';
          }
        }
        const checkedInAt = ['present', 'late'].includes(attendanceStatus)
          ? new Date(schedule.startsAt.getTime() + 10 * 60 * 1000)
          : null;
        await addAttendance(client, {
          scheduleId: schedule.id,
          customerId: member.id,
          staffId: staffFor(member.index),
          status: attendanceStatus,
          checkedInAt,
        });
      }
    }

    const upcomingGroupOneStart = timestampDaysAhead(2, 9);
    const upcomingGroupOneId = await findOrCreateSchedule(client, adminId, {
      title: '[DEMO-SEED] Upcoming group class 01',
      description: 'Demo upcoming group class.',
      type: 'group_class',
      customerId: null,
      trainerName: 'Demo Trainer 01',
      location: 'Gymnasyum Demo Studio',
      startsAt: upcomingGroupOneStart,
      endsAt: new Date(upcomingGroupOneStart.getTime() + 60 * 60 * 1000),
      status: 'scheduled',
      reminder2hEnabled: true,
    });
    const upcomingGroupTwoStart = timestampDaysAhead(4, 17);
    const upcomingGroupTwoId = await findOrCreateSchedule(client, adminId, {
      title: '[DEMO-SEED] Upcoming group class 02',
      description: 'Demo upcoming group class.',
      type: 'group_class',
      customerId: null,
      trainerName: 'Demo Trainer 02',
      location: 'Gymnasyum Demo Studio',
      startsAt: upcomingGroupTwoStart,
      endsAt: new Date(upcomingGroupTwoStart.getTime() + 60 * 60 * 1000),
      status: 'scheduled',
      reminder2hEnabled: false,
    });
    const upcomingMembers = members.filter((member) => member.memberNumber <= 18);
    for (const member of upcomingMembers) {
      await addScheduleMember(client, upcomingGroupOneId, member.id);
      if (member.memberNumber % 2 === 0) {
        await addScheduleMember(client, upcomingGroupTwoId, member.id);
      }
    }

    const personalTrainingMember = members[13];
    const personalTrainingStart = timestampDaysAhead(3, 11);
    const personalTrainingId = await findOrCreateSchedule(client, adminId, {
      title: '[DEMO-SEED] Personal training 01',
      description: 'Demo upcoming personal training session.',
      type: 'personal_training',
      customerId: personalTrainingMember.id,
      trainerName: 'Demo Trainer 03',
      location: 'Gymnasyum Demo Studio',
      startsAt: personalTrainingStart,
      endsAt: new Date(personalTrainingStart.getTime() + 60 * 60 * 1000),
      status: 'scheduled',
      reminder2hEnabled: true,
    });

    const createdReminders = [];
    for (const member of members) {
      const count = member.noResponseReminders || 0;
      for (let reminderIndex = 0; reminderIndex < count; reminderIndex += 1) {
        const scheduledAt = timestampDaysAgo(10 - reminderIndex, 9);
        const sentAt = timestampDaysAgo(9 - reminderIndex, 10);
        const reminderId = await addReminder(client, {
          customerId: member.id,
          memberNumber: member.memberNumber,
          code: `no-response-${reminderIndex + 1}`,
          status: 'no_response',
          scheduledAt,
          sentAt,
          approvalStatus: 'approved',
          assignedTo: staffFor(member.index),
          adminId,
          staffId: staffFor(member.index),
        });
        createdReminders.push({
          id: reminderId,
          customerId: member.id,
          message: seedMessage(member.memberNumber, `no-response-${reminderIndex + 1}`),
          status: 'no_response',
          sentAt,
        });
      }
    }

    const reminderExamples = [
      { memberIndex: 5, code: 'responded', status: 'responded', daysAgo: 12 },
      { memberIndex: 9, code: 'responded', status: 'responded', daysAgo: 5 },
      { memberIndex: 7, code: 'sent', status: 'sent', daysAgo: 4 },
      { memberIndex: 13, code: 'sent', status: 'sent', daysAgo: 2 },
      {
        memberIndex: 15,
        code: 'scheduled',
        status: 'scheduled',
        daysAhead: 1,
        approvalStatus: 'pending',
      },
      {
        memberIndex: 17,
        code: 'scheduled',
        status: 'scheduled',
        daysAhead: 2,
        approvalStatus: 'pending',
      },
    ];
    for (const example of reminderExamples) {
      const member = members[example.memberIndex];
      const sentAt =
        example.status === 'sent' || example.status === 'responded'
          ? timestampDaysAgo(example.daysAgo, 10)
          : null;
      const respondedAt =
        example.status === 'responded' ? timestampDaysAgo(example.daysAgo - 1, 11) : null;
      const scheduledAt = example.daysAhead
        ? timestampDaysAhead(example.daysAhead, 9)
        : timestampDaysAgo(example.daysAgo + 1, 9);
      const reminderId = await addReminder(client, {
        customerId: member.id,
        memberNumber: member.memberNumber,
        code: example.code,
        status: example.status,
        scheduledAt,
        sentAt,
        respondedAt,
        approvalStatus: example.approvalStatus || 'approved',
        assignedTo: staffFor(member.index),
        adminId,
        staffId: staffFor(member.index),
      });
      if (!createdReminders.some((item) => item.id === reminderId)) {
        createdReminders.push({
          id: reminderId,
          customerId: member.id,
          message: seedMessage(member.memberNumber, example.code),
          status: example.status,
          sentAt,
          respondedAt,
        });
      }
    }

    const scheduleReminders = [
      {
        member: members[0],
        scheduleId: upcomingGroupOneId,
        startsAt: upcomingGroupOneStart,
        leadMinutes: 1440,
        code: 'schedule-24h',
      },
      {
        member: members[1],
        scheduleId: upcomingGroupOneId,
        startsAt: upcomingGroupOneStart,
        leadMinutes: 120,
        code: 'schedule-2h',
      },
      {
        member: personalTrainingMember,
        scheduleId: personalTrainingId,
        startsAt: personalTrainingStart,
        leadMinutes: 120,
        code: 'personal-training-2h',
      },
      {
        member: members[7],
        scheduleId: upcomingGroupTwoId,
        startsAt: upcomingGroupTwoStart,
        leadMinutes: 1440,
        code: 'schedule-24h-02',
      },
    ];
    for (const item of scheduleReminders) {
      const reminderId = await addReminder(client, {
        customerId: item.member.id,
        scheduleId: item.scheduleId,
        memberNumber: item.member.memberNumber,
        code: item.code,
        type: 'schedule',
        status: 'scheduled',
        scheduledAt: new Date(item.startsAt.getTime() - item.leadMinutes * 60_000),
        leadMinutes: item.leadMinutes,
        approvalStatus: 'pending',
        assignedTo: staffFor(item.member.index),
        adminId,
        staffId: staffFor(item.member.index),
      });
      if (!createdReminders.some((reminder) => reminder.id === reminderId)) {
        createdReminders.push({
          id: reminderId,
          customerId: item.member.id,
          message: seedMessage(item.member.memberNumber, item.code),
          status: 'scheduled',
        });
      }
    }

    for (const reminder of createdReminders) {
      const history = await client.query(
        `SELECT EXISTS(
           SELECT 1 FROM reminder_events WHERE reminder_id = $1
         ) AS exists`,
        [reminder.id],
      );
      if (!history.rows[0].exists) {
        await addReminderHistory(client, {
          reminderId: reminder.id,
          customerId: reminder.customerId,
          staffId: staffFor(members.find((member) => member.id === reminder.customerId).index),
          adminId,
          message: reminder.message,
          status: reminder.status,
          sentAt: reminder.sentAt,
          respondedAt: reminder.respondedAt,
        });
      }
    }

    const customerIds = members.map((member) => member.id);
    await RecommendationService.generateRecommendations(client, customerIds);
    for (const index of followupMemberIndexes) {
      const member = members[index];
      await ensureFollowup(client, {
        customerId: member.id,
        memberIndex: index,
        staffId: staffFor(index),
        adminId,
      });
    }

    await client.query('COMMIT');
    transactionOpen = false;

    const verification = await pool.query(
      `WITH demo_customers AS (
         SELECT id FROM customers
         WHERE email LIKE 'demo.member.%@example.test'
       )
       SELECT
         current_database() AS database,
         (SELECT COUNT(*)::int FROM demo_customers) AS customers,
         (SELECT COUNT(*)::int
          FROM schedules
          WHERE title LIKE '[DEMO-SEED]%' ) AS schedules,
         (SELECT COUNT(*)::int
          FROM attendances attendance
          JOIN schedules schedule ON schedule.id = attendance.schedule_id
          WHERE schedule.title LIKE '[DEMO-SEED]%') AS attendances,
         (SELECT COUNT(*)::int FROM reminders reminder
          JOIN demo_customers customer ON customer.id = reminder.customer_id
          WHERE reminder.message LIKE '[DEMO-SEED]%') AS reminders,
         (SELECT COUNT(*)::int FROM followups followup
          JOIN demo_customers customer ON customer.id = followup.customer_id
          WHERE followup.subject LIKE '[DEMO-SEED]%') AS followups`,
    );
    const priorityResult = await pool.query(
      `SELECT recommendation.priority, COUNT(*)::int AS count
       FROM followup_recommendations recommendation
       JOIN customers customer ON customer.id = recommendation.customer_id
       WHERE customer.email LIKE 'demo.member.%@example.test'
       GROUP BY recommendation.priority
       ORDER BY CASE recommendation.priority
         WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
    );
    console.log(
      JSON.stringify(
        {
          message: 'Demo data committed and verified in PostgreSQL.',
          ...verification.rows[0],
          priorityDistribution: priorityResult.rows,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemoData().catch((error) => {
  console.error(`Demo data seeding failed: ${error.message}`);
  process.exitCode = 1;
});
