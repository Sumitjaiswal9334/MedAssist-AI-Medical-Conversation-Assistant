import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 600000)
});

export async function transcribeAudio(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/transcribe", formData, { onUploadProgress });

  return response.data;
}

export async function generateSummary(transcript) {
  const response = await api.post("/generate-summary", { transcript });
  return response.data;
}

export async function processAudio(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/process-audio", formData, { onUploadProgress });

  return response.data;
}
