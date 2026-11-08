import Joi from 'joi';

const validateMembershipDates = (value, helpers) => {
  if (
    value.membership_start &&
    value.membership_end &&
    value.membership_start > value.membership_end
  ) {
    return helpers.error('any.invalid');
  }

  return value;
};

const membershipDateMessage = {
  'any.invalid': 'Tanggal mulai membership harus sebelum tanggal berakhir.',
};

export const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().max(150).allow('', null).optional(),
  phone: Joi.string().trim().min(8).max(30).required(),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .allow('', null)
    .optional(),
  address: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  membership_package: Joi.string().trim().min(2).max(100).required(),
  membership_start: Joi.date().iso().allow(null).optional(),
  membership_end: Joi.date().iso().required(),
  contact_permission: Joi.boolean().required(),
  pic_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).allow(null).optional(),
})
  .custom(validateMembershipDates)
  .messages(membershipDateMessage);

export const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  email: Joi.string().email().max(150).allow('', null),
  phone: Joi.string().trim().min(8).max(30),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .allow('', null),
  address: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  membership_package: Joi.string().trim().min(2).max(100).allow('', null),
  membership_start: Joi.date().iso().allow(null),
  membership_end: Joi.date().iso().allow(null),
  contact_permission: Joi.boolean(),
  pic_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).allow(null),
  status: Joi.string().valid('active', 'inactive'),
})
  .min(1)
  .custom(validateMembershipDates)
  .messages(membershipDateMessage);

export const customerIdSchema = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
});

export const listCustomerSchema = Joi.object({
  search: Joi.string().allow('').default(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});