const { execSync, execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

// ── Binary path ────────────────────────────────────────────────
// Resolve onchainos binary using the home directory, works on Win/Mac/Linux
const ONCHAINOS = path.join(
  os.homedir(), '.local', 'bin',
  process.platform === 'win32' ? 'onchainos.exe' : 'onchainos'
);

const ENV = {
  OKX_API_KEY:     process.env.OKX_API_KEY,
  OKX_SECRET_KEY:  process.env.OKX_SECRET_KEY,
  OKX_PASSPHRASE:  process.env.OKX_PASSPHRASE,
  EVM_PRIVATE_KEY: process.env.AGENT_WALLET_PRIVATE_KEY,
};

// ── Demo fallback data (used when OKX API is unreachable) ──────
const DEMO = {
  portfolio: {
    data: [{
      tokenSymbol: 'OKB', tokenAddress: '0x3f4b6664338f23d2397c953f2ab4ce8031663f80',
      balance: '0.0607', usdValue: '5.21', price: '85.82',
    }, {
      tokenSymbol: 'USDC', tokenAddress: '0x74b7f16337b8972027f6196a17a631ac6de26d22',
      balance: '2.14', usdValue: '2.14', price: '1.00',
    }],
  },
  trending: {
    data: [
      { tokenSymbol: 'FDOG', tokenAddress: '0xd4e8a8be852f7e2a89ac0e4d1bec8ea2c578c0b1', priceUsd: '0.000421', volume24h: '18420', priceChange24h: '12.4' },
      { tokenSymbol: 'XDOG', tokenAddress: '0x2e9d52e1caef9c6e6e5e7a4e70213f61f8234c2a', priceUsd: '0.000087', volume24h: '2540', priceChange24h: '-3.2' },
      { tokenSymbol: 'OKB',  tokenAddress: '0x3f4b6664338f23d2397c953f2ab4ce8031663f80', priceUsd: '85.82', volume24h: '4820000', priceChange24h: '1.8' },
    ],
  },
  signals: {
    data: [
      { token: { symbol: 'OKB' }, type: 'whale_accumulation', strength: 'strong', direction: 'bullish', volume: '142000', timestamp: new Date().toISOString() },
      { token: { symbol: 'FDOG' }, type: 'smart_money', strength: 'medium', direction: 'bullish', volume: '18420', timestamp: new Date().toISOString() },
    ],
  },
  defiList: {
    data: [
      { investmentId: 'xlayer-atom-stake-001', protocol: 'ATOM Staking', token: 'ATOM', apy: '19.26', tvl: '4200000', chain: 'xlayer' },
      { investmentId: 'xlayer-okb-lp-002',    protocol: 'OKB/USDC LP',  token: 'OKB',  apy: '14.72', tvl: '8100000', chain: 'xlayer' },
      { investmentId: 'xlayer-usdc-earn-003', protocol: 'USDC Earn',    token: 'USDC', apy: '8.41',  tvl: '12500000', chain: 'xlayer' },
    ],
  },
  defiPositions: { data: [] },
  swapQuote: {
    fromToken: 'OKB', toToken: 'USDC',
    fromAmount: '0.01', toAmount: '0.858',
    priceImpact: '0.12', route: 'OKX DEX → Uniswap V3',
    estimatedGas: '0.0002',
  },
  pnl: {
    totalValue: '7.35', pnl24h: '+0.42', pnlPercent24h: '+6.1',
    topHolding: 'OKB', topHoldingValue: '5.21',
  },
  gas: { gasPrice: '0.0001', estimatedGwei: '0.1', chain: 'xlayer' },
};

function isError(result) {
  if (!result) return true;
  if (typeof result === 'object' && result.error) return true;
  if (typeof result === 'string' && result.toLowerCase().includes('error')) return true;
  return false;
}

function run(cmd) {
  try {
    const result = execSync(cmd, {
      env: { ...process.env, ...ENV },
      encoding: 'utf8',
      timeout: 8000,
    });
    try { return JSON.parse(result); } catch { return result.trim(); }
  } catch (err) {
    const msg = err.stdout || err.stderr || err.message;
    try { return JSON.parse(msg); } catch { return { error: msg.trim() }; }
  }
}

// Use execFileSync with args array to avoid shell escaping issues (critical for JSON args on Windows)
function runArgs(args) {
  try {
    const result = execFileSync(ONCHAINOS, args, {
      env: { ...process.env, ...ENV },
      encoding: 'utf8',
      timeout: 15000,
    });
    try { return JSON.parse(result); } catch { return result.trim(); }
  } catch (err) {
    const msg = err.stdout || err.stderr || err.message;
    try { return JSON.parse(msg); } catch { return { error: msg.trim() }; }
  }
}

// ── Wallet Skills ──────────────────────────────────────────────
const wallet = {
  status:    () => run(`"${ONCHAINOS}" wallet status`),
  login:     () => run(`"${ONCHAINOS}" wallet login`),
  balance:   (chain = 'xlayer') => run(`"${ONCHAINOS}" wallet balance --chain ${chain}`),
  addresses: () => run(`"${ONCHAINOS}" wallet addresses`),
  history:   (chain = 'xlayer') => run(`"${ONCHAINOS}" wallet history --chain ${chain}`),
  send:      (to, amount, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" wallet send --recipient ${to} --readable-amount ${amount} --chain ${chain} --force`),
};

// ── DEX Market Skills ──────────────────────────────────────────
const market = {
  // token address lookup (by contract address)
  price:    (tokenAddress, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" market price --address ${tokenAddress} --chain ${chain}`),
  // hot / trending tokens
  trending: (chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" token hot-tokens --chain ${chain}`);
    return isError(r) ? DEMO.trending : r;
  },
  // smart-money / whale signals
  signals: (chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" signal list --chain ${chain}`);
    return isError(r) ? DEMO.signals : r;
  },
};

// ── DEX Swap Skills ────────────────────────────────────────────
const swap = {
  quote: (from, to, amount, chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" swap quote --from ${from} --to ${to} --readable-amount ${amount} --chain ${chain}`);
    return isError(r) ? DEMO.swapQuote : r;
  },
  execute: (from, to, amount, walletAddr, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" swap execute --from ${from} --to ${to} --readable-amount ${amount} --chain ${chain} --wallet ${walletAddr} --gas-level average`),
};

// ── DeFi Invest Skills ─────────────────────────────────────────
const defi = {
  list: (chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" defi list --chain ${chain}`);
    return isError(r) ? DEMO.defiList : r;
  },
  search:  (token, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" defi search --token ${token} --chain ${chain}`),
  positions: (address, chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" defi positions --address ${address} --chains ${chain}`);
    return isError(r) ? DEMO.defiPositions : r;
  },
  invest:  (investmentId, address, token, amount, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" defi invest --investment-id ${investmentId} --address ${address} --token ${token} --amount ${amount} --chain ${chain}`),
  withdraw: (investmentId, address, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" defi withdraw --investment-id ${investmentId} --address ${address} --chain ${chain} --ratio 1`),
  collectRewards: (address, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" defi collect --address ${address} --chain ${chain} --reward-type REWARD_PLATFORM`),
};

// ── x402 Payment Skills ────────────────────────────────────────
const x402 = {
  // Sign an x402 payment locally using EIP-3009 (reads EVM_PRIVATE_KEY from env)
  // Uses execFileSync to avoid Windows shell escaping issues with JSON args
  pay: (accepts) => runArgs(['payment', 'eip3009-sign', '--accepts', accepts]),

  // Build a standard accepts array for MindVault AI inference on X Layer
  buildAccepts: (amountUsdc = '100000') => JSON.stringify([{
    scheme:            'exact',
    network:           'eip155:196',
    maxAmountRequired: amountUsdc,   // USDC 6-decimal units — 100000 = $0.10
    resource:          'https://inference.mindvault.ai/v1/completions',
    description:       'MindVault AI inference — economy loop cycle payment',
    mimeType:          'application/json',
    payTo:             process.env.AGENTIC_WALLET_CONTRACT,
    maxTimeoutSeconds: 300,
    asset:             '0x74b7f16337b8972027f6196a17a631ac6de26d22', // USDC on X Layer
    extra: { name: 'USD Coin', version: '2', decimals: 6 },
  }]),
};

// ── Onchain Gateway Skills ─────────────────────────────────────
const gateway = {
  estimateGas: (chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" gateway gas --chain ${chain}`);
    return isError(r) ? DEMO.gas : r;
  },
  simulate:    (tx, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" gateway simulate --tx '${JSON.stringify(tx)}' --chain ${chain}`),
  broadcast:   (tx, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" gateway broadcast --tx '${JSON.stringify(tx)}' --chain ${chain}`),
  trackOrder:  (orderId, address, chain = 'xlayer') =>
    run(`"${ONCHAINOS}" gateway orders --address ${address} --chain ${chain} --order-id ${orderId}`),
};

// ── Security Skills ────────────────────────────────────────────
const security = {
  tokenScan: (tokenAddr, chainId = '196') =>
    run(`"${ONCHAINOS}" security token-scan --tokens "${chainId}:${tokenAddr}"`),
  txScan:    (tx) =>
    run(`"${ONCHAINOS}" security tx-scan --tx '${JSON.stringify(tx)}'`),
};

// ── Portfolio Skills ───────────────────────────────────────────
const portfolio = {
  // public wallet token balances
  get: (address, chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" portfolio all-balances --address ${address} --chains ${chain}`);
    return isError(r) ? DEMO.portfolio : r;
  },
  // DeFi positions (same as defi.positions)
  defi: (address, chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" defi positions --address ${address} --chains ${chain}`);
    return isError(r) ? DEMO.defiPositions : r;
  },
  // wallet PnL overview
  pnl: (address, chain = 'xlayer') => {
    const r = run(`"${ONCHAINOS}" market portfolio-overview --address ${address} --chain ${chain}`);
    return isError(r) ? DEMO.pnl : r;
  },
};

module.exports = { wallet, market, swap, defi, x402, gateway, security, portfolio };
