import React, { useEffect, useState, useRef } from 'react';

// Simple person detection using MediaPipe or TensorFlow.js
// For now, we'll use a simpler approach with canvas-based detection

const RealTimePlayerDetection = ({ videoRef }) => {
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    if (!videoRef?.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    const updateCanvasSize = () => {
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
    };

    video.addEventListener('loadedmetadata', updateCanvasSize);
    updateCanvasSize();

    // Simple motion detection for player tracking
    let previousFrame = null;
    
    const detectPlayers = () => {
      if (video.paused || video.ended) return;
      
      try {
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (previousFrame) {
          const players = findMovingObjects(previousFrame, currentFrame, canvas.width, canvas.height);
          setDetectedPlayers(players);
        }
        
        previousFrame = currentFrame;
      } catch (error) {
        console.log('Detection frame skipped:', error.message);
      }
    };

    // Start detection when video plays
    const startDetection = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      detectionIntervalRef.current = setInterval(detectPlayers, 100); // 10 FPS detection
    };

    const stopDetection = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };

    video.addEventListener('play', startDetection);
    video.addEventListener('pause', stopDetection);
    video.addEventListener('ended', stopDetection);

    return () => {
      stopDetection();
      video.removeEventListener('play', startDetection);
      video.removeEventListener('pause', stopDetection);
      video.removeEventListener('ended', stopDetection);
      video.removeEventListener('loadedmetadata', updateCanvasSize);
    };
  }, [videoRef]);

  // Simple motion detection algorithm
  const findMovingObjects = (prevFrame, currFrame, width, height) => {
    const players = [];
    const threshold = 30; // Motion sensitivity
    const minSize = 2000; // Minimum pixels for a player
    const gridSize = 20; // Detection grid size
    
    // Grid-based motion detection
    for (let y = 0; y < height - gridSize; y += gridSize) {
      for (let x = 0; x < width - gridSize; x += gridSize) {
        let motionPixels = 0;
        
        // Check motion in this grid cell
        for (let dy = 0; dy < gridSize; dy++) {
          for (let dx = 0; dx < gridSize; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            
            if (idx < prevFrame.data.length && idx < currFrame.data.length) {
              const prevR = prevFrame.data[idx];
              const prevG = prevFrame.data[idx + 1];
              const prevB = prevFrame.data[idx + 2];
              
              const currR = currFrame.data[idx];
              const currG = currFrame.data[idx + 1];
              const currB = currFrame.data[idx + 2];
              
              const diff = Math.abs(prevR - currR) + Math.abs(prevG - currG) + Math.abs(prevB - currB);
              
              if (diff > threshold) {
                motionPixels++;
              }
            }
          }
        }
        
        // If enough motion detected, consider it a player
        if (motionPixels > gridSize * gridSize * 0.3) {
          // Create bounding box around motion area
          const player = {
            id: `motion_${x}_${y}`,
            x: x - 20,
            y: y - 30,
            w: gridSize + 40,
            h: gridSize + 60,
            confidence: Math.min(motionPixels / (gridSize * gridSize), 1),
            type: 'motion_detected'
          };
          
          // Merge nearby detections
          const nearby = players.find(p => 
            Math.abs(p.x - player.x) < 100 && Math.abs(p.y - player.y) < 100
          );
          
          if (!nearby) {
            players.push(player);
          }
        }
      }
    }
    
    // Limit to most confident detections
    return players
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8) // Max 8 players
      .map((player, index) => ({
        ...player,
        id: `player_${index}`,
        number: index + 1
      }));
  };

  const boxStyle = (player) => ({
    position: 'absolute',
    left: player.x,
    top: player.y,
    width: player.w,
    height: player.h,
    border: '3px solid rgba(255, 100, 0, 0.8)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 100, 0, 0.1)',
    backdropFilter: 'blur(2px)',
    boxShadow: '0 0 15px rgba(255, 100, 0, 0.5)',
    zIndex: 20,
    transition: 'all 0.2s ease-out',
    cursor: 'pointer'
  });

  const labelStyle = {
    position: 'absolute',
    left: 0,
    top: -25,
    background: 'rgba(255, 100, 0, 0.9)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap'
  };

  return (
    <>
      {/* Hidden canvas for detection */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }} 
      />
      
      {/* Render detected player boxes */}
      {detectedPlayers.map((player) => (
        <div 
          key={player.id} 
          style={boxStyle(player)}
          title={`Motion detected (${(player.confidence * 100).toFixed(0)}% confidence)`}
        >
          <div style={labelStyle}>
            Player #{player.number}
          </div>
        </div>
      ))}
      
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff88',
        padding: '5px 10px',
        borderRadius: 5,
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        AI Detected: {detectedPlayers.length} players
      </div>
    </>
  );
};

export default RealTimePlayerDetection;
