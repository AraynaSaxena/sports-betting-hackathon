// // // // src/components/InsightsSidebar.jsx
// // // import React from "react";
// // // import styled from "@emotion/styled";
// // // import { motion, AnimatePresence } from "framer-motion";
// // // import { X, DollarSign, Activity, BarChart3, Download, Trash2 } from "lucide-react";
// // // import { useWallet } from "../context/WalletContext";
// // // import { BetAnalytics } from "../utils/BetAnalytics";
// // // import { useBetAnalytics } from "../hooks/useBetAnalytics";

// // // const Scrim = styled(motion.div)`position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:1000;`;
// // // const Panel = styled(motion.aside)`position:fixed; inset:0 auto 0 0; width:min(320px, 92vw); background:rgba(16,18,27,.98); border-right:1px solid rgba(255,255,255,.1); color:#fff; padding:14px; display:flex; flex-direction:column; gap:12px;`;
// // // const Row = styled.div`display:flex; align-items:center; justify-content:space-between; gap:8px;`;
// // // const Badge = styled.div`display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.08); padding:6px 10px; border-radius:999px; font-size:12px;`;
// // // const List = styled.div`display:grid; gap:8px; max-height:40vh; overflow:auto;`;
// // // const Btn = styled.button`background:#fff; color:#111; border:0; padding:8px 10px; border-radius:10px; font-weight:600; cursor:pointer;`;

// // // function Spark({ series, height=40 }) {
// // //   const max = Math.max(1, ...series.map(v=>Math.abs(v)));
// // //   return (
// // //     <div style={{ display:"flex", alignItems:"end", gap:3, height }}>
// // //       {series.map((v,i)=>(
// // //         <div key={i} style={{ width:8, height:Math.max(2,(Math.abs(v)/max)*(height-8)), background:v>=0?"#4cd964":"#ff3b30", borderRadius:3 }} />
// // //       ))}
// // //     </div>
// // //   );
// // // }

// // // export default function InsightsSidebar({ open, onClose }) {
// // //   const { balance, loading } = useWallet();
// // //   const { total, wins, losses, net, winRate, series, recent } = useBetAnalytics();

// // //   return (
// // //     <AnimatePresence>
// // //       {open && (
// // //         <>
// // //           <Scrim initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose} />
// // //           <Panel initial={{ x:-24, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:-16, opacity:0 }} transition={{ type:"spring", stiffness:320, damping:28 }} >
// // //             <Row>
// // //               <h3 style={{ margin:0 }}>Analytics</h3>
// // //               <button onClick={onClose} style={{ background:"transparent", border:0, color:"#fff", cursor:"pointer" }}><X size={18} /></button>
// // //             </Row>

// // //             <Row style={{ gap:6, flexWrap:"wrap" }}>
// // //               <Badge><DollarSign size={14} /> {loading ? "…" : `$${balance.toFixed(2)}`}</Badge>
// // //               <Badge><BarChart3 size={14} /> {Math.round(winRate*100)}% win</Badge>
// // //               <Badge><Activity size={14} /> Net {net>=0?"+":""}{net}</Badge>
// // //               <Badge>🎯 {wins}/{total} wins</Badge>
// // //             </Row>

// // //             <Spark series={series} />

// // //             <div style={{ fontSize:12, opacity:.75 }}>Recent</div>
// // //             <List>
// // //               {recent.slice(-8).reverse().map((b,i)=>(
// // //                 <Row key={i} style={{ fontSize:13 }}>
// // //                   <div style={{ maxWidth:"60%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
// // //                     {b.question || b.chosenLabel} <span style={{ opacity:.6 }}>• {b.source}</span>
// // //                   </div>
// // //                   <div style={{ color: b.win ? "#4cd964" : "#ff3b30", fontWeight:700 }}>
// // //                     {b.delta>0?"+":""}{b.delta}
// // //                   </div>
// // //                 </Row>
// // //               ))}
// // //               {recent.length===0 && <div style={{ opacity:.7, fontSize:13 }}>No bets yet.</div>}
// // //             </List>

// // //             <Row style={{ marginTop:"auto", gap:8 }}>
// // //               <Btn onClick={() => BetAnalytics.exportCSV()}><Download size={16} /> Export</Btn>
// // //               <Btn onClick={() => { if (window.confirm("Clear local analytics?")) { BetAnalytics.clear(); } }} style={{ background:"#111", color:"#fff", border:"1px solid rgba(255,255,255,.18)" }}>
// // //                 <Trash2 size={16} /> Clear
// // //               </Btn>
// // //             </Row>
// // //           </Panel>
// // //         </>
// // //       )}
// // //     </AnimatePresence>
// // //   );
// // // }



// // // src/components/InsightsSidebar.jsx
// // // src/components/InsightsSidebar.jsx
// import React from "react";
// import styled from "@emotion/styled";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, DollarSign, Activity, BarChart3, Download, Trash2 } from "lucide-react";
// import { useWallet } from "../context/WalletContext";
// import { BetAnalytics } from "../utils/BetAnalytics";
// import { useBetAnalytics } from "../hooks/useBetAnalytics";

// // --- layout ---
// const Scrim = styled(motion.div)`
//   position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000;
// `;
// const Panel = styled(motion.aside)`
//   position: fixed; inset: 0 auto 0 0;
//   width: min(360px, 92vw);
//   background: rgba(16,18,27,.98);
//   border-right: 1px solid rgba(255,255,255,.1);
//   color: #f5f7ff; /* ✅ brighter white */
//   padding: 16px 14px 14px;
//   display: flex; flex-direction: column; gap: 12px;
//   z-index: 1001;                /* above scrim so clicks don't close overlay */
//   -webkit-font-smoothing: antialiased; /* ✅ crisper text */
//   text-rendering: optimizeLegibility;
// `;
// const Row = styled.div`
//   display: flex; align-items: center; justify-content: space-between; gap: 8px;
// `;
// const Badge = styled.div`
//   display: inline-flex; align-items: center; gap: 6px;
//   background: rgba(255,255,255,.08); padding: 6px 10px; border-radius: 999px; font-size: 12px;
// `;
// const Card = styled.div`
//   background: rgba(255,255,255,.05);
//   border: 1px solid rgba(255,255,255,.08);
//   border-radius: 12px; padding: 12px;
// `;
// const H6 = styled.div`
//   font-size: 12px; opacity: .95; margin-bottom: 8px; font-weight: 700; letter-spacing: .2px; /* ✅ slightly stronger */
// `;
// const Btn = styled.button`
//   background: #fff; color: #111; border: 0; padding: 8px 10px;
//   border-radius: 10px; font-weight: 600; cursor: pointer;
// `;

// // --- charts (SVG, no external libs) ---
// function DonutWinLoss({ wins, losses, size = 150, stroke = 16 }) {
//   const total = Math.max(0, (wins || 0) + (losses || 0));
//   const winPct = total ? wins / total : 0;
//   const radius = (size - stroke) / 2;
//   const C = 2 * Math.PI * radius;
//   const winLen = C * winPct;
//   const lossLen = C - winLen;
//   return (
//     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
//       <g transform={`translate(${size/2} ${size/2}) rotate(-90)`}>
//         <circle r={radius} cx="0" cy="0" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={stroke} />
//         {/* wins */}
//         <circle r={radius} cx="0" cy="0" fill="none"
//           stroke="#4cd964" strokeLinecap="butt" strokeWidth={stroke}
//           strokeDasharray={`${winLen} ${C - winLen}`} />
//         {/* losses (start after wins) */}
//         <circle r={radius} cx="0" cy="0" fill="none"
//           stroke="#ff3b30" strokeLinecap="butt" strokeWidth={stroke}
//           strokeDasharray={`${lossLen} ${C - lossLen}`} strokeDashoffset={-winLen} />
//       </g>
//       <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="700">
//         {Math.round(winPct * 100)}%
//       </text>
//       <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)">
//         win rate
//       </text>
//     </svg>
//   );
// }

// function LineNet({ series, height = 90 }) {
//   const w = 300;
//   const h = height;
//   const pad = 6;
//   const min = Math.min(...series, 0);
//   const max = Math.max(...series, 0, 1);
//   const scaleX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
//   const scaleY = (v) => {
//     // center 0, show pos in green and neg in red gradient
//     const rng = max - min || 1;
//     return h - pad - ((v - min) * (h - pad * 2)) / rng;
//   };
//   const path = series.map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`).join(" ");
//   const area = `M ${scaleX(0)} ${scaleY(0)} ` +
//     series.map((v, i) => `L ${scaleX(i)} ${scaleY(v)}`).join(" ") +
//     ` L ${scaleX(series.length - 1)} ${scaleY(0)} Z`;

//   return (
//     <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
//       <defs>
//         <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor="rgba(76,217,100,0.35)" />
//           <stop offset="100%" stopColor="rgba(76,217,100,0.01)" />
//         </linearGradient>
//       </defs>
//       {/* 0 axis */}
//       <line x1={pad} x2={w - pad} y1={scaleY(0)} y2={scaleY(0)} stroke="rgba(255,255,255,.2)" strokeDasharray="4 4" />
//       <path d={area} fill="url(#netFill)" />
//       <path d={path} fill="none" stroke="#4cd964" strokeWidth="2.5" />
//     </svg>
//   );
// }

// function BarsStakes({ items, height = 110 }) { /* ✅ slightly taller to fit labels */
//   const w = 300;
//   const h = height;
//   const pad = 6;
//   const data = items.slice(-10); // last 10 bets
//   const maxV = Math.max(1, ...data.map((d) => Math.abs(d.stake || 0)));
//   const barW = (w - pad * 2) / Math.max(1, data.length);

//   return (
//     <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
//       {data.map((d, i) => {
//         const v = d.stake || 0;
//         const hVal = Math.max(2, (Math.abs(v) / maxV) * (h - pad * 2 - 16)); // leave space for labels
//         const x = pad + i * barW + 2;
//         const y = h - pad - hVal;
//         const color = d.win ? "#4cd964" : "#ff3b30";

//         // ✅ centered value label above each bar
//         const label = String(v);
//         const cx = x + (barW - 4) / 2;
//         const ty = Math.max(12, y - 4);

//         return (
//           <g key={i}>
//             <rect x={x} y={y} width={barW - 4} height={hVal} rx="3" fill={color} />
//             <text
//               x={cx}
//               y={ty}
//               textAnchor="middle"
//               fontSize="11"
//               fontWeight="800"
//               fill="#ffffff"
//               style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.6)", strokeWidth: 2 }}
//             >
//               {label}
//             </text>
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

// export default function InsightsSidebar({ open, onClose }) {
//   const { balance, loading } = useWallet();
//   const stats = useBetAnalytics(); // { total, wins, losses, net, winRate, series, recent, ... }
//   const { total, wins, losses, net, series, recent } = stats;

//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           <Scrim
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />
//           {/* stop clicks from bubbling to the scrim */}
//           <Panel
//             onClick={(e) => e.stopPropagation()}
//             initial={{ x: -24, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: -16, opacity: 0 }}
//             transition={{ type: "spring", stiffness: 320, damping: 28 }}
//           >
//             <Row>
//               <h3 style={{ margin: 0 }}>Analytics</h3>
//               <button
//                 onClick={onClose}
//                 style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
//               >
//                 <X size={18} />
//               </button>
//             </Row>

//             <Row style={{ gap: 6, flexWrap: "wrap" }}>
//               <Badge><DollarSign size={14} /> {loading ? "…" : `$${balance.toFixed(2)}`}</Badge>
//               <Badge><BarChart3 size={14} /> {total} bets</Badge>
//               <Badge><Activity size={14} /> Net {net >= 0 ? "+" : ""}{net}</Badge>
//               <Badge>🎯 {wins}/{total} wins</Badge>
//             </Row>

//             {/* Win/Loss Donut */}
//             <Card>
//               <H6>Win / Loss</H6>
//               <Row style={{ alignItems: "center", gap: 12 }}>
//                 <DonutWinLoss wins={wins} losses={losses} />
//                 <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
//                   <div>Wins: <b style={{ color: "#4cd964" }}>{wins}</b></div>
//                   <div>Losses: <b style={{ color: "#ff3b30" }}>{losses}</b></div>
//                   <div>Net: <b style={{ color: net >= 0 ? "#4cd964" : "#ff3b30" }}>{net}</b></div>
//                 </div>
//               </Row>
//             </Card>

//             {/* Net by Day */}
//             <Card>
//               <H6>Net by day</H6>
//               <LineNet series={series} />
//             </Card>

//             {/* Recent Stakes */}
//             <Card>
//               <H6>Recent stakes</H6>
//               <BarsStakes items={recent} />
//               <div style={{ display: "grid", gap: 6, marginTop: 8, maxHeight: 120, overflow: "auto" }}>
//                 {recent.slice(-6).reverse().map((b, i) => {
//                   const full = (b.question || b.chosenLabel || "").replace(/\s+/g, " ").trim();
//                   return (
//                     <Row key={i} style={{ fontSize: 13 }}>
//                       {/* ✅ show full text (no truncation) */}
//                       <div style={{ maxWidth: "100%", whiteSpace: "normal", wordBreak: "break-word", fontWeight: 600 }}>
//                         {full}
//                         <span style={{ opacity: .6 }}> </span>
//                       </div>
//                       <div style={{ color: b.win ? "#4cd964" : "#ff3b30", fontWeight: 700 }}>
//                         {b.delta > 0 ? "+" : ""}{b.delta}
//                       </div>
//                     </Row>
//                   );
//                 })}
//                 {recent.length === 0 && <div style={{ opacity: .7, fontSize: 13 }}>No bets yet.</div>}
//               </div>
//             </Card>

//             {/* Actions */}
//             <Row style={{ marginTop: "auto", gap: 8 }}>
//               <Btn
//                 onClick={(e) => {
//                   e.stopPropagation();          // keep overlay open
//                   BetAnalytics.exportCSV();
//                 }}
//               >
//                 <Download size={16} /> Export
//               </Btn>
//               <Btn
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (window.confirm("Clear local analytics?")) BetAnalytics.clear();
//                 }}
//                 style={{ background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}
//               >
//                 <Trash2 size={16} /> Clear
//               </Btn>
//             </Row>
//           </Panel>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }

// src/components/InsightsSidebar.jsx
import React from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Activity, BarChart3, Download, Trash2 } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { BetAnalytics } from "../utils/BetAnalytics";
import { useBetAnalytics } from "../hooks/useBetAnalytics";

// --- layout ---
const Scrim = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000;
`;
const Panel = styled(motion.aside)`
  position: fixed; inset: 0 auto 0 0;
  width: min(360px, 92vw);
  background: rgba(16,18,27,.98);
  border-right: 1px solid rgba(255,255,255,.1);
  color: #f5f7ff; /* brighter white */
  padding: 16px 14px 14px;
  display: flex; flex-direction: column; gap: 12px;
  z-index: 1001; /* above scrim so clicks don't close overlay */
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;
const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
`;
const Badge = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.08); padding: 6px 10px; border-radius: 999px; font-size: 12px;
`;
const Card = styled.div`
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px; padding: 12px;
`;
const H6 = styled.div`
  font-size: 12px; opacity: .95; margin-bottom: 8px; font-weight: 700; letter-spacing: .2px;
`;
const Btn = styled.button`
  background: #fff; color: #111; border: 0; padding: 8px 10px;
  border-radius: 10px; font-weight: 600; cursor: pointer;
`;

// --- charts (SVG, no external libs) ---
function DonutWinLoss({ wins, losses, size = 150, stroke = 16 }) {
  const total = Math.max(0, (wins || 0) + (losses || 0));
  const winPct = total ? wins / total : 0;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const winLen = C * winPct;
  const lossLen = C - winLen;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <g transform={`translate(${size/2} ${size/2}) rotate(-90)`}>
        <circle r={radius} cx="0" cy="0" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={stroke} />
        {/* wins */}
        <circle r={radius} cx="0" cy="0" fill="none"
          stroke="#4cd964" strokeLinecap="butt" strokeWidth={stroke}
          strokeDasharray={`${winLen} ${C - winLen}`} />
        {/* losses (start after wins) */}
        <circle r={radius} cx="0" cy="0" fill="none"
          stroke="#ff3b30" strokeLinecap="butt" strokeWidth={stroke}
          strokeDasharray={`${lossLen} ${C - lossLen}`} strokeDashoffset={-winLen} />
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="700">
        {Math.round(winPct * 100)}%
      </text>
      <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)">
        win rate
      </text>
    </svg>
  );
}

function LineNet({ series, height = 90 }) {
  const w = 300;
  const h = height;
  const pad = 6;
  const min = Math.min(...series, 0);
  const max = Math.max(...series, 0, 1);
  const scaleX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
  const scaleY = (v) => {
    const rng = max - min || 1;
    return h - pad - ((v - min) * (h - pad * 2)) / rng;
  };
  const path = series.map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`).join(" ");
  const area = `M ${scaleX(0)} ${scaleY(0)} ` +
    series.map((v, i) => `L ${scaleX(i)} ${scaleY(v)}`).join(" ") +
    ` L ${scaleX(series.length - 1)} ${scaleY(0)} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(76,217,100,0.35)" />
          <stop offset="100%" stopColor="rgba(76,217,100,0.01)" />
        </linearGradient>
      </defs>
      {/* 0 axis */}
      <line x1={pad} x2={w - pad} y1={scaleY(0)} y2={scaleY(0)} stroke="rgba(255,255,255,.2)" strokeDasharray="4 4" />
      <path d={area} fill="url(#netFill)" />
      <path d={path} fill="none" stroke="#4cd964" strokeWidth="2.5" />
    </svg>
  );
}

function BarsStakes({ items, height = 110 }) { /* slightly taller to fit labels */
  const w = 300;
  const h = height;
  const pad = 6;
  const data = items.slice(-10); // last 10 bets
  const maxV = Math.max(1, ...data.map((d) => Math.abs(d.stake || 0)));
  const barW = (w - pad * 2) / Math.max(1, data.length);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const v = d.stake || 0;
        const hVal = Math.max(2, (Math.abs(v) / maxV) * (h - pad * 2 - 16)); // leave space for labels
        const x = pad + i * barW + 2;
        const y = h - pad - hVal;
        const color = d.win ? "#4cd964" : "#ff3b30";

        // centered value label above each bar
        const label = String(v);
        const cx = x + (barW - 4) / 2;
        const ty = Math.max(12, y - 4);

        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - 4} height={hVal} rx="3" fill={color} />
            <text
              x={cx}
              y={ty}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#ffffff"
              style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.6)", strokeWidth: 2 }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --- tiny UI bits for the new sections (no deps) ---
function WinRateBar({ rate }) {
  const pct = Math.round((rate || 0) * 100);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: .9 }}>Win rate</div>
      <div style={{
        width: "100%", height: 10, borderRadius: 999,
        background: "rgba(255,255,255,.12)", overflow: "hidden"
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 999,
          background: "linear-gradient(90deg,#4cd964,#34c759)"
        }} />
      </div>
      <div style={{ fontSize: 12, opacity: .8 }}>{pct}%</div>
    </div>
  );
}

function LeaderRow({ rank, name, net }) {
  const color = net >= 0 ? "#4cd964" : "#ff3b30";
  return (
    <Row style={{ fontSize: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center",
          fontWeight: 700
        }}>{rank}</div>
        <div style={{ fontWeight: 600 }}>{name}</div>
      </div>
      <div style={{ color, fontWeight: 700 }}>{net >= 0 ? "+" : ""}{net}</div>
    </Row>
  );
}

export default function InsightsSidebar({ open, onClose }) {
  const { balance, loading } = useWallet();
  const stats = useBetAnalytics(); // { total, wins, losses, net, series, recent, ... }
  const { total, wins, losses, net, series, recent } = stats;

  // derived (no side effects)
  const winRate = total ? wins / total : 0;

  // streak from recent: count wins back from the end
  const streak = (() => {
    let s = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i]?.win) s++;
      else break;
    }
    return s;
  })();

  // last change (day-over-day) from series
  const last = series?.[series.length - 1] ?? 0;
  const prev = series?.[series.length - 2] ?? 0;
  const delta = last - prev;

  // simple demo leaderboard (You + static peers), sorted by net desc
  const peers = [
    { name: "You", net },
    { name: "Alex K.", net: 180 },
    { name: "Samir V.", net: 95 },
    { name: "Rae C.", net: 60 },
    { name: "Jess P.", net: -20 },
    { name: "Mo R.", net: 220 },
  ].sort((a, b) => b.net - a.net).slice(0, 5);

  return (
    <AnimatePresence>
      {open && (
        <>
          <Scrim
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* stop clicks from bubbling to the scrim */}
          <Panel
            onClick={(e) => e.stopPropagation()}
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <Row>
              <h3 style={{ margin: 0 }}>Analytics</h3>
              <button
                onClick={onClose}
                style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </Row>

            <Row style={{ gap: 6, flexWrap: "wrap" }}>
              <Badge><DollarSign size={14} /> {loading ? "…" : `$${balance.toFixed(2)}`}</Badge>
              <Badge><BarChart3 size={14} /> {total} bets</Badge>
              <Badge><Activity size={14} /> Net {net >= 0 ? "+" : ""}{net}</Badge>
              <Badge>🎯 {wins}/{total} wins</Badge>
            </Row>

            {/* Win/Loss Donut */}
            <Card>
              <H6>Win / Loss</H6>
              <Row style={{ alignItems: "center", gap: 12 }}>
                <DonutWinLoss wins={wins} losses={losses} />
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <div>Wins: <b style={{ color: "#4cd964" }}>{wins}</b></div>
                  <div>Losses: <b style={{ color: "#ff3b30" }}>{losses}</b></div>
                  <div>Net: <b style={{ color: net >= 0 ? "#4cd964" : "#ff3b30" }}>{net}</b></div>
                </div>
              </Row>
            </Card>

            {/* Net by Day */}
            <Card>
              <H6>Net by day</H6>
              <LineNet series={series} />
            </Card>

            {/* 🔥 Momentum */}
            <Card>
              <H6>🔥 Momentum</H6>
              <div style={{ display: "grid", gap: 10 }}>
                <Row>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Streak</div>
                  <div style={{ fontWeight: 700 }}>{streak} {streak === 1 ? "win" : "wins"}</div>
                </Row>
                <WinRateBar rate={winRate} />
                <Row>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Last change</div>
                  <div style={{ fontWeight: 700, color: delta >= 0 ? "#4cd964" : "#ff3b30" }}>
                    {delta >= 0 ? "⬆️ +" : "⬇️ "}{delta}
                  </div>
                </Row>
              </div>
            </Card>

            {/* 🏆 Leaderboard */}
            <Card>
              <H6>🏆 Leaderboard (demo)</H6>
              <div style={{ display: "grid", gap: 8 }}>
                {peers.map((p, i) => (
                  <LeaderRow key={p.name} rank={i + 1} name={p.name} net={p.net} />
                ))}
              </div>
            </Card>

            {/* Recent Stakes */}
            <Card>
              <H6>Recent stakes</H6>
              <BarsStakes items={recent} />
              <div style={{ display: "grid", gap: 6, marginTop: 8, maxHeight: 120, overflow: "auto" }}>
                {recent.slice(-6).reverse().map((b, i) => {
                  const full = (b.question || b.chosenLabel || "").replace(/\s+/g, " ").trim();
                  return (
                    <Row key={i} style={{ fontSize: 13 }}>
                      {/* full text (no truncation) */}
                      <div style={{ maxWidth: "100%", whiteSpace: "normal", wordBreak: "break-word", fontWeight: 600 }}>
                        {full}
                        <span style={{ opacity: .6 }}> </span>
                      </div>
                      <div style={{ color: b.win ? "#4cd964" : "#ff3b30", fontWeight: 700 }}>
                        {b.delta > 0 ? "+" : ""}{b.delta}
                      </div>
                    </Row>
                  );
                })}
                {recent.length === 0 && <div style={{ opacity: .7, fontSize: 13 }}>No bets yet.</div>}
              </div>
            </Card>

            {/* Actions */}
            <Row style={{ marginTop: "auto", gap: 8 }}>
              <Btn
                onClick={(e) => {
                  e.stopPropagation();          // keep overlay open
                  BetAnalytics.exportCSV();
                }}
              >
                <Download size={16} /> Export
              </Btn>
              <Btn
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Clear local analytics?")) BetAnalytics.clear();
                }}
                style={{ background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }}
              >
                <Trash2 size={16} /> Clear
              </Btn>
            </Row>
          </Panel>
        </>
      )}
    </AnimatePresence>
  );
}






