import { useNavigate } from "react-router-dom";

export default function OverviewPanel({ course, isManager }) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "+ Add Lecture",
      cls: "bg-purple-600 hover:bg-purple-700",
      to: "/course/addlecture",
      state: course,
    },
    {
      label: "+ Create Quiz",
      cls: "bg-blue-600 hover:bg-blue-700",
      to: "/quizzes/create",
      state: {
        courseId: course?._id,
        courseTitle: course?.title,
      },
    },
    {
      label: "+ Add Note",
      cls: "bg-emerald-600 hover:bg-emerald-700",
      to: `/courses/${course?._id}/notes/new`,
      state: {
        courseId: course?._id,
        courseTitle: course?.title,
      },
    },
    {
      label: "+ New Assignment",
      cls: "bg-amber-600 hover:bg-amber-700",
      to: "/assignments/create",
      state: {
        courseId: course?._id,
        courseTitle: course?.title,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* COURSE INFORMATION */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Course Overview
        </h2>

        {course?.description && (
          <p className="text-slate-600 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Lectures</p>
            <p className="text-lg font-bold text-slate-900">
              {course?.numberOfLectures ?? 0}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Videos</p>
            <p className="text-lg font-bold text-slate-900">
              {course?.numberOfVideos ?? 0}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-lg font-bold text-slate-900">
              {course?.duration || "N/A"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Category</p>
            <p className="text-lg font-bold text-slate-900">
              {course?.category || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* MANAGER ACTIONS */}
      {isManager && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Manage this course
          </h2>

          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() =>
                  navigate(action.to, {
                    state: action.state,
                  })
                }
                className={`min-h-[44px] px-4 rounded-lg text-white text-sm font-semibold transition ${action.cls}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT MESSAGE */}
      {!isManager && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-indigo-900">
            Course Content
          </h2>

          <p className="text-sm text-indigo-700 mt-1">
            Use the tabs above to access videos, notes, quizzes,
            assignments and attendance for this course.
          </p>
        </div>
      )}
    </div>
  );
}