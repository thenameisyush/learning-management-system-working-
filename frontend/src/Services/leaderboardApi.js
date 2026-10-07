import axiosInstance from "../Helpers/axiosInstance";

export const leaderboardApi = {
  get: (courseId) =>
    axiosInstance
      .get(`/leaderboard/${courseId}`)
      .then((response) => response.data),
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong"
) => {
  return (
    error?.response?.data?.message ||
    (error?.code === "ERR_NETWORK"
      ? "Cannot reach the server. Check your connection."
      : fallback)
  );
};