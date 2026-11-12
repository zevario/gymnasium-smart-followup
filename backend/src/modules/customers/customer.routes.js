import { Router } from 'express';

import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from './customer.controller.js';

import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  listCustomerSchema,
} from './customer.schema.js';

const router = Router();

const validateId = validate(customerIdSchema, 'params');

router.use(authentication, authorization('admin', 'spv', 'staff'));

router.get('/', validate(listCustomerSchema, 'query'), getCustomers);
router.get('/:id', validateId, getCustomerById);
router.post('/', validate(createCustomerSchema), createCustomer);
router.put('/:id', validateId, validate(updateCustomerSchema), updateCustomer);
router.patch('/:id/deactivate', validateId, deactivateCustomer);

export default router;
