import ReportRepositories from '../repositories/report-repositories.js';
import response from '../../../utils/response.js';

const getReport = async (req, res, next) => {
  try {
    const now = new Date();
    const rawTo = req.query.to;
    const to = rawTo && /^\d{4}-\d{2}-\d{2}$/.test(rawTo)
      ? new Date(`${rawTo}T00:00:00.000Z`)
      : req.validated.to
        ? new Date(req.validated.to)
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    if (rawTo && /^\d{4}-\d{2}-\d{2}$/.test(rawTo)) {
      to.setUTCDate(to.getUTCDate() + 1);
    }
    const from = req.validated.from
      ? new Date(req.validated.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const report = await ReportRepositories.getReport({ from, to });
    return response.success(res, 'Report retrieved successfully', { report });
  } catch (error) {
    next(error);
  }
};

export default getReport;
