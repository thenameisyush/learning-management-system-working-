import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';


import quizRoutes from './routes/quiz.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

import errorMiddleware from './middlewares/error.Middleware.js';

config();

const app = express();

// ================= MIDDLEWARES =================

// Built-in
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Third-party
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        credentials: true,
    })
);

app.use(morgan('dev'));
app.use(cookieParser());

// ================= ROUTES =================

// Health check
app.get('/ping', (_req, res) => {
    res.send('Pong');
});

// Root health check
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'LMS Backend API is running 🚀'
    });
});

// ================= EXISTING ROUTES =================

import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import miscRoutes from './routes/miscellaneous.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';

// Phase 3 routes
import noteRoutes from './routes/note.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', miscRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Phase 3
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);

// ================= QUIZ ROUTES =================

app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/attempts', attemptRoutes);

// ================= ASSIGNMENT ROUTES =================

app.use('/api/v1/assignments', assignmentRoutes);

// ================= LEADERBOARD ROUTES =================

app.use('/api/v1/leaderboard', leaderboardRoutes);


app.use('/api/v1/dashboard', dashboardRoutes);

// ================= ERROR HANDLING =================

// 404
app.all('*', (_req, res) => {
    res.status(404).end('OOPS!!! 404 Page Not Found');
});

// Error middleware
app.use(errorMiddleware);

export default app;