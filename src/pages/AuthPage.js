// src/pages/AuthPage.js
import React, { useState } from 'react';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Signup';
import './AuthPage.css';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-overlay">
          <div className="auth-content">
            {/* Header Section */}
            <div className="auth-brand">
              <h1>🏈 SportsBet AI</h1>
              <p>Intelligent Sports Betting with Responsibility First</p>
            </div>

            {/* Auth Forms */}
            {isLoginMode ? (
              <Login onSwitchToSignup={() => setIsLoginMode(false)} />
            ) : (
              <Signup onSwitchToLogin={() => setIsLoginMode(true)} />
            )}

            {/* Features Preview */}
            <div className="features-preview">
              <h3>Built for Responsible Betting</h3>
              <div className="feature-grid">
                <div className="feature-item">
                  <span className="feature-icon">🤖</span>
                  <span>AI-Powered Questions</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🛡️</span>
                  <span>Spending Protection</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Smart Analytics</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⏰</span>
                  <span>Cool-off Controls</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;