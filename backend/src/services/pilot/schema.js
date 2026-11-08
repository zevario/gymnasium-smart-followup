import Joi from 'joi';

const key = Joi.string().trim().min(1).max(100);
const instant = Joi.string().isoDate().required();
export const record = Joi.object({
  location: Joi.string().valid('bintaro').required(),
  customerId: key.required(),
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{7,14}$/)
    .allow('')
    .required(),
  consent: Joi.string().valid('granted', 'unknown', 'withdrawn').required(),
  consentRef: key.when('consent', { is: 'granted', then: Joi.required() }),
  consentAt: Joi.string().isoDate().when('consent', { is: 'granted', then: Joi.required() }),
  membershipState: Joi.string()
    .valid('renewable', 'frozen', 'automatic', 'nonrenewable')
    .when('goal', { is: 'renewal', then: Joi.required(), otherwise: Joi.forbidden() }),
  complaint: Joi.boolean().strict().required(),
  observedAt: instant,
  cycleId: key.required(),
  goal: Joi.string().valid('trial', 'renewal').required(),
  package: key.required(),
  anchor: instant,
  interest: Joi.string().valid('none', 'payment', 'information').default('none'),
  visits: Joi.number().integer().min(0).default(0),
  continueTrial: Joi.boolean().default(false),
  transactionAt: Joi.string().isoDate().when('transaction', {
    is: Joi.string().required(),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  transaction: Joi.string().trim().max(120).allow(null).required(),
}).required();
export const batch = Joi.object({ records: Joi.array().items(record).min(1).max(500).required() });
const note = Joi.string().trim().min(3).max(800);
export const command = Joi.object({
  action: Joi.string()
    .valid(
      'claim',
      'assign',
      'draft',
      'approve',
      'accepted',
      'failed',
      'snooze',
      'reply',
      'outcome',
      'optout',
    )
    .required(),
  version: Joi.number().integer().positive().required(),
  note: note.when('action', {
    is: Joi.valid(
      'assign',
      'approve',
      'accepted',
      'failed',
      'snooze',
      'reply',
      'outcome',
      'optout',
    ),
    then: Joi.required(),
  }),
  owner: Joi.string().uuid().when('action', { is: 'assign', then: Joi.required() }),
  message: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .when('action', { is: 'approve', then: Joi.required() }),
  attempt: Joi.string()
    .uuid()
    .when('action', { is: Joi.valid('approve', 'accepted', 'failed'), then: Joi.required() }),
  until: Joi.string().isoDate().when('action', { is: 'snooze', then: Joi.required() }),
});
