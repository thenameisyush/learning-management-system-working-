import axiosInstance from "../Helpers/axiosInstance";

export const dashboardApi = {
  // Student Dashboard
  student: async () => {
    const response = await axiosInstance.get("/dashboard/student");
    return response.data;
  },

  // Teacher Dashboard
  teacher: async () => {
    const response = await axiosInstance.get("/dashboard/teacher");
    return response.data;
  },

  // Admin Dashboard
  admin: async () => {
    const response = await axiosInstance.get("/dashboard/admin");
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