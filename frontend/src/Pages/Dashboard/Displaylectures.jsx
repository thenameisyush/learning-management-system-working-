import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import HomeLayout from "../../Layouts/HomeLayout";
import {
  deleteCourseLecture,
  getCourseLectures,
} from "../../Redux/Slices/LectureSlice";

function Displaylectures() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();

  const { lectures } = useSelector((state) => state.lecture);
  const { role } = useSelector((state) => state.auth);

  const [currentVideo, setCurrentVideo] = useState(0);

  async function onLectureDelete(courseId, lectureId) {
    await dispatch(deleteCourseLecture({ courseId, lectureId }));
    await dispatch(getCourseLectures(courseId));
  }

  useEffect(() => {
    if (!state) {
      navigate("/courses");
      return;
    }
    dispatch(getCourseLectures(state._id));
  }, []);

  // VIDEO IS OPTIONAL: a lecture only has a player if a video URL exists
  const activeLecture = lectures?.[currentVideo];
  const activeHasVideo = Boolean(activeLecture?.lecture?.secure_url);

  return (
    <HomeLayout>
      <div className="flex flex-col gap-10 items-center justify-center min-h-[90vh] py-10 text-white mx-[5%]">

        {/* COURSE TITLE */}
        <div className="text-center text-2xl font-semibold text-yellow-500">
          Course Name: {state?.title}
        </div>

        {lectures && lectures.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-10 w-full">

            {/* LEFT VIDEO */}
            <div className="space-y-5 w-full lg:w-[28rem] p-3 rounded-lg shadow-[0_0_10px_black]">

              {activeHasVideo ? (
                <video
                  key={activeLecture?._id}
                  src={activeLecture?.lecture?.secure_url}
                  className="rounded-lg w-full"
                  controls
                  muted
                />
              ) : (
                <div className="rounded-lg w-full aspect-video border border-dashed border-gray-600 flex flex-col items-center justify-center text-center gap-1 px-4">
                  <span className="text-3xl" aria-hidden="true">🎞️</span>
                  <p className="font-semibold">No video available</p>
                  <p className="text-sm text-gray-400">
                    This lecture has no recorded video. Check the course for notes, quizzes and assignments.
                  </p>
                </div>
              )}

              <div>
                <h1>
                  <span className="text-yellow-500">Title: </span>
                  {lectures[currentVideo]?.title}
                </h1>

                <p>
                  <span className="text-yellow-500">Description: </span>
                  {lectures[currentVideo]?.description}
                </p>
              </div>
            </div>

            {/* RIGHT LIST */}
            <div className="w-full lg:w-[28rem] space-y-4">

              {/* HEADER */}
              <div className="flex justify-between items-center text-yellow-500 font-semibold text-xl">
                <p>Lectures List</p>

                {/* ✅ ADD LECTURE BUTTON (SAME AS OLD) */}
                {role === "ADMIN" && (
                  <button
                    onClick={() =>
                      navigate("/course/addlecture", { state })
                    }
                    className="bg-purple-600 px-3 py-1 rounded"
                  >
                    + Add Lecture
                  </button>
                )}
              </div>

              {/* 🔥 LECTURE CARDS */}
              {lectures.map((lecture, idx) => {
                
                // ✅ SAFE QUIZ ID FIX
                const quizId = lecture.quizId?._id || lecture.quizId;

                return (
                  <div
                    key={lecture._id}
                    className="bg-[#0f172a] p-4 rounded-xl border border-gray-700 shadow hover:border-purple-500 transition"
                  >

                    {/* TITLE */}
                    <p
                      className="cursor-pointer font-semibold"
                      onClick={() => setCurrentVideo(idx)}
                    >
                      Lecture {idx + 1}: {lecture.title}
                      {!lecture?.lecture?.secure_url && (
                        <span className="ml-2 text-xs font-normal text-gray-400 border border-gray-600 rounded px-2 py-0.5">
                          No video
                        </span>
                      )}
                    </p>

                    {/* BUTTONS */}
                    <div className="flex justify-between mt-3">

                      {/* 🎯 STUDENT QUIZ */}
                      {role === "USER" && (
                        <button
                          disabled={!quizId}
                          onClick={() => {
                            if (!quizId) {
                              alert("No quiz available");
                              return;
                            }
                            navigate(`/quiz-preview/${quizId}`);
                          }}
                          className={`px-3 py-1 rounded text-sm ${
                            quizId
                              ? "bg-green-600"
                              : "bg-gray-600 cursor-not-allowed"
                          }`}
                        >
                          {quizId ? "Attempt Quiz" : "No Quiz"}
                        </button>
                      )}

                      {/* 🧑‍🏫 ADMIN CONTROLS */}
                      {role === "ADMIN" && (
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              navigate("/quizzes/create", {
                                state: {
                                  lectureId: lecture._id,
                                  courseId: state._id,
                                },
                              })
                            }
                            className="bg-blue-600 px-3 py-1 rounded text-sm"
                          >
                            Create Quiz
                          </button>

                          {quizId && (
                            <button
                              onClick={() =>
                                navigate(`/quiz-preview/${quizId}?mode=admin`)
                              }
                              className="bg-yellow-600 px-3 py-1 rounded text-sm"
                            >
                              View Quiz
                            </button>
                          )}

                          <button
                            onClick={() =>
                              onLectureDelete(state._id, lecture._id)
                            }
                            className="bg-red-600 px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>

                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg border border-dashed border-gray-600 rounded-xl p-8 text-center space-y-3">
            <p className="text-4xl" aria-hidden="true">🎞️</p>
            <p className="text-lg font-semibold">No video has been added to this course yet.</p>
            <p className="text-sm text-gray-400">
              {role === "ADMIN"
                ? "Videos are optional. You can add one any time, or use notes, quizzes and assignments instead."
                : "Your instructor may share notes, quizzes and assignments for this course."}
            </p>
            {role === "ADMIN" && (
              <button
                onClick={() =>
                  navigate("/course/addlecture", { state })
                }
                className="bg-purple-600 px-4 py-2 rounded"
              >
                Add Lecture
              </button>
            )}
          </div>
        )}
      </div>
    </HomeLayout>
  );
}

export default Displaylectures;