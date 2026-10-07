import { Router } from "express";

import {
  getStudentDashboard,
  getTeacherDashboard,
} from "../controllers/dashboard.controller.js";

import { isLoggedIn, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(isLoggedIn);

// Student Dashboard
router.get(
  "/student",
  authorizeRoles("USER"),
  getStudentDashboard
);

// Teacher Dashboard
router.get(
  "/teacher",
  authorizeRoles("TEACHER"),
  getTeacherDashboard
);

export default router;