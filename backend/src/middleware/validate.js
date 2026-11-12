/**
 * Validates one part of the request with a Joi schema and stores the sanitised
 * value on `req.validated`. Joi errors are forwarded to the error handler,
 * which answers with 400 and the first validation message.
 */
const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[source]);
    if (error) return next(error);
    req.validated = value;
    return next();
  };

export default validate;
