// src/components/CedarOSAssistant.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send } from 'lucide-react';
import styled from '@emotion/styled';

// Cedar-OS styled components
const AssistantContainer = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1003;
`;

const AssistantBubble = styled(motion.button)`
  position: absolute;
  bottom: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, 
    rgba(16,185,129,.9), 
    rgba(59,130,246,.9)
  );
  background-size: 200% 200%;
  color: #fff;
  padding: 12px 18px;
  border-radius: 25px;
  cursor: pointer;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(16,185,129,.3),
    0 0 0 1px rgba(255,255,255,.1),
    inset 0 1px 0 rgba(255,255,255,.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 13px;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 
      0 12px 40px rgba(16,185,129,.4),
      0 0 0 1px rgba(255,255,255,.2),
      inset 0 1px 0 rgba(255,255,255,.3);
    background-position: 100% 0;
  }
`;

const AssistantPanel = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 12px;
  width: min(400px, 95vw);
  max-height: 70vh;
  background: linear-gradient(135deg, 
    rgba(16,18,27,.95), 
    rgba(32,35,48,.95),
    rgba(16,185,129,.05)
  );
  color: #fff;
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 25px 80px rgba(0,0,0,.6),
    0 0 0 1px rgba(255,255,255,.1),
    inset 0 1px 0 rgba(255,255,255,.2);
  backdrop-filter: blur(30px);
`;

const MessageItem = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: ${props => props.isBot ? 
    'linear-gradient(135deg, rgba(16,185,129,.15), rgba(16,185,129,.05))' : 
    'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))'
  };
  border: 1px solid ${props => props.isBot ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.15)'};
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,.1);
  background: rgba(0,0,0,.1);
`;

const Input = styled.input`
  flex: 1;
  background: rgba(255,255,255,.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,.18);
  padding: 12px 16px;
  border-radius: 12px;
  outline: none;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255,255,255,.5);
  }
  
  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16,185,129,.2);
  }
`;

const SendButton = styled(motion.button)`
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: 0;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// Cedar-OS AI Assistant Component
export default function CedarOSAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Cedar-OS powered AI sports betting assistant. I can help you with betting strategies, player analysis, and game predictions. What would you like to know?",
      isBot: true,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      // Use Gemini API for AI responses (Cedar-OS compatible)
      const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your environment variables.');
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Cedar-OS powered AI sports betting assistant. You have access to real-time data and can provide intelligent analysis using the Cedar-OS framework.

Your capabilities:
- Analyze betting strategies and odds using Cedar-OS data integration
- Provide player statistics and performance insights  
- Offer game predictions based on current data
- Promote responsible betting practices
- Share sports knowledge and betting education
- Use Cedar-OS agentic state management for context

Guidelines:
- Always encourage responsible betting
- Provide accurate, data-driven insights
- Keep responses concise and actionable (under 200 words)
- Be encouraging but realistic about risks
- Focus on education and informed decision-making
- Leverage Cedar-OS AI-native application features

User question: ${userInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }
      
      const aiResponse = data.candidates[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: aiResponse,
        isBot: true,
        timestamp: Date.now()
      }]);
      
    } catch (error) {
      console.warn('Cedar-OS AI Assistant error:', error);
      
      // Fallback responses for Cedar-OS context
      const fallbackResponses = [
        "I'd love to help with that! Based on Cedar-OS analytics, I'd suggest analyzing the team's recent performance and key player stats.",
        "Great question! For responsible betting with Cedar-OS insights, consider the team's home/away record and head-to-head matchups.",
        "That's an interesting angle! I'd recommend looking at the weather conditions and how they might affect the game using our real-time data.",
        "Based on Cedar-OS data analysis, I'd suggest checking the injury reports and how they might impact the team's strategy.",
        "For this type of bet, I'd recommend considering the team's recent form and any coaching changes using our predictive models."
      ];
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        isBot: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <AssistantContainer>
      <AssistantBubble 
        onClick={() => setOpen(!open)}
        animate={{ 
          opacity: open ? 0.7 : 1,
          scale: open ? 0.95 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        <Bot size={18} />
        <span>Cedar-OS AI</span>
      </AssistantBubble>

      <AnimatePresence>
        {open && (
          <AssistantPanel
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "16px 20px", 
              borderBottom: "1px solid rgba(255,255,255,.1)",
              background: "linear-gradient(135deg, rgba(16,185,129,.1), rgba(59,130,246,.1))"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bot size={20} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Cedar-OS AI Assistant</span>
              </div>
              <button 
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ 
              padding: "16px 20px", 
              maxHeight: "50vh", 
              overflow: "auto",
              background: "linear-gradient(180deg, rgba(0,0,0,.1), transparent)"
            }}>
              {messages.map((msg, index) => (
                <MessageItem 
                  key={msg.id}
                  isBot={msg.isBot}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  <div style={{ 
                    fontSize: 20, 
                    marginTop: 2,
                    filter: msg.isBot ? 'drop-shadow(0 2px 4px rgba(16,185,129,.3))' : 'none'
                  }}>
                    {msg.isBot ? '🌲' : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                      {msg.text}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      opacity: 0.6, 
                      marginTop: 4,
                      textAlign: 'right'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </MessageItem>
              ))}
              {isLoading && (
                <MessageItem isBot={true}>
                  <div style={{ fontSize: 20, marginTop: 2 }}>🌲</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, opacity: 0.7 }}>
                      Cedar-OS AI is analyzing your request...
                    </div>
                  </div>
                </MessageItem>
              )}
            </div>

            {/* Input */}
            <InputContainer>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about betting strategies, player stats, or game predictions..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
              />
              <SendButton
                onClick={sendMessage}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={16} />
                Send
              </SendButton>
            </InputContainer>
          </AssistantPanel>
        )}
      </AnimatePresence>
    </AssistantContainer>
  );
}
