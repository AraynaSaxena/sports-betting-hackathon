import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  X, 
  Smile, 
  Trophy, 
  TrendingUp,
  Heart,
  ThumbsUp,
  Fire,
  Star
} from 'lucide-react';
import styled from '@emotion/styled';
import { useCedarChat } from '../community/useCedarChat';

// Enhanced community chat with emojis, memes, and polls
const ChatContainer = styled.div`
  position: fixed;
  right: 450px;
  bottom: 20px;
  z-index: 1002;
`;

const ChatBubble = styled(motion.button)`
  position: absolute;
  bottom: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, 
    rgba(16,185,129,.9), 
    rgba(59,130,246,.9), 
    rgba(147,51,234,.9)
  );
  background-size: 200% 200%;
  color: #fff;
  padding: 10px 14px;
  border-radius: 25px;
  cursor: pointer;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 15px 30px rgba(0,0,0,.3),
    0 0 0 1px rgba(255,255,255,.1),
    inset 0 1px 0 rgba(255,255,255,.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 12px;
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
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 20px 40px rgba(0,0,0,.4),
      0 0 0 1px rgba(255,255,255,.2),
      inset 0 1px 0 rgba(255,255,255,.3);
    background-position: 100% 0;
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

const ChatPanel = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 12px;
  width: min(420px, 95vw);
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
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  position: relative;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  opacity: 0.9;
  font-weight: 500;
`;

const MessageContent = styled(motion.div)`
  background: ${props => props.isSystem ? 
    'linear-gradient(135deg, rgba(16,185,129,.15), rgba(16,185,129,.05))' : 
    'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))'
  };
  border: 1px solid ${props => props.isSystem ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.15)'};
  padding: 16px 20px;
  border-radius: 20px;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: ${props => props.isSystem ? 
    '0 8px 32px rgba(16,185,129,.2)' : 
    '0 4px 20px rgba(0,0,0,.1)'
  };
  ${props => props.isSystem && 'border-left: 4px solid #10b981;'}
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.isSystem ? 
      '0 12px 40px rgba(16,185,129,.3)' : 
      '0 8px 30px rgba(0,0,0,.2)'
    };
  }
`;

const ReactionBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  opacity: 0.7;
`;

const ReactionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255,255,255,.2);
    transform: scale(1.05);
  }
`;

const PollContainer = styled(motion.div)`
  background: linear-gradient(135deg, 
    rgba(16,185,129,.15), 
    rgba(59,130,246,.15),
    rgba(147,51,234,.1)
  );
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 20px;
  padding: 20px;
  margin: 16px 0;
  position: relative;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(16,185,129,.2);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(16,185,129,.2), 
      rgba(59,130,246,.2)
    );
    border-radius: 20px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const PollQuestion = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
  color: #10b981;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,.3);
`;

const PollOption = styled(motion.button)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
  border: 1px solid rgba(255,255,255,.2);
  color: #fff;
  padding: 16px 20px;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(255,255,255,.15), rgba(255,255,255,.08));
    transform: translateX(8px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0,0,0,.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &.selected {
    background: linear-gradient(135deg, rgba(16,185,129,.3), rgba(16,185,129,.1));
    border-color: #10b981;
    box-shadow: 0 8px 25px rgba(16,185,129,.3);
    transform: translateX(4px) scale(1.05);
  }
  
  &:active {
    transform: translateX(2px) scale(1.01);
  }
`;

const EmojiPicker = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, 
    rgba(255,255,255,.08), 
    rgba(255,255,255,.03)
  );
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 16px;
  margin: 12px 0;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
`;

const EmojiButton = styled(motion.button)`
  background: linear-gradient(135deg, 
    rgba(255,255,255,.1), 
    rgba(255,255,255,.05)
  );
  border: 1px solid rgba(255,255,255,.2);
  color: #fff;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(16,185,129,.2), 
      rgba(59,130,246,.2)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, 
      rgba(255,255,255,.2), 
      rgba(255,255,255,.1)
    );
    transform: scale(1.3) rotate(5deg);
    box-shadow: 0 8px 25px rgba(0,0,0,.3);
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: scale(1.1) rotate(2deg);
  }
`;

// Sports memes and emojis
const SPORTS_EMOJIS = ['🏈', '⚽', '🏀', '⚾', '🏒', '🎯', '🏆', '🥇', '🔥', '💪', '🎉', '💰', '📈', '📊', '🎮', '🚀', '💎', '⭐', '❤️', '👍', '👏', '🤝', '🎊', '🏅', '🦅', '⚡', '🏃‍♂️', '🎪', '🎭', '🍺', '🌭', '🥤'];

const BETTING_MEMES = [
  "When Jalen Hurts scrambles for a first down and you had the over! 🦅⚡",
  "That feeling when your Eagles parlay hits and you're flying high! 🏈💰",
  "Me checking if Jalen's rushing yards are hitting my bet 📱🏃‍♂️",
  "When the Eagles defense gets a pick-6 and you had the spread 🎯🦅",
  "That one friend who always bets against Philly 😂🦅",
  "When you're up big on Eagles bets but keep riding the wave! 📈🏈",
  "The moment you realize you should've cashed out on that Hurts TD 💸⚡",
  "When the Phillies hit a home run and you had the over! ⚾🏆",
  "That feeling when your baseball parlay includes the Phillies! 🎉⚾",
  "Me watching every Phillies game just to see if my bet hits 📺⚾",
  "When the Phillies bullpen holds and you had the under! 🎯⚾",
  "That friend who always bets against Philadelphia teams 😂🏈⚾",
  "When you're up big on Phillies bets! 📈⚾",
  "The moment you realize you should've bet more on the Phillies! 💸🏆",
  "I'm gonna rip off the light pole if the Eagles win! 🦅⚡",
  "When Jalen Hurts runs for a TD and I'm jumping on my couch! 🏃‍♂️🏈",
  "That feeling when the Eagles cover the spread and I'm screaming! 🎉🦅",
  "Me betting my entire paycheck on Jalen Hurts rushing yards! 💰⚡",
  "When the Eagles win and I'm ready to climb the nearest pole! 🦅🎪",
  "That moment when Hurts throws a bomb and I'm losing my mind! 💣🏈",
  "I'm gonna celebrate so hard if the Eagles win this bet! 🎊🦅",
  "When the Phillies hit a walk-off and I'm running around my house! ⚾🏃‍♂️",
  "That feeling when Philadelphia teams make me rich! 💎🏆",
  "Me betting on every Eagles game because I BELIEVE! 🦅❤️",
  "When Jalen Hurts does his thing and I'm going absolutely wild! ⚡🎭",
  "I'm gonna party like it's 2017 if the Eagles win! 🎉🦅",
  "That moment when the Eagles defense gets a turnover and I'm jumping! 🏈🎪",
  "When the Phillies make the playoffs and I'm betting everything! ⚾💰",
  "Me screaming 'FLY EAGLES FLY' after every winning bet! 🦅🎵",
  "That feeling when Philadelphia sports make me feel alive! ⚡❤️"
];

export default function CommunityChat({ roomId = "sports-community-1" }) {
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const listRef = useRef(null);
  
  // Use real Cedar OS chat hook
  const { messages, presence, send, connected, error } = useCedarChat({ 
    roomId, 
    user: { id: "user_" + Math.random().toString(36).substr(2, 9), name: "SportsFan" }
  });
  
  // Add welcome message if no messages exist
  const [hasWelcomeMessage, setHasWelcomeMessage] = useState(false);
  
  // Simulate real users chatting
  const [simulationActive, setSimulationActive] = useState(true);
  
  // Simulated user names and messages
  const simulatedUsers = [
    "EaglesFan2024", "PhillyBettingKing", "Hurts4MVP", "GreenMachine", "BroadStreetBull", 
    "PhillyPhanatic", "EaglesNest", "JalenHurtsFan", "PhillySportsBet", "EaglesLoyalty"
  ];
  
  const simulatedMessages = [
    "Jalen Hurts is absolutely cooking today! 🦅⚡",
    "Anyone else betting on the Eagles to cover?",
    "I'm gonna rip off the light pole if we win! 🦅",
    "Hurts rushing yards over 45.5 - easy money! 💰",
    "Fly Eagles Fly! 🎵🦅",
    "The Phillies are looking good this season! ⚾",
    "When Jalen scrambles, I'm jumping on my couch! 🏃‍♂️",
    "Eagles defense is looking solid today! 🛡️",
    "I bet my entire paycheck on this game! 💸",
    "Philadelphia sports make me feel alive! ⚡❤️",
    "Hurts to AJ Brown connection is unstoppable! 🎯",
    "I'm ready to climb the nearest pole if we win! 🎪",
    "Eagles parlay hitting today! 📈",
    "Philly fans are the best! 🦅",
    "When the Eagles win, I'm going absolutely wild! 🎭",
    "Jalen Hurts MVP campaign starts now! 🏆",
    "Eagles covering the spread like it's nothing! 📊",
    "I'm screaming 'FLY EAGLES FLY' right now! 🎵",
    "Philly sports betting is the best! 💎",
    "Hurts throwing bombs and I'm losing my mind! 💣"
  ];
  
  useEffect(() => {
    if (messages.length === 0 && !hasWelcomeMessage) {
      setHasWelcomeMessage(true);
      // Send welcome message
      setTimeout(() => {
        send("Welcome to the Philadelphia Sports Community! 🦅⚡ Fly Eagles Fly! Let's talk Jalen Hurts, Phillies, and some friendly betting competition! 🏈⚾");
      }, 1000);
    }
  }, [messages.length, hasWelcomeMessage, send]);
  
  // Simulate real users chatting every 60-90 seconds
  useEffect(() => {
    if (!simulationActive || !open) return;
    
    const sendSimulatedMessage = () => {
      const randomUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
      const randomMessage = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
      
      // Send through the Cedar client to simulate real users
      try {
        send(`${randomUser}: ${randomMessage}`);
      } catch (error) {
        console.log(`Simulated message from ${randomUser}: ${randomMessage}`);
      }
    };
    
    const interval = setInterval(() => {
      sendSimulatedMessage();
    }, Math.random() * 10000 + 10000); // 10-20 seconds
    
    return () => clearInterval(interval);
  }, [simulationActive, open, send]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    send(text.trim());
  };

  const addReaction = (messageId, emoji) => {
    // Note: In real Cedar OS implementation, reactions would be handled server-side
    // For now, we'll just log the reaction attempt
    console.log(`Adding reaction ${emoji} to message ${messageId}`);
    // In a real implementation, you would send a reaction message to Cedar OS
    // send(`Reacted with ${emoji} to message ${messageId}`);
  };

  const createPoll = () => {
    const pollQuestions = [
      "Who will win the next game?",
      "Best betting strategy?",
      "Favorite sports moment?",
      "Biggest upset prediction?",
      "Most reliable team this season?"
    ];
    
    const question = pollQuestions[Math.floor(Math.random() * pollQuestions.length)];
    const options = [
      "Team A", "Team B", "It's a toss-up", "I don't watch sports"
    ];
    
    setActivePoll({
      id: `poll_${Date.now()}`,
      question,
      options: options.map((opt, i) => ({ id: i, text: opt, votes: 0 })),
      totalVotes: 0,
      userVote: null
    });
  };

  const voteOnPoll = (optionId) => {
    if (!activePoll || activePoll.userVote !== null) return;
    
    setActivePoll(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
      totalVotes: prev.totalVotes + 1,
      userVote: optionId
    }));
  };

  return (
    <ChatContainer onClick={(e) => e.stopPropagation()}>
      <ChatBubble 
        onClick={() => setOpen(!open)}
        animate={{ 
          opacity: open ? 0.7 : 1,
          scale: open ? 0.95 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        <MessageCircle size={18} />
        <span>Community</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
          <Users size={14} />
          <span style={{ fontSize: 12, opacity: 0.8 }}>{presence}</span>
        </div>
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
                <Trophy size={20} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Sports Community</span>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: connected ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)",
                  border: `1px solid ${connected ? "#10b981" : "#ef4444"}`
                }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: connected ? "#10b981" : "#ef4444"
                  }} />
                  <span style={{ 
                    fontSize: 11, 
                    color: connected ? "#10b981" : "#ef4444",
                    fontWeight: 500
                  }}>
                    {connected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={createPoll}
                  style={{ 
                    background: "rgba(16,185,129,.2)", 
                    border: "1px solid #10b981", 
                    color: "#10b981", 
                    padding: "6px 12px", 
                    borderRadius: "8px", 
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  📊 Poll
                </button>
                <button 
                  onClick={() => setOpen(false)}
                  style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={listRef} 
              style={{ 
                padding: "16px 20px", 
                maxHeight: "50vh", 
                overflow: "auto",
                background: "linear-gradient(180deg, rgba(0,0,0,.1), transparent)"
              }}
            >
              {messages.map((msg, index) => (
                <MessageItem 
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  <MessageHeader>
                    <motion.span 
                      style={{ fontSize: 20 }}
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1 + 0.3
                      }}
                    >
                      {msg.user?.avatar || "👤"}
                    </motion.span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {msg.user?.name || "User"}
                    </span>
                    <span style={{ opacity: 0.6, fontSize: 12 }}>
                      {new Date(msg.ts || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </MessageHeader>
                  <MessageContent 
                    isSystem={msg.sys || false}
                    whileHover={{ 
                      scale: 1.02,
                      y: -2
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {msg.text}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <ReactionBar>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <ReactionButton 
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {emoji} {count}
                          </ReactionButton>
                        ))}
                      </ReactionBar>
                    )}
                  </MessageContent>
                </MessageItem>
              ))}

              {/* Active Poll */}
              {activePoll && (
                <PollContainer
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <PollQuestion>📊 {activePoll.question}</PollQuestion>
                  {activePoll.options.map((option, index) => (
                    <PollOption
                      key={option.id}
                      className={activePoll.userVote === option.id ? 'selected' : ''}
                      onClick={() => voteOnPoll(option.id)}
                      disabled={activePoll.userVote !== null}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        x: 8
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span style={{ fontWeight: 500 }}>{option.text}</span>
                      <motion.span 
                        style={{ 
                          opacity: 0.8,
                          fontWeight: 600,
                          color: activePoll.userVote === option.id ? '#10b981' : '#fff'
                        }}
                        animate={{
                          scale: activePoll.userVote === option.id ? [1, 1.2, 1] : 1
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {activePoll.totalVotes > 0 ? 
                          `${Math.round((option.votes / activePoll.totalVotes) * 100)}%` : 
                          '0%'
                        }
                      </motion.span>
                    </PollOption>
                  ))}
                  <motion.div 
                    style={{ 
                      fontSize: 13, 
                      opacity: 0.8, 
                      marginTop: 12,
                      textAlign: 'center',
                      fontWeight: 500
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.5 }}
                  >
                    {activePoll.totalVotes} votes • {activePoll.userVote !== null ? '✅ You voted!' : '👆 Click to vote'}
                  </motion.div>
                </PollContainer>
              )}

              {error && (
                <div style={{ 
                  textAlign: "center", 
                  padding: "16px", 
                  background: "rgba(239,68,68,.1)",
                  border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: "12px",
                  margin: "16px 0"
                }}>
                  <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>
                    Connection Error
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {error}
                  </div>
                </div>
              )}

              {messages.length === 0 && !error && (
                <div style={{ textAlign: "center", opacity: 0.7, padding: "20px" }}>
                  <Trophy size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>Join the community discussion! 🏈</div>
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <EmojiPicker>
                {SPORTS_EMOJIS.map((emoji) => (
                  <EmojiButton 
                    key={emoji}
                    onClick={() => {
                      sendMessage(emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </EmojiButton>
                ))}
              </EmojiPicker>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.text.value;
                if (input.trim()) {
                  sendMessage(input);
                  e.target.text.value = '';
                }
              }}
              style={{ 
                display: "flex", 
                gap: 8, 
                padding: "16px 20px", 
                borderTop: "1px solid rgba(255,255,255,.1)",
                background: "rgba(0,0,0,.1)"
              }}
            >
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{ 
                  background: "rgba(255,255,255,.1)", 
                  border: "1px solid rgba(255,255,255,.2)", 
                  color: "#fff", 
                  padding: "10px 12px", 
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                <Smile size={16} />
              </button>
              <input
                name="text"
                placeholder="Share your thoughts, memes, or predictions..."
                style={{ 
                  flex: 1, 
                  background: "rgba(255,255,255,.06)", 
                  color: "#fff", 
                  border: "1px solid rgba(255,255,255,.18)", 
                  padding: "12px 16px", 
                  borderRadius: "12px",
                  outline: "none"
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  background: "linear-gradient(135deg, #10b981, #059669)", 
                  color: "#fff", 
                  border: 0, 
                  padding: "12px 16px", 
                  borderRadius: "12px", 
                  fontWeight: 600, 
                  cursor: "pointer"
                }}
              >
                Send
              </button>
            </form>
          </ChatPanel>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
}
