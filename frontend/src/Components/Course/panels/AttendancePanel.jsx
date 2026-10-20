
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import EmptyState from "../../UI/EmptyState";
import axiosInstance from "../../../Helpers/axiosInstance";
import { formatDate } from "../../../utils/formatters";

export default function AttendancePanel({ courseId }) {
  const role = useSelector((state) => state.auth.role);

  const isManager = role === "ADMIN" || role === "TEACHER";

  const [activeType, setActiveType] = useState("students");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || !role) return;

    let cancelled = false;

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        // Record attendance before fetching, so the new record
        // can appear immediately for a student or assigned teacher.
        if (role !== "ADMIN") {
          try {
            await axiosInstance.post(
              `/attendance/course/${courseId}/mark`
            );
          } catch (err) {
            // Viewing records should still work if marking fails.
            console.error(
              "Course attendance marking failed:",
              err?.response?.data?.message || err.message
            );
          }
        }

        const params = {
          type: isManager ? activeType : "mine",
        };

        if (date) params.date = date;

        // Search is available only in the manager's Student tab.
        if (isManager && activeType === "students" && search.trim()) {
          params.search = search.trim();
        }

        const res = await axiosInstance.get(
          `/attendance/course/${courseId}`,
          { params }
        );

        if (!cancelled) {
          setRecords(res?.data?.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Could not load course attendance"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, [courseId, role, activeType, date, search, isManager]);

  return (
    <div className="space-y-5">
      {isManager && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveType("students")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeType === "students"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Student Attendance
          </button>

          <button
            type="button"
            onClick={() => setActiveType("teacher")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeType === "teacher"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Teacher Attendance
          </button>
        </div>
      )}

      {/* <p className="text-sm text-slate-600">
        Attendance is recorded once per day when a student or
        assigned teacher opens this section.
      </p> */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
       {isManager && (
  <div>
    <label
      htmlFor="attendance-date"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Filter by date
    </label>

    <input
      id="attendance-date"
      type="date"
      value={date}
      onChange={(event) => setDate(event.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
    />

    {date && (
      <button
        type="button"
        onClick={() => setDate("")}
        className="mt-2 text-sm text-blue-700 hover:underline"
      >
        Clear date filter
      </button>
    )}
  </div>
)}

        {isManager && activeType === "students" && (
          <div>
            <label
              htmlFor="attendance-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search student
            </label>

            <input
              id="attendance-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter student name or email..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            />

            {search.trim() && (
              <p className="mt-2 text-xs text-slate-500">
                Showing matching students' full attendance history.
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="animate-pulse text-slate-500">
          Loading attendance...
        </p>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load attendance"
          message={error}
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No attendance found"
          message={
            search.trim()
              ? "No matching student attendance was found for this course."
              : date
                ? "No attendance records found for this date."
                : "Attendance records will appear here when available."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                {isManager && (
                  <>
                    <th className="px-4 py-3">
                      {activeType === "teacher" ? "Teacher" : "Student"}
                    </th>
                    <th className="px-4 py-3">Email</th>
                  </>
                )}

                {!isManager && (
                  <th className="px-4 py-3">Attendance</th>
                )}

                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr
                  key={record._id}
                  className="border-b last:border-b-0"
                >
                  {isManager && (
                    <>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {record.user?.fullName || "Unknown user"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.user?.email || "N/A"}
                      </td>
                    </>
                  )}

                  {!isManager && (
                    <td className="px-4 py-3 font-medium text-slate-800">
                      My Attendance
                    </td>
                  )}

                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(record.date)}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Present
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
