import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";

import { useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

import {
  BsCollectionPlayFill,
  BsPeopleFill,
  BsTrash,
} from "react-icons/bs";

import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiUsers,
  FiUserPlus,
} from "react-icons/fi";

import { GiMoneyStack } from "react-icons/gi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import HomeLayout from "../../Layouts/HomeLayout";

import {
  deleteCourse,
  getAllCourses,
} from "../../Redux/Slices/CourseSlice";

import {
  getPaymentRecord,
} from "../../Redux/Slices/RazorpaySlice";

import {
  getStatsData,
} from "../../Redux/Slices/StatSlice";


ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);


function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    allUsersCount = 0,
    subscribedCount = 0,
  } = useSelector((state) => state.stat);

  const {
    allPayments,
    monthlySalesRecord = [],
  } = useSelector((state) => state.razorpay);

  const myCourses = useSelector(
    (state) => state?.course?.courseData
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    await dispatch(getAllCourses());
    await dispatch(getStatsData());
    await dispatch(getPaymentRecord());
  }

  async function onCourseDelete(id) {
    if (
      window.confirm(
        "Are you sure you want to delete this course?"
      )
    ) {
      const res = await dispatch(deleteCourse(id));

      if (res?.payload?.success) {
        await dispatch(getAllCourses());
      }
    }
  }

  const totalRevenue =
    (allPayments?.count || 0) * 499;

  const userChartData = {
    labels: [
      "Registered Users",
      "Enrolled Users",
    ],

    datasets: [
      {
        label: "Users",

        data: [
          allUsersCount,
          subscribedCount,
        ],

        backgroundColor: [
          "#eab308",
          "#22c55e",
        ],

        borderColor: [
          "#ffffff",
          "#ffffff",
        ],

        borderWidth: 3,
      },
    ],
  };

  const salesChartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    datasets: [
      {
        label: "Monthly Sales",

        data: monthlySalesRecord,

        backgroundColor: "#eab308",

        borderRadius: 8,

        borderSkipped: false,
      },
    ],
  };

  const userChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "bottom",
      },
    },

    cutout: "68%",
  };

  const salesChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        grid: {
          color: "#e5e7eb",
        },

        ticks: {
          color: "#64748b",
        },
      },

      x: {
        grid: {
          display: false,
        },

        ticks: {
          color: "#64748b",
        },
      },
    },
  };


  return (
    <HomeLayout>
      <div className="min-h-[90vh] bg-slate-50 text-slate-900">

        {/* =====================================================
            DASHBOARD HEADER
        ====================================================== */}

        <div className="px-4 sm:px-6 lg:px-10 pt-6">

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 sm:p-8 shadow-xl">

            <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-yellow-500/10" />

            <div className="absolute -right-10 -bottom-32 w-72 h-72 rounded-full bg-yellow-500/5" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Admin Panel
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Admin Dashboard
                </h1>

                <p className="text-slate-400 mt-2 max-w-xl">
                  Manage users, courses, subscriptions,
                  revenue and attendance from one place.
                </p>

              </div>

              <button
                type="button"
                onClick={loadDashboardData}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold transition"
              >
                <FiRefreshCw />

                Refresh Data
              </button>

            </div>

          </div>
        </div>




{/* =====================================================
    ATTENDANCE QUICK ACCESS
====================================================== */}

<div className="px-4 sm:px-6 lg:px-10 mt-6">

  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

      <div className="flex items-center gap-4">

        <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
          <FiCalendar size={24} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            User Attendance
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Check today's attendance and view previous records.
          </p>
        </div>

      </div>

      <button
        type="button"
        onClick={() => navigate("/attendance")}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold transition"
      >
        <FiCalendar size={18} />

        View Attendance

        <FiArrowRight size={18} />
      </button>

    </div>

  </div>

</div>



{/* =====================================================
    TEACHER MANAGEMENT
====================================================== */}

<div className="px-4 sm:px-6 lg:px-10 mt-6">
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <FiUserPlus size={24} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Teacher Management
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Create and manage teacher accounts.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/admin/create-teacher")}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
      >
        <FiUserPlus size={18} />
        Create Teacher
        <FiArrowRight size={18} />
      </button>

    </div>
  </div>
</div>

        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <div className="px-4 sm:px-6 lg:px-10 mt-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* Registered Users */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Registered Users
                  </p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    {allUsersCount}
                  </h2>

                  <p className="text-xs text-slate-400 mt-2">
                    Total platform users
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                  <BsPeopleFill size={22} />
                </div>

              </div>

            </div>


            {/* Enrolled Users */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Enrolled Users
                  </p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    {subscribedCount}
                  </h2>

                  <p className="text-xs text-slate-400 mt-2">
                    Active subscriptions
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <FiUsers size={22} />
                </div>

              </div>

            </div>


            {/* Subscriptions */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Subscriptions
                  </p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    {allPayments?.count || 0}
                  </h2>

                  <p className="text-xs text-slate-400 mt-2">
                    Total purchases
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiBookOpen size={22} />
                </div>

              </div>

            </div>


            {/* Revenue */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Revenue
                  </p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    ₹{totalRevenue}
                  </h2>

                  <p className="text-xs text-slate-400 mt-2">
                    Based on subscriptions
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <GiMoneyStack size={25} />
                </div>

              </div>

            </div>

          </div>
        </div>


        {/* =====================================================
            ANALYTICS
        ====================================================== */}

        <div className="px-4 sm:px-6 lg:px-10 mt-6">

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* User Distribution */}

            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

              <div className="mb-4">

                <h2 className="text-xl font-bold text-slate-900">
                  User Overview
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Registered vs enrolled users
                </p>

              </div>

              <div className="h-[300px]">
                <Doughnut
                  data={userChartData}
                  options={userChartOptions}
                />
              </div>

            </div>


            {/* Sales Chart */}

            <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

              <div className="mb-4">

                <h2 className="text-xl font-bold text-slate-900">
                  Revenue Analytics
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Monthly subscription sales
                </p>

              </div>

              <div className="h-[300px]">
                <Bar
                  data={salesChartData}
                  options={salesChartOptions}
                />
              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            COURSE MANAGEMENT
        ====================================================== */}

        <div className="px-4 sm:px-6 lg:px-10 mt-6 pb-10">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Course Header */}

            <div className="p-5 sm:p-6 border-b border-slate-200">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FiBookOpen size={22} />
                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-slate-900">
                        Courses
                      </h2>

                      <p className="text-sm text-slate-500">
                        Manage your course content
                      </p>

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => navigate("/course/create")}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold transition"
                >
                  + Create New Course
                </button>

              </div>

            </div>


            {/* Course List */}

            {!myCourses || myCourses.length === 0 ? (

              <div className="py-16 text-center">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                  📚
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-4">
                  No courses available
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Create your first course to get started.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/course/create")}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 font-semibold transition"
                >
                  Create Course
                </button>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {myCourses.map((course, idx) => (

                  <div
                    key={course?._id}
                    className="p-5 sm:p-6 hover:bg-slate-50 transition"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                      {/* Number */}

                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 items-center justify-center font-bold text-slate-500 shrink-0">
                        {idx + 1}
                      </div>


                      {/* Course Info */}

                      <div className="flex-1 min-w-0">

                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {course?.title || "Untitled Course"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-2">

                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                            {course?.category || "General"}
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {course?.numberOfLectures || 0} Lectures
                          </span>

                        </div>

                        <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                          {course?.description ||
                            "No course description available."}
                        </p>

                        <p className="text-xs text-slate-400 mt-2">
                          Instructor:{" "}
                          <span className="font-medium text-slate-600">
                            {course?.createdBy || "N/A"}
                          </span>
                        </p>

                      </div>


                      {/* Actions */}

                      <div className="flex flex-wrap items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/course/displaylectures",
                              {
                                state: {
                                  ...course,
                                },
                              }
                            )
                          }
                          className="inline-flex items-center gap-2 min-h-[42px] px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition"
                        >
                          <BsCollectionPlayFill />

                          View Course
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onCourseDelete(course?._id)
                          }
                          className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"
                          title="Delete course"
                        >
                          <BsTrash size={18} />
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>
    </HomeLayout>
  );
}

export default AdminDashboard;