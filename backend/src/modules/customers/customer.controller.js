import CustomerRepositories from './customer.repository.js';
import response from '../../utils/response.js';

const getCustomers = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.validated;

    const offset = (page - 1) * limit;

    const result = await CustomerRepositories.findAll({
      search,
      status,
      limit,
      offset,
    });

    return response.success(res, 'Customers retrieved successfully', {
      customers: result.customers,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await CustomerRepositories.findById(req.validated.id);

    if (!customer) {
      return response.error(res, 'Customer not found', 404);
    }

    return response.success(res, 'Customer retrieved successfully', {
      customer,
    });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    if (req.validated.pic_id && !(await CustomerRepositories.isEligiblePic(req.validated.pic_id))) {
      return response.error(res, 'PIC must be an active SPV or STAFF account', 400);
    }

    const customer = await CustomerRepositories.create({
      ...req.validated,
      createdBy: req.user.id,
    });

    return response.success(res, 'Customer created successfully', { customer }, 201);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    if (
      Object.hasOwn(req.validated, 'pic_id') &&
      req.validated.pic_id &&
      !(await CustomerRepositories.isEligiblePic(req.validated.pic_id))
    ) {
      return response.error(res, 'PIC must be an active SPV or STAFF account', 400);
    }

    const customer = await CustomerRepositories.update(req.params.id, req.validated);

    if (!customer) {
      return response.error(res, 'Customer not found', 404);
    }

    return response.success(res, 'Customer updated successfully', {
      customer,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateCustomer = async (req, res, next) => {
  try {
    const customer = await CustomerRepositories.deactivate(req.params.id);

    if (!customer) {
      return response.error(res, 'Customer not found', 404);
    }

    return response.success(res, 'Customer deactivated successfully', {
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export { getCustomers, getCustomerById, createCustomer, updateCustomer, deactivateCustomer };
