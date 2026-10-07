import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import CourseCard from "../../Components/CourseCard";
import HomeLayout from "../../Layouts/HomeLayout";
import { getAllCourses } from "../../Redux/Slices/CourseSlice";

function CourseList() {
  const dispatch = useDispatch();

  const { courseData } = useSelector((state) => state.course);

  async function loadCourses() {
    await dispatch(getAllCourses());
  }

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <HomeLayout>
      <div
        className="min-h-[90vh] px-4 py-8 sm:px-6 md:px-8 lg:px-10 xl:px-12"
        style={{ backgroundColor: "#F7DB97" }}
      >
        <div className="mx-auto w-full max-w-[1500px]">

          {/* HEADER */}
          <div className="mb-10 text-center">

            <div className="mb-3 inline-flex items-center rounded-full border border-yellow-700/20 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-800 shadow-sm">
              Explore & Learn
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span
                className="mr-2 text-yellow-700"
                style={{ fontFamily: "Caveat, cursive" }}
              >
                Trending
              </span>

              <span className="text-gray-900">
                Courses
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-700 sm:text-base">
              Discover courses, learn new skills and continue your learning
              journey with our structured online content.
            </p>
          </div>

          {/* COURSE HEADER */}
          {courseData?.length > 0 && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Available Courses
                </h2>

                <p className="mt-1 text-sm text-gray-700">
                  {courseData.length}{" "}
                  {courseData.length === 1 ? "course" : "courses"} available
                </p>
              </div>

              <div className="w-fit rounded-full border border-black/10 bg-white/40 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                📚 Learning Library
              </div>
            </div>
          )}

          {/* COURSE GRID */}
          {courseData?.length > 0 ? (
            <div
              className="
                grid
                w-full
                grid-cols-1
                gap-6
                sm:grid-cols-2
                lg:grid-cols-3
                2xl:grid-cols-4
              "
            >
              {courseData.map((element) => (
                <div
                  key={element._id}
                  className="
                    min-w-0
                    w-full
                    max-w-full
                    overflow-hidden
                    rounded-3xl
                    border
                    border-black/10
                    bg-white/60
                    p-2
                    shadow-lg
                    transition
                    duration-300
                    hover:-translate-y-2
                    hover:bg-white/80
                    hover:shadow-2xl
                  "
                >
                  <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl">
                    <CourseCard data={element} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-black/20 bg-white/40 shadow-sm">
              <div className="max-w-md px-6 text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/60 text-4xl shadow-sm">
                  📚
                </div>

                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  No Courses Available
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-700">
                  There are currently no courses available. Please check again
                  later for new learning content.
                </p>

                <button
                  onClick={loadCourses}
                  className="mt-6 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-gray-900 shadow-md transition hover:bg-yellow-400 hover:shadow-lg"
                >
                  Refresh Courses
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}

export default CourseList;