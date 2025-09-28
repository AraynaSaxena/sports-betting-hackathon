// src/apiClient.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8001";

export async function predictRegions(payload) {
  const resp = await fetch(`${API_BASE}/predict_regions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return resp.json();
}

export async function health() {
  const resp = await fetch(`${API_BASE}/health`);
  return resp.json();
}

