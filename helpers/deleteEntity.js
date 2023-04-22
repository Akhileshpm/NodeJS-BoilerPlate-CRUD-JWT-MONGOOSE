import validator from "validator";
import logger from "../logger";

const deleteEntityById = async (res, entityModel, entityName, uuid) => {
    try {
        logger.info(`Deleting ${entityName} by uuid started`);
    
        if(!(validator.isUUID(uuid))){
          throw { message: "Wrong UUID format passed", status: 400}
        }
    
        const entity = await entityModel.findOneAndDelete({
          uuid: uuid,
        });
    
        if (!entity) {
          throw { message: `${entityName} with the given uuid not found`, status: 404 };
        }
    
        logger.info(`${entityName} delete by Id success`);
        return res.status(204).send();
    
      } catch (error) {
        logger.error(error);
        logger.error(`Deleting ${entityName} details failed`);
        res.status(error?.status || 500).send({ message: error?.message });
      }
};

export default { deleteEntityById };
