import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUserPlus } from "react-icons/fi";
import HomeLayout from "../../Layouts/HomeLayout";
import axiosInstance from "../../Helpers/axiosInstance";

function CreateTeacher() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.fullName.trim().length < 5) {
      setError("Full Name must be at least 5 characters.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        "/user/create-teacher",
        formData
      );

      setMessage(
        response?.data?.message || "Teacher created successfully."
      );

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create teacher."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <HomeLayout>
      <div className="min-h-[90vh] bg-slate-50 px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
            >
              <FiArrowLeft />
              Back to Admin Dashboard
            </button>

            <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FiUserPlus size={24} />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Create Teacher
                  </h1>

                  <p className="text-slate-400 mt-1">
                    Create a new teacher account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">

            {message && (
              <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter teacher full name"
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="text-xs text-slate-400 mt-1">
                  Minimum 5 characters
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@example.com"
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter temporary password"
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="text-xs text-slate-400 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold transition inline-flex items-center justify-center gap-2"
              >
                <FiUserPlus size={18} />

                {loading ? "Creating Teacher..." : "Create Teacher"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}

export default CreateTeacher;