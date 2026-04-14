# MindVault — Autonomous DeFi Agent on X Layer

> An AI agent with a visible mind. Earns, pays, and reinvests autonomously onchain — powered by OKX Onchain OS skills and a deterministic reasoning engine.

[![X Layer](https://img.shields.io/badge/Network-X%20Layer-blue)](https://www.okx.com/xlayer)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-196-purple)](https://rpc.xlayer.tech)
[![Onchain OS](https://img.shields.io/badge/Skills-Onchain%20OS%20v2.2.9-orange)](https://web3.okx.com/onchainos)

---

## Project Introduction

MindVault is a fully autonomous DeFi agent that thinks, decides, and acts onchain — in real time, with a visible reasoning process. The agent runs a continuous **EARN → PAY → REINVEST economy loop** on X Layer, narrating every decision using live market data from OKX Onchain OS.

Users interact through a live dashboard where they can:
- Watch the agent **reason out loud** in real time using live market data
- See every onchain decision and transaction
- Send natural language commands to the agent
- Monitor the economy loop: EARN → x402 PAY → REINVEST

MindVault demonstrates the full potential of agentic DeFi: not just automation, but data-driven decision-making with an onchain identity, economic self-sustainability via x402, and transparent reasoning.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MindVault Dashboard                      │
│              (Next.js · Real-time WebSocket UI)              │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Agent Brain  │  │  Thought Log    │  │  Chat / Ctrl  │  │
│  │ (Live Phase) │  │  (Live Stream)  │  │  (NL Input)   │  │
│  └──────────────┘  └─────────────────┘  └───────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                     Node.js Backend                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         MindVault Reasoning Engine                   │    │
│  │   Fetch live data → Analyze → Decide → Narrate      │    │
│  │   ANALYZE → EARN → EARN → PAY (x402) → REINVEST     │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                          │                                    │
│  ┌───────────┬───────────┼───────────┬──────────────────┐   │
│  │  Wallet   │   Swap    │   DeFi    │   x402 Payment   │   │
│  │  Skills   │  Skills   │  Skills   │  (EIP-3009 sign) │   │
│  └───────────┴───────────┴───────────┴──────────────────┘   │
│              OKX Onchain OS CLI v2.2.9                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ RPC / Onchain TX
┌──────────────────────────▼──────────────────────────────────┐
│                    X Layer (Chain ID: 196)                    │
│  ┌────────────────────┐    ┌──────────────────────────────┐  │
│  │  AgenticWallet.sol │    │   OKX DEX Aggregator         │  │
│  │  (Deployed)        │    │   (500+ liquidity sources,   │  │
│  │  Economy Loop Txns │    │   incl. Uniswap V3 pools)    │  │
│  └────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployed Contracts

| Contract | Address | Network |
|----------|---------|---------|
| AgenticWallet | [`0xDa66C4feec705cfB8c40Ab5B630B797A2dec30ec`](https://www.okx.com/explorer/xlayer/address/0xDa66C4feec705cfB8c40Ab5B630B797A2dec30ec) | X Layer Mainnet |
| Agent Wallet (EOA) | [`0xC84d0368B722425b006F91A9CB98B75Cd12A055A`](https://www.okx.com/explorer/xlayer/address/0xC84d0368B722425b006F91A9CB98B75Cd12A055A) | X Layer Mainnet |

---

## OKX Onchain OS Skills Used

MindVault integrates **9 Onchain OS skills** via the `onchainos` CLI (v2.2.9):

| Skill | Command Used | Phase |
|-------|-------------|-------|
| `okx-wallet-portfolio` | `portfolio all-balances` | ANALYZE — wallet balance check |
| `okx-dex-token` | `token hot-tokens` | EARN — trending token scan |
| `okx-dex-signal` | `signal list` | ANALYZE — smart money signals |
| `okx-defi-invest` | `defi list`, `defi positions` | EARN — yield opportunity discovery |
| `okx-dex-swap` | `swap quote`, `swap execute` | REINVEST — DEX aggregation (500+ sources) |
| `okx-x402-payment` | `payment eip3009-sign` | PAY — EIP-3009 local signing for x402 |
| `okx-security` | `security token-scan` | ANALYZE — pre-trade risk scan |
| `okx-dex-market` | `market portfolio-overview` | REINVEST — PnL analysis |
| `okx-onchain-gateway` | `gateway gas` | REINVEST — gas estimation |

### Economy Loop Skill Flow

```
ANALYZE:
  okx-wallet-portfolio  → check live OKB balance on X Layer
  okx-dex-signal        → scan smart money / whale signals

EARN:
  okx-dex-token         → scan hot tokens by volume/momentum
  okx-defi-invest       → list yield opportunities (APY ranking)
  okx-security          → token risk scan before any position entry

PAY:
  okx-x402-payment      → sign EIP-3009 TransferWithAuthorization
                          to fund AI inference autonomously
                          (self-sustaining economy loop)

REINVEST:
  okx-dex-swap          → quote + execute swap via OKX DEX aggregator
                          (routes through Uniswap V3 pools on X Layer)
  okx-dex-market        → portfolio PnL analysis post-reinvest
```

---

## x402 Payment Integration

The PAY phase demonstrates real x402 protocol usage:

1. Agent constructs a payment `accepts` array targeting `inference.mindvault.ai` on X Layer (`eip155:196`)
2. Signs an **EIP-3009 TransferWithAuthorization** locally using the agent's private key
3. Returns a signed payment proof — ready to attach as `PAYMENT-SIGNATURE` header
4. Payment amount: 0.10 USDC (100000 in 6-decimal units) per inference cycle

This makes MindVault economically self-sustaining: yield earned in the EARN phase covers its own AI costs via x402.

---

## Working Mechanics

### The Economy Loop

MindVault operates a continuous **EARN → PAY → REINVEST** cycle:

1. **ANALYZE** — Checks live wallet balance and smart money signals on X Layer to calibrate strategy

2. **EARN** — Scans hot tokens and DeFi yield products. Ranks by APY, cross-references whale signal data, runs security scan. Identifies optimal entry point.

3. **PAY** — Signs an x402 EIP-3009 payment authorization for AI inference funding. This closes the self-sustainability loop: the agent earns yield and uses it to fund its own cognition.

4. **REINVEST** — Gets a DEX swap quote via OKX aggregator (routes through Uniswap V3 + 500 other sources on X Layer), analyzes PnL, and compounds earnings back into position.

### Reasoning Engine

Every decision uses live data. The agent:
- Fetches real market data from OKX APIs before each decision
- Builds contextual analysis from actual prices, volumes, signals
- Narrates every step with specific numbers: *"0.0607 OKB ($5.21) confirmed. XDOG at $2,540 24h volume — bearish signal. Targeting ATOM staking at 19.26% APY."*
- Handles errors gracefully, explaining fallback strategy

### Natural Language Chat

Users can command the agent mid-loop:
- *"What tokens are trending on X Layer?"* → live hot-token scan
- *"Check my balance"* → live wallet query
- *"Find best yield"* → DeFi opportunity scan with APY ranking
- *"Run x402 payment"* → triggers EIP-3009 signing flow
- *"Show smart money signals"* → whale signal feed

### AgenticWallet.sol

Deployed on X Layer, the contract serves as the agent's permanent onchain identity:
- Tracks economy loop phase (EARN / PAY / REINVEST / IDLE)
- Records all earnings, payments, and reinvestments
- Emits events for every loop completion
- Enables general-purpose execution via `execute()`

---

## Quick Start

### Prerequisites
- Node.js 18+
- OKX API credentials (`OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE`)
- `onchainos` CLI v2.2.9 installed

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/mindvault
cd mindvault

# Create .env (copy from .env.example and fill in values)
cp .env.example .env

# Backend
cd backend && npm install && node src/server.js

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000` → click **Start Economy Loop**.

### Install onchainos CLI

```bash
# macOS / Linux
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh

# Windows (PowerShell)
irm https://raw.githubusercontent.com/okx/onchainos-skills/main/install.ps1 | iex
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TailwindCSS, framer-motion, WebSocket |
| Backend | Node.js, Express, ws |
| Reasoning Engine | Cloudflare Workers AI (Llama 3.3 70B) + deterministic fallback |
| Onchain Skills | OKX Onchain OS CLI v2.2.9 (9 skills) |
| Smart Contracts | Solidity 0.8.24, Hardhat |
| Blockchain | X Layer (Chain ID: 196) |
| Gas Token | OKB |
| x402 | EIP-3009 local signing via `onchainos payment eip3009-sign` |

---

## Team

| Name | Role |
|------|------|
| Damilola | Full Stack Developer & Project Lead |

---

## Links

- **Contract:** https://www.okx.com/explorer/xlayer/address/0xDa66C4feec705cfB8c40Ab5B630B797A2dec30ec
- **Agent Wallet:** https://www.okx.com/explorer/xlayer/address/0xC84d0368B722425b006F91A9CB98B75Cd12A055A
- **Onchain OS Docs:** https://web3.okx.com/onchainos/dev-docs/home/what-is-onchainos
- **X Layer Explorer:** https://www.okx.com/explorer/xlayer
