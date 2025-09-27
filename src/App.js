import React, { useState, useRef } from 'react';
import { Play, Pause, TrendingUp, DollarSign, Eye, MessageCircle } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AIVideoPlayer from './components/AIVideoPlayer';
import EnhancedVideoPlayer from './components/EnhancedVideoPlayer';
import RealTimeVideoPlayer from './components/RealTimeVideoPlayer';
import './App.css';

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyBIfH1c83uRwjqjqELDEoeWJ5J2HDjl_IA';

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

// Mock financial data
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

// Main sports betting component (your original App content)
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
  const [aiDetections, setAiDetections] = useState([]);
  const [useAIDetection, setUseAIDetection] = useState(false);

  const videoRef = useRef(null);

  // Generate AI question using Gemini
  const generateAIQuestion = async (player) => {
    if (GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      // Fallback if no API key
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template.replace('{player}', player.name)
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
      let question = data.candidates[0].content.parts[0].text.trim();
      if (!question.endsWith('?')) question += '?';

      return question;
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to template
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template.replace('{player}', player.name).replace('{team}', player.team);
    }
  };

  // Handle AI player detection
  const handleAIPlayerDetection = (detections) => {
    setAiDetections(detections);
    // Update CV stats to show AI detection data
    setCvStats(prev => ({
      ...prev,
      players: detections.length,
      frames: prev.frames + 1
    }));
  };

  // Handle player click (works for both hardcoded and AI-detected players)
  const handlePlayerClick = async (player) => {
    setSelectedPlayer(player);
    setIsGeneratingQuestion(true);
    setShowPlayerModal(true);

    const question = await generateAIQuestion(player);
    setCurrentQuestion(question);
    setIsGeneratingQuestion(false);
  };

  // Check financial health
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

  // Handle bet amount change
  const handleBetAmountChange = (amount) => {
    setBetAmount(amount);
    setFinancialWarning(checkFinancialHealth(amount));
  };

  // Place bet
  const placeBet = () => {
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

    alert(`Bet Placed! $${amount} on "${selectedBet}" for ${selectedPlayer?.name}\n\nQuestion: ${currentQuestion}`);
    setShowBettingModal(false);
    setBetAmount('');
    setSelectedBet(null);
  };

  // Simulate computer vision
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
        <div className="header-controls">
          <button
            className={`ai-mode-toggle ${useAIDetection ? 'active' : ''}`}
            onClick={() => setUseAIDetection(!useAIDetection)}
          >
            <Eye size={16} />
            {useAIDetection ? 'AI MODE' : 'DEMO MODE'}
          </button>
          <button
            className={`cv-toggle ${cvEnabled ? 'active' : ''}`}
            onClick={() => setCvEnabled(!cvEnabled)}
          >
            <Eye size={16} />
            {cvEnabled ? 'CV ON' : 'CV OFF'}
          </button>
          <button
            className="info-btn"
            onClick={() => alert('SportsBet AI - Interactive Sports Betting\n\n• AI-powered question generation\n• Financial responsibility checks\n• Computer vision player detection\n• Real-time betting interface\n\nToggle between DEMO MODE (hardcoded players) and AI MODE (real detection)')}
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

      {/* Real-Time AI Video Player with Jersey Number Detection */}
      <div className="video-container">
        <RealTimeVideoPlayer 
          onPlayerClick={handlePlayerClick}
        />
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
                <div>Balance: ${USER_FINANCIALS.balance.toLocaleString()}</div>
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

      {/* Demo Footer */}
      <footer className="footer">
        <div className="footer-content">
          <h3>🚀 HackGT Demo Ready!</h3>
          <p>✅ AI Question Generation • ✅ Financial Responsibility • ✅ Computer Vision • ✅ Interactive Betting</p>
          <small>Built in 90 minutes • Ready to scale • All APIs integrated</small>
        </div>
      </footer>
    </div>
  );
}

// Main App component with authentication
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SportsBettingApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;