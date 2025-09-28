// Lightweight client with graceful mock fallback if env not set.

const BASE = process.env.REACT_APP_NESSIE_BASE;
const KEY = process.env.REACT_APP_NESSIE_API_KEY;

const withKey = (url) => {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${KEY}`;
};

// Use real API if available, fallback to mock if CORS issues
const useMock = !BASE || !KEY;

let mock = {
  customerId: "mock_cust_1",
  accountId: "mock_acct_1",
  balance: 1000.00, // start with $1,000
};

async function http(input, init) {
  try {
    const res = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init && init.headers ? init.headers : {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    console.warn('Nessie API request failed, falling back to mock mode:', error.message);
    // Force mock mode on any fetch error (CORS, network, etc.)
    throw new Error('API_UNAVAILABLE');
  }
}

export const Nessie = {
  async createOrGetCustomer(email, firstName = "Hack", lastName = "User") {
    if (useMock) {
      mock.customerId = "mock_cust_" + email;
      return { _id: mock.customerId, first_name: firstName, last_name: lastName };
    }
    
    try {
      // Example: find existing by email (Nessie doesn't truly support email search—store in localStorage for demo)
      const stored = localStorage.getItem(`nessie:cust:${email}`);
      if (stored) return JSON.parse(stored);

      const created = await http(withKey(`${BASE}/customers`), {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          address: { street_number: "1", street_name: "Hackathon Way", city: "Demo", state: "MA", zip: "02139" },
        }),
      });
      localStorage.setItem(`nessie:cust:${email}`, JSON.stringify(created));
      return created;
    } catch (error) {
      if (error.message === 'API_UNAVAILABLE') {
        console.log('Nessie API unavailable, using mock customer');
        mock.customerId = "mock_cust_" + email;
        return { _id: mock.customerId, first_name: firstName, last_name: lastName };
      }
      throw error;
    }
  },

  async createOrGetAccount(customerId) {
    if (useMock) {
      mock.accountId = "acct_" + customerId;
      return { _id: mock.accountId, nickname: "Dollars", balance: mock.balance, type: "savings" };
    }

    try {
      const cacheKey = `nessie:acct:${customerId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      // Create a simple savings account with starter balance 1000 (via deposit)
      const acct = await http(withKey(`${BASE}/customers/${customerId}/accounts`), {
        method: "POST",
        body: JSON.stringify({
          type: "Savings",
          nickname: "Dollars",
          rewards: 0,
          balance: 0,
          account_number: String(Math.floor(Math.random() * 1e12)).padStart(12, "0"),
        }),
      });

      // seed deposit
      await this.deposit(acct._id, 1000, "Welcome bonus");
      const hydrated = await this.getAccount(acct._id);
      localStorage.setItem(cacheKey, JSON.stringify(hydrated));
      return hydrated;
    } catch (error) {
      if (error.message === 'API_UNAVAILABLE') {
        console.log('Nessie API unavailable, using mock account');
        mock.accountId = "acct_" + customerId;
        return { _id: mock.accountId, nickname: "Dollars", balance: mock.balance, type: "savings" };
      }
      throw error;
    }
  },

  async getAccount(accountId) {
    if (useMock) {
      return { _id: mock.accountId, nickname: "Dollars", balance: mock.balance, type: "savings" };
    }
    
    try {
      return await http(withKey(`${BASE}/accounts/${accountId}`));
    } catch (error) {
      if (error.message === 'API_UNAVAILABLE') {
        console.log('Nessie API unavailable, using mock account');
        return { _id: mock.accountId, nickname: "Dollars", balance: mock.balance, type: "savings" };
      }
      throw error;
    }
  },

  async deposit(accountId, amount, description = "Bet win") {
    const amt = Number(amount);
    if (useMock) {
      mock.balance += amt;
      return;
    }
    
    try {
      await http(withKey(`${BASE}/accounts/${accountId}/deposits`), {
        method: "POST",
        body: JSON.stringify({ medium: "balance", amount: amt, description }),
      });
    } catch (error) {
      if (error.message === 'API_UNAVAILABLE') {
        console.log('Nessie API unavailable, using mock deposit');
        mock.balance += amt;
        return;
      }
      throw error;
    }
  },

  async withdraw(accountId, amount, description = "Bet loss") {
    const amt = Number(amount);
    if (useMock) {
      mock.balance = Math.max(0, mock.balance - amt);
      return;
    }
    
    try {
      await http(withKey(`${BASE}/accounts/${accountId}/withdrawals`), {
        method: "POST",
        body: JSON.stringify({ medium: "balance", amount: amt, description }),
      });
    } catch (error) {
      if (error.message === 'API_UNAVAILABLE') {
        console.log('Nessie API unavailable, using mock withdrawal');
        mock.balance = Math.max(0, mock.balance - amt);
        return;
      }
      throw error;
    }
  },
};

export default Nessie;
