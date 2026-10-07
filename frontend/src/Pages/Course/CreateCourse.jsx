import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useDispatch } from "react-redux";
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
  }, []);

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
          instructor:
            course?.instructor?._id ||
            course?.instructor ||
            "",
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
  }, [dispatch, id, isEditMode, navigate]);

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

    if (
      !userInput.title ||
      !userInput.description ||
      !userInput.category ||
      !userInput.instructor
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
  instructorId: userInput.instructor,
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
  instructorId: userInput.instructor,
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
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute w-[500px] h-[500px] bg-purple-600 blur-[150px] opacity-30 top-[-100px] left-[-100px]" />

        <div className="absolute w-[400px] h-[400px] bg-yellow-500 blur-[150px] opacity-20 bottom-[-100px] right-[-100px]" />

        <form
          onSubmit={onFormSubmit}
          className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] rounded-3xl p-10 w-[900px] text-white"
        >
          {/* Back Button */}
          <Link
            to="/courses"
            className="absolute top-6 left-6 text-2xl hover:scale-125 transition"
          >
            <AiOutlineArrowLeft />
          </Link>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            {isEditMode
              ? "✏️ Edit Course"
              : "🚀 Create New Course"}
          </h1>

          <div className="grid grid-cols-2 gap-10">
            {/* =========================
                LEFT SIDE
            ========================== */}
            <div className="space-y-8">
              {/* Image Upload */}
              <label className="group cursor-pointer relative block border-2 border-dashed border-gray-500 rounded-2xl overflow-hidden hover:border-yellow-400 transition-all">
                {userInput.previewImage ? (
                  <img
                    src={userInput.previewImage}
                    className="h-52 w-full object-cover group-hover:scale-105 transition"
                    alt="Course thumbnail"
                  />
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center text-gray-400 group-hover:text-yellow-400 transition">
                    <p className="text-lg font-semibold">
                      Upload Thumbnail
                    </p>

                    <p className="text-sm">
                      Click or Drag Image
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>

              {/* Course Title */}
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={userInput.title}
                  onChange={handleUserInput}
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-2"
                />

                <label className="absolute left-0 top-2 text-gray-400 text-sm peer-focus:-top-4 peer-focus:text-yellow-400 transition-all">
                  Course Title
                </label>
              </div>
            </div>

            {/* =========================
                RIGHT SIDE
            ========================== */}
            <div className="space-y-8">
              {/* Teacher Dropdown */}
              <div className="relative">
                <label className="block text-gray-400 text-sm mb-2">
                  Select Teacher
                </label>

                <select
                  name="instructor"
                  value={userInput.instructor}
                  onChange={handleTeacherChange}
                  required
                  disabled={loadingTeachers}
                  className="w-full bg-black/40 border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-3 text-white"
                >
                  <option
                    value=""
                    className="bg-gray-900 text-gray-400"
                  >
                    {loadingTeachers
                      ? "Loading teachers..."
                      : "Select a teacher"}
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher._id}
                      className="bg-gray-900 text-white"
                    >
                      {teacher.fullName} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="relative">
                <input
                  type="text"
                  name="category"
                  value={userInput.category}
                  onChange={handleUserInput}
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-2"
                />

                <label className="absolute left-0 top-2 text-gray-400 text-sm peer-focus:-top-4 peer-focus:text-yellow-400 transition-all">
                  Category
                </label>
              </div>

              {/* Price + Duration */}
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={userInput.price}
                    onChange={handleUserInput}
                    placeholder="0 = free"
                    className="peer w-full bg-transparent border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-2"
                  />

                  <label className="absolute left-0 -top-4 text-gray-400 text-sm">
                    Price (optional)
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    name="duration"
                    value={userInput.duration}
                    onChange={handleUserInput}
                    placeholder="e.g. 6 weeks"
                    className="peer w-full bg-transparent border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-2"
                  />

                  <label className="absolute left-0 -top-4 text-gray-400 text-sm">
                    Duration (optional)
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="relative">
                <textarea
                  name="description"
                  value={userInput.description}
                  onChange={handleUserInput}
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-500 focus:border-yellow-400 outline-none py-2 h-24 resize-none"
                />

                <label className="absolute left-0 top-2 text-gray-400 text-sm peer-focus:-top-4 peer-focus:text-yellow-400 transition-all">
                  Course Description
                </label>
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loadingTeachers}
            className="mt-10 w-full py-3 rounded-xl font-semibold text-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,165,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditMode
              ? "Update Course"
              : "Create Course"}
          </button>
        </form>
      </div>
    </HomeLayout>
  );
}

export default CreateCourse;