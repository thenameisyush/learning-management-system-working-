import express from "express";
import {
  getAllAttendance,
  markAttendance,
  getCourseAttendance,
  markCourseAttendance,
} from "../controllers/attendance.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isLoggedIn);

// Existing login attendance — unchanged
router.post("/mark", markAttendance);
router.get("/all", getAllAttendance);

// New course-wise attendance
router.post(
  "/course/:courseId/mark",
  markCourseAttendance
);

router.get(
  "/course/:courseId",
  getCourseAttendance
);

export default router;