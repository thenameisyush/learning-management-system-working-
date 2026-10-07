import { Router } from "express";

import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controller.js";

import {
  authorizeRoles,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(isLoggedIn);

router
  .route("/")
  .get(getNotes)
  .post(
    authorizeRoles("ADMIN", "TEACHER"),
    createNote
  );

router
  .route("/:id")
  .get(getNoteById)
  .put(
    authorizeRoles("ADMIN", "TEACHER"),
    updateNote
  )
  .delete(
    authorizeRoles("ADMIN", "TEACHER"),
    deleteNote
  );

export default router;