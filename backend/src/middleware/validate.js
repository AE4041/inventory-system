// Validates req.body (or req.query) against a zod schema and replaces it with the parsed value.
export function validateBody(schema) {
  return (req, res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    req.query = schema.parse(req.query);
    next();
  };
}
