import { FiBookOpen, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function CourseProgressList({ courses = [] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            My Courses
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Continue learning from your enrolled courses.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <FiBookOpen className="text-lg text-indigo-600" />
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-semibold text-slate-700">
            No courses found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Enroll in a course to start learning.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {courses.map((item) => {
            const course = item.course || {};
            const progress = item.progress || {};

            const percent = Math.min(
              100,
              Math.max(0, Number(progress.percent ?? 0))
            );

            return (
              <div
                key={course._id}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-800">
                      {course.title || "Untitled Course"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {course.category || "Course"}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-indigo-600">
                    {percent}%
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {progress.done ?? 0} of {progress.total ?? 0} completed
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/course/content", {
                        state: {
                          ...course,
                          isManager: false,
                          access: "student",
                        },
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    Open
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}