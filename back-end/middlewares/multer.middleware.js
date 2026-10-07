import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Existing course/video upload
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".webp" &&
      ext !== ".png" &&
      ext !== ".mp4"
    ) {
      const error = new Error(
  `Unsupported file type! ${ext}`
);

error.statusCode = 400;

cb(error, false);
      return;
    }

    cb(null, true);
  },
});

// Notes upload
const noteUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    console.log("🔥 NOTE UPLOAD FILTER RUNNING:", ext);

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
    ];

  if (!allowedExtensions.includes(ext)) {
  const error = new Error(`Unsupported file type! ${ext}`);
  error.statusCode = 400;
  cb(error, false);
  return;
}

    cb(null, true);
  },
});

// Assignment attachment upload
// NOTE: This is only for teacher/admin assignment attachments.
// Student submissions use Google Drive links and do NOT use this upload.
const assignmentUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

   if (!allowedExtensions.includes(ext)) {
  const error = new Error(
    `Unsupported file type! ${ext}`
  );

  error.statusCode = 400;

  cb(error, false);
  return;
}

    cb(null, true);
  },
});

export {
  upload as noteUpload,
  assignmentUpload,
};

export default upload;