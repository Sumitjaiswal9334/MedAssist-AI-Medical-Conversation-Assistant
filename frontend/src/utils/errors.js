export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Validation error").join(", ");
  }
  if (error?.code === "ECONNABORTED") return "The request timed out. Try a shorter audio file or increase the API timeout.";
  if (error?.message === "Network Error") return "Cannot reach the backend API. Confirm FastAPI is running and CORS is configured.";
  return error?.message || "Something went wrong.";
}
