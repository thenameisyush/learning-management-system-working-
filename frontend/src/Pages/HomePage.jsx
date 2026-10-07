import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HomePageImage from "../Assets/Images/homePageMainImage.png";
import HomeLayout from "../Layouts/HomeLayout";

export default function HomePage() {
  return (
    <HomeLayout>
      <div className="relative overflow-hidden bg-gradient-to-b from-[#fef3d9] via-[#fde68a] to-[#f7db97] min-h-[90vh] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full bg-[#fff1c6] opacity-40 blur-3xl transform rotate-45"></div>
        <div className="absolute -right-32 bottom-10 w-80 h-80 rounded-full bg-[#f3e8ff] opacity-35 blur-3xl"></div>

        <div className="container mx-auto px-6 lg:px-16 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Hero content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-[#120b2d]">
                Find the best
                <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] via-[#c084fc] to-[#f59e0b] block">
                  Online Courses
                </span>
              </h1>

              <p className="text-lg md:text-xl text-[#474749] max-w-xl">
                A huge library of courses taught by industry experts — affordable,
                structured, and regularly updated. Learn at your pace with
                interactive content, projects and certificates.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/courses">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-[#6d28d9] to-[#f59e0b] text-white px-5 py-3 rounded-2xl shadow-lg font-semibold"
                  >
                    Explore courses
                    <span className="inline-flex items-center justify-center bg-white/20 p-2 rounded-md">
                      <i className="ri-arrow-right-double-line" />
                    </span>
                  </motion.button>
                </Link>

                <Link to="/contact">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-3 rounded-2xl border border-[#f59e0b] bg-white/90 text-[#0b0b0b] font-medium"
                  >
                    Contact Us
                  </motion.button>
                </Link>

                {/* Quick search pill */}
                <div className="ml-2 mt-2 sm:mt-0">
                  <div className="flex items-center gap-2 bg-white/90 rounded-full px-3 py-2 shadow-sm">
                    <i className="ri-search-line text-lg" />
                    <input
                      aria-label="Search courses"
                      placeholder="Search courses, e.g. React, Python..."
                      className="bg-transparent outline-none text-sm min-w-[180px]"
                    />
                  </div>
                </div>
              </div>

              {/* Feature chips and stats */}
              <div className="flex flex-wrap gap-4 items-center mt-4">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl shadow">
                  <div className="p-2 bg-white rounded-full">
                    <i className="ri-time-line text-[#6d28d9]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#6b6b6b]">Duration</div>
                    <div className="font-semibold">Self-paced</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl shadow">
                  <div className="p-2 bg-white rounded-full">
                    <i className="ri-certificate-line text-[#f59e0b]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#6b6b6b]">Certificate</div>
                    <div className="font-semibold">Yes — Verified</div>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">1200+</div>
                    <div className="text-xs text-[#6b6b6b]">Students enrolled</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">4.8</div>
                    <div className="text-xs text-[#6b6b6b]">Avg rating</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Image + card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute -left-6 -top-6 w-52 h-52 rounded-2xl bg-gradient-to-tr from-[#fef3c7] to-[#fce7f3] opacity-60 blur-2xl transform rotate-6"></div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <img
                    src={HomePageImage}
                    alt="Students learning online"
                    className="w-full h-72 object-cover"
                  />

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-[#6b6b6b]">Featured</div>
                        <div className="font-semibold text-lg">Full-Stack Web Bootcamp</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">⭐ 4.9</div>
                        <div className="text-xs text-[#6b6b6b]">(3.2k reviews)</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Link to="/courses/bootcamp">
                        <button className="px-4 py-2 rounded-full bg-[#6d28d9] text-white font-medium">View</button>
                      </Link>

                      <button className="px-4 py-2 rounded-full border border-gray-200">Preview</button>
                    </div>
                  </div>
                </div>

                {/* Floating card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-6 -bottom-6 w-48 p-3 bg-white/95 rounded-2xl shadow-lg"
                >
                  <div className="text-xs text-[#6b6b6b]">Popular</div>
                  <div className="font-semibold">Design Thinking - Mini Course</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* SVG wave bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
          <svg className="relative block w-full h-12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,0 C30,10 90,10 120,0 C150,-10 210,-10 240,0 C270,10 330,10 360,0 L360,120 L0,120 Z" fill="#fff" opacity="0.6"></path>
          </svg>
        </div>
      </div>
    </HomeLayout>
  );
}
