import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Users, Star } from 'lucide-react';
import styled from '@emotion/styled';

const LeaderboardContainer = styled(motion.div)`
  position: fixed;
  left: 20px;
  bottom: 80px;
  z-index: 1001;
  width: min(380px, 90vw);
  max-height: 60vh;
  background: linear-gradient(135deg, 
    rgba(16,18,27,.98), 
    rgba(32,35,48,.98),
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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, 
    rgba(16,185,129,.15), 
    rgba(59,130,246,.15),
    rgba(147,51,234,.1)
  );
  border-bottom: 1px solid rgba(255,255,255,.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(16,185,129,.5), 
      rgba(59,130,246,.5), 
      transparent
    );
  }
`;

const PlayerItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &.rank-1 { 
    background: linear-gradient(135deg, 
      rgba(255,215,0,.15), 
      rgba(255,193,7,.1),
      rgba(255,215,0,.05)
    );
    box-shadow: 0 4px 20px rgba(255,215,0,.2);
  }
  &.rank-2 { 
    background: linear-gradient(135deg, 
      rgba(192,192,192,.15), 
      rgba(169,169,169,.1),
      rgba(192,192,192,.05)
    );
    box-shadow: 0 4px 20px rgba(192,192,192,.2);
  }
  &.rank-3 { 
    background: linear-gradient(135deg, 
      rgba(205,127,50,.15), 
      rgba(184,115,51,.1),
      rgba(205,127,50,.05)
    );
    box-shadow: 0 4px 20px rgba(205,127,50,.2);
  }
  
  &:hover {
    transform: translateX(8px);
    background: linear-gradient(135deg, 
      rgba(255,255,255,.08), 
      rgba(255,255,255,.03)
    );
    box-shadow: 0 8px 25px rgba(0,0,0,.2);
  }
`;

const RankIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    if (props.rank === 1) return 'linear-gradient(135deg, #FFD700, #FFA500, #FF8C00)';
    if (props.rank === 2) return 'linear-gradient(135deg, #C0C0C0, #A9A9A9, #808080)';
    if (props.rank === 3) return 'linear-gradient(135deg, #CD7F32, #B87333, #A0522D)';
    return 'linear-gradient(135deg, rgba(255,255,255,.15), rgba(255,255,255,.05))';
  }};
  color: ${props => props.rank <= 3 ? '#000' : '#fff'};
  font-weight: 800;
  font-size: 16px;
  box-shadow: ${props => {
    if (props.rank === 1) return '0 8px 25px rgba(255,215,0,.4), inset 0 1px 0 rgba(255,255,255,.3)';
    if (props.rank === 2) return '0 8px 25px rgba(192,192,192,.4), inset 0 1px 0 rgba(255,255,255,.3)';
    if (props.rank === 3) return '0 8px 25px rgba(205,127,50,.4), inset 0 1px 0 rgba(255,255,255,.3)';
    return '0 4px 15px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.1)';
  }};
  border: ${props => props.rank <= 3 ? '2px solid rgba(255,255,255,.3)' : '1px solid rgba(255,255,255,.2)'};
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
      rgba(255,255,255,.2), 
      transparent
    );
    border-radius: 50%;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PlayerName = styled.div`
  font-weight: 600;
  font-size: 14px;
`;

const PlayerStats = styled.div`
  font-size: 12px;
  opacity: 0.7;
  display: flex;
  gap: 12px;
`;

const Score = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #10b981;
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(16,185,129,.2);
  color: #10b981;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
`;

// Mock leaderboard data with realistic sports betting stats
const generateMockLeaderboard = () => {
  const players = [
    { name: "BetMaster", avatar: "🎯", wins: 23, totalBets: 31, winRate: 74.2, streak: 5 },
    { name: "SportsAnalyst", avatar: "📊", wins: 19, totalBets: 28, winRate: 67.9, streak: 3 },
    { name: "LuckyCharm", avatar: "🍀", wins: 17, totalBets: 25, winRate: 68.0, streak: 2 },
    { name: "DataDriven", avatar: "📈", wins: 15, totalBets: 22, winRate: 68.2, streak: 1 },
    { name: "RiskTaker", avatar: "🎲", wins: 14, totalBets: 20, winRate: 70.0, streak: 4 },
    { name: "SteadyEddie", avatar: "⚖️", wins: 13, totalBets: 18, winRate: 72.2, streak: 1 },
    { name: "HotStreak", avatar: "🔥", wins: 12, totalBets: 16, winRate: 75.0, streak: 6 },
    { name: "WiseOwl", avatar: "🦉", wins: 11, totalBets: 15, winRate: 73.3, streak: 2 }
  ];

  return players.map((player, index) => ({
    ...player,
    rank: index + 1,
    score: Math.round(player.wins * 10 + player.winRate * 2 + player.streak * 5),
    id: `player_${index + 1}`
  }));
};

export default function Leaderboard() {
  const [open, setOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState(generateMockLeaderboard());
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, day

  // Simulate real-time updates
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const updated = [...prev];
        // Randomly update some scores to simulate live betting
        const randomIndex = Math.floor(Math.random() * updated.length);
        updated[randomIndex] = {
          ...updated[randomIndex],
          score: updated[randomIndex].score + Math.floor(Math.random() * 10),
          wins: updated[randomIndex].wins + (Math.random() > 0.7 ? 1 : 0),
          streak: updated[randomIndex].streak + (Math.random() > 0.8 ? 1 : 0)
        };
        
        // Re-sort by score
        return updated.sort((a, b) => b.score - a.score).map((player, index) => ({
          ...player,
          rank: index + 1
        }));
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [open]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={16} />;
    if (rank === 2) return <Medal size={16} />;
    if (rank === 3) return <Award size={16} />;
    return <span style={{ fontSize: 12, fontWeight: 700 }}>{rank}</span>;
  };

  const getBadge = (player) => {
    if (player.streak >= 5) return <Badge>🔥 {player.streak} streak</Badge>;
    if (player.winRate >= 75) return <Badge>⭐ {player.winRate}% win rate</Badge>;
    if (player.wins >= 20) return <Badge>🏆 {player.wins} wins</Badge>;
    return null;
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(135deg, rgba(16,185,129,.9), rgba(59,130,246,.9), rgba(147,51,234,.9))',
          backgroundSize: '200% 200%',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: '50px',
          border: '2px solid transparent',
          cursor: 'pointer',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.1), inset 0 1px 0 rgba(255,255,255,.2)',
          fontWeight: '600',
          fontSize: '14px',
          position: 'relative',
          overflow: 'hidden'
        }}
        whileHover={{ 
          scale: 1.05,
          backgroundPosition: '100% 0'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Trophy size={18} />
        <span>Leaderboard</span>
        <Users size={14} />
      </motion.button>

      {/* Leaderboard Panel */}
      <AnimatePresence>
        {open && (
          <LeaderboardContainer
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={20} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Community Leaderboard</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,.1)',
                    border: '1px solid rgba(255,255,255,.2)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </Header>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {leaderboard.map((player, index) => (
                <PlayerItem
                  key={player.id}
                  className={`rank-${player.rank}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RankIcon rank={player.rank}>
                    {getRankIcon(player.rank)}
                  </RankIcon>
                  
                  <div style={{ fontSize: 20, marginRight: 4 }}>{player.avatar}</div>
                  
                  <PlayerInfo>
                    <PlayerName>{player.name}</PlayerName>
                    <PlayerStats>
                      <span>{player.wins}W-{player.totalBets - player.wins}L</span>
                      <span>{player.winRate}%</span>
                      {getBadge(player)}
                    </PlayerStats>
                  </PlayerInfo>
                  
                  <Score>{player.score}</Score>
                </PlayerItem>
              ))}
            </div>

            <div style={{
              padding: '16px 20px',
              background: 'rgba(0,0,0,.2)',
              borderTop: '1px solid rgba(255,255,255,.1)',
              textAlign: 'center',
              fontSize: '12px',
              opacity: 0.7
            }}>
              <TrendingUp size={14} style={{ marginRight: 4 }} />
              Live updates every 5 seconds
            </div>
          </LeaderboardContainer>
        )}
      </AnimatePresence>
    </>
  );
}
