import { Router } from 'express';

import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';

import {
  getCatalog,
  getCustomerPackages,
  assignPackage,
  getExpiringPackages,
} from './package.controller.js';

import {
  customerIdParamSchema,
  listCatalogSchema,
  assignPackageSchema,
  listExpiringSchema,
} from './package.schema.js';

const router = Router();

router.use(authentication, authorization('admin', 'spv', 'staff'));

router.get('/', validate(listCatalogSchema, 'query'), getCatalog);
router.get('/expiring', validate(listExpiringSchema, 'query'), getExpiringPackages);

// Paket milik pelanggan dipasang di router terpisah agar tetap berada di bawah
// /api/customers/:id/packages, sesuai kontrak API pada PRD.
const customerPackageRouter = Router({ mergeParams: true });

customerPackageRouter.use(authentication, authorization('admin', 'spv', 'staff'));
customerPackageRouter.get('/', validate(customerIdParamSchema, 'params'), getCustomerPackages);
customerPackageRouter.post(
  '/',
  authorization('admin', 'spv'),
  validate(customerIdParamSchema, 'params'),
  validate(assignPackageSchema),
  assignPackage,
);

export { customerPackageRouter };
export default router;
