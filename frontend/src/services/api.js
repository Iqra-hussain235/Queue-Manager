"use client";

import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api/v1" : undefined);

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be set outside development");
}

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ""),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("queue-manager-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("queue-manager-token");
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export const apiError = (error) => error.response?.data?.message || error.message || "Something went wrong";
export default api;
