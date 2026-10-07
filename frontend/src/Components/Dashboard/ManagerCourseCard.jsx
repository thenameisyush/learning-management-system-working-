import { useNavigate } from "react-router-dom";

import DashboardCard from "./DashboardCard";

/** One row per owned course: enrollment, quiz/assignment counts, average quiz performance. */
export default function ManagerCourseCard({ courses, onCreateCourse }) {
  const navigate = useNavigate();

  return (
    <DashboardCard title="My courses" actionLabel="+ New course" onAction={onCreateCourse}>
      {courses.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-3xl" aria-hidden="true">📚</p>
          <p className="font-semibold text-slate-800 mt-2">You don't have any courses yet</p>
          <button onClick={onCreateCourse} className="mt-4 min-h-[44px] px-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            Create your first course
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map(({ course, enrolledCount, quizCount, assignmentCount, averageQuizPercentage, passRate }) => (
            <li key={course._id}>
              <button
                onClick={() => navigate("/course/description", { state: course })}
                className="w-full text-left rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition min-h-[44px]"
              >
                <p className="font-semibold text-slate-900 truncate">{course.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>{enrolledCount} student{enrolledCount === 1 ? "" : "s"}</span>
                  <span>{quizCount} quiz{quizCount === 1 ? "" : "zes"}</span>
                  <span>{assignmentCount} assignment{assignmentCount === 1 ? "" : "s"}</span>
                </div>
                {averageQuizPercentage === null ? (
                  <p className="text-xs text-slate-400 mt-1">No quiz attempts yet</p>
                ) : (
                  <p className="text-xs mt-1">
                    <span className="font-semibold text-slate-700">{averageQuizPercentage}%</span>
                    <span className="text-slate-500"> avg quiz score · {passRate}% pass rate</span>
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
