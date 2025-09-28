// import React, { useCallback, useMemo, useRef, useState } from "react";
// import { useVideoCues } from "../hooks/useVideoCues";
// import { BettingPoll } from "../components/BettingPoll";

// const SAMPLE_POLLS = {
//   2: {
//     id: "poll_15",
//     question: "Drive outcome?",
//     stake: 50,
//     timeoutMs: 12000,
//     options: [
//       { id: "td",       label: "Touchdown",     odds: 1.8, isCorrect: true },  // ✅ exactly one correct
//       { id: "fg",       label: "Field Goal",    odds: 2.2 },
//       { id: "punt",     label: "Punt / No Score", odds: 1.6 },
//       { id: "turnover", label: "Turnover",      odds: 2.8 },
//     ],
//   },
//   5: {
//     id: "poll_42",
//     question: "Next play call?",
//     stake: 30,
//     timeoutMs: 9000,
//     options: [
//       { id: "run",      label: "Run",           odds: 1.7 },
//       { id: "pass",     label: "Pass",          odds: 1.4, isCorrect: true },   // ✅ exactly one correct
//       { id: "screen",   label: "Screen Pass",   odds: 2.0 },
//       { id: "scramble", label: "QB Scramble",   odds: 2.5 },
//     ],
//   },
// };

// export const BettingDuringVideo = () => {
//   const videoRef = useRef(null);
//   const [active, setActive] = useState(null);

//   const cueSeconds = useMemo(() => Object.keys(SAMPLE_POLLS).map(Number), []);
//   const onCue = useCallback((sec) => {
//     setActive(SAMPLE_POLLS[sec]);
//   }, []);

//   useVideoCues(videoRef.current, cueSeconds, onCue);

//  return (
//   <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
//     <div
//       style={{
//         position: "relative",
//         width: "100%",
//         maxWidth: 840,          // cap the width (adjust as you like)
//         borderRadius: 12,
//         overflow: "hidden",
//       }}
//     >
//       <video
//         ref={videoRef}
//         src="/game-video.mp4"
//         style={{
//           width: "70%",
//           height: 270,          // fixed frame height (similar to your old 400px)
//           display: "block",
//           backgroundColor: "#000",
//           borderRadius: 12,
//           objectFit: "contain", // keeps full video visible in the frame
//         }}
//         controls
//       />
//       <BettingPoll poll={active} onClose={() => setActive(null)} />
//     </div>
//   </div>
// );

// };


import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useVideoCues } from "../hooks/useVideoCues";
import { BettingPoll } from "../components/BettingPoll";

const SAMPLE_POLLS = {
  2: {
    id: "poll_15",
    question: "Drive outcome?",
    stake: 50,
    timeoutMs: 12000,
    options: [
      { id: "td",       label: "Touchdown",     odds: 1.8, isCorrect: true },
      { id: "fg",       label: "Field Goal",    odds: 2.2 },
      { id: "punt",     label: "Punt / No Score", odds: 1.6 },
      { id: "turnover", label: "Turnover",      odds: 2.8 },
    ],
  },
  5: {
    id: "poll_42",
    question: "Next play call?",
    stake: 30,
    timeoutMs: 9000,
    options: [
      { id: "run",      label: "Run",           odds: 1.7 },
      { id: "pass",     label: "Pass",          odds: 1.4, isCorrect: true },
      { id: "screen",   label: "Screen Pass",   odds: 2.0 },
      { id: "scramble", label: "QB Scramble",   odds: 2.5 },
    ],
  },
};

export const BettingDuringVideo = () => {
  const videoRef = useRef(null);
  const [active, setActive] = useState(null);

  const cueSeconds = useMemo(() => Object.keys(SAMPLE_POLLS).map(Number), []);
  const onCue = useCallback((sec) => {
    setActive(SAMPLE_POLLS[sec]);
  }, []);

  useVideoCues(videoRef.current, cueSeconds, onCue);

  // ✅ Add this effect: handles links like #seek-97 from chat/messages
  useEffect(() => {
    const handleClick = (e) => {
      const a = e.target.closest?.("a[href^='#seek-']");
      if (!a) return;
      e.preventDefault();
      const sec = parseInt(a.getAttribute("href").slice("#seek-".length), 10);
      const v = videoRef.current;
      if (Number.isFinite(sec) && v) {
        v.currentTime = sec;
        v.play?.();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 840,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          src="/game-video.mp4"
          style={{
            width: "70%",
            height: 270,
            display: "block",
            backgroundColor: "#000",
            borderRadius: 12,
            objectFit: "contain",
          }}
          controls
        />
        <BettingPoll poll={active} onClose={() => setActive(null)} />
      </div>
    </div>
  );
};
