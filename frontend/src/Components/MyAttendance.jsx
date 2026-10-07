import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import axiosInstance from "../Helpers/axiosInstance";

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await axiosInstance.get("/attendance/all");

    setAttendance(res?.data?.data || []);
  } catch (err) {
    console.error("Attendance Error:", err);
    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch attendance"
    );
  } finally {
    setLoading(false);
  }
};

    fetchAttendance();
  }, []);

  // Unique attendance days
  const attendanceDays = useMemo(() => {
    return new Set(attendance.map((item) => item.date)).size;
  }, [attendance]);

  // Filter by selected date + search
  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const matchesDate =
        !selectedDate || item.date === selectedDate;

      const name =
        item.user?.fullName ||
        item.user?.name ||
        "";

      const email = item.user?.email || "";

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        name.toLowerCase().includes(searchText) ||
        email.toLowerCase().includes(searchText);

      return matchesDate && matchesSearch;
    });
  }, [attendance, selectedDate, search]);

  const totalPresent = filteredAttendance.length;

  const todayCount = useMemo(() => {
    const today = getToday();

    return attendance.filter(
      (item) => item.date === today
    ).length;
  }, [attendance]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />

          <p className="text-slate-500 font-medium">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl">
          !
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-4">
          Unable to load attendance
        </h2>

        <p className="text-slate-500 mt-2">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-yellow-500/10" />
        <div className="absolute -right-20 bottom-[-80px] w-56 h-56 rounded-full bg-yellow-500/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-500 flex items-center justify-center text-slate-900">
                <FiCalendar size={22} />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Attendance Overview
                </h1>

                <p className="text-slate-300 text-sm mt-1">
                  Track user attendance day by day
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Selected Date
            </p>

            <p className="text-lg font-bold text-yellow-400 mt-1">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Today */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Present Today
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-2">
                {todayCount}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <FiCheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Selected Date */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Selected Date
              </p>

              <p className="text-lg font-bold text-slate-900 mt-2">
                {formatDate(selectedDate)}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
              <FiCalendar size={24} />
            </div>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Present on Selected Date
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-2">
                {totalPresent}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FiUsers size={24} />
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Attendance Days
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-2">
                {attendanceDays}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <FiCalendar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">

          {/* Date */}
          <div className="flex-1">
            <label
              htmlFor="attendance-date"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Select Attendance Date
            </label>

            <div className="relative">
              <FiCalendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                className="w-full h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-slate-700 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="attendance-search"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Search User
            </label>

            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                id="attendance-search"
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-slate-700 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
              />
            </div>
          </div>

          {/* Today */}
          <button
            type="button"
            onClick={() => {
              setSelectedDate(getToday());
              setSearch("");
            }}
            className="h-11 px-6 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold transition"
          >
            Today
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              setSearch("");
            }}
            className="h-11 px-6 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
          >
            All Dates
          </button>
        </div>
      </div>

      {/* =====================================================
          ATTENDANCE TABLE
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Attendance Records
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {selectedDate
                ? `Showing attendance for ${formatDate(
                    selectedDate
                  )}`
                : "Showing attendance for all dates"}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
            <FiCheckCircle size={16} />
            {filteredAttendance.length} Present
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">

            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  #
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  User
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Attendance Date
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-16 text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                      📅
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mt-4">
                      No attendance found
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {selectedDate
                        ? `No users were marked present on ${formatDate(
                            selectedDate
                          )}.`
                        : "No attendance records are available."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item, index) => {
                  const name =
                    item.user?.fullName ||
                    item.user?.name ||
                    "Unknown User";

                  const email =
                    item.user?.email || "N/A";

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {getInitials(name)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {name}
                            </p>

                            <p className="text-xs text-slate-400">
                              User
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <FiCalendar
                            size={16}
                            className="text-slate-400"
                          />

                          {formatDate(item.date)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;