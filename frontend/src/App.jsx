import "./App.css";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./Components/Auth/RequireAuth";
import MyAttendance from "./Components/MyAttendance";

import CourseContent from "./Pages/Course/CourseContent";
import AboutUs from "./Pages/AboutUs";
import AttendancePage from "./Pages/AttendancePage";
import Contact from "./Pages/Contact";
import CourseDescription from "./Pages/Course/CourseDescription";
import CourseList from "./Pages/Course/CourseList";

import AddLecture from "./Pages/Dashboard/Addlecture";
import AdminDashboard from "./Pages/Dashboard/AdminDashboard";
import Displaylectures from "./Pages/Dashboard/Displaylectures";
import StudentDashboard from "./Pages/Dashboard/StudentDashboard";
import TeacherDashboard from "./Pages/Dashboard/TeacherDashboard";

import Denied from "./Pages/Denied";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import NotFound from "./Pages/NotFound";

import Checkout from "./Pages/Payment/Checkout";
import CheckoutFailure from "./Pages/Payment/CheckoutFailure";
import CheckoutSuccess from "./Pages/Payment/CheckoutSuccess";

import Signup from "./Pages/Signup";
import EditProfile from "./Pages/User/EditProfile";
import Profile from "./Pages/User/Profile";

/* ================= ASSIGNMENTS ================= */

import AssignmentList from "./Pages/Assignment/AssignmentList.jsx";
import AssignmentCreate from "./Pages/Assignment/AssignmentCreate.jsx";
import AssignmentView from "./Pages/Assignment/AssignmentView.jsx";

/* ================= QUIZZES ================= */

import QuizList from "./Pages/Quiz/QuizList.jsx";
import QuizCreate from "./Pages/Quiz/QuizCreate.jsx";
import QuizAttempt from "./Pages/Quiz/QuizAttempt.jsx";
import QuizPreview from "./Pages/Quiz/QuizPreview.jsx";
import QuizResults from "./Pages/Quiz/QuizResults.jsx";
import QuizReview from "./Pages/Quiz/QuizReview.jsx";

/* ================= COURSE ================= */

import CreateCourse from "./Pages/Course/CreateCourse";

/* ================= NOTES ================= */

import CourseNotes from "./Pages/Notes/CourseNotes.jsx";
import NoteEditor from "./Pages/Notes/NoteEditor.jsx";

/* ================= ADMIN ================= */

import CreateTeacher from "./Pages/Admin/CreateTeacher.jsx";

function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/about"
        element={<AboutUs />}
      />

      <Route
        path="/courses"
        element={<CourseList />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      <Route
        path="/denied"
        element={<Denied />}
      />

      <Route
        path="/course/description"
        element={<CourseDescription />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          ADMIN ONLY
      ===================================================== */}

      <Route element={<RequireAuth allowedRoles={["ADMIN"]} />}>

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/* Create Teacher */}
        <Route
          path="/admin/create-teacher"
          element={<CreateTeacher />}
        />

      </Route>


      {/* =====================================================
          ADMIN + TEACHER
          COURSE MANAGEMENT
      ===================================================== */}

      <Route
        element={
          <RequireAuth
            allowedRoles={["ADMIN", "TEACHER"]}
          />
        }
      >

        {/* ---------------- COURSE ---------------- */}

        <Route
          path="/course/create"
          element={<CreateCourse />}
        />

        <Route
          path="/course/edit/:id"
          element={<CreateCourse />}
        />

        <Route
          path="/course/addlecture"
          element={<AddLecture />}
        />


        {/* =================================================
            NOTES MANAGEMENT
        ================================================= */}

        <Route
          path="/courses/:courseId/notes/new"
          element={<NoteEditor />}
        />

        <Route
          path="/notes/:noteId/edit"
          element={<NoteEditor />}
        />


        {/* =================================================
            ASSIGNMENT MANAGEMENT
        ================================================= */}

        <Route
          path="/assignments/create"
          element={<AssignmentCreate />}
        />

        <Route
          path="/assignments/:id/edit"
          element={<AssignmentCreate />}
        />


        {/* =================================================
            QUIZ MANAGEMENT
        ================================================= */}

        <Route
          path="/quizzes/create"
          element={<QuizCreate />}
        />

        <Route
          path="/quizzes/:id/edit"
          element={<QuizCreate />}
        />

        <Route
          path="/quizzes/:id/results"
          element={<QuizResults />}
        />

      </Route>


      {/* =====================================================
          TEACHER ONLY
          TEACHER DASHBOARD
      ===================================================== */}

      <Route
        element={
          <RequireAuth
            allowedRoles={["TEACHER"]}
          />
        }
      >

        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboard />}
        />

      </Route>


      {/* =====================================================
          STUDENT ONLY
          STUDENT DASHBOARD
      ===================================================== */}

      <Route
        element={
          <RequireAuth
            allowedRoles={["USER"]}
          />
        }
      >

        <Route
          path="/dashboard"
          element={<StudentDashboard />}
        />

      </Route>


      {/* =====================================================
          USER + TEACHER + ADMIN
          COMMON AUTHENTICATED ROUTES
      ===================================================== */}

      <Route
        element={
          <RequireAuth
            allowedRoles={[
              "ADMIN",
              "TEACHER",
              "USER",
            ]}
          />
        }
      >

        {/* =================================================
            PROFILE
        ================================================= */}

        <Route
          path="/user/profile"
          element={<Profile />}
        />

        <Route
          path="/user/editprofile"
          element={<EditProfile />}
        />


        {/* =================================================
            PAYMENT
        ================================================= */}

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/checkout/success"
          element={<CheckoutSuccess />}
        />

        <Route
          path="/checkout/fail"
          element={<CheckoutFailure />}
        />


        {/* =================================================
            COURSE VIEW
        ================================================= */}

        <Route
          path="/course/displaylectures"
          element={<Displaylectures />}
        />

        <Route
          path="/course/content"
          element={<CourseContent />}
        />


        {/* =================================================
            ATTENDANCE
        ================================================= */}

        <Route
          path="/attendance"
          element={<AttendancePage />}
        />

        <Route
          path="/user/attendance"
          element={<MyAttendance />}
        />


        {/* =================================================
            NOTES VIEW
        ================================================= */}

        <Route
          path="/courses/:courseId/notes"
          element={<CourseNotes />}
        />


        {/* =================================================
            ASSIGNMENTS
            VIEW / SUBMIT
        ================================================= */}

        <Route
          path="/assignments"
          element={<AssignmentList />}
        />

        <Route
          path="/assignments/:id"
          element={<AssignmentView />}
        />


        {/* =================================================
            QUIZZES
        ================================================= */}

        <Route
          path="/quizzes"
          element={<QuizList />}
        />

        <Route
          path="/quizzes/:id"
          element={<QuizAttempt />}
        />

        <Route
          path="/quiz/:id/attempt"
          element={<QuizAttempt />}
        />


        {/* =================================================
            QUIZ PREVIEW
            Student + Teacher + Admin
        ================================================= */}

        <Route
          path="/quiz-preview/:id"
          element={<QuizPreview />}
        />


        {/* =================================================
            QUIZ REVIEW
        ================================================= */}

        <Route
          path="/quiz-review/:id"
          element={<QuizReview />}
        />

      </Route>


      {/* =====================================================
          404
      ===================================================== */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}

export default App;