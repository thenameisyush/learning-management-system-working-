import { AiFillCloseCircle } from "react-icons/ai";
import { useEffect } from "react";
import {
  FiBookOpen,
  FiClipboard,
  FiHome,
  FiInfo,
  FiLayout,
  FiLogOut,
  FiMail,
  FiMenu,
  FiUser,
  FiPlusCircle,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Footer from "../Components/Footer";
import { logout } from "../Redux/Slices/AuthSlice";

function HomeLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
  window.scrollTo(0, 0);
}, [location.pathname]);

  // =====================================================
  // AUTH STATE
  // AuthSlice ke actual field names:
  // isLoggedIn
  // role
  // =====================================================

  const auth = useSelector((state) => state?._auth_);

  const reduxLoggedIn = auth?.isLoggedIn;
  const reduxRole = auth?.role;

  // localStorage fallback
  const storedLoggedIn = localStorage.getItem("isLoggedIn");
  const storedRole = localStorage.getItem("role");

  const isLoggedIn =
    reduxLoggedIn === true ||
    reduxLoggedIn === "true" ||
    storedLoggedIn === "true";

  const role = reduxRole || storedRole || "";

  // =====================================================
  // OPEN DRAWER
  // =====================================================

  function changeWidth() {
    const drawerSide =
      document.getElementsByClassName("drawer-side");

    if (drawerSide[0]) {
      drawerSide[0].style.width = "auto";
    }

    // Menu button hide after drawer opens
    const menuButton =
      document.getElementById("home-layout-menu-button");

    if (menuButton) {
      menuButton.style.display = "none";
    }
  }

  // =====================================================
  // CLOSE DRAWER
  // =====================================================

  function hideDrawer() {
    const element =
      document.getElementsByClassName("drawer-toggle");

    if (element[0]) {
      element[0].checked = false;
    }

    const drawerSide =
      document.getElementsByClassName("drawer-side");

    if (drawerSide[0]) {
      drawerSide[0].style.width = "0";
    }

    // Menu button show again
    const menuButton =
      document.getElementById("home-layout-menu-button");

    if (menuButton) {
      menuButton.style.display = "block";
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout(e) {
    e.preventDefault();

    try {
      const res = await dispatch(logout());

      if (res?.payload?.success) {
        hideDrawer();
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7db97]">

      {/* =====================================================
          DRAWER
      ===================================================== */}

      <div className="drawer absolute left-0 top-0 z-50 w-fit">

        <input
          className="drawer-toggle"
          id="my-drawer"
          type="checkbox"
        />

        {/* =====================================================
            MENU BUTTON
        ===================================================== */}

        <div className="drawer-content">

          <label
            htmlFor="my-drawer"
            id="home-layout-menu-button"
            className="cursor-pointer relative"
          >
            <FiMenu
              onClick={changeWidth}
              size="32px"
              className="font-bold text-black m-4"
            />
          </label>

        </div>

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <div className="drawer-side w-0">

          <label
            htmlFor="my-drawer"
            className="drawer-overlay"
            onClick={hideDrawer}
          />

          <div
            className="
              relative
              flex
              h-full
              min-h-screen
              w-48
              sm:w-80
              flex-col
              bg-[#fffefb]
              shadow-2xl
            "
          >

            {/* =====================================================
                SIDEBAR HEADER
            ===================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-black/10
                px-5
                py-5
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-indigo-600
                  "
                >
                  Learning Portal
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-slate-800
                  "
                >
                  LMS
                </h2>

              </div>

              {/* CLOSE BUTTON */}

              <button
                type="button"
                onClick={hideDrawer}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-white/70
                  text-slate-600
                  transition
                  hover:bg-red-100
                  hover:text-red-500
                "
              >
                <AiFillCloseCircle size={24} />
              </button>

            </div>

            {/* =====================================================
                NAVIGATION
            ===================================================== */}

            <ul
              className="
                menu
                flex-1
                gap-1
                overflow-y-auto
                p-4
              "
            >

              {/* HOME */}

              <li>
                <Link
                  to="/"
                  onClick={hideDrawer}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    font-medium
                    text-slate-700
                    transition-all
                    hover:bg-white/70
                    hover:text-indigo-600
                  "
                >
                  <FiHome />
                  Home
                </Link>
              </li>

              {/* =================================================
                  STUDENT DASHBOARD
              ================================================= */}

              {isLoggedIn &&
                (role === "USER" || role === "STUDENT") && (
                  <li>
                    <Link
                      to="/dashboard"
                      onClick={hideDrawer}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        font-medium
                        text-slate-700
                        transition-all
                        hover:bg-white/70
                        hover:text-indigo-600
                      "
                    >
                      <FiLayout />
                      Dashboard
                    </Link>
                  </li>
                )}

              {/* =================================================
                  TEACHER DASHBOARD
              ================================================= */}

              {isLoggedIn && role === "TEACHER" && (
                <li>
                  <Link
                    to="/teacher/dashboard"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      font-medium
                      text-slate-700
                      transition-all
                      hover:bg-white/70
                      hover:text-indigo-600
                    "
                  >
                    <FiLayout />
                    Dashboard
                  </Link>
                </li>
              )}

              {/* =================================================
                  ADMIN DASHBOARD
              ================================================= */}

              {isLoggedIn && role === "ADMIN" && (
                <li>
                  <Link
                    to="/admin/dashboard"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      font-medium
                      text-slate-700
                      transition-all
                      hover:bg-white/70
                      hover:text-indigo-600
                    "
                  >
                    <FiLayout />
                    Admin Dashboard
                  </Link>
                </li>
              )}

              {/* =================================================
                  CREATE COURSE
              ================================================= */}

              {isLoggedIn && role === "ADMIN" && (
                <li>
                  <Link
                    to="/course/create"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      font-medium
                      text-slate-700
                      transition-all
                      hover:bg-white/70
                      hover:text-indigo-600
                    "
                  >
                    <FiPlusCircle />
                    Create New Course
                  </Link>
                </li>
              )}

              {/* =================================================
                  ALL COURSES
              ================================================= */}

              <li>
                <Link
                  to="/courses"
                  onClick={hideDrawer}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    font-medium
                    text-slate-700
                    transition-all
                    hover:bg-white/70
                    hover:text-indigo-600
                  "
                >
                  <FiBookOpen />
                  All Courses
                </Link>
              </li>


              {/* =================================================
                  CONTACT
              ================================================= */}

              <li>
                <Link
                  to="/contact"
                  onClick={hideDrawer}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    font-medium
                    text-slate-700
                    transition-all
                    hover:bg-white/70
                    hover:text-indigo-600
                  "
                >
                  <FiMail />
                  Contact Us
                </Link>
              </li>

              {/* =================================================
                  ABOUT
              ================================================= */}

              <li>
                <Link
                  to="/about"
                  onClick={hideDrawer}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    font-medium
                    text-slate-700
                    transition-all
                    hover:bg-white/70
                    hover:text-indigo-600
                  "
                >
                  <FiInfo />
                  About Us
                </Link>
              </li>

            </ul>

            {/* =====================================================
                BOTTOM ACTIONS
            ===================================================== */}

            <div
              className="
                border-t
                border-black/10
                bg-[#f7db97]
                p-4
              "
            >

              {/* =================================================
                  LOGGED OUT
              ================================================= */}

              {!isLoggedIn ? (
                <div className="grid grid-cols-2 gap-2">

                  <Link
                    to="/login"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      justify-center
                      rounded-xl
                      bg-indigo-600
                      px-3
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-indigo-700
                    "
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-indigo-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      font-semibold
                      text-indigo-600
                      transition
                      hover:bg-indigo-50
                    "
                  >
                    Signup
                  </Link>

                </div>
              ) : (

                /* =================================================
                   LOGGED IN
                ================================================= */

                <div className="grid grid-cols-2 gap-2">

                  {/* PROFILE */}

                  <Link
                    to="/user/profile"
                    onClick={hideDrawer}
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-indigo-50
                      hover:text-indigo-600
                    "
                  >
                    <FiUser />
                    Profile
                  </Link>

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-red-50
                      px-3
                      py-2.5
                      text-sm
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-100
                    "
                  >
                    <FiLogOut />
                    Logout
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <div className="w-full">
  {children}
</div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />

    </div>
  );
}

export default HomeLayout;