// back-end/server.js

import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Import app
import app from './app.js';

// DB connection
import connectToDB from './config/dbConn.js';

// Routes
import assignmentRoutes from './routes/assignments.js';
import quizRoutes from './routes/quiz.routes.js';

// Required middlewares
import cookieParser from 'cookie-parser';
import express from 'express';

// -------------------- CONFIG --------------------

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Razorpay
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const PORT = process.env.PORT || 3000;

// __dirname (ESM fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- SETUP --------------------

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ uploads/ directory created');
  }
} catch (err) {
  console.error('❌ Error ensuring uploads directory:', err);
}

// -------------------- MIDDLEWARES --------------------

// ❗ IMPORTANT: CORS yaha NAHI lagana (already app.js me hai)

// Body parser (safe)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(uploadsDir));

// -------------------- ROUTES --------------------

app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);

// -------------------- ERROR HANDLER --------------------

app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// -------------------- START SERVER --------------------

app.listen(PORT, async () => {
  try {
    await connectToDB();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err);
  }

  console.log(`🚀 Server running at http://localhost:${PORT}`);
});