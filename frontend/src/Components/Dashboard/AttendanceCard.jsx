import {
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AttendanceCard({ attendance = {} }) {
  const navigate = useNavigate();

  const totalDays = Number(attendance.totalDays ?? 0);
  const thisMonth = Number(attendance.thisMonth ?? 0);
  const lastMarked = attendance.lastMarked || null;

  const todayMarked = lastMarked === getToday();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep track of your attendance.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <FiCalendar className="text-lg text-emerald-600" />
        </div>
      </div>

      {/* Today's Status */}
      <div
        className={`mt-5 rounded-xl border p-4 ${
          todayMarked
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              todayMarked
                ? "bg-emerald-100"
                : "bg-amber-100"
            }`}
          >
            {todayMarked ? (
              <FiCheckCircle className="text-emerald-600" />
            ) : (
              <FiCalendar className="text-amber-600" />
            )}
          </div>

          <div>
            <p
              className={`text-sm font-bold ${
                todayMarked
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {todayMarked
                ? "Attendance marked"
                : "Attendance not marked"}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {todayMarked
                ? "You're marked present today."
                : "Your attendance has not been recorded today."}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Total Present
          </p>

          <p className="mt-1 text-xl font-bold text-slate-800">
            {totalDays}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            This Month
          </p>

          <p className="mt-1 text-xl font-bold text-slate-800">
            {thisMonth}
          </p>
        </div>
      </div>

      {/* Last Marked */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-500">
          Last Attendance
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          {lastMarked
            ? new Date(
                `${lastMarked}T00:00:00`
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "No attendance record"}
        </p>
      </div>

      {/* View Attendance */}
      <button
        type="button"
        onClick={() => navigate("/attendance")}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
      >
        View Attendance
        <FiChevronRight />
      </button>
    </div>
  );
}