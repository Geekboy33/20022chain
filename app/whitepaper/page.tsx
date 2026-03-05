"use client";

import { useRef } from "react";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChainWhitepaper() {
  const handleDownload = () => { window.print(); };

  return (
    <>
      <div className="print:hidden sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-xl border-b border-[#e8e8ec] flex items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#8b8b94] hover:text-[#0A0A0A] transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
        <button onClick={handleDownload} className="h-8 px-4 bg-[#0A0A0A] text-white text-[11px] font-bold tracking-wider rounded-lg hover:bg-[#1a1a2e] transition-all flex items-center gap-2">
          <Download size={12} /> DOWNLOAD PDF
        </button>
      </div>

      <div className="bg-white min-h-screen print:bg-white">
        <div className="max-w-[850px] mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12">

          {/* Cover */}
          <section className="min-h-[85vh] print:min-h-0 print:pb-12 flex flex-col items-center justify-center text-center mb-20 print:break-after-page">
            <div className="w-24 h-24 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mb-8 shadow-xl"><span className="font-black text-white text-2xl tracking-tighter">20022</span></div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-3">20022Chain</h1>
            <div className="w-20 h-1 bg-[#0A0A0A] rounded-full mb-5" />
            <h2 className="text-xl font-semibold text-[#4a4a5a] mb-2">Technical Whitepaper</h2>
            <p className="text-base text-[#6b6b74] max-w-md">The ISO 20022-Native Blockchain for<br/>Institutional Real World Asset Settlement</p>
            <p className="text-sm text-[#8b8b94] mt-8">Version 1.0 · February 2026</p>
            <div className="mt-10 grid grid-cols-3 gap-6 text-xs text-[#6b6b74]">
              <div><span className="font-bold text-[#0A0A0A]">Chain ID:</span> 20022</div>
              <div><span className="font-bold text-[#0A0A0A]">Core:</span> Rust</div>
              <div><span className="font-bold text-[#0A0A0A]">TPS:</span> 50,000+</div>
            </div>
          </section>

          {/* TOC */}
          <Sec num="" title="Table of Contents" noBar>
            <div className="space-y-2 border-b-2 border-[#0A0A0A] pb-6 mb-6">
              {[
                "01 — Why 20022Chain Exists",
                "02 — Architecture: 12 Subsystems Deep Dive",
                "03 — ArchPoS Consensus Mechanism",
                "04 — Parallel Execution Engine",
                "05 — ISO 20022 Native Message Format",
                "06 — ISIN Registry & Asset Classification",
                "07 — ViewsRight Verification System",
                "08 — Seal System & Trust Layers",
                "09 — Wallet System & Account Types",
                "10 — Smart Contract Virtual Machine",
                "11 — Cross-Chain Bridge Protocol",
                "12 — Zero-Knowledge Proof System",
                "13 — On-Chain Governance & Treasury",
                "14 — Verkle Trees & State Management",
                "15 — DAG Mempool Architecture",
                "16 — Danksharding & Data Availability",
                "17 — Full API Reference & Developer Tools",
                "18 — Integration with ARCHT Ecosystem",
                "19 — Security Model & Audit Framework",
                "20 — Roadmap 2026–2028",
              ].map(t => <div key={t} className="text-sm py-1.5 border-b border-[#f0f0f2]"><span className="font-mono font-bold text-[#d4a855] mr-3">{t.slice(0,2)}</span>{t.slice(5)}</div>)}
            </div>
          </Sec>

          {/* 01 */}
          <Sec num="01" title="Why 20022Chain Exists" pb>
            <p>The global financial system moves over $5 quadrillion annually through messaging standards. ISO 20022 is the universal format adopted by SWIFT (migrating all 11,000+ banks), the European Central Bank (TARGET2), the Federal Reserve (FedNow), and 200+ countries. By 2025, ISO 20022 will be mandatory for all international financial messaging.</p>
            <p>Yet every existing blockchain — Ethereum, Solana, Cosmos, Polkadot — uses proprietary transaction formats. This creates a fundamental incompatibility: banks cannot read blockchain transactions, and blockchains cannot integrate with banking systems without expensive middleware.</p>
            <p className="font-semibold text-[#0A0A0A] text-base mt-4">20022Chain eliminates this gap entirely.</p>
            <p>Every transaction on 20022Chain is natively formatted as an ISO 20022 message. A bank receiving a 20022Chain settlement can parse it with the same systems they use for SWIFT messages. No adapters, no translators, no middleware. This is what makes institutional RWA tokenization possible at scale.</p>
            <Box title="Key Differentiators">
              <ul className="space-y-1">
                <li>• First blockchain with native ISO 20022 compliance</li>
                <li>• Designed for institutional RWA settlement, not retail DeFi</li>
                <li>• 50,000+ TPS with instant finality (no rollbacks)</li>
                <li>• Built in Rust for maximum performance and safety</li>
                <li>• Settlement layer for $5T+ in verified mineral reserves on ARCHT</li>
              </ul>
            </Box>
          </Sec>

          {/* 02 */}
          <Sec num="02" title="Architecture: 12 Subsystems Deep Dive" pb>
            <p>20022Chain is not a monolithic blockchain. It is composed of 12 specialized subsystems, each independently designed, tested, and upgradeable through governance. This modular architecture allows individual components to be improved without affecting others.</p>
            <Table headers={["Subsystem", "Purpose", "Key Metric"]} rows={[
              ["Parallel Execution", "Multi-threaded tx processing", "50,000+ TPS"],
              ["DAG Mempool", "Non-sequential tx ordering", "100K tx queue"],
              ["ArchPoS Consensus", "Stake-weighted block production", "400ms blocks"],
              ["ISO 20022 Layer", "Financial message formatting", "8 msg types"],
              ["Verkle Trees", "State-efficient storage", "90% reduction"],
              ["ZK Proofs", "Privacy-preserving verification", "ZK-SNARKs"],
              ["Cross-Chain Bridge", "ETH, BNB, Cosmos, Polkadot", "5 chains"],
              ["On-Chain Governance", "Protocol upgrades & treasury", "Token voting"],
              ["ISIN Registry", "Securities identification", "8,247+ ISINs"],
              ["Account Abstraction", "Multi-sig, social recovery", "ERC-4337"],
              ["State Expiry", "Automatic state pruning", "365-day cycle"],
              ["Danksharding", "Blob data availability", "EIP-4844"],
            ]} />
          </Sec>

          {/* 03 */}
          <Sec num="03" title="ArchPoS Consensus Mechanism" pb>
            <p>ArchPoS (Archetype Proof of Stake) is 20022Chain&apos;s proprietary consensus mechanism. It achieves instant finality in a single slot — meaning once a block is committed at 400ms, it is mathematically impossible to revert.</p>
            <h3 className="text-base font-bold mt-6 mb-2">3.1 Validator Selection</h3>
            <p>128 validators participate in block production. Selection uses a Verifiable Random Function (VRF) weighted by: (a) stake amount, (b) uptime score, (c) historical performance. This ensures both decentralization and reliability.</p>
            <h3 className="text-base font-bold mt-6 mb-2">3.2 Block Production</h3>
            <p>Each slot (400ms), one validator is selected as the block proposer. The proposer collects transactions from the DAG mempool, orders them, executes them through the parallel engine, and broadcasts the block. Other validators attest within the same slot, achieving instant finality.</p>
            <h3 className="text-base font-bold mt-6 mb-2">3.3 Slashing Conditions</h3>
            <Box title="Slashing Rules">
              <ul className="space-y-1">
                <li>• <strong>Double signing:</strong> Proposing two different blocks for the same slot → 100% stake slash</li>
                <li>• <strong>Prolonged downtime:</strong> Offline for 24+ hours → Gradual stake reduction (0.1%/hour)</li>
                <li>• <strong>Censorship:</strong> Repeatedly excluding valid transactions → 50% stake slash + removal</li>
                <li>• <strong>Invalid attestation:</strong> Attesting to invalid blocks → 25% stake slash</li>
              </ul>
            </Box>
            <h3 className="text-base font-bold mt-6 mb-2">3.4 Staking Rewards</h3>
            <p>Validators earn rewards proportional to their stake and performance. Current estimated APY: 6.2%. Rewards are distributed automatically at the end of each epoch (every 32 blocks = ~12.8 seconds).</p>
          </Sec>

          {/* 04 */}
          <Sec num="04" title="Parallel Execution Engine">
            <p>Traditional blockchains execute transactions sequentially — one after another. This creates a fundamental bottleneck: throughput is limited by single-core performance. 20022Chain breaks this barrier with a parallel execution engine that processes independent transactions simultaneously.</p>
            <h3 className="text-base font-bold mt-6 mb-2">4.1 How It Works</h3>
            <p>1. Transactions enter the DAG mempool. 2. The engine analyzes read/write sets to identify dependencies. 3. Independent transactions (different sender/receiver pairs) are assigned to separate execution threads. 4. Dependent transactions (touching the same account) are ordered sequentially within their thread. 5. Results are merged into the final state root.</p>
            <Box title="Performance">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Normal load:</strong> 50,000+ TPS</div>
                <div><strong>Peak (stress test):</strong> 127,390 TPS</div>
                <div><strong>Average latency:</strong> 12ms per tx</div>
                <div><strong>Threads:</strong> Up to 64 parallel</div>
              </div>
            </Box>
          </Sec>

          {/* 05 */}
          <Sec num="05" title="ISO 20022 Native Message Format" pb>
            <p>Every transaction on 20022Chain is wrapped in an ISO 20022 message envelope. This is not a translation layer — the native wire format is ISO 20022.</p>
            <Table headers={["Code", "Message Type", "Use Case", "Example"]} rows={[
              ["setr.012", "Asset Tokenization", "Create new tokenized asset", "Tokenize Oro Verde mine → MINE-AU-001"],
              ["pacs.008", "Token Transfer", "Send tokens between wallets", "Transfer 1,000 ARCHT from 0x7a... to 0x3b..."],
              ["semt.002", "Holdings Report", "Query portfolio holdings", "List all ISIN instruments for wallet 0x7a..."],
              ["sese.023", "Settlement", "Finalize trade execution", "Settle buy order: 500 MINE-AU-001 at $45.20"],
              ["seev.031", "Corporate Action", "Dividend/yield distribution", "Distribute Q1 mining yield to token holders"],
              ["camt.053", "Account Statement", "Transaction history", "Generate statement for wallet 0x7a... (Jan-Mar)"],
              ["colr.003", "Collateral Mgmt", "Lock/release collateral", "Lock 10,000 ARCHT as loan collateral"],
              ["reda.041", "Reference Data", "Update asset metadata", "Update Oro Verde reserve estimate to 2.6M oz"],
            ]} />
          </Sec>

          {/* 06 */}
          <Sec num="06" title="ISIN Registry & Asset Classification">
            <p>Every tokenized asset on 20022Chain receives a unique ISIN (International Securities Identification Number) — the same system used by traditional stock exchanges worldwide. This allows institutional portfolio systems to natively track 20022Chain assets.</p>
            <h3 className="text-base font-bold mt-6 mb-2">6.1 ISIN Format</h3>
            <Code>{`ISIN Format: [TYPE]-[MINERAL]-[SEQUENCE]
Examples:
  MINE-AU-001  → Gold mining token (Oro Verde)
  MINE-LI-042  → Lithium mining token
  REAL-DXB-007 → Dubai real estate property
  BOND-US-103  → US Treasury tokenized bond
  GEM-EM-015   → Colombian emerald token
  COMM-CU-088  → Copper commodity token`}</Code>
            <h3 className="text-base font-bold mt-6 mb-2">6.2 RWA Categories</h3>
            <Table headers={["Code", "Category", "Color", "Description"]} rows={[
              ["MINE", "Mining", "Gold (#92700a)", "Tokenized mineral reserves — gold, silver, lithium, rare earths, etc."],
              ["REAL", "Real Estate", "Blue (#1D4ED8)", "Tokenized properties — commercial, residential, development"],
              ["BOND", "Fixed Income", "Purple (#7C3AED)", "Tokenized bonds — government, corporate, green"],
              ["COMM", "Commodity", "Green (#059669)", "Tokenized commodities — copper, agricultural, energy"],
              ["GEM", "Gemstone", "Pink (#DB2777)", "Tokenized gemstones — diamonds, emeralds, rubies"],
            ]} />
            <p className="mt-4">Registry currently holds <strong>8,247+ registered instruments</strong> across all categories.</p>
          </Sec>

          {/* 07 */}
          <Sec num="07" title="ViewsRight Verification System" pb>
            <p>ViewsRight is 20022Chain&apos;s proprietary digital rights and verification system. It provides cryptographic proof of ownership, authenticity, and compliance for tokenized assets.</p>
            <h3 className="text-base font-bold mt-6 mb-2">7.1 What ViewsRight Does</h3>
            <p>When an asset is tokenized, ViewsRight generates a unique cryptographic fingerprint that binds the physical asset to its digital representation. This fingerprint includes: the asset&apos;s geographic coordinates, NI 43-101 report hash, ownership chain, compliance status, and verification timestamp.</p>
            <h3 className="text-base font-bold mt-6 mb-2">7.2 ViewsRight Verification Levels</h3>
            <p>A ViewsRight-verified asset has been independently confirmed by the 20022Chain validator network. The VR_VERIFIED seal (purple, fingerprint icon) indicates that:</p>
            <Box title="ViewsRight Guarantees">
              <ul className="space-y-1">
                <li>• The underlying physical asset exists and has been verified</li>
                <li>• The NI 43-101 report (or equivalent) has been cryptographically hashed and stored on-chain</li>
                <li>• Geographic coordinates match satellite imagery verification</li>
                <li>• The asset originator has passed KYC/AML verification</li>
                <li>• The smart contract has been audited and formally verified</li>
                <li>• Ownership rights are legally binding in the asset&apos;s jurisdiction</li>
              </ul>
            </Box>
            <h3 className="text-base font-bold mt-6 mb-2">7.3 How ViewsRight Verification Works</h3>
            <Code>{`1. Asset originator submits documentation → AI analysis
2. Validator network reviews and votes on verification
3. If 2/3+ validators approve → VR_VERIFIED seal issued
4. Seal is permanently recorded on-chain (immutable)
5. Any user can verify by querying: GET /api/contracts/{address}
6. Response includes: seal type, timestamp, validator signatures`}</Code>
          </Sec>

          {/* 08 */}
          <Sec num="08" title="Seal System & Trust Layers">
            <p>20022Chain implements a multi-layered trust system through seals — cryptographic badges that indicate different levels of verification and compliance.</p>
            <Table headers={["Seal", "Icon", "Color", "Meaning"]} rows={[
              ["VERIFIED", "✓ BadgeCheck", "Green (#00C853)", "Basic verification: asset exists, contract audited"],
              ["VR_VERIFIED", "🔏 Fingerprint", "Purple (#7C3AED)", "ViewsRight: full asset + legal + geographic verification"],
              ["IS_VERIFIED", "# Hash", "Blue (#1D4ED8)", "ISIN registered: asset has international securities ID"],
              ["GOV_VERIFIED", "🛡 Shield", "Gold (#D4A017)", "Government: sovereign or government-backed asset"],
              ["INST_VERIFIED", "🏢 Building", "Gray (#6B7280)", "Institutional: verified by institutional custodian"],
              ["PRO_VERIFIED", "🏆 Award", "Emerald (#059669)", "Professional: Qualified Person reviewed (mining)"],
              ["PRIVACY_SHIELD", "🔒 Lock", "Black (#0A0A0A)", "Private: ZK-verified but details hidden"],
            ]} />
            <p className="mt-4">Assets can carry multiple seals simultaneously. A gold mine might have: VERIFIED + VR_VERIFIED + IS_VERIFIED + PRO_VERIFIED — indicating full verification, ViewsRight confirmation, ISIN registration, and Qualified Person review.</p>
          </Sec>

          {/* 09 */}
          <Sec num="09" title="Wallet System & Account Types" pb>
            <p>20022Chain supports multiple wallet types designed for different user profiles — from individual investors to institutional custodians.</p>
            <h3 className="text-base font-bold mt-6 mb-2">9.1 Standard Wallet</h3>
            <p>HD-compliant (BIP-39/BIP-44) wallet with a single private key. Generates unique addresses, supports mnemonic seed phrases, and works with all major wallet providers.</p>
            <Code>{`// Create wallet
POST /api/wallets
Response: {
  address: "0x7a3f8c21...b4e9",
  publicKey: "0x04ab93...f721",
  mnemonic: "abandon ability able about above absent..."
}

// Check balance (18 decimal precision)
GET /api/balance?address=0x7a3f...
Response: { 
  balance: "1000000000000000000",  // 1.0 token
  staked: "500000000000000000",    // 0.5 staked
  available: "500000000000000000"  // 0.5 available
}`}</Code>
            <h3 className="text-base font-bold mt-6 mb-2">9.2 Multi-Signature Wallet</h3>
            <p>Requires M-of-N signatures to execute transactions. Designed for institutional treasuries, DAOs, and corporate accounts. Example: 3-of-5 signatures required for transfers above $1M.</p>
            <h3 className="text-base font-bold mt-6 mb-2">9.3 Social Recovery Wallet</h3>
            <p>Users designate guardians who can collectively restore access if the private key is lost. No single guardian can access the wallet alone — a threshold (e.g., 3 of 5 guardians) is required.</p>
            <h3 className="text-base font-bold mt-6 mb-2">9.4 Session Key Wallet</h3>
            <p>Allows dApps to request time-limited, scope-limited permissions. Example: a trading interface can execute trades up to $10,000 for 24 hours without prompting for signature each time.</p>
            <h3 className="text-base font-bold mt-6 mb-2">9.5 Institutional Custody Wallet</h3>
            <p>Enterprise-grade wallet with role-based access control, audit logging, compliance monitoring, and integration with HSM (Hardware Security Module) for key management.</p>
            <Code>{`// Send transaction
POST /api/transactions
Body: {
  from: "0x7a3f...",
  to: "0x3b21...",
  amount: "1000000000000000000",  // 1.0 token
  nonce: 42,
  gasPrice: "1000000000",
  signature: "0x3a9b..."
}
Response: { hash: "0x8f2a...", status: "pending" }

// Get receipt after confirmation
GET /api/transactions/0x8f2a...
Response: { 
  hash: "0x8f2a...",
  blockNumber: 158574,
  status: "confirmed",
  gasUsed: 21000,
  iso20022_type: "pacs.008",
  finality: "instant"
}`}</Code>
          </Sec>

          {/* 10 */}
          <Sec num="10" title="Smart Contract Virtual Machine">
            <p>20022Chain runs a Rust-based VM with WebAssembly (WASM) support. Contracts are compiled to WASM bytecode, enabling developers to write in Rust, AssemblyScript, or any WASM-compatible language.</p>
            <h3 className="text-base font-bold mt-6 mb-2">10.1 Contract Types</h3>
            <Table headers={["Contract", "Purpose"]} rows={[
              ["AssetToken", "ERC-20 compatible token for tokenized RWA"],
              ["ISINRegistry", "Register and manage ISIN identifiers"],
              ["YieldDistributor", "Automated dividend/coupon distribution"],
              ["GovernanceVoting", "Proposal creation and token-weighted voting"],
              ["BridgeEscrow", "Lock/unlock for cross-chain transfers"],
              ["LendingPool", "Collateralized lending with liquidation"],
              ["StakingValidator", "Validator staking and reward distribution"],
              ["ViewsRightVerifier", "Issue and verify ViewsRight seals"],
              ["OracleAggregator", "Price feeds and external data"],
            ]} />
          </Sec>

          {/* 11 */}
          <Sec num="11" title="Cross-Chain Bridge Protocol">
            <p>Native bridges connect 20022Chain to five major ecosystems:</p>
            <Table headers={["Chain", "Protocol", "Status"]} rows={[
              ["Ethereum", "Lock & Mint (ERC-20)", "Active"],
              ["BNB Chain", "Lock & Mint (BEP-20)", "Active"],
              ["Polygon", "Lock & Mint (ERC-20)", "Active"],
              ["Cosmos", "IBC (Inter-Blockchain Communication)", "Q4 2026"],
              ["Polkadot", "XCMP (Cross-Consensus Messaging)", "Q4 2026"],
            ]} />
            <p className="mt-4">Bridge security: dedicated validator set (16 of 21 threshold), cryptographic proof of lock on source chain, and automatic fraud detection with 7-day challenge period for large transfers.</p>
          </Sec>

          {/* 12 */}
          <Sec num="12" title="Zero-Knowledge Proof System">
            <p>ZK-SNARKs enable privacy-preserving operations. Users can prove facts about their state without revealing the underlying data.</p>
            <Box title="ZK Use Cases">
              <ul className="space-y-1">
                <li>• <strong>Balance proof:</strong> Prove you have sufficient funds without revealing exact balance</li>
                <li>• <strong>KYC proof:</strong> Prove KYC completion without exposing personal data</li>
                <li>• <strong>Reserve proof:</strong> Prove asset backing without revealing exact reserve amounts</li>
                <li>• <strong>Accredited investor:</strong> Prove status without revealing income/net worth</li>
                <li>• <strong>Age verification:</strong> Prove &gt;18 without revealing date of birth</li>
              </ul>
            </Box>
          </Sec>

          {/* 13 */}
          <Sec num="13" title="On-Chain Governance & Treasury">
            <p>Token holders govern the protocol through proposals and voting. Any holder with 1% of circulating supply can create a proposal. Voting period: 7 days. Quorum: 10% of supply. Execution delay: 48 hours after passing.</p>
            <p className="mt-3">The treasury holds protocol revenue (transaction fees, bridge fees, staking commissions) and is allocated by governance vote for: ecosystem development, security audits, validator incentives, and partnership grants.</p>
          </Sec>

          {/* 14 */}
          <Sec num="14" title="Verkle Trees & State Management">
            <p>Traditional Merkle Patricia Tries require downloading ~1 GB of proof data to verify a single account. Verkle Trees reduce this to ~150 bytes — a 90% reduction in node requirements. This enables light clients on mobile devices and browsers to verify state directly.</p>
          </Sec>

          {/* 15 */}
          <Sec num="15" title="DAG Mempool Architecture">
            <p>The DAG (Directed Acyclic Graph) mempool organizes pending transactions as a graph rather than a queue. Transactions that don&apos;t conflict can be processed in parallel paths. This eliminates the first-come-first-served bottleneck and enables natural transaction ordering that maximizes throughput.</p>
          </Sec>

          {/* 16 */}
          <Sec num="16" title="Danksharding & Data Availability">
            <p>EIP-4844 blob transactions provide scalable data availability for L2 rollups. Data blobs are stored for 30 days, then pruned — keeping the chain lightweight while supporting L2 ecosystems. This reduces L2 settlement costs by ~100x compared to calldata.</p>
          </Sec>

          {/* 17 */}
          <Sec num="17" title="Full API Reference & Developer Tools" pb>
            <p>20022Chain exposes 30+ REST API endpoints and JSON-RPC methods for developers.</p>
            <h3 className="text-base font-bold mt-6 mb-2">17.1 REST Endpoints</h3>
            <Code>{`Blockchain:
  GET  /api/chain         → Chain overview (id, block height, TPS)
  GET  /api/blocks        → Recent blocks with transactions
  GET  /api/transactions  → Transaction list with ISO 20022 types
  GET  /api/stats         → Network statistics (TPS, validators, uptime)
  GET  /api/validators    → Active validator list with performance

Wallets:
  POST /api/wallets       → Create new HD wallet
  GET  /api/balance       → Query address balance
  GET  /api/nonce         → Get next nonce for address
  POST /api/faucet        → Request testnet tokens

Assets:
  GET  /api/isin          → ISIN registry lookup
  GET  /api/contracts     → Smart contract list
  POST /api/tokenize      → Tokenize new RWA asset
  GET  /api/por           → Proof of Reserve data

DeFi:
  GET  /api/defi          → DeFi protocol stats
  GET  /api/staking       → Staking pools and rewards
  GET  /api/oracle        → Price oracle feeds
  POST /api/nft           → Mint NFT for asset certificate

Bridge:
  GET  /api/bridge        → Bridge status and connections
  POST /api/swift         → ISO 20022 SWIFT message relay

Governance:
  GET  /api/governance    → Active proposals and voting
  GET  /api/network       → Network health and peer count`}</Code>
            <h3 className="text-base font-bold mt-6 mb-2">17.2 JSON-RPC Methods</h3>
            <Code>{`chain_blockNumber     → Latest block number
chain_getBalance      → Address balance
chain_getTransactionByHash → Transaction details
chain_getBlockByNumber     → Block with transactions
chain_getTransactionReceipt → Execution receipt
chain_chainId         → Chain ID (20022)
chain_gasPrice        → Current gas price`}</Code>
          </Sec>

          {/* 18 */}
          <Sec num="18" title="Integration with ARCHT Ecosystem">
            <p>20022Chain is the settlement layer for ARCHT.World — the institutional RWA tokenization platform with $5T+ in verified mineral reserves across 1,000+ mining operations.</p>
            <Box title="Integration Flow">
              <div className="font-mono text-xs space-y-1">
                <div>ARCHT: Asset Created → 20022Chain: Smart Contract Deployed</div>
                <div>ARCHT: ISIN Assigned → 20022Chain: ISIN Registered</div>
                <div>ARCHT: Trade Executed → 20022Chain: Settlement Finalized</div>
                <div>ARCHT: Yield Generated → 20022Chain: Distribution via Contract</div>
                <div>ARCHT: Mine Verified → 20022Chain: ViewsRight Seal Issued</div>
              </div>
            </Box>
          </Sec>

          {/* 19 */}
          <Sec num="19" title="Security Model & Audit Framework">
            <p>Multi-layered security: formal verification of all smart contracts, continuous monitoring via SOC, multi-sig governance for upgrades, bug bounty program ($500K max reward), time-locked upgrades (48-hour delay), slashing for validator misbehavior, and HSM key management for bridge validators.</p>
          </Sec>

          {/* 20 */}
          <Sec num="20" title="Roadmap 2026–2028">
            <div className="space-y-3">
              {[
                { p: "Q1 2026", t: "Testnet launch, validator onboarding, developer documentation" },
                { p: "Q2 2026", t: "Security audits (3 firms), bridge testing, ISIN registry population" },
                { p: "Q3 2026", t: "PUBLIC MAINNET LAUNCH, ARCHT integration live, first 200 assets tokenized" },
                { p: "Q4 2026", t: "Cosmos IBC bridge, Polkadot XCMP bridge, 150+ Rare Earth assets" },
                { p: "Q1 2027", t: "Danksharding activation, L2 rollup support, 180 Lithium assets" },
                { p: "Q2 2027", t: "200+ validators, governance expansion, AMM DEX on-chain" },
                { p: "Q3 2027", t: "100+ Real Estate assets, institutional custody integrations" },
                { p: "2028", t: "100K+ TPS target, full banking API integration, sovereign partnerships" },
              ].map(r => (
                <div key={r.p} className="flex gap-4 py-2 border-b border-[#f0f0f2]">
                  <span className="font-mono font-bold text-[#d4a855] w-20 shrink-0 text-xs">{r.p}</span>
                  <span className="text-xs">{r.t}</span>
                </div>
              ))}
            </div>
          </Sec>

          {/* Back Cover */}
          <section className="mt-16 py-12 text-center border-t-2 border-[#0A0A0A] print:break-before-page">
            <div className="w-14 h-14 rounded-xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-4"><span className="font-black text-white text-[11px]">20022</span></div>
            <h3 className="text-xl font-black">20022Chain</h3>
            <p className="text-xs text-[#8b8b94] mt-1">The ISO 20022-Native Blockchain</p>
            <p className="text-xs text-[#8b8b94] mt-1">Part of the ARCHT Ecosystem</p>
            <p className="text-[10px] text-[#c4c4c4] mt-6">&copy; 2026 20022Chain. All rights reserved.</p>
          </section>
        </div>
      </div>

      <style jsx global>{`@media print { body { background: white !important; } nav, .print\\:hidden { display: none !important; } @page { margin: 1.5cm; size: A4; } }`}</style>
    </>
  );
}

function Sec({ num, title, children, pb, noBar }: { num: string; title: string; children: React.ReactNode; pb?: boolean; noBar?: boolean }) {
  return (
    <section className={`mb-14 ${pb ? "print:break-after-page" : ""}`}>
      {num && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-mono font-bold text-[#d4a855] bg-[#d4a855]/10 px-2 py-1 rounded">{num}</span>
          <h2 className="text-xl font-black">{title}</h2>
        </div>
      )}
      {!num && !noBar && <h2 className="text-xl font-black mb-5">{title}</h2>}
      <div className="text-sm text-[#4a4a5a] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 bg-[#fafafa] border border-[#e8e8ec] rounded-xl my-4">
      <h4 className="text-xs font-bold uppercase tracking-wider mb-3">{title}</h4>
      <div className="text-xs text-[#4a4a5a] leading-relaxed">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <pre className="p-4 bg-[#0A0A0A] text-[#10B981] rounded-xl font-mono text-[10px] sm:text-[11px] overflow-x-auto my-4 leading-relaxed whitespace-pre-wrap">{children}</pre>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8e8ec] my-4">
      <table className="w-full text-xs">
        <thead className="bg-[#fafafa]"><tr>{headers.map(h => <th key={h} className="text-left p-3 font-bold uppercase tracking-wider text-[10px]">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#f0f0f2]">{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className={`p-3 ${j === 0 ? "font-semibold text-[#0A0A0A]" : "text-[#4a4a5a]"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
