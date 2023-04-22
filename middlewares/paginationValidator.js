const paginationValidator = (req, res, next) => {
  const page = +(req.query.page);
  const limit = +(req.query.limit);

  if (!Number.isInteger(page) || !Number.isInteger(limit) || limit < 1 || limit > 100 || page < 1) {
    return res.status(400).send('Invalid pagination parameters. Please provide a valid page number and limit within the range of 1 to 100.');
  }
  next();
};

export default paginationValidator;
