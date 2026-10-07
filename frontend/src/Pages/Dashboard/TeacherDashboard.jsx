import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ActivityFeedCard from "../../Components/Dashboard/ActivityFeedCard";
import AttendanceCard from "../../Components/Dashboard/AttendanceCard";
import ManagerCourseCard from "../../Components/Dashboard/ManagerCourseCard";
import QuizPerformanceCard from "../../Components/Dashboard/QuizPerformanceCard";
import SubmissionQueueCard from "../../Components/Dashboard/SubmissionQueueCard";
import EmptyState from "../../Components/UI/EmptyState";
import HomeLayout from "../../Layouts/HomeLayout";
import { dashboardApi, getApiErrorMessage } from "../../Services/dashboardApi";

const Skeleton = () => (
  <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
    <div className="h-32 rounded-2xl bg-slate-200" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-40 rounded-2xl bg-slate-200" />
    ))}
  </div>
);

const Stat = ({ value, label, tone = "text-slate-900" }) => (
  <div className="bg-white/70 rounded-xl px-4 py-3 text-center min-w-[92px]">
    <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
  </div>
);

/** Teacher-specific header - kept separate from the student dashboard's WelcomeHeader since the stats are different. */
function TeacherHeader({ fullName, stats }) {
  const first = (fullName || "").trim().split(/\s+/)[0];
  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-100 to-sky-100 border border-indigo-200 p-5 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back{first ? `, ${first}` : ""} 👋</h1>
      <p className="text-sm text-slate-600 mt-1">Here's how your courses are doing.</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <Stat value={stats.courses} label={stats.courses === 1 ? "Course" : "Courses"} />
        <Stat value={stats.students} label="Students enrolled" tone="text-indigo-600" />
        <Stat value={stats.pendingSubmissions} label="To grade" tone={stats.pendingSubmissions > 0 ? "text-amber-600" : "text-slate-900"} />
        <Stat value={stats.quizzes} label="Quizzes" />
      </div>
    </div>
  );
}

/**
 * Teacher dashboard (route: /teacher/dashboard). Every section is scoped
 * server-side to courses this teacher owns (see dashboard.controller.js's
 * getTeacherDashboard) - this page never filters anything client-side.
 */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await dashboardApi.teacher());
    } catch (err) {
  console.error("TEACHER DASHBOARD ERROR:", err);
  console.error("STATUS:", err?.response?.status);
  console.error("DATA:", err?.response?.data);

  setError(
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Could not load your dashboard"
  );
} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <HomeLayout>
      <div className="min-h-[90vh] bg-slate-50 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          {loading ? (
            <Skeleton />
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load your dashboard"
              message={error}
              action={
                <button onClick={load} className="min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold">
                  Try again
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              <TeacherHeader fullName={data.teacher.fullName} stats={data.stats} />

              <div className="grid lg:grid-cols-3 gap-5 items-start">
                <div className="lg:col-span-2 space-y-5 min-w-0">
                  <ManagerCourseCard courses={data.courses} onCreateCourse={() => navigate("/course/create")} />
                  <SubmissionQueueCard queue={data.submissionQueue} total={data.stats.pendingSubmissions} />
                  <QuizPerformanceCard quizzes={data.quizPerformance} />
                </div>
                <div className="space-y-5 min-w-0">
                  <AttendanceCard attendance={data.attendance} />
                  <ActivityFeedCard activity={data.recentActivity} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}
