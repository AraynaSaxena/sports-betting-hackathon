// src/components/JerseyHoverOverlay.jsx
import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "../config";

const API_URL = `${API_BASE}/predict_regions`;

export default function JerseyHoverOverlay({ videoRef, hovering: hoveringProp }) {
  const canvasRef = useRef(null);
  const [results, setResults] = useState([]);
  const [internalHover, setInternalHover] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetection, setLastDetection] = useState(0);

  // Use parent-controlled hover if provided
  const hovering = typeof hoveringProp === "boolean" ? hoveringProp : internalHover;

  async function requestPreds() {
    const v = videoRef?.current;
    const c = canvasRef.current;

    if (!v || !c || v.videoWidth === 0 || isProcessing) return;

    // Throttle detection to every 3 seconds
    const now = Date.now();
    if (now - lastDetection < 3000) return;

    setIsProcessing(true);
    setLastDetection(now);

    try {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const dataURL = c.toDataURL("image/jpeg", 0.7);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame_data_url: dataURL,
          regions: []
        }),
      });

      if (response.ok) {
        const json = await response.json();
        setResults(Array.isArray(json.results) ? json.results : []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Detection request failed:", error);
      setResults([]);
    } finally {
      setIsProcessing(false);
    }
  }

  // Only detect when hovering, and throttle requests
  useEffect(() => {
    if (!hovering) {
      setResults([]);
      return;
    }

    // Single detection on hover start
    requestPreds();
  }, [hovering]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Overlay - positioned to not block controls */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: "60px", // Leave space for video controls
        pointerEvents: "none",
        zIndex: 5
      }}>

        {/* Hover detection area - only if parent doesn't control it */}
        {typeof hoveringProp !== "boolean" && (
          <div
            onMouseEnter={() => setInternalHover(true)}
            onMouseLeave={() => {
              setInternalHover(false);
              setResults([]);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#00ff88",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 10
          }}>
            Detecting players...
          </div>
        )}

        {/* Detection results */}
        {results.map((r, i) => (
          <div
            key={`player-${i}`}
            style={{
              position: "absolute",
              left: r.box[0],
              top: r.box[1],
              width: r.box[2],
              height: r.box[3],
              border: "2px solid #00ff88",
              borderRadius: "6px",
              pointerEvents: "none",
            }}
          >
            <div style={{
              position: "absolute",
              top: -25,
              left: 0,
              background: "rgba(0, 255, 136, 0.9)",
              color: "black",
              fontSize: "12px",
              fontWeight: "bold",
              padding: "2px 6px",
              borderRadius: "4px",
            }}>
              {r.position ?? (r.jersey ? `#${r.jersey}` : 'PLAYER')} • {(r.conf * 100).toFixed(0)}%
            </div>
          </div>
        ))}

        {/* Results counter */}
        {results.length > 0 && (
          <div style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#00ff88",
            padding: "5px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}>
            {results.length} detected
          </div>
        )}
      </div>
    </>
  );
}
