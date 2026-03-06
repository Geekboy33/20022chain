import { NextRequest, NextResponse } from 'next/server';
import { getChain } from '@/lib/blockchain/Blockchain';
import { getDB } from '@/lib/blockchain/Database';
import { getContractManager } from '@/lib/blockchain/SmartContract';
import { Transaction, RWAType } from '@/lib/blockchain/Transaction';

// ═══════════════════════════════════════════════════════════════
// POST /api/tokenize — Full RWA Tokenization Pipeline
// Creates: Smart Contract + ISIN + Blockchain Transaction
// This is the REAL tokenization endpoint
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    // Asset basics
    name,
    description,
    rwaType,         // MINE, REAL, BOND, GEM, COMM
    // Token config
    tokenSymbol,
    totalSupply,
    initialPrice,
    // Issuer
    issuerName,
    issuerLEI,
    jurisdiction,
    // Location (for mines/real estate)
    location,        // { lat, lng, country, region?, city?, address? }
    // Owner
    ownerAddress,
  } = body;

  // ── VALIDATION ──
  if (!name || !rwaType || !tokenSymbol || !totalSupply || !issuerName) {
    return NextResponse.json({
      error: 'Required fields: name, rwaType, tokenSymbol, totalSupply, issuerName'
    }, { status: 400 });
  }

  const validTypes: RWAType[] = ['MINE', 'REAL', 'BOND', 'GEM', 'COMM'];
  if (!validTypes.includes(rwaType)) {
    return NextResponse.json({ error: `Invalid rwaType. Use: ${validTypes.join(', ')}` }, { status: 400 });
  }

  try {
    const chain = getChain();
    const db = getDB();
    const mgr = getContractManager();
    // ── STEP 1: Generate addresses ──
    const contractAddress = chain.generateContractAddress(name);
    const isinContractAddress = chain.generateContractAddress(`isin-${name}`);
    const owner = ownerAddress || chain.generateAddress(issuerName);
    const isinCode = `ARCHT${String(db.getISINCount() + 1).padStart(5, '0')}`;

    // ── STEP 2: Generate smart contract code ──
    const contractCode = generateRWAContract(name, tokenSymbol, totalSupply, rwaType, issuerName);

    // ── STEP 3: Deploy smart contract ──
    const deployResult = mgr.deploy(contractCode, name, description || '', 'rwa');

    // ── STEP 4: Register ISIN on blockchain ──
    db.saveISIN({
      isin: isinCode,
      name,
      rwaType: rwaType as RWAType,
      issuer: issuerName,
      lei: issuerLEI || '',
      status: 'active',
      tokenSymbol,
      totalSupply,
      circulatingSupply: 0,
      price: initialPrice || 0,
      holders: 1,
      createdBlock: db.getBlockCount(),
      contractAddress,
      isoMessages: 0,
      jurisdiction: jurisdiction || '',
      complianceScore: 85,
      description: description || '',
      lastActivity: Date.now(),
    });

    // ── STEP 5: Create tokenization transaction on blockchain ──
    const tx = new Transaction({
      from: owner,
      to: contractAddress,
      amount: 0,
      fee: 0.01,
      timestamp: Date.now(),
      nonce: 0,
      iso20022: {
        messageType: 'setr.012',  // Asset Tokenization
        rwaType: rwaType as RWAType,
        isin: isinCode,
        lei: issuerLEI || '',
        instrumentName: name,
        jurisdiction: jurisdiction || '',
        complianceScore: 85,
      },
      data: JSON.stringify({
        action: 'TOKENIZE_RWA',
        tokenSymbol,
        totalSupply,
        location: location || null,
      }),
    });
    // Mark as system transaction (no signature needed)
    tx.status = 'pending';
    chain.addTransaction(tx);

    // ── STEP 6: Credit initial supply to owner ──
    db.setBalance(owner, (db.getBalance(owner) || 0) + totalSupply);

    // ── RETURN COMPLETE RESULT ──
    return NextResponse.json({
      success: true,
      tokenization: {
        contractAddress,
        isin: isinCode,
        isinContractAddress,
        tokenSymbol,
        totalSupply,
        initialPrice: initialPrice || 0,
        owner,
        issuer: issuerName,
        rwaType,
        jurisdiction: jurisdiction || '',
        location: location || null,
        txHash: tx.hash,
        deployBlock: db.getBlockCount(),
        deployResult: deployResult.success ? {
          address: deployResult.address,
          gasUsed: deployResult.gasUsed,
        } : null,
        createdAt: Date.now(),
      },
      message: `Successfully tokenized ${name} as ${tokenSymbol}. ISIN: ${isinCode}. Contract deployed at ${contractAddress}.`,
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Tokenization failed',
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════
// RWA CONTRACT TEMPLATE GENERATOR
// ═══════════════════════════════════════════════════

function generateRWAContract(name: string, symbol: string, supply: number, rwaType: string, issuer: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ${name}
 * @dev ISO 20022 compliant RWA token - ${rwaType}
 * @notice Deployed on 20022Chain by ${issuer}
 */
contract ${symbol}_Token {
    // ═══ TOKEN METADATA ═══
    string public constant name = "${name}";
    string public constant symbol = "${symbol}";
    uint8 public constant decimals = 18;
    uint256 public totalSupply = ${supply} * 10**18;

    // ═══ RWA CLASSIFICATION ═══
    string public constant rwaType = "${rwaType}";
    string public constant issuer = "${issuer}";
    string public constant isoStandard = "ISO 20022";
    bool public certified = false;

    // ═══ STATE ═══
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    address public owner;
    bool public paused = false;

    // ═══ EVENTS ═══
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event AssetCertified(string certifier, string report, uint256 timestamp);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ═══ MODIFIERS ═══
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ═══ CONSTRUCTOR ═══
    constructor() {
        owner = msg.sender;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // ═══ TOKEN OPERATIONS ═══
    function transfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public whenNotPaused returns (bool) {
        require(allowances[from][msg.sender] >= amount, "Allowance exceeded");
        require(balances[from] >= amount, "Insufficient balance");

        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    // ═══ RWA FUNCTIONS ═══
    function certifyAsset(string memory certifier, string memory report) public onlyOwner {
        certified = true;
        emit AssetCertified(certifier, report, block.timestamp);
    }

    function isCertified() public view returns (bool) {
        return certified;
    }

    // ═══ ADMIN ═══
    function pause() public onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() public onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}`;
}

// GET /api/tokenize — Get tokenization form schema
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tokenize',
    method: 'POST',
    description: 'Full RWA tokenization pipeline: deploys contract, registers ISIN, creates blockchain transaction',
    requiredFields: {
      name: 'Asset name (e.g. "Oro Verde Gold Token")',
      rwaType: 'MINE | REAL | BOND | GEM | COMM',
      tokenSymbol: 'Token ticker (e.g. "OVG")',
      totalSupply: 'Total token supply (number)',
      issuerName: 'Legal entity name',
    },
    optionalFields: {
      description: 'Asset description',
      initialPrice: 'Initial token price in USD',
      issuerLEI: 'Legal Entity Identifier (LEI)',
      jurisdiction: 'ISO country code (e.g. "CO", "US")',
      ownerAddress: 'Owner address (auto-generated if not provided)',
      location: '{ lat, lng, country, region?, city?, address? }',
    },
    rwaTypes: [
      { type: 'MINE', description: 'Mining assets (gold, silver, lithium, etc.)' },
      { type: 'REAL', description: 'Real estate (commercial, residential)' },
      { type: 'BOND', description: 'Fixed income (bonds, green bonds)' },
      { type: 'GEM', description: 'Gemstones (emeralds, rubies, diamonds)' },
      { type: 'COMM', description: 'Commodities (copper, oil, agriculture)' },
    ],
  });
}
