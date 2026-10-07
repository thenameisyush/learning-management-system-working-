import axiosInstance from "../Helpers/axiosInstance";

/*
|--------------------------------------------------------------------------
| Error helpers
|--------------------------------------------------------------------------
*/

export function getApiErrorMessage(
  error,
  fallback = "Something went wrong"
) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function getApiErrorCode(error) {
  return (
    error?.response?.data?.code ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Assignment API
|--------------------------------------------------------------------------
*/

export const assignmentApi = {
  /*
   * Get assignments
   *
   * GET /api/v1/assignments
   * GET /api/v1/assignments?courseId=...
   */
  list: (courseId) =>
    axiosInstance
      .get("/assignments", {
        params: courseId
          ? { courseId }
          : undefined,
      })
      .then((response) =>
        response.data
      ),

  /*
   * Get one assignment
   */
  get: (id) =>
    axiosInstance
      .get(`/assignments/${id}`)
      .then((response) =>
        response.data
      ),

  /*
   * Create assignment
   *
   * JSON only.
   *
   * No FormData.
   * No file upload.
   * No Cloudinary.
   */
  create: (data) =>
    axiosInstance
      .post(
        "/assignments",
        data
      )
      .then((response) =>
        response.data
      ),

  /*
   * Update assignment
   *
   * JSON only.
   */
  update: (id, data) =>
    axiosInstance
      .put(
        `/assignments/${id}`,
        data
      )
      .then((response) =>
        response.data
      ),

  /*
   * Delete assignment
   */
  remove: (
    id,
    { force = false } = {}
  ) =>
    axiosInstance
      .delete(
        `/assignments/${id}`,
        {
          params: force
            ? { force: true }
            : undefined,
        }
      )
      .then((response) =>
        response.data
      ),

  /*
   * Student submission
   *
   * JSON:
   * {
   *   text,
   *   driveLink
   * }
   */
  submit: (id, data) =>
    axiosInstance
      .post(
        `/assignments/${id}/submit`,
        data
      )
      .then((response) =>
        response.data
      ),

      requestResubmit: (id) =>
  axiosInstance
    .post(`/assignments/${id}/request-resubmit`)
    .then((r) => r.data),

  /*
   * Get student's own submission
   */
  mySubmission: (id) =>
    axiosInstance
      .get(
        `/assignments/${id}/my-submission`
      )
      .then((response) =>
        response.data
      ),

  /*
   * Teacher/Admin:
   * Get all submissions
   */
  submissions: (id) =>
    axiosInstance
      .get(
        `/assignments/${id}/submissions`
      )
      .then((response) =>
        response.data
      ),

  /*
   * Teacher/Admin:
   * Grade submission
   */
  grade: (
    submissionId,
    { marks, feedback }
  ) =>
    axiosInstance
      .put(
        `/assignments/submissions/${submissionId}/grade`,
        {
          marks,
          feedback,
        }
      )
      .then((response) =>
        response.data
      ),

      allowResubmit: (submissionId) =>
  axiosInstance
    .put(`/assignments/submissions/${submissionId}/allow-resubmit`)
    .then((r) => r.data),
};