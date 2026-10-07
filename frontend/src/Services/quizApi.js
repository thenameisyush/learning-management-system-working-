import axiosInstance from "../Helpers/axiosInstance";

/**
 * Thin wrapper around the Phase 4 secure quiz API. No score/grading logic
 * lives here or anywhere in the frontend - the server is always the source
 * of truth for correctness, score and pass/fail.
 */
export const quizApi = {
  list: (courseId) =>
    axiosInstance.get("/quizzes", { params: courseId ? { courseId } : undefined }).then((r) => r.data),

  // Manager view (has answers) if the caller manages the course; otherwise
  // student metadata (no questions) - the backend decides, not the query string.
  get: (id) => axiosInstance.get(`/quizzes/${id}`).then((r) => r.data),

  create: (payload) => axiosInstance.post("/quizzes", payload).then((r) => r.data),
  update: (id, payload) => axiosInstance.put(`/quizzes/${id}`, payload).then((r) => r.data),
  remove: (id, { force = false } = {}) =>
    axiosInstance.delete(`/quizzes/${id}`, { params: force ? { force: true } : undefined }).then((r) => r.data),
  publish: (id) => axiosInstance.post(`/quizzes/${id}/publish`).then((r) => r.data),
  unpublish: (id) => axiosInstance.post(`/quizzes/${id}/unpublish`).then((r) => r.data),

  // Attempting
  start: (id) => axiosInstance.post(`/quizzes/${id}/start`).then((r) => r.data),
  saveProgress: (id, attemptId, answers) =>
    axiosInstance.post(`/quizzes/${id}/save-progress`, { attemptId, answers }).then((r) => r.data),
  submit: (id, attemptId, answers) =>
    axiosInstance.post(`/quizzes/${id}/submit`, { attemptId, answers }).then((r) => r.data),
  myAttempts: (id) => axiosInstance.get(`/quizzes/${id}/my-attempts`).then((r) => r.data),

  // Manager-only
  attempts: (id) => axiosInstance.get(`/quizzes/${id}/attempts`).then((r) => r.data),
  stats: (id) => axiosInstance.get(`/quizzes/${id}/stats`).then((r) => r.data),

  // Review (works for the owner and for the course's admin/teacher)
  getAttempt: (attemptId) => axiosInstance.get(`/attempts/${attemptId}`).then((r) => r.data),
};

export const getApiErrorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message ||
  (err?.code === "ERR_NETWORK" ? "Cannot reach the server. Check your connection." : fallback);

export const getApiErrorCode = (err) => err?.response?.data?.code;
