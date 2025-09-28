// src/config.js
export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:8001";

export const OVERLAY_ENABLED =
  (process.env.REACT_APP_JERSEY_OVERLAY ?? "1") === "1";
