import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Hourglass, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import styled from "@emotion/styled";
import { useWallet } from "../context/WalletContext";

// ——— styles that blend into most UIs using your stack ———
const Card = styled(motion.div)`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  width: min(420px, 92vw);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  background: rgba(16, 18, 27, 0.8);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;

const Body = styled.div`
  padding: 14px;
  display: grid;
  gap: 10px;
`;

// Prevent forwarding custom styling props to the DOM
const OptionBtn = styled("button", {
  shouldForwardProp: (prop) => prop !== "selectedFlag" && prop !== "disabledFlag",
})(({ selectedFlag, disabledFlag }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  borderRadius: 12,
  width: "100%",
  border: `1px solid ${selectedFlag ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)"}`,
  background: selectedFlag ? "rgba(255,255,255,0.08)" : "transparent",
  color: "#fff",
  cursor: "pointer",
  transition: "all .18s ease",
  ...(disabledFlag ? { opacity: 0.6, pointerEvents: "none" } : {}),
  ":hover": { transform: "translateY(-1px)", borderColor: "rgba(255,255,255,0.35)" },
}));

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  gap: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.08);
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  font-size: 12px;
`;

const SmallMuted = styled.span`
  opacity: 0.8;
  font-size: 12px;
`;

const CloseBtn = styled.button`
  margin-left: auto;
  background: #fff;
  color: #111;
  border: 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
`;

// ——— component ———
export function BettingPoll({ poll, onClose, onResult }) {
  const { balance, credit, debit } = useWallet();
  const [selected, setSelected] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [phase, setPhase] = useState("answer"); // "answer" | "reveal" | "done"

  // start countdown when poll arrives
  useEffect(() => {
    if (!poll) return;
    const end = Date.now() + poll.timeoutMs;
    setDeadline(end);
    setSelected(null);
    setPhase("answer");
  }, [poll && poll.id]); // guard access in dependency

  // auto-close after reveal
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => {
      setPhase("done");
      onClose();
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  // ticking
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, [deadline]);

  if (!poll) return null;

  const remainingMs = deadline ? Math.max(0, deadline - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const disabled = remainingMs === 0 || phase !== "answer";
  const correct = poll.options.find((o) => o.isCorrect);

  const choose = async (opt) => {
    if (disabled) return;
    setSelected(opt.id);
    
    // Enhanced betting logic using real Nessie API
    const win = !!opt.isCorrect;
    const stakeAmount = poll.stake;
    
    // Calculate winnings based on odds (more realistic)
    const winnings = win ? Math.floor(stakeAmount * (opt.odds - 1)) : 0;
    const delta = win ? winnings : -stakeAmount;
    
    try {
      if (win) {
        await credit(winnings, `Bet Win: ${poll.question} (${opt.label})`);
        console.log(`🎉 Bet won! +$${winnings.toFixed(2)} (stake: $${stakeAmount.toFixed(2)}, odds: ${opt.odds})`);
      } else {
        await debit(stakeAmount, `Bet Loss: ${poll.question} (${opt.label})`);
        console.log(`💸 Bet lost! -$${stakeAmount.toFixed(2)} (stake: $${stakeAmount.toFixed(2)}, odds: ${opt.odds})`);
      }
      
      // Log to analytics for better tracking
      if (typeof onResult === "function") onResult(win, delta);
    } catch (error) {
      console.error('Betting transaction failed:', error);
      // Revert optimistic UI update
      if (win) {
        await debit(winnings, `Transaction failed - reverting win`);
      } else {
        await credit(stakeAmount, `Transaction failed - reverting loss`);
      }
    } finally {
      setPhase("reveal");
    }
  };

  return (
    <AnimatePresence>
      <Card
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
      >
        <Header>
          <Trophy size={18} />
          Bet Pop-Up
          <div
            style={{
              marginLeft: "auto",
              fontWeight: 500,
              opacity: 0.8,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <DollarSign size={14} /> ${balance.toFixed(2)}
          </div>
        </Header>

        <Body>
          <div style={{ fontWeight: 600, lineHeight: 1.25 }}>{poll.question}</div>
          {poll.options.map((opt) => (
            <OptionBtn
              key={opt.id}
              selectedFlag={selected === opt.id}
              disabledFlag={disabled}
              disabled={disabled}
              onClick={() => choose(opt)}
            >
              <span>{opt.label}</span>
              <SmallMuted>x{opt.odds.toFixed(2)}</SmallMuted>
            </OptionBtn>
          ))}
        </Body>

        <Footer>
          {phase === "answer" ? (
            <>
              <Pill>
                <Hourglass size={14} /> {remainingSec}s
              </Pill>
              <Pill>
                <DollarSign size={14} /> Stake: ${poll.stake}
              </Pill>
            </>
          ) : (
            <>
              {selected && correct && selected === correct.id ? (
                <Pill>
                  <CheckCircle2 size={14} /> Correct! +{Math.floor(poll.stake * correct.odds)}
                </Pill>
              ) : (
                <Pill>
                  <XCircle size={14} /> Better luck next time −{poll.stake}
                </Pill>
              )}
              <CloseBtn onClick={onClose}>Close</CloseBtn>
            </>
          )}
        </Footer>
      </Card>
    </AnimatePresence>
  );
}
