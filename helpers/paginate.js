import logger from "../logger";

const paginateHelper = async (req, res, model, entity, filter) => {
  try {
    logger.info(`Fetching ${entity} started.`);
    const page = +req.query.page || 0;
    const limit = +req.query.limit || 0;
    const startIndex = (page - 1) * limit;
    const queryValue = req.query.search;
    const regex = { $regex: `^${queryValue}`, $options: 'i' };

    const data = await model
      .find( req.query.search ? { name : regex } : {}, {...filter, _id: 1 })
      .limit(limit)
      .skip(startIndex)
      .exec();
    const totalCount = await model.countDocuments(req.query.search ? { name : regex } : {}, {...filter, _id: 1 });
    logger.info(`Fetching ${entity} success.`);
    res.send({data, totalCount});
  } catch (error) {
    logger.error(error);
    logger.error(`Fetching ${entity} failed.`);
    res.status(500).send(error.message);
  }
};
export default paginateHelper;
