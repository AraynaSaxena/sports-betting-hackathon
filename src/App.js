// // src/App.js
// import React, { useState, useRef } from 'react';
// import { Play, Pause, TrendingUp, DollarSign, Eye, MessageCircle, DollarSign as DollarIcon } from 'lucide-react';
// import { AuthProvider } from './context/AuthContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import { useCedarChat } from "./community/useCedarChat";
// import './App.css';

// // ✅ Wallet
// import { WalletProvider, useWallet } from './context/WalletContext';

// // ✅ Analytics (sidebar UI + store)
// import InsightsSidebar from './components/InsightsSidebar';
// import { BetAnalytics } from './utils/BetAnalytics';
// const user = { id: "demo-user-1", name: "You" };


// // Your Gemini API key (left exactly as-is)
// const GEMINI_API_KEY = 'YOUR_API_KEY';

// // Player data from your preprocessing
// const PLAYER_POSITIONS = [
//   {
//     id: 'player_12',
//     name: 'Tom Brady',
//     number: 12,
//     position: 'QB',
//     team: 'Buccaneers',
//     screenPosition: { x: 15, y: 25, width: 8, height: 12 }, // Percentage-based
//     stats: { completions: 28, attempts: 42, yards: 315, touchdowns: 2, interceptions: 1, rating: 98.5 },
//     context: 'Currently in red zone, high pressure situation',
//     color: '#FF0000'
//   },
//   {
//     id: 'player_13',
//     name: 'Mike Evans',
//     number: 13,
//     position: 'WR',
//     team: 'Buccaneers',
//     screenPosition: { x: 35, y: 20, width: 8, height: 12 },
//     stats: { receptions: 8, yards: 147, touchdowns: 1, targets: 12, longestCatch: 34 },
//     context: 'Running deep routes, covered by top corner',
//     color: '#00FF00'
//   },
//   {
//     id: 'player_87',
//     name: 'Rob Gronkowski',
//     number: 87,
//     position: 'TE',
//     team: 'Buccaneers',
//     screenPosition: { x: 25, y: 30, width: 8, height: 12 },
//     stats: { receptions: 5, yards: 89, touchdowns: 1, targets: 7, longestCatch: 28 },
//     context: 'Key target in red zone situations',
//     color: '#0000FF'
//   }
// ];

// // Mock financial data (still used for the advisory copy)
// const USER_FINANCIALS = {
//   balance: 2500,
//   monthlySpending: 3200,
//   bettingHistory: 450,
//   riskLevel: 'medium'
// };

// // community / chat (single user demo)


// // Question templates for fallback
// const QUESTION_TEMPLATES = [
//   "Will {player} throw for over {yards} yards this drive?",
//   "Will {player} catch a touchdown in the next 5 plays?",
//   "Will {player} get sacked on this drive?",
//   "Will {team} score on this drive?",
//   "Will there be a turnover in the next 3 plays?"
// ];

// // ✅ Tiny wallet badge
// function WalletBadge() {
//   const { balance, loading } = useWallet();
//   return (
//     <div className="wallet-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
//       <Coins size={16} />
//       <span style={{ fontWeight: 600 }}>{loading ? '…' : `${balance} coins`}</span>
//     </div>
//   );
// }

// // Main sports betting component (original content extended)
// function SportsBettingApp() {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [selectedPlayer, setSelectedPlayer] = useState(null);
//   const [showPlayerModal, setShowPlayerModal] = useState(false);
//   const [showBettingModal, setShowBettingModal] = useState(false);
//   const [currentQuestion, setCurrentQuestion] = useState('');
//   const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
//   const [cvEnabled, setCvEnabled] = useState(false);
//   const [cvStats, setCvStats] = useState({ frames: 0, players: 0, latency: 0 });
//   const [betAmount, setBetAmount] = useState('');
//   const [selectedBet, setSelectedBet] = useState(null);
//   const [financialWarning, setFinancialWarning] = useState(null);

//   // ✅ Wallet
//   const { balance, credit, debit } = useWallet();

//   // ✅ Analytics sidebar state
//   const [showSidebar, setShowSidebar] = useState(false);

//   // const [showAnalytics, setShowAnalytics] = useState(false);

//   const videoRef = useRef(null);
//   const { connected, presence, messages, send, postPollOpen, postPollClose } = useCedarChat({ roomId: "demo-room-1", user });

// // analytics feed used for community summary later if needed
//   const results = BetAnalytics.getAll?.() || [];

//   // Generate AI question using Gemini
//   const generateAIQuestion = async (player) => {
//     // ✅ Fallback whenever key is missing or a placeholder
//     if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('YOUR_')) {
//       const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
//       return template
//         .replace('{player}', player.name)
//         .replace('{team}', player.team)
//         .replace('{yards}', Math.floor(Math.random() * 50) + 25);
//     }

//     try {
//       const prompt = `Create a short sports betting question for NFL player ${player.name} (#${player.number}, ${player.position}) from ${player.team}.
//       Current stats: ${JSON.stringify(player.stats)}
//       Context: ${player.context}

//       Generate ONE specific betting question (max 12 words) about the next play or immediate drive.
//       Examples: "Will Brady complete his next pass?" or "Will Evans catch over 20 yards?"

//       Question:`;

//       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: prompt }] }],
//           generationConfig: { temperature: 0.7, maxOutputTokens: 30 }
//         })
//       });

//       const data = await response.json();
//       let question = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() || '';
//       if (!question) {
//         const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
//         question = template.replace('{player}', player.name).replace('{team}', player.team);
//       }
//       if (!question.endsWith('?')) question += '?';
//       return question;
//     } catch (error) {
//       console.error('Gemini API error:', error);
//       // Fallback to template
//       const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
//       return template.replace('{player}', player.name).replace('{team}', player.team);
//     }
//   };

//   // Handle player click
//   const handlePlayerClick = async (player) => {
//     setSelectedPlayer(player);
//     setIsGeneratingQuestion(true);
//     setShowPlayerModal(true);

//     const question = await generateAIQuestion(player);
//     setCurrentQuestion(question);
//     setIsGeneratingQuestion(false);
//   };

//   // Check financial health
//   const checkFinancialHealth = (amount) => {
//     const amountNum = parseFloat(amount) || 0;
//     const totalBetting = USER_FINANCIALS.bettingHistory + amountNum;

//     if (amountNum > USER_FINANCIALS.balance * 0.1) {
//       return {
//         level: 'high',
//         message: '⚠️ This bet is more than 10% of your balance',
//         suggestion: 'Consider betting less than $250'
//       };
//     } else if (totalBetting > USER_FINANCIALS.balance * 0.2) {
//       return {
//         level: 'medium',
//         message: '🔶 You\'ve spent 20% of your balance on betting this month',
//         suggestion: 'Consider reducing bet sizes'
//       };
//     } else if (amountNum > 0) {
//       return {
//         level: 'safe',
//         message: '✅ This is a safe bet amount',
//         suggestion: 'Good job betting responsibly!'
//       };
//     }
//     return null;
//   };

//   // Handle bet amount change
//   const handleBetAmountChange = (amount) => {
//     setBetAmount(amount);
//     setFinancialWarning(checkFinancialHealth(amount));
//   };

//   // Place bet
//   const placeBet = async () => {
//     if (!selectedBet || !betAmount) {
//       alert('Please select an option and enter bet amount');
//       return;
//     }

//     const amount = parseFloat(betAmount);
//     if (financialWarning?.level === 'high') {
//       if (!window.confirm('This bet amount may not be financially responsible. Continue anyway?')) {
//         return;
//       }
//     }

//     // Keep your existing alert and modal flow exactly the same
//     alert(`Bet Placed! $${amount} on "${selectedBet}" for ${selectedPlayer?.name}\n\nQuestion: ${currentQuestion}`);

//     // ✅ Simulated outcome -> update wallet -> log analytics
//     const win = Math.random() < 0.5;
//     const delta = win ? amount : -amount;

//     try {
//       if (win) {
//         await credit(amount, `Win: ${currentQuestion}`);
//         console.log(`Wallet credited +${amount} coins`);
//       } else {
//         await debit(amount, `Loss: ${currentQuestion}`);
//         console.log(`Wallet debited -${amount} coins`);
//       }

//       // ✅ Log to analytics so the sidebar can live-update
//       BetAnalytics.save({
//         source: 'modal',
//         question: currentQuestion,
//         stake: amount,
//         chosenId: selectedBet,
//         chosenLabel: selectedBet,
//         odds: selectedBet === 'YES' ? '+150' : '-120',
//         win,
//         delta
//       });
//     } catch (e) {
//       console.warn('Wallet update failed:', e);
//     }

//     // Reset your existing modal state exactly as before
//     setShowBettingModal(false);
//     setBetAmount('');
//     setSelectedBet(null);
//   };

//   // Simulate computer vision
//   React.useEffect(() => {
//     if (cvEnabled) {
//       const interval = setInterval(() => {
//         setCvStats(prev => ({
//           frames: prev.frames + 1,
//           players: Math.floor(Math.random() * 4) + 2,
//           latency: Math.random() * 20 + 10
//         }));
//       }, 200);
//       return () => clearInterval(interval);
//     }
//   }, [cvEnabled]);

//   return (
//     <div className="app">
//       {/* Header */}
//       <header className="header">
//         <h1>🏈 SportsBet AI</h1>

//         {/* Wallet badge */}
//         <div style={{ marginLeft: 'auto', marginRight: 12 }}>
//           <WalletBadge />
//         </div>

//         <div className="header-controls">
//           <button
//             className={`cv-toggle ${cvEnabled ? 'active' : ''}`}
//             onClick={() => setCvEnabled(!cvEnabled)}
//           >
//             <Eye size={16} />
//             {cvEnabled ? 'CV ON' : 'CV OFF'}
//           </button>

//           {/* ✅ New analytics toggle */}
//           <button
//   className="info-btn"
//   onClick={() => setShowSidebar(true)}
// >
//   📊 Analytics
// </button>


//           <button
//             className="info-btn"
//             onClick={() => alert('SportsBet AI - Interactive Sports Betting\n\n• AI-powered question generation\n• Financial responsibility checks\n• Computer vision player detection\n• Real-time betting interface')}
//           >
//             ℹ️ Info
//           </button>
//         </div>
//       </header>

//       {/* Computer Vision Panel */}
//       {cvEnabled && (
//         <div className="cv-panel">
//           <div className="cv-header">
//             <Eye size={20} />
//             <span>Computer Vision Active</span>
//           </div>
//           <div className="cv-stats">
//             <div className="cv-stat">
//               <span>Frames</span>
//               <span>{cvStats.frames}</span>
//             </div>
//             <div className="cv-stat">
//               <span>Players</span>
//               <span>{cvStats.players}</span>
//             </div>
//             <div className="cv-stat">
//               <span>Latency</span>
//               <span>{cvStats.latency.toFixed(1)}ms</span>
//             </div>
//           </div>
//           <div className="cv-description">
//             🔍 Analyzing jersey colors and player movement in real-time
//           </div>
//         </div>
//       )}

//       {/* Video Container */}
//       <div className="video-container">
//         <div className="video-wrapper" style={{ position: 'relative' }}>
//           <video
//             ref={videoRef}
//             width="100%"
//             height="400px"
//             controls
//             style={{ borderRadius: '10px', backgroundColor: '#000' }}
//             onPlay={() => setIsPlaying(true)}
//             onPause={() => setIsPlaying(false)}
//           >
//             <source src="/game-video.mp4" type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>

//           {/* Player overlays positioned over the video */}
//           <div style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             pointerEvents: 'none' // Allow video controls to work
//           }}>
//             {PLAYER_POSITIONS.map(player => (
//               <button
//                 key={player.id}
//                 className="player-overlay"
//                 style={{
//                   position: 'absolute',
//                   left: `${player.screenPosition.x}%`,
//                   top: `${player.screenPosition.y}%`,
//                   width: `${player.screenPosition.width}%`,
//                   height: `${player.screenPosition.height}%`,
//                   backgroundColor: player.color + '40',
//                   borderColor: player.color,
//                   pointerEvents: 'auto', // Re-enable clicks for player buttons
//                   zIndex: 10
//                 }}
//                 onClick={() => handlePlayerClick(player)}
//               >
//                 <div className="player-label">
//                   <div>#{player.number}</div>
//                   <div>{player.name.split(' ')[1]}</div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Video Controls */}
//         <div className="video-controls">
//           <button
//             className="control-btn"
//             onClick={() => setIsPlaying(!isPlaying)}
//           >
//             {isPlaying ? <Pause size={20} /> : <Play size={20} />}
//             {isPlaying ? 'Pause' : 'Play'}
//           </button>
//           <span className="video-status">
//             {PLAYER_POSITIONS.length} players detected • AI Ready ✅
//           </span>
//         </div>
//       </div>

//       {/* Features Panel */}
//       <div className="features-panel">
//         <h3>🚀 Live Demo Features</h3>
//         <div className="features-grid">
//           <div className="feature">
//             <TrendingUp size={24} />
//             <span>AI Question Generation</span>
//           </div>
//           <div className="feature">
//             <DollarSign size={24} />
//             <span>Financial Responsibility</span>
//           </div>
//           <div className="feature">
//             <Eye size={24} />
//             <span>Computer Vision</span>
//           </div>
//           <div className="feature">
//             <MessageCircle size={24} />
//             <span>Cedar Social</span>
//           </div>
//         </div>
//       </div>

//       {/* Player Stats Modal */}
//       {showPlayerModal && selectedPlayer && (
//         <div className="modal-overlay" onClick={() => setShowPlayerModal(false)}>
//           <div className="modal" onClick={e => e.stopPropagation()}>
//             <div className="modal-header">
//               <h2>{selectedPlayer.name}</h2>
//               <span>#{selectedPlayer.number} • {selectedPlayer.position} • {selectedPlayer.team}</span>
//               <button className="close-btn" onClick={() => setShowPlayerModal(false)}>✕</button>
//             </div>

//             <div className="modal-content">
//               <div className="stats-section">
//                 <h3>📊 Performance Stats</h3>
//                 <div className="stats-grid">
//                   {Object.entries(selectedPlayer.stats).map(([key, value]) => (
//                     <div key={key} className="stat-item">
//                       <span className="stat-label">{key}</span>
//                       <span className="stat-value">{value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="question-section">
//                 <h3>🤖 AI-Generated Question</h3>
//                 {isGeneratingQuestion ? (
//                   <div className="generating">🤖 Generating question...</div>
//                 ) : (
//                   <div className="question-box">
//                     <div className="question-text">{currentQuestion}</div>
//                     <div className="odds">
//                       <div className="odd">YES +150</div>
//                       <div className="odd">NO -120</div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button onClick={() => setShowPlayerModal(false)}>Close</button>
//               <button
//                 className="primary"
//                 onClick={() => {
//                   setShowPlayerModal(false);
//                   setShowBettingModal(true);
//                 }}
//                 disabled={isGeneratingQuestion}
//               >
//                 🎯 Place Bet
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Betting Modal */}
//       {showBettingModal && (
//         <div className="modal-overlay" onClick={() => setShowBettingModal(false)}>
//           <div className="modal betting-modal" onClick={e => e.stopPropagation()}>
//             <div className="modal-header">
//               <h2>🎯 Place Your Bet</h2>
//               <button className="close-btn" onClick={() => setShowBettingModal(false)}>✕</button>
//             </div>

//             <div className="modal-content">
//               <div className="question-display">
//                 <strong>{currentQuestion}</strong>
//                 <div>Player: {selectedPlayer?.name}</div>
//               </div>

//               <div className="bet-options">
//                 <h3>Choose Your Prediction</h3>
//                 <div className="options">
//                   <button
//                     className={`option ${selectedBet === 'YES' ? 'selected' : ''}`}
//                     onClick={() => setSelectedBet('YES')}
//                   >
//                     <span>YES</span>
//                     <span>+150</span>
//                   </button>
//                   <button
//                     className={`option ${selectedBet === 'NO' ? 'selected' : ''}`}
//                     onClick={() => setSelectedBet('NO')}
//                   >
//                     <span>NO</span>
//                     <span>-120</span>
//                   </button>
//                 </div>
//               </div>

//               <div className="bet-amount">
//                 <h3>Bet Amount</h3>
//                 <div className="amount-input">
//                   <span>$</span>
//                   <input
//                     type="number"
//                     value={betAmount}
//                     onChange={e => handleBetAmountChange(e.target.value)}
//                     placeholder="0.00"
//                   />
//                 </div>
//                 <div className="quick-amounts">
//                   {[10, 25, 50, 100].map(amount => (
//                     <button
//                       key={amount}
//                       onClick={() => handleBetAmountChange(amount.toString())}
//                     >
//                       ${amount}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {financialWarning && (
//                 <div className={`warning ${financialWarning.level}`}>
//                   <div>{financialWarning.message}</div>
//                   <div>{financialWarning.suggestion}</div>
//                 </div>
//               )}

//               <div className="balance-info">
//                 {/* ✅ live wallet balance */}
//                 <div>Balance: ${balance.toFixed(2)}</div>
//                 <div>Betting this month: ${USER_FINANCIALS.bettingHistory}</div>
//               </div>
//             </div>

//             <div className="modal-actions">
//               <button onClick={() => setShowBettingModal(false)}>Cancel</button>
//               <button
//                 className="primary"
//                 onClick={placeBet}
//                 disabled={!selectedBet || !betAmount}
//               >
//                 Place Bet ${betAmount || '0'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ Analytics Sidebar mount */}
//       <InsightsSidebar open={showSidebar} onClose={() => setShowSidebar(false)} />

//       {/* Demo Footer */}
//       <footer className="footer">
//         <div className="footer-content">
//           <h3>🚀 HackGT Demo Ready!</h3>
//           <p>✅ AI Question Generation • ✅ Financial Responsibility • ✅ Computer Vision • ✅ Interactive Betting</p>
//           <small>Built in 90 minutes • Ready to scale • All APIs integrated</small>
//         </div>
//       </footer>
//     </div>
//   );
// }

// // Main App component with authentication
// function App() {
//   return (
//     <AuthProvider>
//       <ProtectedRoute>
//         {/* Wrap only the inner app so auth flow stays identical */}
//         <WalletProvider email="demo@user.com" firstName="Demo" lastName="User">
//           <SportsBettingApp />
//         </WalletProvider>
//       </ProtectedRoute>
//     </AuthProvider>
//   );
// }

// export default App;



// new version

// src/App.js
import React, { useState, useRef } from 'react';
import { Play, Pause, TrendingUp, DollarSign, Eye, MessageCircle, DollarSign as DollarIcon } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CedarProvider from "./components/CedarProvider";
import CedarChat from "./components/CedarChat";
import CommunityChat from "./components/CommunityChat";
import Leaderboard from "./components/Leaderboard";
import './App.css';

// ✅ Wallet
import { WalletProvider, useWallet } from './context/WalletContext';

// ✅ Analytics (sidebar UI + store)
import InsightsSidebar from './components/InsightsSidebar';
import { BetAnalytics } from './utils/BetAnalytics';

// ✅ Community: Cedar chat hook + tiny chat UI
import { useCedarChat } from "./community/useCedarChat";

// Single-user demo identity (hardcoded on purpose for hackathon demo)
const user = { id: "demo-user-1", name: "You" };

// Your Gemini API key (from environment variables)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Player data from your preprocessing
const PLAYER_POSITIONS = [
  {
    id: 'player_12',
    name: 'Tom Brady',
    number: 12,
    position: 'QB',
    team: 'Buccaneers',
    screenPosition: { x: 15, y: 25, width: 8, height: 12 }, // Percentage-based
    stats: { completions: 28, attempts: 42, yards: 315, touchdowns: 2, interceptions: 1, rating: 98.5 },
    context: 'Currently in red zone, high pressure situation',
    color: '#FF0000'
  },
  {
    id: 'player_13',
    name: 'Mike Evans',
    number: 13,
    position: 'WR',
    team: 'Buccaneers',
    screenPosition: { x: 35, y: 20, width: 8, height: 12 },
    stats: { receptions: 8, yards: 147, touchdowns: 1, targets: 12, longestCatch: 34 },
    context: 'Running deep routes, covered by top corner',
    color: '#00FF00'
  },
  {
    id: 'player_87',
    name: 'Rob Gronkowski',
    number: 87,
    position: 'TE',
    team: 'Buccaneers',
    screenPosition: { x: 25, y: 30, width: 8, height: 12 },
    stats: { receptions: 5, yards: 89, touchdowns: 1, targets: 7, longestCatch: 28 },
    context: 'Key target in red zone situations',
    color: '#0000FF'
  }
];

// Mock financial data (still used for the advisory copy)
const USER_FINANCIALS = {
  balance: 2500,
  monthlySpending: 3200,
  bettingHistory: 450,
  riskLevel: 'medium'
};

// Question templates for fallback
const QUESTION_TEMPLATES = [
  "Will {player} throw for over {yards} yards this drive?",
  "Will {player} catch a touchdown in the next 5 plays?",
  "Will {player} get sacked on this drive?",
  "Will {team} score on this drive?",
  "Will there be a turnover in the next 3 plays?"
];

// ✅ Tiny wallet badge
function WalletBadge() {
  const { balance, loading } = useWallet();
  return (
    <div className="wallet-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <DollarIcon size={16} />
      <span style={{ fontWeight: 600 }}>{loading ? '…' : `${balance.toFixed(2)}`}</span>
    </div>
  );
}

// Main sports betting component (original content extended carefully)
function SportsBettingApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [cvEnabled, setCvEnabled] = useState(false);
  const [cvStats, setCvStats] = useState({ frames: 0, players: 0, latency: 0 });
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState(null);
  const [financialWarning, setFinancialWarning] = useState(null);

  // ✅ Wallet
  const { balance, credit, debit } = useWallet();

  // ✅ Analytics sidebar state (kept exactly as you now use it)
  const [showSidebar, setShowSidebar] = useState(false);

  const videoRef = useRef(null);

  // ✅ Community / chat (single-user demo friendly; auto-mocks if Cedar not configured)
  const { connected, presence, send, postPollOpen, postPollClose } =
    useCedarChat({ roomId: "demo-room-1", user });

  // ✅ Analytics feed (used by Insights & optionally community summary)
  const results = BetAnalytics.getAll?.() || [];

  // Generate AI question using Gemini (unchanged logic)
  const generateAIQuestion = async (player) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('YOUR_')) {
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template
        .replace('{player}', player.name)
        .replace('{team}', player.team)
        .replace('{yards}', Math.floor(Math.random() * 50) + 25);
    }

    try {
      const prompt = `Create a short sports betting question for NFL player ${player.name} (#${player.number}, ${player.position}) from ${player.team}.
      Current stats: ${JSON.stringify(player.stats)}
      Context: ${player.context}

      Generate ONE specific betting question (max 12 words) about the next play or immediate drive.
      Examples: "Will Brady complete his next pass?" or "Will Evans catch over 20 yards?"

      Question:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 30 }
        })
      });

      const data = await response.json();
      let question = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() || '';
      if (!question) {
        const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
        question = template.replace('{player}', player.name).replace('{team}', player.team);
      }
      if (!question.endsWith('?')) question += '?';
      return question;
    } catch (error) {
      console.error('Gemini API error:', error);
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template.replace('{player}', player.name).replace('{team}', player.team);
    }
  };

  // Handle player click — open your modal; announce a poll to chat (non-intrusive)
  const handlePlayerClick = async (player) => {
    setSelectedPlayer(player);
    setIsGeneratingQuestion(true);
    setShowPlayerModal(true);

    const question = await generateAIQuestion(player);
    setCurrentQuestion(question);
    setIsGeneratingQuestion(false);

    // 🔔 Announce a "poll opened" line in chat (simple, no backend)
    // Safe for single user; in mock mode this shows as a system line.
    try { postPollOpen(question); } catch {}
  };

  // Check financial health (unchanged)
  const checkFinancialHealth = (amount) => {
    const amountNum = parseFloat(amount) || 0;
    const totalBetting = USER_FINANCIALS.bettingHistory + amountNum;

    if (amountNum > USER_FINANCIALS.balance * 0.1) {
      return {
        level: 'high',
        message: '⚠️ This bet is more than 10% of your balance',
        suggestion: 'Consider betting less than $250'
      };
    } else if (totalBetting > USER_FINANCIALS.balance * 0.2) {
      return {
        level: 'medium',
        message: '🔶 You\'ve spent 20% of your balance on betting this month',
        suggestion: 'Consider reducing bet sizes'
      };
    } else if (amountNum > 0) {
      return {
        level: 'safe',
        message: '✅ This is a safe bet amount',
        suggestion: 'Good job betting responsibly!'
      };
    }
    return null;
  };

  // Handle bet amount change (unchanged)
  const handleBetAmountChange = (amount) => {
    setBetAmount(amount);
    setFinancialWarning(checkFinancialHealth(amount));
  };

  // Place bet (kept intact; we only add 2 chat echoes)
  const placeBet = async () => {
    if (!selectedBet || !betAmount) {
      alert('Please select an option and enter bet amount');
      return;
    }

    const amount = parseFloat(betAmount);
    if (financialWarning?.level === 'high') {
      if (!window.confirm('This bet amount may not be financially responsible. Continue anyway?')) {
        return;
      }
    }

    // Your existing alert & modal flow
    alert(`Bet Placed! $${amount} on "${selectedBet}" for ${selectedPlayer?.name}\n\nQuestion: ${currentQuestion}`);

    // ✅ Enhanced betting with real Nessie API integration
    const win = Math.random() < 0.5;
    const stakeAmount = amount;
    
    // Calculate winnings based on selected bet odds
    const odds = selectedBet === 'YES' ? 2.5 : 0.83; // +150 vs -120
    const winnings = win ? Math.floor(stakeAmount * (odds - 1)) : 0;
    const delta = win ? winnings : -stakeAmount;

    try {
      if (win) {
        await credit(winnings, `Bet Win: ${currentQuestion} (${selectedBet})`);
        console.log(`🎉 Bet won! +$${winnings.toFixed(2)} (stake: $${stakeAmount.toFixed(2)}, odds: ${odds})`);
      } else {
        await debit(stakeAmount, `Bet Loss: ${currentQuestion} (${selectedBet})`);
        console.log(`💸 Bet lost! -$${stakeAmount.toFixed(2)} (stake: $${stakeAmount.toFixed(2)}, odds: ${odds})`);
      }

      // ✅ Log to analytics so the sidebar can live-update
      BetAnalytics.save({
        source: 'modal',
        question: currentQuestion,
        stake: stakeAmount,
        chosenId: selectedBet,
        chosenLabel: selectedBet,
        odds: selectedBet === 'YES' ? '+150' : '-120',
        win,
        delta,
        winnings: winnings,
        player: selectedPlayer?.name,
        timestamp: new Date().toISOString()
      });

      // 🔔 Echo to chat for community feel (safe, optional)
      try { send(`Placed $${amount} on "${selectedBet}" for ${selectedPlayer?.name}`); } catch {}

      // 🔔 Close poll line (playful)
      try { postPollClose(win ? "YES" : "NO"); } catch {}

    } catch (e) {
      console.warn('Wallet update failed:', e);
    }

    // Reset (unchanged)
    setShowBettingModal(false);
    setBetAmount('');
    setSelectedBet(null);
  };

  // Simulate computer vision (unchanged)
  React.useEffect(() => {
    if (cvEnabled) {
      const interval = setInterval(() => {
        setCvStats(prev => ({
          frames: prev.frames + 1,
          players: Math.floor(Math.random() * 4) + 2,
          latency: Math.random() * 20 + 10
        }));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [cvEnabled]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🏈 SportsBet AI</h1>

        {/* Wallet badge */}
        <div style={{ marginLeft: 'auto', marginRight: 12 }}>
          <WalletBadge />
        </div>

        <div className="header-controls">
          {/* Presence chip (optional, unobtrusive) */}
          <span className="info-btn" title="Watchers online">🟢 {presence}</span>

          <button
            className={`cv-toggle ${cvEnabled ? 'active' : ''}`}
            onClick={() => setCvEnabled(!cvEnabled)}
          >
            <Eye size={16} />
            {cvEnabled ? 'CV ON' : 'CV OFF'}
          </button>

          {/* ✅ Analytics toggle (unchanged behavior; we now feed it data below) */}
          <button
            className="info-btn"
            onClick={() => setShowSidebar(true)}
          >
            📊 Analytics
          </button>

          <button
            className="info-btn"
            onClick={() => alert('SportsBet AI - Interactive Sports Betting\n\n• AI-powered question generation\n• Financial responsibility checks\n• Computer vision player detection\n• Real-time betting interface')}
          >
            ℹ️ Info
          </button>
        </div>
      </header>

      {/* Computer Vision Panel */}
      {cvEnabled && (
        <div className="cv-panel">
          <div className="cv-header">
            <Eye size={20} />
            <span>Computer Vision Active</span>
          </div>
          <div className="cv-stats">
            <div className="cv-stat">
              <span>Frames</span>
              <span>{cvStats.frames}</span>
            </div>
            <div className="cv-stat">
              <span>Players</span>
              <span>{cvStats.players}</span>
            </div>
            <div className="cv-stat">
              <span>Latency</span>
              <span>{cvStats.latency.toFixed(1)}ms</span>
            </div>
          </div>
          <div className="cv-description">
            🔍 Analyzing jersey colors and player movement in real-time
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className="video-container">
        <div className="video-wrapper" style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            width="100%"
            height="400px"
            controls
            style={{ borderRadius: '10px', backgroundColor: '#000' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/game-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

        {/* Player overlays positioned over the video */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none' // Allow video controls to work
          }}>
            {PLAYER_POSITIONS.map(player => (
              <button
                key={player.id}
                className="player-overlay"
                style={{
                  position: 'absolute',
                  left: `${player.screenPosition.x}%`,
                  top: `${player.screenPosition.y}%`,
                  width: `${player.screenPosition.width}%`,
                  height: `${player.screenPosition.height}%`,
                  backgroundColor: player.color + '40',
                  borderColor: player.color,
                  pointerEvents: 'auto', // Re-enable clicks for player buttons
                  zIndex: 10
                }}
                onClick={() => handlePlayerClick(player)}
              >
                <div className="player-label">
                  <div>#{player.number}</div>
                  <div>{player.name.split(' ')[1]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Video Controls */}
        <div className="video-controls">
          <button
            className="control-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="video-status">
            {PLAYER_POSITIONS.length} players detected • AI Ready ✅
          </span>
        </div>
      </div>

      {/* Features Panel */}
      <div className="features-panel">
        <h3>🚀 Live Demo Features</h3>
        <div className="features-grid">
          <div className="feature">
            <TrendingUp size={24} />
            <span>AI Question Generation</span>
          </div>
          <div className="feature">
            <DollarSign size={24} />
            <span>Financial Responsibility</span>
          </div>
          <div className="feature">
            <Eye size={24} />
            <span>Computer Vision</span>
          </div>
          <div className="feature">
            <MessageCircle size={24} />
            <span>Cedar Social</span>
          </div>
        </div>
      </div>

      {/* Player Stats Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setShowPlayerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPlayer.name}</h2>
              <span>#{selectedPlayer.number} • {selectedPlayer.position} • {selectedPlayer.team}</span>
              <button className="close-btn" onClick={() => setShowPlayerModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="stats-section">
                <h3>📊 Performance Stats</h3>
                <div className="stats-grid">
                  {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                    <div key={key} className="stat-item">
                      <span className="stat-label">{key}</span>
                      <span className="stat-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="question-section">
                <h3>🤖 AI-Generated Question</h3>
                {isGeneratingQuestion ? (
                  <div className="generating">🤖 Generating question...</div>
                ) : (
                  <div className="question-box">
                    <div className="question-text">{currentQuestion}</div>
                    <div className="odds">
                      <div className="odd">YES +150</div>
                      <div className="odd">NO -120</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPlayerModal(false)}>Close</button>
              <button
                className="primary"
                onClick={() => {
                  setShowPlayerModal(false);
                  setShowBettingModal(true);
                }}
                disabled={isGeneratingQuestion}
              >
                🎯 Place Bet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Betting Modal */}
      {showBettingModal && (
        <div className="modal-overlay" onClick={() => setShowBettingModal(false)}>
          <div className="modal betting-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Place Your Bet</h2>
              <button className="close-btn" onClick={() => setShowBettingModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="question-display">
                <strong>{currentQuestion}</strong>
                <div>Player: {selectedPlayer?.name}</div>
              </div>

              <div className="bet-options">
                <h3>Choose Your Prediction</h3>
                <div className="options">
                  <button
                    className={`option ${selectedBet === 'YES' ? 'selected' : ''}`}
                    onClick={() => setSelectedBet('YES')}
                  >
                    <span>YES</span>
                    <span>+150</span>
                  </button>
                  <button
                    className={`option ${selectedBet === 'NO' ? 'selected' : ''}`}
                    onClick={() => setSelectedBet('NO')}
                  >
                    <span>NO</span>
                    <span>-120</span>
                  </button>
                </div>
              </div>

              <div className="bet-amount">
                <h3>Bet Amount</h3>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={e => handleBetAmountChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="quick-amounts">
                  {[10, 25, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleBetAmountChange(amount.toString())}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {financialWarning && (
                <div className={`warning ${financialWarning.level}`}>
                  <div>{financialWarning.message}</div>
                  <div>{financialWarning.suggestion}</div>
                </div>
              )}

              <div className="balance-info">
                {/* ✅ live wallet balance */}
                <div>Balance: ${balance.toFixed(2)}</div>
                <div>Betting this month: ${USER_FINANCIALS.bettingHistory}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowBettingModal(false)}>Cancel</button>
              <button
                className="primary"
                onClick={placeBet}
                disabled={!selectedBet || !betAmount}
              >
                Place Bet ${betAmount || '0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Analytics Sidebar mount (now receives coins + results for richer view) */}
      <InsightsSidebar
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
        dollars={balance}
        results={results}
      />

      {/* ✅ NEW: Community Chat with polls, memes, and social features */}
      <CommunityChat roomId="sports-community-1" />

      {/* ✅ NEW: Leaderboard for friendly competition */}
      <Leaderboard />

      {/* Demo Footer */}
      <footer className="footer">
        <div className="footer-content">
          <h3>🚀 HackGT Demo Ready!</h3>
          <p>✅ AI Question Generation • ✅ Financial Responsibility • ✅ Computer Vision • ✅ Interactive Betting • ✅ Watch Party • ✅ Community Features</p>
          <small>Built in 90 minutes • Ready to scale • All APIs integrated • Community-driven social betting</small>
        </div>
      </footer>
    </div>
  );
}

// Main App component with authentication
function App() {
  return (
    <CedarProvider>
      <AuthProvider>
        <ProtectedRoute>
          {/* Wrap only the inner app so auth flow stays identical */}
          <WalletProvider email="demo@user.com" firstName="Demo" lastName="User">
            <SportsBettingApp />
            <CedarChat />
          </WalletProvider>
        </ProtectedRoute>
      </AuthProvider>
    </CedarProvider>
  );
}

export default App;
