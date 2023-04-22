import express from "express";
import { googleLogin } from "../controllers/auth";

const router = express.Router();

router.post("/google", googleLogin);

export default router;
