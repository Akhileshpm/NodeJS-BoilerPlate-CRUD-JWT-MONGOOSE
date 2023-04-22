import express from "express";
import resourceController from "../controllers/resource";
import paginationValidator from "../middlewares/paginationValidator";

const router = express.Router();

router.post("/create", resourceController.createResource);
router.get("/", paginationValidator, resourceController.getAllResources);
router.delete("/:resourceId", resourceController.deleteResourceById);
router.put("/:resourceId", resourceController.updateResourceByUUID);
router.get("/:resourceId", resourceController.getResourcesByUUID);

export default router;
