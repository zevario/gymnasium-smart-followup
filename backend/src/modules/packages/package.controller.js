import PackageRepositories from './package.repository.js';
import PackageServices from './package.service.js';
import response from '../../utils/response.js';

const getCatalog = async (req, res, next) => {
  try {
    const packages = await PackageRepositories.findCatalog({
      activeOnly: !req.validated.include_inactive,
    });
    return response.success(res, 'Package catalog retrieved successfully', { packages });
  } catch (error) {
    next(error);
  }
};

const getCustomerPackages = async (req, res, next) => {
  try {
    const packages = await PackageRepositories.findByCustomer(req.validated.id);
    return response.success(res, 'Customer packages retrieved successfully', { packages });
  } catch (error) {
    next(error);
  }
};

const assignPackage = async (req, res, next) => {
  try {
    const customerPackage = await PackageServices.assignPackage({
      customerId: req.params.id,
      packageId: req.body.package_id,
      purchasedAt: req.body.purchased_at,
    });
    return response.success(res, 'Package assigned successfully', { customerPackage }, 201);
  } catch (error) {
    next(error);
  }
};

const getExpiringPackages = async (req, res, next) => {
  try {
    const packages = await PackageRepositories.findExpiring({ days: req.validated.days });
    return response.success(res, 'Expiring packages retrieved successfully', {
      packages,
      days: req.validated.days,
    });
  } catch (error) {
    next(error);
  }
};

export { getCatalog, getCustomerPackages, assignPackage, getExpiringPackages };
