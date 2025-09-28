import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Cpu, Zap, AlertCircle } from 'lucide-react';
import './AIVideoPlayer.css';

const AIVideoPlayer = ({ onPlayerDetection, onPlayerClick }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [detections, setDetections] = useState([]);
  const [aiStats, setAiStats] = useState({
    fps: 0,
    processingTime: 0,
    playersDetected: 0,
    confidence: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // AI Backend URL
  const AI_BACKEND_URL = 'http://localhost:5000';
  
  // Processing interval
  const processingIntervalRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isAIEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => disconnectWebSocket();
  }, [isAIEnabled]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8765');
      
      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected to AI backend');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'detections') {
          updateDetections(data.data);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
      };
      
      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setError('Failed to connect to AI backend');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Capture video frame and send to AI backend
  const captureAndProcessFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isAIEnabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      setIsProcessing(true);
      
      const response = await fetch(`${AI_BACKEND_URL}/process_video_frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: frameData,
          timestamp: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        updateDetections(result.detections);
        
        // Update AI stats
        setAiStats(prev => ({
          fps: Math.round(1000 / (result.processing_time * 1000 + 50)), // Estimate FPS
          processingTime: Math.round(result.processing_time * 1000),
          playersDetected: result.detections.length,
          confidence: result.detections.length > 0 
            ? Math.round(result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.detections.length * 100)
            : 0
        }));
        
        setError(null);
      } else {
        setError(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      setError('Failed to connect to AI backend');
    } finally {
      setIsProcessing(false);
    }
  }, [isAIEnabled]);

  // Update detections and notify parent
  const updateDetections = (newDetections) => {
    setDetections(newDetections);
    if (onPlayerDetection) {
      onPlayerDetection(newDetections);
    }
  };

  // Start/stop AI processing
  const toggleAI = async () => {
    if (!isAIEnabled) {
      // Test backend connection first
      try {
        const response = await fetch(`${AI_BACKEND_URL}/health`);
        if (!response.ok) {
          throw new Error('Backend not responding');
        }
        
        setIsAIEnabled(true);
        setError(null);
        
        // Start processing frames
        processingIntervalRef.current = setInterval(captureAndProcessFrame, 200); // 5 FPS
        
      } catch (error) {
        setError('AI Backend not available. Make sure to run: python ai_backend/app.py');
        console.error('Backend connection failed:', error);
      }
    } else {
      setIsAIEnabled(false);
      setDetections([]);
      
      // Stop processing
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    }
  };

  // Handle player hover
  const handlePlayerHover = (detection, isHovering) => {
    setHoveredPlayer(isHovering ? detection : null);
  };

  // Handle player click
  const handlePlayerClick = (detection) => {
    if (onPlayerClick && detection.stats) {
      onPlayerClick({
        id: `ai_player_${detection.jersey_number}`,
        name: detection.stats.name,
        number: detection.jersey_number,
        position: detection.stats.position,
        team: detection.stats.team,
        stats: detection.stats.stats,
        context: detection.stats.context,
        screenPosition: detection.screen_position,
        confidence: detection.confidence,
        color: getPlayerColor(detection.jersey_number)
      });
    }
  };

  // Get color for player based on jersey number
  const getPlayerColor = (jerseyNumber) => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    return colors[jerseyNumber % colors.length];
  };

  // Render player overlays
  const renderPlayerOverlays = () => {
    if (!videoRef.current || detections.length === 0) return null;

    const video = videoRef.current;
    const videoRect = video.getBoundingClientRect();

    return detections.map((detection, index) => {
      const { screen_position, jersey_number, confidence, stats } = detection;
      
      if (!screen_position) return null;

      const overlayStyle = {
        position: 'absolute',
        left: `${screen_position.x}%`,
        top: `${screen_position.y}%`,
        width: `${screen_position.width}%`,
        height: `${screen_position.height}%`,
        border: `2px solid ${getPlayerColor(jersey_number || index)}`,
        backgroundColor: `${getPlayerColor(jersey_number || index)}20`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hoveredPlayer === detection ? 'scale(1.05)' : 'scale(1)',
        zIndex: 10
      };

      return (
        <div
          key={`detection_${index}`}
          className="ai-player-overlay"
          style={overlayStyle}
          onMouseEnter={() => handlePlayerHover(detection, true)}
          onMouseLeave={() => handlePlayerHover(detection, false)}
          onClick={() => handlePlayerClick(detection)}
        >
          <div className="player-label">
            {jersey_number && <div className="jersey-number">#{jersey_number}</div>}
            {stats && <div className="player-name">{stats.name?.split(' ').pop()}</div>}
            <div className="confidence">{Math.round(confidence * 100)}%</div>
          </div>
          
          {hoveredPlayer === detection && (
            <div className="player-tooltip">
              <div className="tooltip-content">
                {stats ? (
                  <>
                    <div className="player-info">
                      <strong>{stats.name}</strong>
                      <span>{stats.position} • {stats.team}</span>
                    </div>
                    <div className="quick-stats">
                      {stats.stats && Object.entries(stats.stats).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="stat">
                          <span>{key.replace('_', ' ')}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div>Player #{jersey_number || 'Unknown'}</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="ai-video-player">
      {/* AI Control Panel */}
      <div className="ai-control-panel">
        <div className="ai-controls">
          <button
            className={`ai-toggle ${isAIEnabled ? 'active' : ''}`}
            onClick={toggleAI}
            disabled={isProcessing}
          >
            <Eye size={16} />
            {isAIEnabled ? 'AI ON' : 'AI OFF'}
            {isProcessing && <div className="spinner" />}
          </button>
          
          {error && (
            <div className="ai-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* AI Stats */}
        {isAIEnabled && (
          <div className="ai-stats">
            <div className="ai-stat">
              <Zap size={14} />
              <span>{aiStats.fps} FPS</span>
            </div>
            <div className="ai-stat">
              <Cpu size={14} />
              <span>{aiStats.processingTime}ms</span>
            </div>
            <div className="ai-stat">
              <Eye size={14} />
              <span>{aiStats.playersDetected} players</span>
            </div>
            {aiStats.confidence > 0 && (
              <div className="ai-stat">
                <span>🎯 {aiStats.confidence}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Container with Overlays */}
      <div className="video-container-ai" style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          width="100%"
          height="400px"
          controls
          style={{ borderRadius: '10px', backgroundColor: '#000' }}
        >
          <source src="/game-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Hidden canvas for frame capture */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* AI-detected player overlays */}
        <div className="player-overlays-container" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
            {renderPlayerOverlays()}
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="processing-indicator">
            <div className="processing-spinner" />
            <span>Processing frame...</span>
          </div>
        )}
      </div>

      {/* AI Status */}
      <div className="ai-status">
        {isAIEnabled ? (
          <div className="status-active">
            <div className="status-dot active" />
            <span>AI Detection Active • Real-time player recognition</span>
          </div>
        ) : (
          <div className="status-inactive">
            <div className="status-dot" />
            <span>AI Detection Disabled • Click "AI ON" to start</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIVideoPlayer;
