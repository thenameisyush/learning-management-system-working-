import { useEffect, useState } from "react";
import EmptyState from "../../UI/EmptyState";
import axiosInstance from "../../../Helpers/axiosInstance";
import { formatDate } from "../../../utils/formatters";

export default function AttendancePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/attendance/all", {
        params: { mine: 1 },
      })
      .then((res) => {
        setRecords(res.data.data || []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            "Could not load attendance"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-gray-400 animate-pulse">
        Loading attendance...
      </p>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load attendance"
        message={error}
      />
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No attendance recorded yet"
        message="You'll be marked present automatically each day you log in."
      />
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Your overall attendance record (marked once per day at
        login - not specific to this course).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {records.map((record) => (
          <div
            key={record._id}
            className="bg-[#0f172a] border border-gray-800 rounded-xl p-3 text-center"
          >
            <p className="text-sm font-semibold text-white">
              {formatDate(record.date)}
            </p>

            <p className="text-xs text-green-400 mt-1">
              Present
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}