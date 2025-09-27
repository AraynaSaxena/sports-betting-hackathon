import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Eye, Zap } from 'lucide-react';
import './EnhancedVideoPlayer.css';

const EnhancedVideoPlayer = ({ onPlayerClick, playerPositions = [] }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [videoRect, setVideoRect] = useState(null);
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    fps: 0,
    detections: 0,
    processing: false
  });

  // AI Backend URL
  const AI_BACKEND_URL = 'http://localhost:5000';

  // Update video rect when video loads or resizes
  useEffect(() => {
    const updateVideoRect = () => {
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        setVideoRect(rect);
      }
    };

    updateVideoRect();
    window.addEventListener('resize', updateVideoRect);
    return () => window.removeEventListener('resize', updateVideoRect);
  }, []);

  // Process video frame for AI detection
  const processVideoFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isAIEnabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      setProcessingStats(prev => ({ ...prev, processing: true }));

      const response = await fetch(`${AI_BACKEND_URL}/process_video_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameData })
      });

      const result = await response.json();
      
      if (result.success) {
        setDetectedPlayers(result.detections);
        setProcessingStats({
          fps: Math.round(1000 / (result.processing_time * 1000 + 100)),
          detections: result.detections.length,
          processing: false
        });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      setProcessingStats(prev => ({ ...prev, processing: false }));
    }
  }, [isAIEnabled]);

  // Start/stop AI processing
  const toggleAI = async () => {
    if (!isAIEnabled) {
      try {
        const response = await fetch(`${AI_BACKEND_URL}/health`);
        if (response.ok) {
          setIsAIEnabled(true);
          // Process frames every 200ms (5 FPS)
          const interval = setInterval(processVideoFrame, 200);
          return () => clearInterval(interval);
        }
      } catch (error) {
        alert('AI Backend not available. Please start the backend first.');
      }
    } else {
      setIsAIEnabled(false);
      setDetectedPlayers([]);
    }
  };

  // Handle mouse move over video
  const handleMouseMove = (e) => {
    if (!videoRect) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });

    // Check if hovering over any player
    const playersToCheck = isAIEnabled ? detectedPlayers : playerPositions;
    const hoveredPlayer = playersToCheck.find(player => {
      const pos = player.screenPosition || player.screen_position;
      if (!pos) return false;

      return (
        x >= pos.x && x <= pos.x + pos.width &&
        y >= pos.y && y <= pos.y + pos.height
      );
    });

    setHoveredPlayer(hoveredPlayer);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredPlayer(null);
  };

  // Handle player click
  const handlePlayerClick = (player) => {
    if (onPlayerClick) {
      // Convert AI detection format to expected format
      const playerData = {
        id: player.id || `player_${player.jersey_number || Math.random()}`,
        name: player.stats?.name || player.name || `Player #${player.jersey_number || player.number}`,
        number: player.jersey_number || player.number,
        position: player.stats?.position || player.position || 'Unknown',
        team: player.stats?.team || player.team || 'Unknown',
        screenPosition: player.screenPosition || player.screen_position,
        stats: player.stats?.stats || player.stats || {},
        context: player.stats?.context || player.context || 'Player information',
        color: player.color || '#FF0000',
        confidence: player.confidence
      };
      onPlayerClick(playerData);
    }
  };

  // Render player overlays with hover effects
  const renderPlayerOverlays = () => {
    const playersToRender = isAIEnabled ? detectedPlayers : playerPositions;
    
    return playersToRender.map((player, index) => {
      const pos = player.screenPosition || player.screen_position;
      if (!pos) return null;

      const isHovered = hoveredPlayer === player;
      const jerseyNumber = player.jersey_number || player.number;
      const playerName = player.stats?.name || player.name;

      return (
        <div
          key={player.id || `player_${index}`}
          className={`player-overlay-enhanced ${isHovered ? 'hovered' : ''}`}
          style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${pos.width}%`,
            height: `${pos.height}%`,
            border: isHovered ? '3px solid #00ff00' : '2px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isHovered ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
            zIndex: isHovered ? 20 : 10,
            boxShadow: isHovered ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none'
          }}
          onClick={() => handlePlayerClick(player)}
        >
          {/* Jersey Number Label */}
          {isHovered && jerseyNumber && (
            <div className="jersey-number-label">
              <div className="jersey-number">#{jerseyNumber}</div>
              {playerName && (
                <div className="player-name-short">
                  {playerName.split(' ').pop()}
                </div>
              )}
              {player.confidence && (
                <div className="confidence-score">
                  {Math.round(player.confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Hover Tooltip */}
          {isHovered && (
            <div className="player-hover-tooltip">
              <div className="tooltip-content">
                {playerName ? (
                  <>
                    <div className="player-info">
                      <strong>{playerName}</strong>
                      <span>#{jerseyNumber} • {player.stats?.position || player.position}</span>
                      <span>{player.stats?.team || player.team}</span>
                    </div>
                    {player.stats?.stats && (
                      <div className="quick-stats">
                        {Object.entries(player.stats.stats).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="stat-row">
                            <span>{key.replace('_', ' ')}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="unknown-player">
                    <strong>Player #{jerseyNumber}</strong>
                    <span>Click for more info</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="enhanced-video-player" ref={containerRef}>
      {/* AI Controls */}
      <div className="ai-controls-bar">
        <div className="controls-left">
          <button
            className={`ai-toggle-btn ${isAIEnabled ? 'active' : ''}`}
            onClick={toggleAI}
          >
            <Eye size={16} />
            {isAIEnabled ? 'AI ON' : 'AI OFF'}
          </button>
          
          {isAIEnabled && (
            <div className="ai-stats-mini">
              <span><Zap size={12} /> {processingStats.fps} FPS</span>
              <span>👥 {processingStats.detections}</span>
              {processingStats.processing && <span className="processing">⚡</span>}
            </div>
          )}
        </div>

        <div className="controls-right">
          <span className="mode-indicator">
            {isAIEnabled ? '🤖 AI Detection' : '🎭 Demo Mode'}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div 
        className="video-wrapper-enhanced"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          width="100%"
          height="400px"
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ 
            borderRadius: '10px', 
            backgroundColor: '#000',
            display: 'block'
          }}
        >
          <source src="/game-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Hidden canvas for AI processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Player Overlays */}
        <div className="overlays-container">
          {renderPlayerOverlays()}
        </div>

        {/* Mouse Position Debug (optional) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mouse-debug">
            Mouse: {mousePosition.x.toFixed(1)}%, {mousePosition.y.toFixed(1)}%
            {hoveredPlayer && (
              <div>Hovering: Player #{hoveredPlayer.jersey_number || hoveredPlayer.number}</div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar-enhanced">
        <div className="status-left">
          <button
            className="play-btn"
            onClick={() => {
              if (isPlaying) {
                videoRef.current?.pause();
              } else {
                videoRef.current?.play();
              }
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>

        <div className="status-center">
          <span className="detection-count">
            {isAIEnabled ? detectedPlayers.length : playerPositions.length} players detected
          </span>
        </div>

        <div className="status-right">
          <span className="hover-hint">
            💡 Hover over players to see details
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer;
