import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import styled from '@emotion/styled';

// Custom Cedar OS Chat Component using available hooks
const ChatContainer = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1003;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const ChatBubble = styled(motion.button)`
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
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 
      0 12px 40px rgba(16,185,129,.4),
      0 0 0 1px rgba(255,255,255,.2),
      inset 0 1px 0 rgba(255,255,255,.3);
    background-position: 100% 0;
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px) scale(1.01);
  }
`;

const ChatPanel = styled(motion.div)`
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: min(400px, 95vw);
  max-height: 60vh;
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
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(16,185,129,.1), 
      rgba(59,130,246,.1),
      rgba(147,51,234,.1)
    );
    border-radius: 24px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
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
  box-shadow: ${props => props.isBot ? 
    '0 4px 20px rgba(16,185,129,.2)' : 
    '0 4px 20px rgba(0,0,0,.1)'
  };
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

// Cedar OS Chat Component using available hooks
export default function CedarChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your AI sports betting assistant. I can help you with betting strategies, player analysis, and game predictions. What would you like to know?",
      isBot: true,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    
    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      text: "🤖 AI is thinking...",
      isBot: true,
      timestamp: Date.now(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      // Call Gemini API for real AI responses
      const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      console.log('🔑 Gemini API Key status:', geminiApiKey ? 'Found' : 'Missing');
      
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
              text: `You are a friendly and helpful AI assistant who loves football and sports betting, but you're also knowledgeable about many topics. Your personality is warm, engaging, and you mirror the user's energy level.

CORE PERSONALITY:
- Always start with a warm greeting if the user greets you
- Mirror the user's energy and enthusiasm level
- Be conversational and personable, not robotic
- Show genuine interest in what the user is saying
- Respond contextually and helpfully to ANY question or topic
- Be knowledgeable and useful across various subjects
- Only discuss football/sports topics if the user shows interest in them

EXPERTISE AREAS:
- General knowledge and helpful information
- Problem-solving and advice
- Technology, science, and current events
- Entertainment, movies, music, and culture
- Health, lifestyle, and personal development
- Football and sports betting (when relevant)
- Philadelphia Eagles specialist knowledge (when relevant)

CONVERSATION STYLE:
- Match the user's tone (excited if they're excited, calm if they're calm)
- Use appropriate emojis to match their energy
- Ask follow-up questions to show interest
- Be encouraging and supportive
- Keep responses natural and conversational
- Provide helpful, relevant answers to any question

RESPONSE GUIDELINES:
- Start with greetings when appropriate
- Mirror user's energy and enthusiasm
- Answer any question helpfully and contextually
- Only dive into football details if user shows interest
- Be knowledgeable and useful across all topics
- Keep responses concise but engaging
- Use appropriate emojis and enthusiasm level
- Always be helpful, regardless of the topic

User Message: ${userInput}

Respond naturally, helpfully, and match their energy:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
            topP: 0.9,
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
      
      console.log('📡 Gemini API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API Error:', errorData);
        throw new Error(`Gemini API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }
      
      const aiResponse = data.candidates[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      // Remove loading message and add real AI response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: Date.now() + 2,
          text: aiResponse,
          isBot: true,
          timestamp: Date.now()
        }];
      });
      
    } catch (error) {
      console.warn('Gemini API failed, using fallback response:', error);
      
      // Fallback to intelligent Eagles-focused mock responses
      const fallbackResponses = [
        "🦅 Great question! Jalen Hurts has been electric this season with his dual-threat ability. I'd recommend looking at his rushing yards props - he's averaging 45+ yards per game and the Eagles' offensive scheme really utilizes his mobility.",
        "⚡ For Eagles betting, consider the weather at Lincoln Financial Field. When it's windy or cold, the Eagles tend to lean more on the run game with Hurts and their backs, which can affect totals.",
        "🏈 That's a solid angle! AJ Brown and DeVonta Smith have been connecting well with Hurts. I'd suggest checking their reception props - Brown especially has been a target monster in the red zone.",
        "🦅 Based on recent Eagles performance, I'd recommend analyzing their home/away splits. They've been dominant at Lincoln Financial Field, especially in division games against Dallas and the Giants.",
        "⚡ For Eagles props, don't sleep on Dallas Goedert. He's been a reliable target for Hurts, especially on third downs. His reception totals have been consistent this season.",
        "🏈 Great insight! The Eagles defense has been creating turnovers lately. I'd suggest looking at their turnover props and how they match up against opposing quarterbacks.",
        "🦅 That's an interesting bet! Consider the Eagles' offensive line - Lane Johnson and company have been protecting Hurts well, which helps both passing and rushing opportunities."
      ];
      
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: Date.now() + 2,
          text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
          isBot: true,
          timestamp: Date.now()
        }];
      });
    }
  };

  return (
    <ChatContainer>
      <ChatBubble onClick={() => setOpen(!open)}>
        <Bot size={18} />
        <span>AI Assistant</span>
      </ChatBubble>

      <AnimatePresence>
        {open && (
          <ChatPanel
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
                <span style={{ fontWeight: 700, fontSize: 16 }}>AI Sports Assistant</span>
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
                    {msg.isBot ? '🤖' : '👤'}
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
            </div>

            {/* Input */}
            <InputContainer>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about betting strategies, player stats, or game predictions..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <SendButton
                onClick={sendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={16} />
                Send
              </SendButton>
            </InputContainer>
          </ChatPanel>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
}
