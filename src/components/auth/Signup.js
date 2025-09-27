// src/components/auth/Signup.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Signup = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    ageVerified: false,
    acceptedTerms: false,
    dailyLimit: 50,
    weeklyLimit: 200,
    monthlyLimit: 500
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLimitsStep, setShowLimitsStep] = useState(false);

  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleFirstStepSubmit = (e) => {
    e.preventDefault();

    // Validate basic info
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.ageVerified) {
      setError('You must verify that you are 18 or older');
      return;
    }

    if (parseInt(formData.age) < 18) {
      setError('You must be 18 or older to create an account');
      return;
    }

    setShowLimitsStep(true);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acceptedTerms) {
      setError('You must accept the responsible gambling terms to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showLimitsStep) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Set Your Spending Limits</h2>
            <p>Protect yourself with responsible spending limits</p>
          </div>

          <form onSubmit={handleFinalSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="responsible-gambling-info">
              <h4>Why set limits?</h4>
              <ul>
                <li>Prevents spending more than you can afford</li>
                <li>Helps maintain control over your betting</li>
                <li>Can be adjusted later (with a 24-hour cooling period)</li>
                <li>Hard limits - system will prevent bets that exceed them</li>
              </ul>
            </div>

            <div className="limits-grid">
              <div className="form-group">
                <label htmlFor="dailyLimit">Daily Spending Limit</label>
                <div className="input-with-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    id="dailyLimit"
                    name="dailyLimit"
                    value={formData.dailyLimit}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    required
                  />
                </div>
                <small>Maximum you can spend in a single day</small>
              </div>

              <div className="form-group">
                <label htmlFor="weeklyLimit">Weekly Spending Limit</label>
                <div className="input-with-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    id="weeklyLimit"
                    name="weeklyLimit"
                    value={formData.weeklyLimit}
                    onChange={handleChange}
                    min={formData.dailyLimit}
                    max="5000"
                    required
                  />
                </div>
                <small>Maximum you can spend in a week</small>
              </div>

              <div className="form-group">
                <label htmlFor="monthlyLimit">Monthly Spending Limit</label>
                <div className="input-with-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    id="monthlyLimit"
                    name="monthlyLimit"
                    value={formData.monthlyLimit}
                    onChange={handleChange}
                    min={formData.weeklyLimit}
                    max="20000"
                    required
                  />
                </div>
                <small>Maximum you can spend in a month</small>
              </div>
            </div>

            <div className="terms-section">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="acceptedTerms"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="acceptedTerms">
                  I acknowledge that I understand responsible gambling practices and agree to:
                  <ul>
                    <li>Only bet money I can afford to lose</li>
                    <li>Respect the spending limits I've set</li>
                    <li>Seek help if gambling becomes a problem</li>
                    <li>Use cool-off periods if needed</li>
                  </ul>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="auth-button secondary"
                onClick={() => setShowLimitsStep(false)}
              >
                Back
              </button>
              <button
                type="submit"
                className="auth-button primary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="help-resources">
            <p><strong>Need help with gambling problems?</strong></p>
            <p>National Problem Gambling Helpline: 1-800-522-4700</p>
            <p>Or visit: ncpgambling.org</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join SportsBet AI with responsible gambling protections</p>
        </div>

        <form onSubmit={handleFirstStepSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
            />
          </div>

          <div className="age-verification">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="18"
                max="120"
                placeholder="Must be 18 or older"
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="ageVerified"
                name="ageVerified"
                checked={formData.ageVerified}
                onChange={handleChange}
                required
              />
              <label htmlFor="ageVerified">
                I verify that I am 18 years of age or older and legally allowed to participate in online betting in my jurisdiction
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button primary"
          >
            Continue to Spending Limits
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;