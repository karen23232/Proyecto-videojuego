const AppError = require('../errors/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError('Datos de entrada invalidos', 400, details));
  }

  req[source] = parsed.data;
  return next();
};

module.exports = validate;
