import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Eye, Zap, AlertCircle } from 'lucide-react';
import './RealTimeVideoPlayer.css';

const RealTimeVideoPlayer = ({ onPlayerClick }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const processingIntervalRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [isAIActive, setIsAIActive] = useState(true); // Start AI immediately
  const [aiStats, setAiStats] = useState({
    fps: 0,
    detections: 0,
    processingTime: 0,
    confidence: 0
  });
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const AI_BACKEND_URL = 'http://localhost:5002';

  // Process video frame to detect players and jersey numbers
  const processVideoFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isAIActive || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Skip if video not ready
    if (video.readyState < 2) return;

    try {
      setIsProcessing(true);
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.7);
      
      const startTime = Date.now();

      // Send to AI backend
      const response = await fetch(`${AI_BACKEND_URL}/process_video_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          frame: frameData,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const processingTime = Date.now() - startTime;
        
        // Update detections
        setDetectedPlayers(result.detections || []);
        
        // Update stats
        const avgConfidence = result.detections.length > 0 
          ? result.detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / result.detections.length
          : 0;

        setAiStats({
          fps: Math.round(1000 / Math.max(processingTime, 100)),
          detections: result.detections.length,
          processingTime: processingTime,
          confidence: Math.round(avgConfidence * 100)
        });

        // Draw bounding boxes on overlay canvas
        drawPlayerOverlays(result.detections);
        
        setError(null);
      } else {
        setError(result.error || 'Processing failed');
      }
    } catch (err) {
      console.error('Frame processing error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isAIActive, isProcessing]);

  // Draw player bounding boxes on overlay canvas
  const drawPlayerOverlays = (detections) => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!overlayCanvas || !video) return;

    const ctx = overlayCanvas.getContext('2d');
    const rect = video.getBoundingClientRect();
    
    // Set canvas size to match video display size
    overlayCanvas.width = rect.width;
    overlayCanvas.height = rect.height;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Calculate scale factors
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    detections.forEach((detection, index) => {
      if (!detection.bbox) return;

      const [x1, y1, x2, y2] = detection.bbox;
      
      // Scale coordinates to display size
      const displayX1 = x1 * scaleX;
      const displayY1 = y1 * scaleY;
      const displayX2 = x2 * scaleX;
      const displayY2 = y2 * scaleY;
      
      const width = displayX2 - displayX1;
      const height = displayY2 - displayY1;

      // Determine colors based on confidence and jersey detection
      let boxColor = '#00ff00'; // Green for good detection
      let textColor = '#ffffff';
      
      if (detection.confidence < 0.5) {
        boxColor = '#ffff00'; // Yellow for medium confidence
      }
      if (detection.confidence < 0.3) {
        boxColor = '#ff0000'; // Red for low confidence
      }

      // Draw bounding box
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(displayX1, displayY1, width, height);

      // Draw semi-transparent fill on hover
      if (hoveredPlayer === detection) {
        ctx.fillStyle = boxColor + '20';
        ctx.fillRect(displayX1, displayY1, width, height);
        
        // Enhanced border for hovered player
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(displayX1 - 2, displayY1 - 2, width + 4, height + 4);
      }

      // Draw jersey number label
      if (detection.jersey_number) {
        const labelText = `#${detection.jersey_number}`;
        const labelWidth = 60;
        const labelHeight = 25;
        const labelX = displayX1 + (width - labelWidth) / 2;
        const labelY = displayY1 - labelHeight - 5;

        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        
        // Label border
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

        // Label text
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, labelX + labelWidth/2, labelY + 17);
      }

      // Draw player name if available
      if (detection.stats && detection.stats.name) {
        const nameText = detection.stats.name.split(' ').pop(); // Last name
        ctx.fillStyle = textColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(nameText, displayX1 + width/2, displayY2 + 15);
      }

      // Draw confidence score
      const confidenceText = `${Math.round(detection.confidence * 100)}%`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(displayX2 - 35, displayY1, 35, 20);
      ctx.fillStyle = textColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(confidenceText, displayX2 - 17, displayY1 + 13);
    });
  };

  // Handle mouse move over video to detect hover (YOLO detections only)
  const handleMouseMove = (e) => {
    const video = videoRef.current;
    if (!video || !detectedPlayers.length) return;

    const rect = video.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale mouse coordinates to video coordinates for AI detections
    const scaleX = video.videoWidth / rect.width;
    const scaleY = video.videoHeight / rect.height;
    const videoX = x * scaleX;
    const videoY = y * scaleY;

    // Find hovered player from YOLO detections
    const hoveredPlayer = detectedPlayers.find(detection => {
      if (!detection.bbox) return false;
      const [x1, y1, x2, y2] = detection.bbox;
      return videoX >= x1 && videoX <= x2 && videoY >= y1 && videoY <= y2;
    });

    setHoveredPlayer(hoveredPlayer || null);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredPlayer(null);
  };

  // Handle player click
  const handlePlayerClickEvent = (e) => {
    if (hoveredPlayer && onPlayerClick) {
      const playerData = {
        id: `ai_player_${hoveredPlayer.jersey_number || Math.random()}`,
        name: hoveredPlayer.stats?.name || `Player #${hoveredPlayer.jersey_number}`,
        number: hoveredPlayer.jersey_number,
        position: hoveredPlayer.stats?.position || 'Unknown',
        team: hoveredPlayer.stats?.team || 'Unknown',
        stats: hoveredPlayer.stats?.stats || {},
        context: hoveredPlayer.stats?.context || 'AI detected player',
        confidence: hoveredPlayer.confidence,
        bbox: hoveredPlayer.bbox
      };
      onPlayerClick(playerData);
    }
  };

  // Toggle AI processing
  const toggleAI = async () => {
    if (!isAIActive) {
      try {
        // Test backend connection
        const response = await fetch(`${AI_BACKEND_URL}/health`);
        if (!response.ok) {
          throw new Error('Backend not responding');
        }

        setIsAIActive(true);
        setError(null);
        
        // Start processing frames every 300ms (about 3 FPS for performance)
        processingIntervalRef.current = setInterval(processVideoFrame, 300);
        
      } catch (err) {
        setError('AI Backend not available. Please run: cd ai_backend && python3 app.py');
        console.error('Backend connection failed:', err);
      }
    } else {
      setIsAIActive(false);
      setDetectedPlayers([]);
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }

      // Clear overlay canvas
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }
  };

  // Update overlay canvas when video size changes
  useEffect(() => {
    const handleResize = () => {
      if (detectedPlayers.length > 0) {
        drawPlayerOverlays(detectedPlayers);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectedPlayers]);

  // Start AI processing automatically when component mounts
  useEffect(() => {
    const startAI = async () => {
      try {
        const response = await fetch(`${AI_BACKEND_URL}/health`);
        if (response.ok) {
          setError(null);
          // Start processing frames every 200ms (5 FPS)
          processingIntervalRef.current = setInterval(processVideoFrame, 200);
          console.log('🤖 YOLO AI detection started automatically');
        } else {
          setError('AI Backend not responding');
        }
      } catch (err) {
        setError('AI Backend not available. Please run: cd ai_backend && python3 simple_app.py');
        console.error('Backend connection failed:', err);
      }
    };

    startAI();

    // Cleanup on unmount
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [processVideoFrame]);

  return (
    <div className="realtime-video-player">
      {/* AI Control Panel */}
      <div className="ai-control-panel">
        <div className="controls-left">
          <div className="ai-status-display">
            <Eye size={20} />
            <div>
              <div className="status-title">YOLO AI Detection</div>
              <div className="status-subtitle">
                {error ? 'Backend Offline' : 'Processing Video Frames'}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {isAIActive && (
          <div className="ai-stats">
            <div className="stat">
              <Zap size={14} />
              <span>{aiStats.fps} FPS</span>
            </div>
            <div className="stat">
              <span>👥 {aiStats.detections}</span>
            </div>
            <div className="stat">
              <span>⏱️ {aiStats.processingTime}ms</span>
            </div>
            {aiStats.confidence > 0 && (
              <div className="stat">
                <span>🎯 {aiStats.confidence}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="video-container-realtime">
        <div 
          className="video-wrapper"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handlePlayerClickEvent}
        >
          <video
            ref={videoRef}
            width="100%"
            height="400px"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/game-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Overlay canvas for drawing bounding boxes */}
          <canvas
            ref={overlayCanvasRef}
            className="overlay-canvas"
          />

          {/* Hidden canvas for frame processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />


          {/* Hover tooltip */}
          {hoveredPlayer && (
            <div className="hover-tooltip" style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px',
              fontSize: '14px',
              zIndex: 1000,
              border: '1px solid #00ff00'
            }}>
              <div><strong>
                Jersey #{hoveredPlayer.jersey_number || hoveredPlayer.number || 'Unknown'}
              </strong></div>
              {(hoveredPlayer.stats?.name || hoveredPlayer.name) && (
                <div>{hoveredPlayer.stats?.name || hoveredPlayer.name}</div>
              )}
              {hoveredPlayer.confidence && (
                <div>Confidence: {Math.round(hoveredPlayer.confidence * 100)}%</div>
              )}
              {hoveredPlayer.position && (
                <div>Position: {hoveredPlayer.position}</div>
              )}
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                {isAIActive ? 'AI Detected • Click for details' : 'Demo Player • Click for details'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <button
            className="play-control"
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
          <span>
            🤖 YOLO AI Detection • {detectedPlayers.length} players detected • Processing video frames
          </span>
        </div>

        <div className="status-right">
          <span>💡 Hover over detected players</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeVideoPlayer;
