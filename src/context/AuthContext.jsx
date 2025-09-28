// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('sportsBetUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Check if user is in cool-off period
      if (userData.coolOffUntil && new Date(userData.coolOffUntil) > new Date()) {
        userData.isCooledOff = true;
      } else {
        userData.isCooledOff = false;
        userData.coolOffUntil = null;
      }
      setUser(userData);
    }
    setLoading(false);
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('sportsBetUser', JSON.stringify(user));
    }
  }, [user]);

  const signup = async (userData) => {
    // Validation for responsible gambling
    if (!userData.ageVerified || userData.age < 18) {
      throw new Error('You must be 18 or older to create an account');
    }

    if (!userData.acceptedTerms) {
      throw new Error('You must accept the responsible gambling terms');
    }

    // Create new user with responsible gambling defaults
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      age: userData.age,
      createdAt: new Date().toISOString(),

      // Financial settings with safe defaults
      financialSettings: {
        dailyLimit: userData.dailyLimit || 50,
        weeklyLimit: userData.weeklyLimit || 200,
        monthlyLimit: userData.monthlyLimit || 500,
        spendingThisWeek: 0,
        spendingThisMonth: 0,
        spendingToday: 0,
        lastSpendingReset: new Date().toISOString()
      },

      // Responsible gambling features
      responsibleGambling: {
        selfExclusionActive: false,
        coolOffUntil: null,
        reminderFrequency: 'weekly', // weekly spending reminders
        lossLimitEnabled: true,
        sessionTimeLimit: 60, // minutes
        acceptedTerms: true,
        helpResourcesViewed: false
      },

      // Betting history
      bettingHistory: [],
      totalSpent: 0,
      totalWon: 0,

      // Account status
      isVerified: true, // Simplified for demo
      isCooledOff: false,
      lastLogin: new Date().toISOString()
    };

    setUser(newUser);
    return newUser;
  };

  const login = async (email, password) => {
    // Simulate login - in real app this would hit an API
    const savedUser = localStorage.getItem('sportsBetUser');
    if (!savedUser) {
      throw new Error('No account found. Please sign up first.');
    }

    const userData = JSON.parse(savedUser);
    if (userData.email !== email) {
      throw new Error('Invalid email or password');
    }

    // Check if user is in cool-off period
    if (userData.coolOffUntil && new Date(userData.coolOffUntil) > new Date()) {
      userData.isCooledOff = true;
    } else {
      userData.isCooledOff = false;
      userData.coolOffUntil = null;
    }

    // Update last login
    userData.lastLogin = new Date().toISOString();

    setUser(userData);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sportsBetUser');
  };

  // Responsible gambling functions
  const updateSpendingLimits = (newLimits) => {
    setUser(prev => ({
      ...prev,
      financialSettings: {
        ...prev.financialSettings,
        ...newLimits
      }
    }));
  };

  const recordBet = (betData) => {
    const now = new Date();
    const today = now.toDateString();

    setUser(prev => {
      const updatedUser = { ...prev };

      // Update spending tracking
      updatedUser.financialSettings.spendingToday += betData.amount;
      updatedUser.financialSettings.spendingThisWeek += betData.amount;
      updatedUser.financialSettings.spendingThisMonth += betData.amount;
      updatedUser.totalSpent += betData.amount;

      // Add to betting history
      updatedUser.bettingHistory.push({
        id: Date.now().toString(),
        ...betData,
        timestamp: now.toISOString(),
        date: today
      });

      return updatedUser;
    });
  };

  const initiateCoolOff = (hours = 24) => {
    const coolOffUntil = new Date();
    coolOffUntil.setHours(coolOffUntil.getHours() + hours);

    setUser(prev => ({
      ...prev,
      isCooledOff: true,
      coolOffUntil: coolOffUntil.toISOString(),
      responsibleGambling: {
        ...prev.responsibleGambling,
        coolOffUntil: coolOffUntil.toISOString()
      }
    }));
  };

  const checkSpendingLimits = (proposedAmount) => {
    if (!user) return { allowed: false, reason: 'Not logged in' };

    const { financialSettings } = user;
    const warnings = [];

    // Check daily limit
    if (financialSettings.spendingToday + proposedAmount > financialSettings.dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily spending limit exceeded',
        suggestion: `Daily limit: $${financialSettings.dailyLimit}, spent today: $${financialSettings.spendingToday}`
      };
    }

    // Check weekly limit
    if (financialSettings.spendingThisWeek + proposedAmount > financialSettings.weeklyLimit) {
      return {
        allowed: false,
        reason: 'Weekly spending limit exceeded',
        suggestion: `Weekly limit: $${financialSettings.weeklyLimit}, spent this week: $${financialSettings.spendingThisWeek}`
      };
    }

    // Check monthly limit
    if (financialSettings.spendingThisMonth + proposedAmount > financialSettings.monthlyLimit) {
      return {
        allowed: false,
        reason: 'Monthly spending limit exceeded',
        suggestion: `Monthly limit: $${financialSettings.monthlyLimit}, spent this month: $${financialSettings.spendingThisMonth}`
      };
    }

    // Warnings for approaching limits
    if (financialSettings.spendingToday + proposedAmount > financialSettings.dailyLimit * 0.8) {
      warnings.push('Approaching daily spending limit');
    }

    if (financialSettings.spendingThisWeek + proposedAmount > financialSettings.weeklyLimit * 0.8) {
      warnings.push('Approaching weekly spending limit');
    }

    return { allowed: true, warnings };
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateSpendingLimits,
    recordBet,
    initiateCoolOff,
    checkSpendingLimits,

    // Computed values for easy access
    isAuthenticated: !!user,
    canBet: user && !user.isCooledOff && !user.responsibleGambling?.selfExclusionActive
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};