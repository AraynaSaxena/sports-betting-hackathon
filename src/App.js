import React, { useState, useRef } from 'react';
import { Play, Pause, TrendingUp, DollarSign, Eye, MessageCircle, Users, Zap, Shield, Brain } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyC3r1DQPqNfU28LKvbRr2Grbwf7oAlxrXw';

// Enhanced player data with more realistic stats
const PLAYER_POSITIONS = [
  {
    id: 'player_12',
    name: 'Tom Brady',
    number: 12,
    position: 'QB',
    team: 'Buccaneers',
    screenPosition: { x: 15, y: 25, width: 8, height: 12 },
    stats: { completions: 28, attempts: 42, yards: 315, touchdowns: 2, interceptions: 1, rating: 98.5, accuracy: 66.7 },
    context: 'Currently in red zone, high pressure situation',
    color: '#FF0000',
    confidence: 0.94,
    momentum: 'hot'
  },
  {
    id: 'player_13',
    name: 'Mike Evans',
    number: 13,
    position: 'WR',
    team: 'Buccaneers',
    screenPosition: { x: 35, y: 20, width: 8, height: 12 },
    stats: { receptions: 8, yards: 147, touchdowns: 1, targets: 12, longestCatch: 34, catchRate: 66.7 },
    context: 'Running deep routes, covered by top corner',
    color: '#00FF00',
    confidence: 0.87,
    momentum: 'trending'
  },
  {
    id: 'player_87',
    name: 'Rob Gronkowski',
    number: 87,
    position: 'TE',
    team: 'Buccaneers',
    screenPosition: { x: 25, y: 30, width: 8, height: 12 },
    stats: { receptions: 5, yards: 89, touchdowns: 1, targets: 7, longestCatch: 28, redZoneTargets: 3 },
    context: 'Key target in red zone situations',
    color: '#0000FF',
    confidence: 0.91,
    momentum: 'steady'
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

// Main sports betting component
function SportsBettingApp() {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [cvEnabled, setCvEnabled] = useState(false);
  const [cvStats, setCvStats] = useState({ frames: 0, players: 0, latency: 0, accuracy: 0, predictions: 0 });
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState(null);
  const [financialWarning, setFinancialWarning] = useState(null);
  const [liveStats, setLiveStats] = useState({
    activeBets: 1247,
    totalVolume: 2.4,
    winRate: 67.3,
    topPerformer: 'Tom Brady'
  });

  const videoRef = useRef(null);

  // Fixed video control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Generate AI question using Gemini
  const generateAIQuestion = async (player) => {
    if (GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template.replace('{player}', player.name)
                    .replace('{team}', player.team)
                    .replace('{yards}', Math.floor(Math.random() * 50) + 25);
    }

    try {
      const prompt = `Create a short sports betting question for NFL player ${player.name} (#${player.number}, ${player.position}) from ${player.team}.
      Current stats: ${JSON.stringify(player.stats)}
      Context: ${player.context}
      Player momentum: ${player.momentum}

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
      const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
      return template.replace('{player}', player.name).replace('{team}', player.team);
    }
  };

  // Handle player click
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
        message: 'This bet is more than 10% of your balance',
        suggestion: 'Consider betting less than $250'
      };
    } else if (totalBetting > USER_FINANCIALS.balance * 0.2) {
      return {
        level: 'medium',
        message: "You've spent 20% of your balance on betting this month",
        suggestion: 'Consider reducing bet sizes'
      };
    } else if (amountNum > 0) {
      return {
        level: 'safe',
        message: 'This is a safe bet amount',
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

  // Simulate computer vision and live stats
  React.useEffect(() => {
    if (cvEnabled) {
      const interval = setInterval(() => {
        setCvStats(prev => ({
          frames: prev.frames + 1,
          players: Math.floor(Math.random() * 2) + 3,
          latency: Math.random() * 5 + 8,
          accuracy: Math.random() * 5 + 92,
          predictions: prev.predictions + Math.floor(Math.random() * 3)
        }));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [cvEnabled]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeBets: prev.activeBets + Math.floor(Math.random() * 10) - 3,
        totalVolume: prev.totalVolume + (Math.random() * 0.2 - 0.1),
        winRate: Math.max(45, Math.min(85, prev.winRate + (Math.random() * 2 - 1))),
        topPerformer: PLAYER_POSITIONS[Math.floor(Math.random() * PLAYER_POSITIONS.length)].name
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      {/* Enhanced Header */}
      <header className="header">
        <div className="header-left">
          <h1>🏈 SportsBet AI</h1>
          <div className="user-welcome">
            Welcome back, {user?.name || 'Player'}
          </div>
        </div>
        <div className="header-controls">
          <div className="live-indicator">
            <div className="pulse-dot"></div>
            <span>LIVE</span>
          </div>
          <button
            className={`cv-toggle ${cvEnabled ? 'active' : ''}`}
            onClick={() => setCvEnabled(!cvEnabled)}
          >
            <Eye size={16} />
            {cvEnabled ? 'AI ON' : 'AI OFF'}
          </button>
          <button
            className="info-btn"
            onClick={() => alert('SportsBet AI - Interactive Sports Betting\n\n• AI-powered question generation\n• Financial responsibility checks\n• Computer vision player detection\n• Real-time betting interface')}
          >
            <Brain size={16} />
            Info
          </button>
        </div>
      </header>

      {/* Live Stats Bar */}
      <div className="live-stats-bar">
        <div className="stat-item">
          <Users size={16} />
          <span>{liveStats.activeBets.toLocaleString()} Active Bets</span>
        </div>
        <div className="stat-item">
          <TrendingUp size={16} />
          <span>${liveStats.totalVolume.toFixed(1)}M Volume</span>
        </div>
        <div className="stat-item">
          <Zap size={16} />
          <span>{liveStats.winRate.toFixed(1)}% Win Rate</span>
        </div>
        <div className="stat-item">
          <Shield size={16} />
          <span>Top: {liveStats.topPerformer}</span>
        </div>
      </div>

      {/* Enhanced Computer Vision Panel */}
      {cvEnabled && (
        <div className="cv-panel">
          <div className="cv-header">
            <div className="cv-title">
              <Eye size={20} />
              <span>AI Computer Vision</span>
              <div className="processing-indicator">
                <div className="processing-dot"></div>
                <div className="processing-dot"></div>
                <div className="processing-dot"></div>
              </div>
            </div>
            <div className="cv-status">
              <div className="status-active">ACTIVE</div>
            </div>
          </div>
          <div className="cv-stats">
            <div className="cv-stat">
              <span>Frames/Sec</span>
              <span>{cvStats.frames}</span>
              <div className="cv-stat-bar">
                <div className="cv-stat-fill" style={{width: '85%'}}></div>
              </div>
            </div>
            <div className="cv-stat">
              <span>Players</span>
              <span>{cvStats.players}</span>
              <div className="cv-stat-bar">
                <div className="cv-stat-fill" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="cv-stat">
              <span>Latency</span>
              <span>{cvStats.latency.toFixed(1)}ms</span>
              <div className="cv-stat-bar">
                <div className="cv-stat-fill" style={{width: '90%'}}></div>
              </div>
            </div>
            <div className="cv-stat">
              <span>Accuracy</span>
              <span>{cvStats.accuracy.toFixed(1)}%</span>
              <div className="cv-stat-bar">
                <div className="cv-stat-fill" style={{width: '95%'}}></div>
              </div>
            </div>
          </div>
          <div className="cv-description">
            🔍 Real-time player tracking • Pattern recognition • Predictive analysis
          </div>
        </div>
      )}

      {/* Enhanced Video Container */}
      <div className="video-container">
        <div className="video-wrapper">
          <div className="video-header">
            <div className="game-info">
              <div className="teams">TB vs BUF</div>
              <div className="quarter">Q3 • 8:42</div>
            </div>
            <div className="prediction-confidence">
              <div className="confidence-label">AI Confidence</div>
              <div className="confidence-meter">
                <div className="confidence-fill" style={{width: '87%'}}></div>
                <span>87%</span>
              </div>
            </div>
          </div>

          <video
            ref={videoRef}
            width="100%"
            height="350px"
            controls
            style={{ borderRadius: '0', backgroundColor: '#000' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/game-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Enhanced Player overlays */}
          <div className="player-overlays">
            {PLAYER_POSITIONS.map(player => (
              <button
                key={player.id}
                className={`player-overlay ${player.momentum}`}
                style={{
                  position: 'absolute',
                  left: `${player.screenPosition.x}%`,
                  top: `${player.screenPosition.y}%`,
                  width: `${player.screenPosition.width}%`,
                  height: `${player.screenPosition.height}%`,
                  backgroundColor: player.color + '40',
                  borderColor: player.color,
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
                onClick={() => handlePlayerClick(player)}
              >
                <div className="player-label">
                  <div className="player-number">#{player.number}</div>
                  <div className="player-name">{player.name.split(' ')[1]}</div>
                  <div className="player-confidence">{Math.round(player.confidence * 100)}%</div>
                </div>
                <div className="player-indicator">
                  <div className="indicator-pulse"></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Video Controls */}
        <div className="video-controls">
          <div className="control-left">
            <button
              className="control-btn"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <div className="video-status">
              <div className="detection-count">
                {PLAYER_POSITIONS.length} players detected
              </div>
              <div className="ai-status">AI Ready ✅</div>
            </div>
          </div>
          <div className="control-right">
            <div className="real-time-stats">
              <div className="stat">
                <span>Predictions:</span>
                <span>{cvStats.predictions}</span>
              </div>
              <div className="stat">
                <span>Accuracy:</span>
                <span>{cvStats.accuracy.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Panel */}
      <div className="features-panel">
        <h3>🚀 Advanced AI Features</h3>
        <div className="features-grid">
          <div className="feature premium">
            <div className="feature-icon">
              <Brain size={28} />
            </div>
            <div className="feature-content">
              <span className="feature-title">AI Question Generation</span>
              <span className="feature-desc">Real-time analysis with Gemini AI</span>
            </div>
            <div className="feature-status active">ACTIVE</div>
          </div>
          <div className="feature premium">
            <div className="feature-icon">
              <Shield size={28} />
            </div>
            <div className="feature-content">
              <span className="feature-title">Financial Protection</span>
              <span className="feature-desc">Smart spending limits & warnings</span>
            </div>
            <div className="feature-status active">ACTIVE</div>
          </div>
          <div className="feature premium">
            <div className="feature-icon">
              <Eye size={28} />
            </div>
            <div className="feature-content">
              <span className="feature-title">Computer Vision</span>
              <span className="feature-desc">Real-time player tracking</span>
            </div>
            <div className="feature-status">{cvEnabled ? 'ACTIVE' : 'READY'}</div>
          </div>
          <div className="feature premium">
            <div className="feature-icon">
              <MessageCircle size={28} />
            </div>
            <div className="feature-content">
              <span className="feature-title">Social Betting</span>
              <span className="feature-desc">Community insights & sharing</span>
            </div>
            <div className="feature-status ready">READY</div>
          </div>
        </div>
      </div>

      {/* Enhanced Player Stats Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setShowPlayerModal(false)}>
          <div className="modal enhanced" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="player-header-info">
                <h2>{selectedPlayer.name}</h2>
                <span>#{selectedPlayer.number} • {selectedPlayer.position} • {selectedPlayer.team}</span>
                <div className="momentum-indicator">
                  <span className={`momentum ${selectedPlayer.momentum}`}>
                    {selectedPlayer.momentum.toUpperCase()}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowPlayerModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="stats-section">
                <h3>📊 Live Performance Analytics</h3>
                <div className="stats-grid enhanced">
                  {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                    <div key={key} className="stat-item enhanced">
                      <span className="stat-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      <span className="stat-value">{value}</span>
                      <div className="stat-trend">
                        <TrendingUp size={12} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="confidence-section">
                  <div className="confidence-label">AI Prediction Confidence</div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{width: `${selectedPlayer.confidence * 100}%`}}
                    ></div>
                    <span>{Math.round(selectedPlayer.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="question-section">
                <h3>🤖 AI-Generated Prediction</h3>
                {isGeneratingQuestion ? (
                  <div className="generating">
                    <div className="ai-thinking">
                      <div className="thinking-dots">
                        <div></div><div></div><div></div>
                      </div>
                      <span>AI analyzing player data...</span>
                    </div>
                  </div>
                ) : (
                  <div className="question-box enhanced">
                    <div className="question-text">{currentQuestion}</div>
                    <div className="odds enhanced">
                      <div className="odd">
                        <span>YES</span>
                        <span>+150</span>
                        <div className="odd-confidence">72%</div>
                      </div>
                      <div className="odd">
                        <span>NO</span>
                        <span>-120</span>
                        <div className="odd-confidence">28%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions fixed">
              <button className="modal-btn secondary" onClick={() => setShowPlayerModal(false)}>Close</button>
              <button
                className="modal-btn primary"
                onClick={() => {
                  setShowPlayerModal(false);
                  setShowBettingModal(true);
                }}
                disabled={isGeneratingQuestion}
              >
                <Zap size={16} />
                Place Smart Bet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Betting Modal */}
      {showBettingModal && (
        <div className="modal-overlay" onClick={() => setShowBettingModal(false)}>
          <div className="modal betting-modal enhanced" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Place Your Smart Bet</h2>
              <button className="close-btn" onClick={() => setShowBettingModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="question-display enhanced">
                <strong>{currentQuestion}</strong>
                <div>Player: {selectedPlayer?.name}</div>
                <div className="ai-recommendation">
                  AI Recommendation: <span className="recommendation-value">YES (+150)</span>
                </div>
              </div>

              <div className="bet-options">
                <h3>Choose Your Prediction</h3>
                <div className="options enhanced">
                  <button
                    className={`option ${selectedBet === 'YES' ? 'selected' : ''}`}
                    onClick={() => setSelectedBet('YES')}
                  >
                    <span>YES</span>
                    <span>+150</span>
                    <div className="win-amount">Win: ${betAmount ? (parseFloat(betAmount) * 1.5).toFixed(2) : '0.00'}</div>
                  </button>
                  <button
                    className={`option ${selectedBet === 'NO' ? 'selected' : ''}`}
                    onClick={() => setSelectedBet('NO')}
                  >
                    <span>NO</span>
                    <span>-120</span>
                    <div className="win-amount">Win: ${betAmount ? (parseFloat(betAmount) * 0.83).toFixed(2) : '0.00'}</div>
                  </button>
                </div>
              </div>

              <div className="bet-amount">
                <h3>Bet Amount</h3>
                <div className="amount-input enhanced">
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
                      className="quick-amount-btn"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {financialWarning && (
                <div className={`warning ${financialWarning.level} enhanced`}>
                  <div className="warning-icon">
                    <Shield size={16} />
                  </div>
                  <div className="warning-content">
                    <div>{financialWarning.message}</div>
                    <div>{financialWarning.suggestion}</div>
                  </div>
                </div>
              )}

              <div className="balance-info enhanced">
                <div className="balance-item">
                  <span>Available Balance:</span>
                  <span>${USER_FINANCIALS.balance.toLocaleString()}</span>
                </div>
                <div className="balance-item">
                  <span>Monthly Betting:</span>
                  <span>${USER_FINANCIALS.bettingHistory}</span>
                </div>
                <div className="balance-item">
                  <span>Risk Level:</span>
                  <span className={`risk-${USER_FINANCIALS.riskLevel}`}>{USER_FINANCIALS.riskLevel.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions fixed">
              <button className="modal-btn secondary" onClick={() => setShowBettingModal(false)}>Cancel</button>
              <button
                className="modal-btn primary"
                onClick={placeBet}
                disabled={!selectedBet || !betAmount}
              >
                <Zap size={16} />
                Place Bet ${betAmount || '0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Demo Footer */}
      <footer className="footer enhanced">
        <div className="footer-content">
          <h3>🚀 HackGT Demo - SportsBet AI</h3>
          <div className="feature-badges">
            <span className="badge">✅ AI Question Generation</span>
            <span className="badge">✅ Financial Responsibility</span>
            <span className="badge">✅ Computer Vision</span>
            <span className="badge">✅ Real-time Analytics</span>
          </div>
          <small>Built with React • Gemini AI • Advanced CV • Ready to scale</small>
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