import React, { useState } from "react";
import { quizApi } from "../../Services/quizApi";
import { getApiErrorMessage } from "../../Services/quizApi";
import { useNavigate, useLocation } from "react-router-dom";

// ================= QUESTION CARD =================
function QuestionCard({ q, i, updateQuestion, removeQuestion }) {
  return (
    <div className="bg-[#0f172a] border border-purple-800/30 rounded-2xl p-6 space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="bg-purple-600 w-6 h-6 flex items-center justify-center rounded-full text-sm">
            {i + 1}
          </span>
          Question {i + 1}
        </h2>

        <button
          onClick={() => removeQuestion(i)}
          className="text-red-500 text-sm"
        >
          Remove
        </button>
      </div>

      {/* Question */}
      <textarea
        className="w-full p-3 rounded-lg bg-black border border-gray-700 text-white"
        placeholder="Enter question here..."
        value={q.text}
        onChange={(e) => updateQuestion(i, { ...q, text: e.target.value })}
      />

      {/* TYPE */}
      <div className="flex gap-2">
        {["MCQ", "TRUE_FALSE"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              updateQuestion(i, {
                ...q,
                type: t,
                options: t === "TRUE_FALSE" ? ["True", "False"] : q.options.length >= 2 ? q.options : ["", ""],
                correctOptionIndex: 0,
              })
            }
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              (q.type || "MCQ") === t ? "border-purple-500 bg-purple-900/40 text-white" : "border-gray-700 text-gray-400"
            }`}
          >
            {t === "MCQ" ? "Multiple Choice" : "True / False"}
          </button>
        ))}
      </div>

      {/* OPTIONS */}
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-gray-400">Options</p>
          <p className="text-gray-400">Correct Answer</p>
        </div>

        {q.options.map((opt, j) => (
          <div
            key={j}
            className={`flex items-center justify-between px-3 py-2 mb-2 rounded-lg border ${
              q.correctOptionIndex === j
                ? "border-purple-500"
                : "border-gray-700"
            } bg-black`}
          >
            <div className="flex items-center gap-3 w-full">
              <span className="bg-purple-600 w-8 h-8 flex items-center justify-center rounded-full">
                {String.fromCharCode(65 + j)}
              </span>

              {(q.type || "MCQ") === "TRUE_FALSE" ? (
                <span className="flex-1 text-white">{opt}</span>
              ) : (
                <input
                  className="flex-1 bg-transparent outline-none text-white"
                  value={opt}
                  placeholder={`Option ${j + 1}`}
                  onChange={(e) => {
                    const newOptions = [...q.options];
                    newOptions[j] = e.target.value;
                    updateQuestion(i, { ...q, options: newOptions });
                  }}
                />
              )}
            </div>

            <input
              type="radio"
              checked={q.correctOptionIndex === j}
              onChange={() =>
                updateQuestion(i, { ...q, correctOptionIndex: j })
              }
            />
          </div>
        ))}

        {(q.type || "MCQ") !== "TRUE_FALSE" && q.options.length < 6 && (
          <button
            onClick={() =>
              updateQuestion(i, { ...q, options: [...q.options, ""] })
            }
            className="text-purple-400 text-sm mt-2"
          >
            + Add Option
          </button>
        )}
      </div>

      {/* Marks */}
      <div>
        <label className="text-gray-400 text-sm">Marks</label>
        <input
          type="number"
          value={q.marks}
          onChange={(e) =>
            updateQuestion(i, {
              ...q,
              marks: parseInt(e.target.value || "1"),
            })
          }
          className="w-full mt-1 p-2 rounded bg-black border border-gray-700 text-white"
        />
      </div>

    </div>
  );
}

// ================= MAIN =================
export default function QuizCreate() {
  const location = useLocation();
  const nav = useNavigate();

  const { lectureId, courseId } = location.state || {}; // 🔥 IMPORTANT

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(20);
  const [passingMarks, setPassingMarks] = useState(0);

  const [questions, setQuestions] = useState([
    {
      text: "",
      type: "MCQ",
      options: ["", ""],
      correctOptionIndex: 0,
      marks: 1,
    },
  ]);

  const updateQuestion = (index, updated) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "MCQ",
        options: ["", ""],
        correctOptionIndex: 0,
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (i) => {
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const [saving, setSaving] = useState(false);

  // ================= SUBMIT =================
  const submit = async () => {
    if (!title.trim() || questions.length === 0) {
      alert("Please add a title and at least one question");
      return;
    }
    if (!courseId) {
      alert("Course is missing - open this page from a course's lecture list");
      return;
    }

    setSaving(true);
    try {
      const data = await quizApi.create({
  courseId,
  title,
  description,
  durationMinutes: duration,
  passingMarks,
  questions,
  ...(lectureId && { lectureId }),
});
      console.log("🔥 NEW QUIZ CREATED RESPONSE:", data);
console.log("🔥 NEW QUIZ CREATED ID:", data?.quiz?._id);

      // The teacher lands on the (draft) preview and publishes from there.
      nav(`/quiz-preview/${data.quiz._id}`);
    } catch (err) {
      alert(getApiErrorMessage(err, "Error creating quiz"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#020617] text-white p-6">

      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold">Create Quiz</h1>
          <p className="text-gray-400">Build engaging quizzes</p>
        </div>

        {/* Top Section */}
        <div className="bg-[#0f172a] p-6 rounded-2xl space-y-4">

          <input
            placeholder="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-black border border-gray-700 rounded"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-black border border-gray-700 rounded"
          />

          <div className="flex gap-3 items-center">
            <span>Duration</span>
            <button onClick={() => setDuration(d => Math.max(1, d - 1))}>-</button>
            <span>{duration} min</span>
            <button onClick={() => setDuration(d => d + 1)}>+</button>
          </div>

          <div className="flex gap-3 items-center">
  <span>Passing Marks</span>

  <input
    type="number"
    min="0"
    value={passingMarks}
    onChange={(e) => setPassingMarks(Number(e.target.value) || 0)}
    className="w-24 p-2 bg-black border border-gray-700 rounded text-white"
  />

  <span className="text-gray-400">
    marks
  </span>
</div>
        </div>

        {/* Questions */}
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            q={q}
            i={i}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
          />
        ))}

        <button
          onClick={addQuestion}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          + Add Question
        </button>

        <button
          onClick={submit}
          disabled={saving}
          className="bg-green-600 px-6 py-2 rounded text-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create Quiz \uD83D\uDE80"}
        </button>

      </div>
    </div>
  );
}