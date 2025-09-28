import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import styled from '@emotion/styled';

const StatusContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1004;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,.3);
  font-size: 14px;
  font-weight: 500;
`;

const OnlineStatus = styled(StatusContainer)`
  background: linear-gradient(135deg, rgba(16,185,129,.9), rgba(16,185,129,.7));
  color: #fff;
  border: 1px solid rgba(16,185,129,.3);
`;

const OfflineStatus = styled(StatusContainer)`
  background: linear-gradient(135deg, rgba(251,146,60,.9), rgba(251,146,60,.7));
  color: #fff;
  border: 1px solid rgba(251,146,60,.3);
`;

export default function ApiStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check if we're in mock mode (API unavailable)
    const checkApiStatus = () => {
      const mockMode = !process.env.REACT_APP_NESSIE_BASE || !process.env.REACT_APP_NESSIE_API_KEY;
      setIsOnline(!mockMode);
      setShowStatus(true);
      
      // Hide status after 5 seconds
      setTimeout(() => setShowStatus(false), 5000);
    };

    checkApiStatus();
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isOnline ? (
            <OnlineStatus>
              <CheckCircle size={16} />
              <span>Real API Connected</span>
            </OnlineStatus>
          ) : (
            <OfflineStatus>
              <AlertCircle size={16} />
              <span>Demo Mode (Mock API)</span>
            </OfflineStatus>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
