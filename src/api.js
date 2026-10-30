import axios from "axios";

// In production or cloud deployment (Render, Vercel), use same-origin "/api"
// In local React development server (port 3000), use "http://localhost:5000/api"
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (
    process.env.NODE_ENV === "production" ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost")
  ) {
    return "/api";
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

/* ⭐ AUTO ATTACH TOKEN */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lg_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

