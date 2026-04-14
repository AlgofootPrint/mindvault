require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const MindVaultAgent = require('./agent');
const skills = require('./skills');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ── Active agents per connection ───────────────────────────────
const agents = new Map();

function broadcast(ws, event, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
  }
}

// ── WebSocket ──────────────────────────────────────────────────
wss.on('connection', (ws) => {
  const agentId = Date.now().toString();
  const emit = (event, data) => broadcast(ws, event, data);

  const agent = new MindVaultAgent(emit);
  agents.set(agentId, agent);

  broadcast(ws, 'connected', {
    agentId,
    walletAddress: process.env.AGENT_WALLET_ADDRESS,
    network: 'X Layer (Chain ID: 196)',
    message: 'MindVault connected. Agent ready.',
  });

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'start') {
        agent.runLoop(msg.interval || 30000).catch(err =>
          broadcast(ws, 'error', { message: err.message })
        );
      } else if (msg.type === 'stop') {
        agent.stop();
      } else if (msg.type === 'chat') {
        await agent.chat(msg.message);
      } else if (msg.type === 'step') {
        await agent.step();
      }
    } catch (err) {
      broadcast(ws, 'error', { message: err.message });
    }
  });

  ws.on('close', () => {
    const a = agents.get(agentId);
    if (a) { a.stop(); agents.delete(agentId); }
  });
});

// ── REST API ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', wallet: process.env.AGENT_WALLET_ADDRESS, network: 'X Layer' });
});

app.get('/api/wallet/balance', async (req, res) => {
  try {
    const address = req.query.address || process.env.AGENT_WALLET_ADDRESS;
    const chain = req.query.chain || 'xlayer';
    const balance = skills.portfolio.get(address, chain);
    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/wallet/history', async (req, res) => {
  try {
    const chain = req.query.chain || 'xlayer';
    const history = skills.wallet.history(chain);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/market/trending', async (req, res) => {
  try {
    const data = skills.market.trending('xlayer');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/market/signals', async (req, res) => {
  try {
    const chain = req.query.chain || 'xlayer';
    const data = skills.market.signals(chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/defi/list', async (req, res) => {
  try {
    const data = skills.defi.list('xlayer');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/defi/positions', async (req, res) => {
  try {
    const data = skills.defi.positions(process.env.AGENT_WALLET_ADDRESS, 'xlayer');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/portfolio/pnl', async (req, res) => {
  try {
    const address = req.query.address || process.env.AGENT_WALLET_ADDRESS;
    const chain = req.query.chain || 'xlayer';
    const data = skills.portfolio.pnl(address, chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/swap/quote', async (req, res) => {
  try {
    const { from, to, amount, chain } = req.body;
    const data = skills.swap.quote(from, to, amount, chain || 'xlayer');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Token skills ────────────────────────────────────────────────
app.get('/api/token/trending', async (req, res) => {
  try {
    const chain = req.query.chain || 'xlayer';
    const data = skills.market.trending(chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/token/search', async (req, res) => {
  try {
    const { q, chain } = req.query;
    const data = skills.market.price(q, chain || 'xlayer');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Signal skills ───────────────────────────────────────────────
app.get('/api/signals/whales', async (req, res) => {
  try {
    const chain = req.query.chain || 'xlayer';
    const data = skills.market.signals(chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DeFi portfolio ──────────────────────────────────────────────
app.get('/api/defi/portfolio', async (req, res) => {
  try {
    const address = req.query.address || process.env.AGENT_WALLET_ADDRESS;
    const chain = req.query.chain || 'xlayer';
    const data = skills.defi.positions(address, chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/defi/opportunities', async (req, res) => {
  try {
    const chain = req.query.chain || 'xlayer';
    const data = skills.defi.list(chain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Wallet addresses ────────────────────────────────────────────
app.get('/api/wallet/addresses', async (req, res) => {
  try {
    const data = skills.wallet.addresses();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Contract stats ──────────────────────────────────────────────
app.get('/api/contract/stats', async (req, res) => {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC_URL);
    const abi = ['function getStats() view returns (uint256,uint256,uint256,uint256,uint256,uint8,uint256)'];
    const contract = new ethers.Contract(process.env.AGENTIC_WALLET_CONTRACT, abi, provider);
    const stats = await contract.getStats();
    res.json({
      success: true,
      data: {
        totalEarned: ethers.formatEther(stats[0]),
        totalPaid: ethers.formatEther(stats[1]),
        totalReinvested: ethers.formatEther(stats[2]),
        loopCount: stats[3].toString(),
        txCount: stats[4].toString(),
        phase: ['IDLE','EARN','PAY','REINVEST'][Number(stats[5])],
        balance: ethers.formatEther(stats[6]),
        contractAddress: process.env.AGENTIC_WALLET_CONTRACT,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MindVault backend running on port ${PORT}`);
  console.log(`Agent wallet: ${process.env.AGENT_WALLET_ADDRESS}`);
  console.log(`Network: X Layer (Chain ID: 196)`);
});
