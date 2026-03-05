// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Persistent Storage Layer
// SQLite-backed real blockchain persistence
// Every block, transaction, validator, and ISIN lives on disk.
// ═══════════════════════════════════════════════════════════════

import Database from 'better-sqlite3';
import path from 'path';
import { Transaction, ISO20022Metadata, ISOMessageType, RWAType } from './Transaction';
import { Block } from './Block';
import type { Validator, ISINEntry } from './Blockchain';

const DB_PATH = path.join(process.cwd(), 'data', '20022chain.db');

// ═══════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS blocks (
    idx           INTEGER PRIMARY KEY,
    timestamp     INTEGER NOT NULL,
    hash          TEXT NOT NULL UNIQUE,
    previous_hash TEXT NOT NULL,
    merkle_root   TEXT NOT NULL,
    nonce         INTEGER DEFAULT 0,
    validator     TEXT NOT NULL,
    validator_name TEXT NOT NULL,
    stake_amount  REAL DEFAULT 0,
    reward        REAL DEFAULT 2.5,
    gas_used      REAL DEFAULT 0,
    gas_limit     REAL DEFAULT 30000000,
    size          INTEGER DEFAULT 0,
    tx_count      INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    hash          TEXT PRIMARY KEY,
    block_idx     INTEGER,
    tx_index      INTEGER DEFAULT 0,
    "from"        TEXT NOT NULL,
    "to"          TEXT NOT NULL,
    amount        REAL NOT NULL,
    fee           REAL DEFAULT 0,
    timestamp     INTEGER NOT NULL,
    nonce         INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'pending',
    signature     TEXT DEFAULT '',
    data          TEXT DEFAULT '',
    iso_msg_type  TEXT NOT NULL,
    iso_rwa_type  TEXT NOT NULL,
    iso_isin      TEXT DEFAULT '',
    iso_lei       TEXT DEFAULT '',
    iso_instrument TEXT DEFAULT '',
    iso_jurisdiction TEXT DEFAULT '',
    iso_compliance INTEGER DEFAULT 0,
    FOREIGN KEY (block_idx) REFERENCES blocks(idx)
  );

  CREATE TABLE IF NOT EXISTS validators (
    address       TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    stake         REAL NOT NULL,
    blocks_produced INTEGER DEFAULT 0,
    uptime        REAL DEFAULT 99.9,
    region        TEXT DEFAULT '',
    is_active     INTEGER DEFAULT 1,
    joined_block  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS isin_registry (
    isin          TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    rwa_type      TEXT NOT NULL,
    issuer        TEXT NOT NULL,
    lei           TEXT DEFAULT '',
    status        TEXT DEFAULT 'active',
    token_symbol  TEXT NOT NULL,
    total_supply  REAL DEFAULT 0,
    circulating   REAL DEFAULT 0,
    price         REAL DEFAULT 0,
    holders       INTEGER DEFAULT 0,
    created_block INTEGER DEFAULT 0,
    contract_addr TEXT DEFAULT '',
    iso_messages  INTEGER DEFAULT 0,
    jurisdiction  TEXT DEFAULT '',
    compliance    INTEGER DEFAULT 0,
    description   TEXT DEFAULT '',
    last_activity INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS balances (
    address       TEXT PRIMARY KEY,
    amount        REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS pending_transactions (
    hash          TEXT PRIMARY KEY,
    "from"        TEXT NOT NULL,
    "to"          TEXT NOT NULL,
    amount        REAL NOT NULL,
    fee           REAL DEFAULT 0,
    timestamp     INTEGER NOT NULL,
    nonce         INTEGER DEFAULT 0,
    data          TEXT DEFAULT '',
    iso_msg_type  TEXT NOT NULL,
    iso_rwa_type  TEXT NOT NULL,
    iso_isin      TEXT DEFAULT '',
    iso_lei       TEXT DEFAULT '',
    iso_instrument TEXT DEFAULT '',
    iso_jurisdiction TEXT DEFAULT '',
    iso_compliance INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS chain_meta (
    key           TEXT PRIMARY KEY,
    value         TEXT NOT NULL
  );

  -- Indexes for fast queries
  CREATE INDEX IF NOT EXISTS idx_tx_block ON transactions(block_idx);
  CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions("from");
  CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions("to");
  CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_tx_isin ON transactions(iso_isin);
  CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
  CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_isin_symbol ON isin_registry(token_symbol);
`;

// ═══════════════════════════════════════════════════
// DATABASE CLASS
// ═══════════════════════════════════════════════════

export class ChainDB {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');     // Write-Ahead Logging for performance
    this.db.pragma('synchronous = NORMAL');   // Good balance of safety/speed
    this.db.pragma('cache_size = -64000');    // 64MB cache
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
  }

  // ═══════════════════════════════════════════════════
  // BLOCKS
  // ═══════════════════════════════════════════════════

  saveBlock(block: Block): void {
    const insertBlock = this.db.prepare(`
      INSERT OR REPLACE INTO blocks (idx, timestamp, hash, previous_hash, merkle_root, nonce, validator, validator_name, stake_amount, reward, gas_used, gas_limit, size, tx_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTx = this.db.prepare(`
      INSERT OR REPLACE INTO transactions (hash, block_idx, tx_index, "from", "to", amount, fee, timestamp, nonce, status, signature, data, iso_msg_type, iso_rwa_type, iso_isin, iso_lei, iso_instrument, iso_jurisdiction, iso_compliance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const removePending = this.db.prepare(`DELETE FROM pending_transactions WHERE hash = ?`);

    const txn = this.db.transaction(() => {
      insertBlock.run(
        block.index, block.timestamp, block.hash, block.previousHash,
        block.merkleRoot, block.nonce, block.validator, block.validatorName,
        block.stakeAmount, block.reward, block.gasUsed, block.gasLimit,
        block.size, block.transactions.length
      );

      block.transactions.forEach((tx, i) => {
        insertTx.run(
          tx.hash, block.index, i, tx.from, tx.to, tx.amount, tx.fee,
          tx.timestamp, tx.nonce, tx.status, tx.signature || '', tx.data || '',
          tx.iso20022.messageType, tx.iso20022.rwaType,
          tx.iso20022.isin || '', tx.iso20022.lei || '',
          tx.iso20022.instrumentName || '', tx.iso20022.jurisdiction || '',
          tx.iso20022.complianceScore || 0
        );
        // Remove from pending
        removePending.run(tx.hash);
      });
    });

    txn();
  }

  getBlock(index: number): any | null {
    const row = this.db.prepare('SELECT * FROM blocks WHERE idx = ?').get(index) as any;
    if (!row) return null;
    const txs = this.db.prepare('SELECT * FROM transactions WHERE block_idx = ? ORDER BY tx_index').all(index);
    return { ...this.mapBlock(row), transactions: txs.map(t => this.mapTx(t as any)) };
  }

  getBlockByHash(hash: string): any | null {
    const row = this.db.prepare('SELECT * FROM blocks WHERE hash = ?').get(hash) as any;
    if (!row) return null;
    const txs = this.db.prepare('SELECT * FROM transactions WHERE block_idx = ? ORDER BY tx_index').all(row.idx);
    return { ...this.mapBlock(row), transactions: txs.map(t => this.mapTx(t as any)) };
  }

  getLatestBlock(): any | null {
    const row = this.db.prepare('SELECT * FROM blocks ORDER BY idx DESC LIMIT 1').get() as any;
    if (!row) return null;
    return this.mapBlock(row);
  }

  getRecentBlocks(count: number = 20): any[] {
    const rows = this.db.prepare('SELECT * FROM blocks ORDER BY idx DESC LIMIT ?').all(count);
    return rows.map(r => this.mapBlock(r as any));
  }

  getBlockCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM blocks').get() as any;
    return row.cnt;
  }

  // ═══════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════

  getTransaction(hash: string): any | null {
    const row = this.db.prepare('SELECT * FROM transactions WHERE hash = ?').get(hash) as any;
    return row ? this.mapTx(row) : null;
  }

  getRecentTransactions(count: number = 50): any[] {
    const rows = this.db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?').all(count);
    return rows.map(r => this.mapTx(r as any));
  }

  getTransactionCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM transactions').get() as any;
    return row.cnt;
  }

  getTransactionsByAddress(address: string, limit: number = 50): any[] {
    const rows = this.db.prepare('SELECT * FROM transactions WHERE "from" = ? OR "to" = ? ORDER BY timestamp DESC LIMIT ?').all(address, address, limit);
    return rows.map(r => this.mapTx(r as any));
  }

  // ═══════════════════════════════════════════════════
  // PENDING TRANSACTIONS
  // ═══════════════════════════════════════════════════

  savePendingTx(tx: Transaction): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO pending_transactions (hash, "from", "to", amount, fee, timestamp, nonce, data, iso_msg_type, iso_rwa_type, iso_isin, iso_lei, iso_instrument, iso_jurisdiction, iso_compliance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.hash, tx.from, tx.to, tx.amount, tx.fee, tx.timestamp, tx.nonce,
      tx.data || '', tx.iso20022.messageType, tx.iso20022.rwaType,
      tx.iso20022.isin || '', tx.iso20022.lei || '',
      tx.iso20022.instrumentName || '', tx.iso20022.jurisdiction || '',
      tx.iso20022.complianceScore || 0
    );
  }

  getPendingTransactions(limit: number = 100): Transaction[] {
    const rows = this.db.prepare('SELECT * FROM pending_transactions ORDER BY timestamp LIMIT ?').all(limit) as any[];
    return rows.map(r => {
      const tx = new Transaction({
        from: r.from, to: r.to, amount: r.amount, fee: r.fee,
        timestamp: r.timestamp, nonce: r.nonce,
        iso20022: {
          messageType: r.iso_msg_type as ISOMessageType,
          rwaType: r.iso_rwa_type as RWAType,
          isin: r.iso_isin || undefined,
          lei: r.iso_lei || undefined,
          instrumentName: r.iso_instrument || undefined,
          jurisdiction: r.iso_jurisdiction || undefined,
          complianceScore: r.iso_compliance || undefined,
        },
        data: r.data || undefined,
      });
      return tx;
    });
  }

  clearPendingTx(hash: string): void {
    this.db.prepare('DELETE FROM pending_transactions WHERE hash = ?').run(hash);
  }

  getPendingCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM pending_transactions').get() as any;
    return row.cnt;
  }

  // ═══════════════════════════════════════════════════
  // VALIDATORS
  // ═══════════════════════════════════════════════════

  saveValidator(v: Validator): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO validators (address, name, stake, blocks_produced, uptime, region, is_active, joined_block)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(v.address, v.name, v.stake, v.blocksProduced, v.uptime, v.region, v.isActive ? 1 : 0, v.joinedBlock);
  }

  getValidators(): Validator[] {
    const rows = this.db.prepare('SELECT * FROM validators ORDER BY stake DESC').all() as any[];
    return rows.map(r => ({
      address: r.address, name: r.name, stake: r.stake,
      blocksProduced: r.blocks_produced, uptime: r.uptime,
      region: r.region, isActive: !!r.is_active, joinedBlock: r.joined_block,
    }));
  }

  getValidator(address: string): Validator | null {
    const r = this.db.prepare('SELECT * FROM validators WHERE address = ?').get(address) as any;
    if (!r) return null;
    return {
      address: r.address, name: r.name, stake: r.stake,
      blocksProduced: r.blocks_produced, uptime: r.uptime,
      region: r.region, isActive: !!r.is_active, joinedBlock: r.joined_block,
    };
  }

  incrementValidatorBlocks(address: string): void {
    this.db.prepare('UPDATE validators SET blocks_produced = blocks_produced + 1 WHERE address = ?').run(address);
  }

  // ═══════════════════════════════════════════════════
  // ISIN REGISTRY
  // ═══════════════════════════════════════════════════

  saveISIN(e: ISINEntry): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO isin_registry (isin, name, rwa_type, issuer, lei, status, token_symbol, total_supply, circulating, price, holders, created_block, contract_addr, iso_messages, jurisdiction, compliance, description, last_activity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      e.isin, e.name, e.rwaType, e.issuer, e.lei, e.status,
      e.tokenSymbol, e.totalSupply, e.circulatingSupply, e.price,
      e.holders, e.createdBlock, e.contractAddress, e.isoMessages,
      e.jurisdiction, e.complianceScore, e.description, e.lastActivity
    );
  }

  getISIN(isin: string): ISINEntry | null {
    const r = this.db.prepare('SELECT * FROM isin_registry WHERE isin = ?').get(isin) as any;
    return r ? this.mapISIN(r) : null;
  }

  getAllISINs(): ISINEntry[] {
    const rows = this.db.prepare('SELECT * FROM isin_registry ORDER BY created_block DESC').all() as any[];
    return rows.map(r => this.mapISIN(r));
  }

  searchISIN(query: string): ISINEntry[] {
    const q = `%${query}%`;
    const rows = this.db.prepare(`
      SELECT * FROM isin_registry WHERE
        isin LIKE ? OR name LIKE ? OR token_symbol LIKE ? OR issuer LIKE ? OR lei LIKE ?
    `).all(q, q, q, q, q) as any[];
    return rows.map(r => this.mapISIN(r));
  }

  incrementISINMessages(isin: string): void {
    this.db.prepare('UPDATE isin_registry SET iso_messages = iso_messages + 1, last_activity = ? WHERE isin = ?').run(Date.now(), isin);
  }

  getISINCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM isin_registry').get() as any;
    return row.cnt;
  }

  // ═══════════════════════════════════════════════════
  // BALANCES
  // ═══════════════════════════════════════════════════

  getBalance(address: string): number {
    const r = this.db.prepare('SELECT amount FROM balances WHERE address = ?').get(address) as any;
    return r ? r.amount : 0;
  }

  setBalance(address: string, amount: number): void {
    this.db.prepare('INSERT OR REPLACE INTO balances (address, amount) VALUES (?, ?)').run(address, amount);
  }

  addBalance(address: string, delta: number): void {
    const current = this.getBalance(address);
    this.setBalance(address, current + delta);
  }

  // ═══════════════════════════════════════════════════
  // CHAIN METADATA
  // ═══════════════════════════════════════════════════

  getMeta(key: string): string | null {
    const r = this.db.prepare('SELECT value FROM chain_meta WHERE key = ?').get(key) as any;
    return r ? r.value : null;
  }

  setMeta(key: string, value: string): void {
    this.db.prepare('INSERT OR REPLACE INTO chain_meta (key, value) VALUES (?, ?)').run(key, value);
  }

  // ═══════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════

  getStats() {
    const blocks = this.getBlockCount();
    const txs = this.getTransactionCount();
    const validators = this.db.prepare('SELECT COUNT(*) as cnt FROM validators WHERE is_active = 1').get() as any;
    const totalStake = this.db.prepare('SELECT SUM(stake) as total FROM validators').get() as any;
    const isins = this.getISINCount();
    const mcap = this.db.prepare('SELECT SUM(price * circulating) as total FROM isin_registry').get() as any;

    return {
      totalBlocks: blocks,
      totalTransactions: txs,
      totalStaked: totalStake?.total || 0,
      activeValidators: validators?.cnt || 0,
      totalISINs: isins,
      marketCap: mcap?.total || 0,
    };
  }

  // ═══════════════════════════════════════════════════
  // CHECK STATE
  // ═══════════════════════════════════════════════════

  isInitialized(): boolean {
    return this.getBlockCount() > 0;
  }

  // ═══════════════════════════════════════════════════
  // MAPPERS (DB rows -> app objects)
  // ═══════════════════════════════════════════════════

  private mapBlock(r: any) {
    return {
      index: r.idx,
      timestamp: r.timestamp,
      hash: r.hash,
      previousHash: r.previous_hash,
      merkleRoot: r.merkle_root,
      nonce: r.nonce,
      validator: r.validator,
      validatorName: r.validator_name,
      stakeAmount: r.stake_amount,
      reward: r.reward,
      gasUsed: r.gas_used,
      gasLimit: r.gas_limit,
      size: r.size,
      transactionCount: r.tx_count,
    };
  }

  private mapTx(r: any) {
    return {
      hash: r.hash,
      from: r.from,
      to: r.to,
      amount: r.amount,
      fee: r.fee,
      timestamp: r.timestamp,
      nonce: r.nonce,
      status: r.status,
      signature: r.signature || '',
      data: r.data || '',
      iso20022: {
        messageType: r.iso_msg_type,
        rwaType: r.iso_rwa_type,
        isin: r.iso_isin || undefined,
        lei: r.iso_lei || undefined,
        instrumentName: r.iso_instrument || undefined,
        jurisdiction: r.iso_jurisdiction || undefined,
        complianceScore: r.iso_compliance || undefined,
      },
    };
  }

  private mapISIN(r: any): ISINEntry {
    return {
      isin: r.isin, name: r.name, rwaType: r.rwa_type as RWAType,
      issuer: r.issuer, lei: r.lei, status: r.status,
      tokenSymbol: r.token_symbol, totalSupply: r.total_supply,
      circulatingSupply: r.circulating, price: r.price,
      holders: r.holders, createdBlock: r.created_block,
      contractAddress: r.contract_addr, isoMessages: r.iso_messages,
      jurisdiction: r.jurisdiction, complianceScore: r.compliance,
      description: r.description, lastActivity: r.last_activity,
    };
  }

  close(): void {
    this.db.close();
  }
}

// ═══════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════

const globalForDB = globalThis as unknown as { __chainDB?: ChainDB };

export function getDB(): ChainDB {
  if (!globalForDB.__chainDB) {
    globalForDB.__chainDB = new ChainDB();
  }
  return globalForDB.__chainDB;
}
