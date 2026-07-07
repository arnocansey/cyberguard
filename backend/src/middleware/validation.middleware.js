export const validate = (schema, target = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((d) => d.message)
    });
  }
  req[target] = value;
  return next();
};

