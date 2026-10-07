import express from "express";
import {
  getAllAttendance,
  markAttendance,
} from "../controllers/attendance.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isLoggedIn);

router.post("/mark", markAttendance);

router.get("/all", getAllAttendance);

export default router;