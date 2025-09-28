import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Eye, Zap, AlertCircle } from 'lucide-react';
import './RealTimeVideoPlayer.css';

const RealTimeVideoPlayer = ({ onPlayerClick }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const processingIntervalRef = useRef(null);
  // Freeze overlay geometry when paused
  const frozenRectRef = useRef(null);
  const frozenScaleRef = useRef({ x: 1, y: 1 });
  // Abort in-flight frame requests when pausing
  const requestAbortRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [isAIActive, setIsAIActive] = useState(true); // Start AI immediately
  const [displayMode, setDisplayMode] = useState('all'); // 'all' or 'hover'
  const [aiStats, setAiStats] = useState({
    fps: 0,
    detections: 0,
    processingTime: 0,
    confidence: 0
  });
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const AI_BACKEND_URL = 'http://localhost:5001';

  // Draw player bounding boxes on overlay canvas
  const drawPlayerOverlays = useCallback((detections) => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!overlayCanvas || !video) return;

    const ctx = overlayCanvas.getContext('2d');
    // When paused, use frozen geometry to avoid jitter from layout changes
    let rect;
    if (!isPlaying && frozenRectRef.current) {
      rect = frozenRectRef.current;
    } else {
      rect = video.getBoundingClientRect();
      // Update frozen values while playing
      frozenRectRef.current = rect;
    }
    
    // Set canvas size to match video display size (use integers to avoid subpixel jitter)
    overlayCanvas.width = Math.round(rect.width);
    overlayCanvas.height = Math.round(rect.height);
    
    // Clear previous drawings
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Calculate scale factors (frozen when paused)
    let scaleX, scaleY;
    if (!isPlaying && frozenScaleRef.current) {
      scaleX = frozenScaleRef.current.x;
      scaleY = frozenScaleRef.current.y;
    } else {
      scaleX = rect.width / video.videoWidth;
      scaleY = rect.height / video.videoHeight;
      frozenScaleRef.current = { x: scaleX, y: scaleY };
    }

    // DEBUG log
    console.debug('[Overlay] Drawing detections:', detections?.length || 0);

    // Filter detections based on display mode
    const detectionsToShow = displayMode === 'hover' 
      ? (hoveredPlayer ? [hoveredPlayer] : [])
      : detections;

    // Draw each detection
    detectionsToShow.forEach((detection, index) => {
      if (!detection.bbox) return;

      const [x1, y1, x2, y2] = detection.bbox;
      
      // Scale coordinates to display size
      const displayX1 = x1 * scaleX;
      const displayY1 = y1 * scaleY;
      const displayX2 = x2 * scaleX;
      const displayY2 = y2 * scaleY;
      
      const width = displayX2 - displayX1;
      const height = displayY2 - displayY1;

      // Dynamic color based on movement intensity
      let boxColor = '#00ff00'; // Default green
      let textColor = '#ffffff';
      
      // Color coding based on movement intensity
      if (detection.intensity_level === 'red') {
        boxColor = '#ff0000'; // Red for high intensity (sprinting)
      } else if (detection.intensity_level === 'yellow') {
        boxColor = '#ffff00'; // Yellow for medium intensity (jogging)
      } else {
        boxColor = '#00ff00'; // Green for low intensity (walking/stationary)
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

      // Draw movement confidence score
      const movementText = `${Math.round((detection.movement_confidence || 0) * 100)}%`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(displayX2 - 40, displayY1, 40, 20);
      ctx.fillStyle = boxColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(movementText, displayX2 - 20, displayY1 + 14);
    });
  }, [isPlaying, hoveredPlayer]);

  // Process video frame to detect players and jersey numbers
  const processVideoFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isAIActive || !isPlaying || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Skip if video not ready or paused
    if (video.readyState < 2 || video.paused) return;

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
      
      console.log('🚀 [Frontend] ===== SENDING FRAME =====');
      console.log('🚀 [Frontend] Time:', new Date().toISOString());
      console.log('🚀 [Frontend] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('🚀 [Frontend] Canvas dimensions:', canvas.width, 'x', canvas.height);

      // Send to AI backend (with abort support)
      if (requestAbortRef.current) {
        // If a previous request exists, abort it before starting a new one
        requestAbortRef.current.abort();
      }
      const controller = new AbortController();
      requestAbortRef.current = controller;
      const response = await fetch(`${AI_BACKEND_URL}/process_video_frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          frame: frameData,
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 [Frontend] Backend response:', result);

      // If video got paused while awaiting response, abort applying updates
      if (video.paused) {
        console.log('⏸️ [Frontend] Video paused, aborting update');
        return;
      }

      if (result.success) {
        console.log('✅ [Frontend] Processing successful, detections:', result.detections?.length || 0);
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
      // Clear abort controller when done
      if (requestAbortRef.current) {
        requestAbortRef.current = null;
      }
      setIsProcessing(false);
    }
  }, [isAIActive, isProcessing, isPlaying, drawPlayerOverlays]);


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


  // Update overlay canvas when video size changes
  useEffect(() => {
    const handleResize = () => {
      if (detectedPlayers.length > 0) {
        drawPlayerOverlays(detectedPlayers);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectedPlayers, drawPlayerOverlays]);

  // Redraw overlays whenever detections or play state change
  useEffect(() => {
    drawPlayerOverlays(detectedPlayers);
  }, [detectedPlayers, isPlaying, drawPlayerOverlays]);

  // Start AI processing automatically when component mounts
  useEffect(() => {
    const startAI = async () => {
      try {
        const response = await fetch(`${AI_BACKEND_URL}/health`);
        if (response.ok) {
          setError(null);
          
          // FORCE TEST: Try processing a frame immediately
          console.log('🧪 [Frontend] FORCE TESTING - calling processVideoFrame once');
          try {
            await processVideoFrame();
          } catch (testErr) {
            console.error('❌ [Frontend] Force test failed:', testErr);
          }
          
          // Start processing frames every 200ms (5 FPS) ONLY if video is playing
          const video = videoRef.current;
          if (video && !video.paused && !processingIntervalRef.current) {
            processingIntervalRef.current = setInterval(processVideoFrame, 200);
            console.log('🤖 YOLO AI detection started automatically');
          } else {
            console.log('🤖 Backend healthy. Waiting for video play to start AI processing...');
          }
        } else {
          setError('AI Backend not responding');
        }
      } catch (err) {
        setError('AI Backend not available. Please run: cd ai_backend && python3 app.py');
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

  // Ensure interval tracks play/AI state reactively
  useEffect(() => {
    const shouldRun = isAIActive && isPlaying && !processingIntervalRef.current;
    if (shouldRun) {
      processingIntervalRef.current = setInterval(processVideoFrame, 200);
      console.log('▶️ Processing interval started (reactive)');
    }
    if ((!isAIActive || !isPlaying) && processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
      console.log('⏹️ Processing interval stopped (reactive)');
    }
    return () => {};
  }, [isAIActive, isPlaying, processVideoFrame]);

  // Handle video play/pause events to control AI processing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Resume AI processing when video plays
      if (isAIActive && !processingIntervalRef.current) {
        processingIntervalRef.current = setInterval(processVideoFrame, 200);
        console.log('🤖 AI processing resumed');
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Keep the last detections visible when paused, but stop processing new frames
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      // Abort any in-flight request so late responses don't update overlays
      if (requestAbortRef.current) {
        try { requestAbortRef.current.abort(); } catch (_) {}
        requestAbortRef.current = null;
      }
      console.log('⏸️ AI processing paused with video');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isAIActive, processVideoFrame]);

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
                {error ? 'Backend Offline' : 
                 !isPlaying ? 'Paused - Detections Frozen' : 'Processing Video Frames'}
              </div>
            </div>
          </div>

          {/* Display Mode Toggle */}
          <div className="display-mode-toggle">
            <label className="toggle-label">Display:</label>
            <select 
              value={displayMode} 
              onChange={(e) => setDisplayMode(e.target.value)}
              className="mode-select"
            >
              <option value="all">Show All Frames</option>
              <option value="hover">Show on Hover Only</option>
            </select>
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
            🤖 YOLO AI Detection • {detectedPlayers.length} players detected • 
            {!isPlaying ? 'Paused - Detections frozen' : 'Processing video frames'}
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
