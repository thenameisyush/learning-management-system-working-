import axiosInstance from "../Helpers/axiosInstance";

export const notesApi = {
  list: async (courseId) => {
    const response = await axiosInstance.get(
      `/notes?courseId=${courseId}`
    );

    return response.data;
  },

  get: async (noteId) => {
    const response = await axiosInstance.get(`/notes/${noteId}`);

    return response.data;
  },

  create: async (payload) => {
    const response = await axiosInstance.post(
      "/notes",
      payload
    );

    return response.data;
  },

  update: async (noteId, payload) => {
    const response = await axiosInstance.put(
      `/notes/${noteId}`,
      payload
    );

    return response.data;
  },

  remove: async (noteId) => {
    const response = await axiosInstance.delete(
      `/notes/${noteId}`
    );

    return response.data;
  },
};

export function getApiErrorMessage(
  error,
  fallback = "Something went wrong"
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}