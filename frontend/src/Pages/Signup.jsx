import "remixicon/fonts/remixicon.css";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BsPersonCircle } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import imges from "../Assets/Images/loginn.png";

import {
  isEmail,
  isValidPassword,
} from "../Helpers/regexMatcher";

import { createAccount } from "../Redux/Slices/AuthSlice";
import Footer from "../Components/Footer";

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [previewImage, setPreviewImage] = useState("");

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    avatar: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleUserInput(e) {
    const { name, value } = e.target;

    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function getImage(event) {
    event.preventDefault();

    const uploadedImage = event.target.files?.[0];

    if (!uploadedImage) return;

    setSignupData((prev) => ({
      ...prev,
      avatar: uploadedImage,
    }));

    const fileReader = new FileReader();

    fileReader.onload = function () {
      setPreviewImage(fileReader.result);
    };

    fileReader.readAsDataURL(uploadedImage);
  }

  async function createNewAccount(event) {
    event.preventDefault();

    if (
      !signupData.email ||
      !signupData.password ||
      !signupData.fullName ||
      !signupData.avatar
    ) {
      toast.error("Please fill all the details");
      return;
    }

    if (signupData.fullName.trim().length < 5) {
      toast.error("Name should be at least 5 characters");
      return;
    }

    if (!isEmail(signupData.email)) {
      toast.error("Invalid email id");
      return;
    }

    if (!isValidPassword(signupData.password)) {
      toast.error(
        "Password should be 6 - 16 characters with at least a number and special character"
      );
      return;
    }

    const formData = new FormData();

    formData.append("fullName", signupData.fullName.trim());
    formData.append("email", signupData.email.trim());
    formData.append("password", signupData.password);
    formData.append("avatar", signupData.avatar);

    setLoading(true);

    try {
      const response = await dispatch(
        createAccount(formData)
      );

      if (response?.payload?.success) {
        toast.success("Account created successfully!");

        setSignupData({
          fullName: "",
          email: "",
          password: "",
          avatar: "",
        });

        setPreviewImage("");

        navigate("/");
      } else {
        toast.error(
          response?.payload?.message ||
            "Could not create your account"
        );
      }
    } catch (error) {
      console.error("Signup Error:", error);

      toast.error(
        error?.message ||
          "Something went wrong while creating account"
      );
    } finally {
      setLoading(false);
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
              alt="Registration"
              className="w-full max-w-md object-contain drop-shadow-xl"
            />
          </div>

          {/* Signup Card */}
          <div className="w-full max-w-md">
            <form
              noValidate
              onSubmit={createNewAccount}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                  Create Account
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                  Join us and start learning
                </p>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <label
                  htmlFor="image_uploads"
                  className="relative cursor-pointer group"
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-yellow-100 shadow-md group-hover:border-yellow-300 transition"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-yellow-300 transition">
                      <BsPersonCircle className="w-20 h-20" />
                    </div>
                  )}

                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center shadow">
                    <i className="ri-camera-line text-sm" />
                  </div>
                </label>

                <input
                  onChange={getImage}
                  className="hidden"
                  type="file"
                  name="image_uploads"
                  id="image_uploads"
                  accept=".jpg,.jpeg,.png,.svg"
                />
              </div>

              <p className="text-center text-xs text-slate-400 -mt-3 mb-5">
                Upload profile picture
              </p>

              {/* Name */}
              <div className="flex flex-col gap-2 mb-4">
                <label
                  htmlFor="fullName"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />

                  <input
                    type="text"
                    required
                    name="fullName"
                    id="fullName"
                    placeholder="Enter your full name"
                    className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    onChange={handleUserInput}
                    value={signupData.fullName}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 mb-4">
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
                    value={signupData.email}
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
                    placeholder="Create a strong password"
                    className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-11 text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                    onChange={handleUserInput}
                    value={signupData.password}
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

                <p className="text-xs text-slate-400">
                  6–16 characters with at least one number and
                  special character.
                </p>
              </div>

              {/* Create account */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-semibold text-base transition shadow-sm"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>

              {/* Login */}
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-yellow-700 hover:text-yellow-800"
                >
                  Login
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

export default Signup;