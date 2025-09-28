const KEY = "bet:log:v1";
const MAX_ROWS = 500;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function writeAll(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX_ROWS)));
  } catch {}
  notify();
}

export const BetAnalytics = {
  save(entry) {
    const all = readAll();
    all.push({ ...entry, ts: entry.ts || Date.now() });
    writeAll(all);
  },

  all() {
    return readAll();
  },

  clear() {
    localStorage.removeItem(KEY);
    notify();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  stats({ days = 14 } = {}) {
    const all = readAll();
    const now = Date.now();
    const since = now - days * 86400000;

    const recent = all.filter((b) => b.ts >= since);
    const total = all.length;
    const wins = all.filter((b) => b.win).length;
    const losses = total - wins;
    const staked = all.reduce((s, b) => s + (+b.stake || 0), 0);
    const net = all.reduce((s, b) => s + (+b.delta || 0), 0);
    const winRate = total ? wins / total : 0;
    const avgStake = total ? staked / total : 0;
    const biggestWin = all.reduce((m, b) => (b.delta > m ? b.delta : m), 0);
    const biggestLoss = all.reduce((m, b) => (b.delta < m ? b.delta : m), 0);

    // streaks
    let currentStreak = 0, maxStreak = 0;
    for (const b of all) {
      if (b.win) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // daily series for last N days
    const byDay = {};
    for (const b of recent) {
      const d = new Date(b.ts);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDay[k] = (byDay[k] || 0) + (+b.delta || 0);
    }
    const labels = [];
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      labels.push(k);
      series.push(byDay[k] || 0);
    }

    return { total, wins, losses, winRate, staked, net, avgStake, biggestWin, biggestLoss, currentStreak, maxStreak, labels, series, recent };
  },

  exportCSV() {
    const rows = [["ts", "source", "question", "stake", "chosen", "odds", "win", "delta"]];
    for (const b of readAll()) {
      rows.push([
        b.ts,
        b.source || "",
        (b.question || "").replace(/\s+/g, " ").trim(),
        b.stake ?? "",
        b.chosenLabel || b.chosenId || "",
        b.odds ?? "",
        b.win ? 1 : 0,
        b.delta ?? ""
      ]);
    }
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bet-analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  }
};

// Cross-tab sync
window.addEventListener("storage", (e) => {
  if (e.key === KEY) notify();
});