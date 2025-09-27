import React, { useEffect, useState, useRef } from 'react';

// TensorFlow.js-based player detection
// This will load a pre-trained COCO-SSD model to detect persons

const TensorFlowPlayerDetection = ({ videoRef }) => {
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [tfModel, setTfModel] = useState(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    // Load TensorFlow.js and COCO-SSD model
    const loadModel = async () => {
      try {
        // Dynamically import TensorFlow.js
        const tf = await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        
        console.log('Loading TensorFlow.js model...');
        const model = await cocoSsd.load();
        setTfModel(model);
        setModelLoaded(true);
        console.log('✅ TensorFlow.js model loaded successfully');
      } catch (error) {
        console.log('❌ Failed to load TensorFlow.js model:', error);
        console.log('Using fallback motion detection instead');
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (!videoRef?.current || !modelLoaded || !tfModel) return;

    const video = videoRef.current;
    
    const detectPlayers = async () => {
      if (video.paused || video.ended || !tfModel) return;
      
      try {
        // Run detection on current video frame
        const predictions = await tfModel.detect(video);
        
        // Filter for person detections only
        const players = predictions
          .filter(prediction => prediction.class === 'person')
          .filter(prediction => prediction.score > 0.5) // Confidence threshold
          .map((prediction, index) => ({
            id: `tf_player_${index}`,
            x: prediction.bbox[0],
            y: prediction.bbox[1],
            w: prediction.bbox[2],
            h: prediction.bbox[3],
            confidence: prediction.score,
            type: 'tensorflow_detected',
            number: index + 1
          }));
        
        setDetectedPlayers(players);
      } catch (error) {
        console.log('Detection frame skipped:', error.message);
      }
    };

    // Start detection when video plays
    const startDetection = () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      detectionIntervalRef.current = setInterval(detectPlayers, 200); // 5 FPS detection
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
    };
  }, [videoRef, modelLoaded, tfModel]);

  const boxStyle = (player) => ({
    position: 'absolute',
    left: player.x,
    top: player.y,
    width: player.w,
    height: player.h,
    border: '3px solid rgba(0, 255, 100, 0.8)',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 100, 0.1)',
    backdropFilter: 'blur(2px)',
    boxShadow: '0 0 15px rgba(0, 255, 100, 0.5)',
    zIndex: 20,
    transition: 'all 0.1s ease-out',
    cursor: 'pointer'
  });

  const labelStyle = {
    position: 'absolute',
    left: 0,
    top: -25,
    background: 'rgba(0, 255, 100, 0.9)',
    color: '#000',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap'
  };

  if (!modelLoaded) {
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#ffaa00',
        padding: '5px 10px',
        borderRadius: 5,
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        🤖 Loading AI Model...
      </div>
    );
  }

  return (
    <>
      {/* Render detected player boxes */}
      {detectedPlayers.map((player) => (
        <div 
          key={player.id} 
          style={boxStyle(player)}
          title={`AI Detected Player (${(player.confidence * 100).toFixed(0)}% confidence)`}
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
        🤖 TensorFlow.js: {detectedPlayers.length} players
      </div>
    </>
  );
};

export default TensorFlowPlayerDetection;
