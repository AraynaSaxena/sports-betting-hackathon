// src/hooks/useComputerVision.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useComputerVision = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [cvStats, setCvStats] = useState({
    frames_processed: 0,
    players_detected: 0,
    avg_latency: 0,
    fps: 0,
    model_accuracy: 0,
    detection_confidence: 0
  });
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket('ws://localhost:8000/ws/cv');

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        console.log('✅ CV WebSocket connected');

        // Send initial ping
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'error') {
            setError(data.message);
            return;
          }

          if (data.type === 'connection') {
            console.log('🔗 CV System:', data.message);
            return;
          }

          if (data.detections) {
            setDetections(data.detections);

            if (data.stats) {
              setCvStats(data.stats);
            }

            // Log detection updates (for debugging)
            console.log(`🎯 Detected ${data.detections.length} players`);
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
          setError('Failed to parse detection results');
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('🔌 CV WebSocket disconnected');

        // Don't attempt to reconnect if it was a normal close
        if (event.code !== 1000) {
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection failed - make sure backend is running');
        setConnectionStatus('error');
      };

    } catch (err) {
      setError('Failed to connect to CV service');
      setConnectionStatus('error');
    }
  }, []);

  const startVideoProcessing = useCallback(() => {
    if (!isConnected) {
      console.log('⚠️ WebSocket not connected, cannot start video processing');
      return;
    }

    // Send periodic frame updates to trigger detections
    frameIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          timestamp: Date.now(),
          frame_id: Math.floor(Date.now() / 1000)
        }));
      }
    }, 500); // Send frame every 500ms for real-time feel

    console.log('🎬 Video processing started');
  }, [isConnected]);

  const stopVideoProcessing = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
      console.log('⏹️ Video processing stopped');
    }
  }, []);

  const disconnect = useCallback(() => {
    stopVideoProcessing();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000); // Normal closure
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setDetections([]);
  }, [stopVideoProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    detections,
    cvStats,
    error,
    connectionStatus,
    connectWebSocket,
    startVideoProcessing,
    stopVideoProcessing,
    disconnect
  };
};