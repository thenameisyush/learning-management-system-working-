import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import HomeLayout from "../../Layouts/HomeLayout";

import {
  createNewCourse,
  updateCourse,
  getAllCourses,
} from "../../Redux/Slices/CourseSlice";

import axiosInstance from "../../Helpers/axiosInstance";

function CreateCourse() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: currentUser = {}, role = "" } = useSelector(
    (state) => state.auth || {}
  );
  const isAdmin = role === "ADMIN";
  const isTeacher = role === "TEACHER";
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [userInput, setUserInput] = useState({
    title: "",
    category: "",
    createdBy: "",
    instructor: "",
    description: "",
    price: "",
    duration: "",
    thumbnail: null,
    previewImage: "",
  });

  // =========================
  // GET ALL TEACHERS
  // =========================
  useEffect(() => {
    // Only admins can assign a course to a selected teacher.
    if (!isAdmin) return;

    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);

        const response = await axiosInstance.get("/user/teachers");

        if (response?.data?.success) {
          setTeachers(response.data.teachers || []);
        }
      } catch (error) {
        console.error("Teacher loading error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Unable to load teachers"
        );
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, [isAdmin]);

  // =========================
  // LOAD COURSE FOR EDIT
  // =========================
  useEffect(() => {
    if (!isEditMode) return;

    const loadCourse = async () => {
      try {
        const result = await dispatch(getAllCourses());

        const courses = result?.payload || [];

        const course = courses.find(
          (item) => item?._id === id
        );

        if (!course) {
          toast.error("Course not found");
          navigate("/courses");
          return;
        }

        setUserInput({
          title: course?.title || "",
          category: course?.category || "",
          createdBy: course?.createdBy || "",
          instructor: isTeacher
            ? (currentUser?._id || currentUser?.id || course?.instructor?._id || course?.instructor || "")
            : (course?.instructor?._id || course?.instructor || ""),
          description: course?.description || "",
          price: course?.price ?? "",
          duration: course?.duration || "",
          thumbnail: null,
          previewImage:
            course?.thumbnail?.secure_url || "",
        });
      } catch (error) {
        console.error("Course loading error:", error);
        toast.error("Unable to load course");
      }
    };

    loadCourse();
  }, [dispatch, id, isEditMode, navigate, isTeacher, currentUser?._id, currentUser?.id]);

  // =========================
  // IMAGE UPLOAD
  // =========================
  function handleImageUpload(e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        setUserInput({
          ...userInput,
          thumbnail: file,
          previewImage: reader.result,
        });
      };
    }
  }

  // =========================
  // NORMAL INPUT
  // =========================
  function handleUserInput(e) {
    const { name, value } = e.target;

    setUserInput({
      ...userInput,
      [name]: value,
    });
  }

  // =========================
  // TEACHER SELECT
  // =========================
  function handleTeacherChange(e) {
    if (!isAdmin) return;

    const teacherId = e.target.value;

    const selectedTeacher = teachers.find(
      (teacher) => teacher._id === teacherId
    );

    setUserInput({
      ...userInput,
      instructor: teacherId,
      createdBy: selectedTeacher?.fullName || "",
    });
  }

  // =========================
  // FORM SUBMIT
  // =========================
  async function onFormSubmit(e) {
    e.preventDefault();

    const instructorId = isTeacher
      ? (currentUser?._id || currentUser?.id || userInput.instructor)
      : userInput.instructor;

    if (
      !userInput.title ||
      !userInput.description ||
      !userInput.category ||
      !instructorId
    ) {
      toast.error(
        "Course Title, Description, Category and Teacher are required"
      );
      return;
    }

    if (!isEditMode && !userInput.thumbnail) {
      toast.error("Please upload course thumbnail");
      return;
    }

    // =========================
    // CREATE COURSE
    // =========================
    if (!isEditMode) {
     const courseData = {
        ...userInput,
        createdBy: isTeacher ? (currentUser?.fullName || userInput.createdBy) : userInput.createdBy,
        instructorId,
      };

const response = await dispatch(
  createNewCourse(courseData)
);

      if (response?.payload?.success) {
        toast.success("🔥 Course Created Successfully!");
        navigate("/courses");
      }

      return;
    }

    // =========================
    // UPDATE COURSE
    // =========================
    const courseData = {
      ...userInput,
      createdBy: isTeacher ? (currentUser?.fullName || userInput.createdBy) : userInput.createdBy,
      instructorId,
    };

const response = await dispatch(
  updateCourse({
    id,
    data: courseData,
  })
);

    if (response?.payload?.success) {
      toast.success("🔥 Course Updated Successfully!");
      navigate("/courses");
    }
  }

  return (
    <HomeLayout>
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            to="/courses"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-violet-400 hover:text-white"
          >
            <AiOutlineArrowLeft />
            Back to courses
          </Link>

          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                Course management
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {isEditMode ? "Edit course" : "Create a new course"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Add the course information, choose an instructor, and make your learning content ready for students.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {isEditMode ? "Editing course" : "New course"}
            </span>
          </div>

          <form onSubmit={onFormSubmit} className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
            {/* Thumbnail panel */}
            <section className="h-fit rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/20 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
                  <span aria-hidden="true">▧</span>
                </div>
                <div>
                  <h2 className="font-semibold">Course thumbnail</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Choose a clear cover image</p>
                </div>
              </div>

              <label className="group block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 transition hover:border-violet-400">
                {userInput.previewImage ? (
                  <div className="relative">
                    <img
                      src={userInput.previewImage}
                      alt="Course thumbnail preview"
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-10">
                      <span className="text-sm font-medium text-white">Click to change thumbnail</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-56 flex-col items-center justify-center px-5 py-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-3xl text-violet-300 transition group-hover:bg-violet-500/15">
                      ↑
                    </div>
                    <p className="font-semibold text-slate-200">Upload thumbnail</p>
                    <p className="mt-1 text-sm text-slate-500">Click to browse image files</p>
                  </div>
                )}
                <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
              </label>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-200">Thumbnail tip</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Use an image that clearly represents the course. When editing, leave the image unchanged if you do not want to replace it.
                </p>
              </div>
            </section>

            {/* Details panel */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/20 sm:p-6 lg:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xl text-cyan-300">
                  <span aria-hidden="true">▤</span>
                </div>
                <div>
                  <h2 className="font-semibold">Course information</h2>
                  <p className="mt-0.5 text-sm text-slate-400">Fields marked * are required</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-300">Course title <span className="text-rose-400">*</span></label>
                  <input id="title" type="text" name="title" value={userInput.title} onChange={handleUserInput} placeholder="e.g. Full Stack Web Development" required className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                </div>

                <div>
                  {isAdmin ? (
                    <>
                      <label htmlFor="instructor" className="mb-2 block text-sm font-medium text-slate-300">Select teacher <span className="text-rose-400">*</span></label>
                      <select id="instructor" name="instructor" value={userInput.instructor} onChange={handleTeacherChange} required disabled={loadingTeachers} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-wait disabled:opacity-60">
                        <option value="" className="bg-slate-900">{loadingTeachers ? "Loading teachers..." : "Choose a teacher"}</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id} className="bg-slate-900">
                            {teacher.fullName} {teacher.email ? `(${teacher.email})` : ""}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor="assignedTeacher" className="mb-2 block text-sm font-medium text-slate-300">Assigned teacher</label>
                      <div id="assignedTeacher" className="flex min-h-[50px] items-center rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-slate-200">
                        {currentUser?.fullName || "Logged-in teacher"}
                        <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">You</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">This course will remain assigned to your account.</p>
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-300">Category <span className="text-rose-400">*</span></label>
                  <input id="category" type="text" name="category" value={userInput.category} onChange={handleUserInput} placeholder="e.g. Programming" required className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                </div>

                <div>
                  <label htmlFor="price" className="mb-2 block text-sm font-medium text-slate-300">Price <span className="text-slate-500">(₹)</span></label>
                  <input id="price" type="number" min="0" name="price" value={userInput.price} onChange={handleUserInput} placeholder="0 = Free" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                  <p className="mt-1.5 text-xs text-slate-500">Enter 0 for a free course.</p>
                </div>

                <div>
                  <label htmlFor="duration" className="mb-2 block text-sm font-medium text-slate-300">Duration</label>
                  <input id="duration" type="text" name="duration" value={userInput.duration} onChange={handleUserInput} placeholder="e.g. 6 weeks" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                  <p className="mt-1.5 text-xs text-slate-500">Example: 10 hours or 6 weeks.</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-300">Course description <span className="text-rose-400">*</span></label>
                  <textarea id="description" name="description" value={userInput.description} onChange={handleUserInput} placeholder="Explain what students will learn in this course..." required rows={5} className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <Link to="/courses" className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  Cancel
                </Link>
                <button type="submit" disabled={isAdmin && loadingTeachers} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                  {isEditMode ? "Update course" : "Create course"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>
    </HomeLayout>
  );
}

export default CreateCourse;
