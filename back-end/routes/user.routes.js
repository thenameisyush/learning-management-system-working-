import { Router } from "express";

import {
  changePassword,
  forgotPassword,
  getLoggedInUserDetails,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
  createTeacher,
  getAllTeachers,
} from "../controllers/user.controller.js";

import {
  isLoggedIn,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", isLoggedIn, getLoggedInUserDetails);
router.post("/reset", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/change-password", isLoggedIn, changePassword);
router.put(
  "/update/:id",
  isLoggedIn,
  upload.single("avatar"),
  updateUser
);

// Admin can create teacher accounts
router.post(
  "/create-teacher",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  createTeacher
);

// Admin can get all teachers
router.get(
  "/teachers",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  getAllTeachers
);

export default router;