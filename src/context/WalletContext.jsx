import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Nessie } from "../services/nessieclient"; // keep your existing file/name

const WalletCtx = createContext(null);

export function WalletProvider({ email, firstName, lastName, children }) {
  const [customer, setCustomer] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const cust = await Nessie.createOrGetCustomer(email, firstName, lastName);
      setCustomer(cust);
      const acct = await Nessie.createOrGetAccount(cust._id);
      setAccount(acct);
      setBalance(acct.balance);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap(); // on login/email change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const sync = async () => {
    if (!account) return;
    const fresh = await Nessie.getAccount(account._id);
    setAccount(fresh);
    setBalance(fresh.balance);
  };

  const credit = async (amount, note) => {
    if (!account) return;
    // optimistic UI
    setBalance((b) => b + amount);
    try {
      await Nessie.deposit(account._id, amount, note);
    } catch (e) {
      setBalance((b) => b - amount);
      throw new Error("Deposit failed");
    }
  };

  const debit = async (amount, note) => {
    if (!account) return;
    setBalance((b) => Math.max(0, b - amount));
    try {
      await Nessie.withdraw(account._id, amount, note);
    } catch (e) {
      setBalance((b) => b + amount);
      throw new Error("Withdrawal failed");
    }
  };

  const value = useMemo(
    () => ({ customer, account, balance, loading, sync, credit, debit }),
    [customer, account, balance, loading]
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
