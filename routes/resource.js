import express from "express";
import resourceController from "../controllers/resource";
import paginationValidator from "../middlewares/paginationValidator";

const router = express.Router();

router.post("/create", resourceController.createResource);
router.get("/", resourceController.getAllResources);
router.get(
  "/unallocated",
  paginationValidator,
  resourceController.getUnallocatedResources
);
router.get("/allocated", resourceController.getAllocatedResources);
router.delete("/:resourceId", resourceController.deleteResourceById);
router.put("/:resourceId", resourceController.updateResourceByUUID);
router.get("/grades", resourceController.getGrades);
router.get("/:resourceId", resourceController.getResourcesByUUID);
export default router;
