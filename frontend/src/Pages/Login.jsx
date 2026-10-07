import "remixicon/fonts/remixicon.css";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import imges from "../Assets/Images/loginn.png";
import Footer from "../Components/Footer";
import { login } from "../Redux/Slices/AuthSlice";
import axiosInstance from "../Helpers/axiosInstance";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleUserInput(e) {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function onLogin(event) {
    event.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error("Please fill all the details");
      return;
    }

    setLoading(true);

    try {
      // Login via Redux
      const response = await dispatch(login(loginData));

      if (!response?.payload?.success) {
        toast.error(
          response?.payload?.message || "Invalid credentials"
        );
        return;
      }

      toast.success("Login Successful!");

      // Mark attendance automatically after successful login
     
try {
  const attendanceRes = await axiosInstance.post(
    "/attendance/mark"
  );

  const attendanceData = attendanceRes?.data;

  if (attendanceRes?.status >= 200 && attendanceRes?.status < 300) {
    toast.success(
      attendanceData?.message || "Attendance marked successfully"
    );
  }
} catch (attendanceError) {
  console.error("Attendance Error:", attendanceError);

  toast.error("Login successful, but attendance could not be marked");
}
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Something went wrong during login");
    } finally {
      setLoading(false);

      setLoginData({
        email: "",
        password: "",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF4D8]">
      {/* Back to home */}
      <div className="px-5 sm:px-8 pt-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-yellow-700 font-medium transition"
        >
          <i className="ri-arrow-left-line text-lg" />
          Back to home
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
          {/* Image */}
          <div className="hidden md:flex w-full lg:w-1/2 justify-center">
            <img
              src={imges}
              alt="Login"
              className="w-full max-w-md object-contain drop-shadow-xl"
            />
          </div>

          {/* Login Card */}
          <div className="w-full max-w-md">
            <form
              noValidate
              onSubmit={onLogin}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8"
            >
              <div className="text-center mb-7">
                <h1 className="text-3xl font-bold text-slate-900">
                  Welcome Back
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                  Login to continue learning
                </p>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 mb-5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />

                  <input
                    type="email"
                    required
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    onChange={handleUserInput}
                    value={loginData.email}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2 mb-6">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-11 text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    onChange={handleUserInput}
                    value={loginData.password}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <i
                      className={
                        showPassword
                          ? "ri-eye-off-line text-lg"
                          : "ri-eye-line text-lg"
                      }
                    />
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-semibold text-base transition shadow-sm"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* Signup */}
              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-yellow-700 hover:text-yellow-800"
                >
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;