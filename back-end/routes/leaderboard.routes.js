import { Router } from "express";

import {
  getCourseLeaderboard,
} from "../controllers/leaderboard.controller.js";

import {
  isLoggedIn,
} from "../middlewares/auth.middleware.js";

const router = Router();

// All leaderboard routes require login
router.use(isLoggedIn);

// GET /api/v1/leaderboard/:courseId
router.get(
  "/:courseId",
  getCourseLeaderboard
);

export default router;