import Attendance from "../models/attendance.model.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

export const markAttendance = asyncHandler(async (req, res) => {
  const today = new Date().toLocaleDateString("en-CA");

  const existing = await Attendance.findOne({
    user: req.user.id,
    date: today,
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: "Attendance already marked for today",
    });
  }

  await Attendance.create({
    user: req.user.id,
    date: today,
  });

  res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
  });
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const ownOnly =
    req.query.mine === "1" || req.user.role !== "ADMIN";

  const filter = ownOnly
    ? { user: req.user.id }
    : {};

  const records = await Attendance.find(filter)
    .populate("user", "fullName email")
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: records,
  });
});