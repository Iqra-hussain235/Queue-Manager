export function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed",
        data: null,
        meta: { details: error.details.map(({ message, path }) => ({ message, path })) },
      });
    }
    if (source === "query") req.validatedQuery = value;
    else req[source] = value;
    return next();
  };
}
