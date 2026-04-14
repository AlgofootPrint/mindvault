require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const agentAddress = process.env.AGENT_WALLET_ADDRESS;

  console.log("Deploying AgenticWallet...");
  console.log("Deployer:", deployer.address);
  console.log("Agent:   ", agentAddress);
  console.log("Network: ", hre.network.name);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance: ", hre.ethers.formatEther(balance), "OKB\n");

  const AgenticWallet = await hre.ethers.getContractFactory("AgenticWallet");
  const wallet = await AgenticWallet.deploy(agentAddress);
  await wallet.waitForDeployment();

  const address = await wallet.getAddress();
  console.log("✅ AgenticWallet deployed!");
  console.log("Contract address:", address);
  console.log("Explorer:        https://www.okx.com/explorer/xlayer/address/" + address);
  console.log("\nAdd to .env:");
  console.log(`AGENTIC_WALLET_CONTRACT=${address}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
