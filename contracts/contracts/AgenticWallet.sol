// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgenticWallet
 * @notice MindVault's onchain identity on X Layer.
 *         An autonomous AI agent wallet that executes the earn-pay-earn economy loop.
 * @dev Deployed on X Layer (Chain ID: 196). Gas token: OKB.
 */
contract AgenticWallet {

    // ── State ─────────────────────────────────────────────────────────────────

    address public owner;
    address public agent;

    string public constant NAME    = "MindVault AgenticWallet";
    string public constant VERSION = "1.0.0";

    uint256 public totalEarned;
    uint256 public totalPaid;
    uint256 public totalReinvested;
    uint256 public loopCount;
    uint256 public txCount;

    enum LoopPhase { IDLE, EARN, PAY, REINVEST }
    LoopPhase public currentPhase;

    struct Transaction {
        address to;
        uint256 value;
        bytes   data;
        bool    executed;
        uint256 timestamp;
        string  label;
    }

    Transaction[] public transactions;

    // ── Events ────────────────────────────────────────────────────────────────

    event PhaseChanged(LoopPhase indexed phase, uint256 timestamp);
    event EarningRecorded(uint256 amount, string source, uint256 timestamp);
    event PaymentExecuted(address indexed to, uint256 amount, string purpose, uint256 timestamp);
    event ReinvestExecuted(address indexed protocol, uint256 amount, uint256 timestamp);
    event LoopCompleted(uint256 indexed loopNumber, uint256 earned, uint256 paid, uint256 reinvested, uint256 timestamp);
    event TransactionExecuted(address indexed to, uint256 value, bytes data, string label, uint256 timestamp);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event Deposit(address indexed from, uint256 amount, uint256 timestamp);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AgenticWallet: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == agent, "AgenticWallet: not authorized");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
        currentPhase = LoopPhase.IDLE;
        emit AgentUpdated(address(0), _agent);
    }

    // ── Receive OKB ──────────────────────────────────────────────────────────

    receive() external payable {
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    // ── Phase Management ─────────────────────────────────────────────────────

    function setPhase(LoopPhase _phase) external onlyAuthorized {
        currentPhase = _phase;
        emit PhaseChanged(_phase, block.timestamp);
    }

    // ── Economy Loop Actions ─────────────────────────────────────────────────

    /**
     * @notice Record an earning event (yield, fees, rewards).
     */
    function recordEarning(uint256 amount, string calldata source) external onlyAuthorized {
        totalEarned += amount;
        txCount++;
        emit EarningRecorded(amount, source, block.timestamp);
    }

    /**
     * @notice Execute an x402 payment from the agent wallet.
     */
    function executePayment(
        address payable to,
        uint256 amount,
        string calldata purpose
    ) external onlyAuthorized {
        require(address(this).balance >= amount, "AgenticWallet: insufficient OKB balance");
        totalPaid += amount;
        txCount++;
        (bool success, ) = to.call{value: amount}("");
        require(success, "AgenticWallet: payment failed");
        emit PaymentExecuted(to, amount, purpose, block.timestamp);
    }

    /**
     * @notice Execute a reinvestment (deposit into DeFi protocol).
     */
    function executeReinvest(
        address protocol,
        uint256 amount,
        bytes calldata data
    ) external onlyAuthorized {
        require(address(this).balance >= amount, "AgenticWallet: insufficient OKB balance");
        totalReinvested += amount;
        txCount++;
        (bool success, ) = protocol.call{value: amount}(data);
        require(success, "AgenticWallet: reinvest failed");
        emit ReinvestExecuted(protocol, amount, block.timestamp);
    }

    /**
     * @notice Complete one full earn-pay-reinvest loop cycle.
     */
    function completeLoop(
        uint256 earned,
        uint256 paid,
        uint256 reinvested
    ) external onlyAuthorized {
        loopCount++;
        currentPhase = LoopPhase.IDLE;
        emit LoopCompleted(loopCount, earned, paid, reinvested, block.timestamp);
        emit PhaseChanged(LoopPhase.IDLE, block.timestamp);
    }

    /**
     * @notice General-purpose transaction execution (for Onchain OS skill calls).
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        string calldata label
    ) external onlyAuthorized returns (bytes memory) {
        require(address(this).balance >= value, "AgenticWallet: insufficient balance");
        txCount++;

        transactions.push(Transaction({
            to:        to,
            value:     value,
            data:      data,
            executed:  true,
            timestamp: block.timestamp,
            label:     label
        }));

        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "AgenticWallet: execution failed");

        emit TransactionExecuted(to, value, data, label, block.timestamp);
        return result;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setAgent(address _agent) external onlyOwner {
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "AgenticWallet: insufficient balance");
        payable(owner).transfer(amount);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getStats() external view returns (
        uint256 _totalEarned,
        uint256 _totalPaid,
        uint256 _totalReinvested,
        uint256 _loopCount,
        uint256 _txCount,
        LoopPhase _phase,
        uint256 _balance
    ) {
        return (
            totalEarned,
            totalPaid,
            totalReinvested,
            loopCount,
            txCount,
            currentPhase,
            address(this).balance
        );
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }
}
