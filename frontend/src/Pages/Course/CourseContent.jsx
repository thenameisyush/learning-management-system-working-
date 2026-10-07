import { useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";

import VideosPanel from "../../Components/Course/panels/VideosPanel";
import HomeLayout from "../../Layouts/HomeLayout";

import CourseHeader from "../../Components/Course/CourseHeader";
import CourseTabs from "../../Components/Course/CourseTabs";

import OverviewPanel from "../../Components/Course/panels/OverviewPanel";
import NotesPanel from "../../Components/Course/panels/NotesPanel";
import QuizzesPanel from "../../Components/Course/panels/QuizzesPanel";
import AssignmentsPanel from "../../Components/Course/panels/AssignmentsPanel";
import AttendancePanel from "../../Components/Course/panels/AttendancePanel";
import ProgressPanel from "../../Components/Course/panels/ProgressPanel";
import LeaderboardPanel from "../../Components/Course/panels/LeaderboardPanel";

export default function CourseContent() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  const course = state;

  if (!course?._id) {
    return <Navigate to="/courses" replace />;
  }

  const isManager =
    course?.isManager === true ||
    course?.access === "manager";

  const renderPanel = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewPanel
            course={course}
            isManager={isManager}
          />
        );

      case "videos":
        return <VideosPanel course={course} />;

      case "notes":
        return (
          <NotesPanel
            courseId={course._id}
            courseTitle={course.title}
          />
        );

      case "quizzes":
        return (
          <QuizzesPanel
            courseId={course._id}
          />
        );

      case "assignments":
        return (
          <AssignmentsPanel
            courseId={course._id}
            courseTitle={course.title}
          />
        );

      case "attendance":
        return <AttendancePanel />;

      case "progress":
        return <ProgressPanel />;

      case "leaderboard":
        return (
          <LeaderboardPanel
            courseId={course._id}
          />
        );

      default:
        return null;
    }
  };

  return (
    <HomeLayout>
      <div
        className="min-h-[90vh] px-3 py-5 sm:px-5 sm:py-7 lg:px-8"
        style={{ backgroundColor: "#F7DB97" }}
      >
        <div className="mx-auto w-full max-w-7xl">

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/courses")}
            className="
              mb-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-black/10
              bg-white/50
              px-4
              py-2
              text-sm
              font-semibold
              text-gray-800
              shadow-sm
              transition
              hover:bg-white
              hover:shadow-md
            "
          >
            <span className="text-lg">←</span>
            Back to Courses
          </button>

          {/* PAGE HEADER */}
          <div className="mb-6">

            <div className="mb-2 flex flex-wrap items-center gap-2">

              <span
                className="
                  rounded-full
                  bg-white/60
                  px-3
                  py-1
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-yellow-800
                  shadow-sm
                "
              >
                Course Learning
              </span>

              {isManager && (
                <span
                  className="
                    rounded-full
                    bg-purple-100
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-purple-700
                  "
                >
                  Manager
                </span>
              )}

              {!isManager && course?.access === "subscribed" && (
                <span
                  className="
                    rounded-full
                    bg-green-100
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-green-700
                  "
                >
                  Enrolled
                </span>
              )}

            </div>

            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {course?.title || "Course Content"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700 sm:text-base">
              Access lectures, notes, quizzes, assignments, attendance,
              progress and leaderboard from one place.
            </p>
          </div>

          {/* COURSE HEADER CARD */}
          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-black/10
              bg-white
              shadow-xl
            "
          >
            <div className="p-4 sm:p-6">
              <CourseHeader
                course={course}
                access={
                  isManager
                    ? "manager"
                    : course?.access === "guest"
                    ? "guest"
                    : "subscribed"
                }
              />
            </div>
          </div>

          {/* TABS */}
          <div
            className="
              mt-5
              overflow-hidden
              rounded-2xl
              border
              border-black/10
              bg-white
              shadow-lg
            "
          >
            {/* Horizontal scroll helps on mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <CourseTabs
                  active={activeTab}
                  onChange={setActiveTab}
                />
              </div>
            </div>
          </div>

          {/* ACTIVE TAB CONTENT */}
          <div
            className="
              mt-5
              overflow-hidden
              rounded-3xl
              border
              border-black/10
              bg-white
              shadow-xl
            "
          >
            {/* CONTENT TOP BAR */}
            <div
              className="
                flex
                flex-col
                gap-2
                border-b
                border-black/10
                px-5
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-7
              "
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">
                  Course Section
                </p>

                <h2 className="mt-1 text-xl font-bold capitalize text-gray-900">
                  {activeTab === "overview"
                    ? "Course Overview"
                    : activeTab}
                </h2>
              </div>

              <div
                className="
                  w-fit
                  rounded-full
                  bg-yellow-50
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-yellow-700
                "
              >
                📚 {course?.title}
              </div>
            </div>

            {/* PANEL */}
            <div className="p-4 sm:p-6 lg:p-7">
              {renderPanel()}
            </div>
          </div>

          {/* BOTTOM INFO */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div
              className="
                rounded-2xl
                border
                border-black/10
                bg-white/60
                p-4
                shadow-sm
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                  🎥
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Learning Material
                  </p>

                  <p className="font-bold text-gray-900">
                    Videos & Notes
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-black/10
                bg-white/60
                p-4
                shadow-sm
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  🧠
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Practice
                  </p>

                  <p className="font-bold text-gray-900">
                    Quizzes & Assignments
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-black/10
                bg-white/60
                p-4
                shadow-sm
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  📊
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Track
                  </p>

                  <p className="font-bold text-gray-900">
                    Progress & Ranking
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </HomeLayout>
  );
}