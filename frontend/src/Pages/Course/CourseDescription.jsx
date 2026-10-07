import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import HomeLayout from "../../Layouts/HomeLayout";

export default function CourseDescription() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { role, data } = useSelector((s) => s.auth);

  const [open, setOpen] = useState(false);

  const course = state || {};

  const canManage = role === "ADMIN" || role === "TEACHER";

  const hasAccess =
    role === "ADMIN" ||
    role === "TEACHER" ||
    data?.subscription?.status === "active";

  return (
    <HomeLayout>
      <div
        className="min-h-[90vh] px-4 py-8 sm:px-6 lg:px-10"
        style={{ backgroundColor: "#F7DB97" }}
      >
        <div className="mx-auto max-w-7xl">

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/courses")}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/30 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white/50"
          >
            ← Back to Courses
          </button>

          {/* COURSE HEADER */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center rounded-full bg-white/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-700 shadow-sm">
              Course Details
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {course?.title || "Course"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700 sm:text-base">
              Explore course lectures, notes, quizzes, assignments and your
              learning progress from one place.
            </p>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* LEFT */}
            <div className="space-y-6 lg:col-span-2">

              {/* IMAGE */}
              <div className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {course?.thumbnail?.secure_url ? (
                  <img
                    src={course.thumbnail.secure_url}
                    alt={course?.title || "Course thumbnail"}
                    className="h-64 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-80 lg:h-[25rem]"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 sm:h-80 lg:h-[25rem]">
                    <div className="text-center">
                      <div className="text-6xl">📚</div>
                      <p className="mt-3 text-sm text-gray-600">
                        No course thumbnail
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                    Online Course
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    {course?.title}
                  </h2>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                    📖
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      About this course
                    </h2>

                    <p className="text-xs text-gray-500">
                      Course overview
                    </p>
                  </div>
                </div>

                <p className="whitespace-pre-line text-sm leading-8 text-gray-700 sm:text-base">
                  {course?.description ||
                    "No description has been added for this course yet."}
                </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-black/10 bg-white/60 p-5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Lectures
                    </span>

                    <span className="text-xl">🎥</span>
                  </div>

                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {course?.numberOfLectures ?? 0}
                  </p>

                  {typeof course?.numberOfVideos === "number" && (
                    <p className="mt-1 text-xs text-gray-500">
                      {course.numberOfVideos} with video
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Instructor
                    </span>

                    <span className="text-xl">👨‍🏫</span>
                  </div>

                  <p className="mt-3 truncate text-lg font-bold text-gray-900">
                    {course?.createdBy || "Not assigned"}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Learning
                    </span>

                    <span className="text-xl">🚀</span>
                  </div>

                  <p className="mt-3 text-lg font-bold text-gray-900">
                    Self Paced
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Learn at your own pace
                  </p>
                </div>

              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">

                {/* HEADER */}
                <div className="border-b border-black/10 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">
                    Start Learning
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {hasAccess
                      ? "Ready to learn?"
                      : "Unlock this course"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {hasAccess
                      ? "Access all available course content and continue your learning journey."
                      : "Subscribe to access lectures, notes, quizzes and assignments."}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="space-y-3 p-6">

                  {hasAccess ? (
                    <button
                      onClick={() =>
                        navigate("/course/content", {
                          state: { ...course },
                        })
                      }
                      className="group flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 px-5 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">📚</span>
                        Open Course Content
                      </span>

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/checkout")}
                      className="group flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 px-5 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        Subscribe Now
                      </span>

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  )}

                  {role && (
                    <button
                      onClick={() =>
                        navigate(`/courses/${course?._id}/notes`, {
                          state: {
                            courseId: course?._id,
                            courseTitle: course?.title,
                          },
                        })
                      }
                      className="group flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        Study Notes
                      </span>

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  )}

                  {/* SMALL FEATURES */}
                  <div className="grid grid-cols-2 gap-3 pt-2">

                    <div className="rounded-2xl border border-black/10 bg-yellow-50 p-4 text-center">
                      <p className="text-2xl">📝</p>
                      <p className="mt-2 text-xs font-semibold text-gray-600">
                        Assignments
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-yellow-50 p-4 text-center">
                      <p className="text-2xl">🧠</p>
                      <p className="mt-2 text-xs font-semibold text-gray-600">
                        Quizzes
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MANAGEMENT */}
          {canManage && (
            <div className="mt-10 overflow-hidden rounded-3xl border border-black/10 bg-white/60 p-6 shadow-xl sm:p-8">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div>
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                      ⚙️
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Course Management
                      </h2>

                      <p className="text-sm text-gray-600">
                        Manage quizzes, assignments, notes and lectures.
                      </p>
                    </div>

                  </div>
                </div>

                <button
                  onClick={() => setOpen(!open)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-md transition ${
                    open
                      ? "bg-gray-900 text-white"
                      : "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  }`}
                >
                  {open ? "Close Tools" : "Open Management"}

                  <span
                    className={`transition-transform ${
                      open ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

              </div>

              {open && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <button
                    onClick={() =>
                      navigate("/quizzes/create", {
                        state: {
                          courseId: course?._id,
                          courseTitle: course?.title,
                        },
                      })
                    }
                    className="rounded-2xl border border-purple-200 bg-purple-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="text-2xl">🧠</span>
                    <p className="mt-3 font-semibold text-gray-900">
                      Create Quiz
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add a new quiz
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/assignments/create", {
                        state: {
                          courseId: course?._id,
                          courseTitle: course?.title,
                        },
                      })
                    }
                    className="rounded-2xl border border-green-200 bg-green-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="text-2xl">📝</span>
                    <p className="mt-3 font-semibold text-gray-900">
                      Create Assignment
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add a new assignment
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/courses/${course?._id}/notes/new`, {
                        state: {
                          courseId: course?._id,
                          courseTitle: course?.title,
                        },
                      })
                    }
                    className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="text-2xl">📄</span>
                    <p className="mt-3 font-semibold text-gray-900">
                      Upload Notes
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add Google Drive notes
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/course/displaylectures", {
                        state: { ...course },
                      })
                    }
                    className="rounded-2xl border border-red-200 bg-red-50 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="text-2xl">🎥</span>
                    <p className="mt-3 font-semibold text-gray-900">
                      Add Video
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add course lecture
                    </p>
                  </button>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}