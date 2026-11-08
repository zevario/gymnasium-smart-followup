import { Router } from 'express';

import authentication from '../../../middleware/authentication.js';
import authorization from '../../../middleware/authorization.js';

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from '../controller/customer-controller.js';

import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  listCustomerSchema,
} from '../validator/schema.js';

const router = Router();

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source]);

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }

  req.validated = value;
  next();
};

const validateId = validate(customerIdSchema, 'params');

router.use(
  authentication,
  authorization('admin', 'spv', 'staff'),
);

router.get('/', validate(listCustomerSchema, 'query'), getCustomers);
router.get('/:id', validateId, getCustomerById);
router.post('/', validate(createCustomerSchema), createCustomer);
router.put('/:id', validateId, validate(updateCustomerSchema), updateCustomer);
router.patch('/:id/deactivate', validateId, deactivateCustomer);

export default router;