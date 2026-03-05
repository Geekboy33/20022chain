// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Patricia Merkle Trie
// Verifiable state storage with Merkle proofs
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { sha256 } from './Crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type NodeType = 'branch' | 'extension' | 'leaf';

export interface TrieNode {
  type: NodeType;
  hash: string;
  raw?: Buffer;
}

export interface BranchNode extends TrieNode {
  type: 'branch';
  children: (TrieNode | null)[];
  value?: Buffer;
}

export interface ExtensionNode extends TrieNode {
  type: 'extension';
  nibbles: number[];
  next: TrieNode;
}

export interface LeafNode extends TrieNode {
  type: 'leaf';
  nibbles: number[];
  value: Buffer;
}

export interface TrieProof {
  key: string;
  value: Buffer | null;
  proofNodes: string[];
  root: string;
}

export interface TrieStats {
  nodeCount: number;
  leafCount: number;
  depth: number;
  size: number;
}

// ─────────────────────────────────────────────────────────────
// RLP Encoding (simplified for Trie)
// ─────────────────────────────────────────────────────────────

function encodeLength(len: number, offset: number): Buffer {
  if (len < 56) return Buffer.from([offset + len]);
  const blen = Buffer.allocUnsafe(8);
  blen.writeBigUInt64BE(BigInt(len));
  let i = 0;
  while (i < 8 && blen[i] === 0) i++;
  return Buffer.concat([Buffer.from([offset + 55 + (8 - i)]), blen.subarray(i)]);
}

function rlpEncode(item: Buffer | Buffer[]): Buffer {
  if (Buffer.isBuffer(item)) {
    if (item.length === 1 && item[0] < 128) return item;
    return Buffer.concat([encodeLength(item.length, 128), item]);
  }
  const enc = Buffer.concat(item.map(rlpEncode));
  return Buffer.concat([encodeLength(enc.length, 192), enc]);
}

function rlpDecode(data: Buffer): Buffer | Buffer[] {
  if (data.length === 0) return Buffer.alloc(0);
  const first = data[0];
  if (first < 128) return data.subarray(0, 1);
  if (first < 184) return data.subarray(1, 1 + first - 128);
  if (first < 192) {
    const lenLen = first - 183;
    let len = 0;
    for (let i = 0; i < lenLen; i++) len = (len << 8) | data[1 + i];
    return data.subarray(1 + lenLen, 1 + lenLen + len);
  }
  if (first < 248) return data.subarray(1, 1 + first - 192);
  const lenLen = first - 247;
  let len = 0;
  for (let i = 0; i < lenLen; i++) len = (len << 8) | data[1 + i];
  return data.subarray(1 + lenLen, 1 + lenLen + len);
}

// ─────────────────────────────────────────────────────────────
// Nibble Encoding (hex key to nibbles)
// ─────────────────────────────────────────────────────────────

function hexToNibbles(hex: string): number[] {
  const nibbles: number[] = [];
  for (let i = 0; i < hex.length; i++) {
    const b = parseInt(hex[i], 16);
    nibbles.push(b);
  }
  return nibbles;
}

function nibblesToHex(nibbles: number[]): string {
  return nibbles.map(n => n.toString(16)).join('');
}

function nibblesToBuffer(nibbles: number[]): Buffer {
  const buf = Buffer.alloc((nibbles.length + 1) >> 1);
  for (let i = 0; i < nibbles.length; i += 2) {
    buf[i >> 1] = (nibbles[i] << 4) | (nibbles[i + 1] ?? 0);
  }
  return buf;
}

// ─────────────────────────────────────────────────────────────
// Node Hashing
// ─────────────────────────────────────────────────────────────

function hashNode(node: TrieNode): string {
  if (node.raw) return sha256(node.raw).toString('hex');
  return node.hash;
}

function createLeafHash(nibbles: number[], value: Buffer): string {
  const enc = rlpEncode([Buffer.from([0x20 | nibbles.length, ...nibbles]), value]);
  return sha256(enc).toString('hex');
}

function createExtensionHash(nibbles: number[], childHash: string): string {
  const childBuf = Buffer.from(childHash, 'hex');
  const enc = rlpEncode([Buffer.from([nibbles.length, ...nibbles]), childBuf]);
  return sha256(enc).toString('hex');
}

function createBranchHash(children: (string | null)[], value?: Buffer): string {
  const items: Buffer[] = children.map(c => c ? Buffer.from(c, 'hex') : Buffer.alloc(0));
  if (value && value.length > 0) items.push(value);
  const enc = rlpEncode(items);
  return sha256(enc).toString('hex');
}

// ─────────────────────────────────────────────────────────────
// Merkle Patricia Trie
// ─────────────────────────────────────────────────────────────

export class MerkleTrie {
  private root: TrieNode | null = null;
  private nodeMap: Map<string, TrieNode> = new Map();
  private leafCount = 0;

  getRoot(): string {
    return this.root ? hashNode(this.root) : sha256(Buffer.alloc(0)).toString('hex');
  }

  get(key: string): Buffer | null {
    const keyHex = key.startsWith('0x') ? key.slice(2) : Buffer.from(key, 'utf8').toString('hex');
    const nibbles = hexToNibbles(keyHex);
    return this.getAt(this.root, nibbles, 0);
  }

  private getAt(node: TrieNode | null, nibbles: number[], depth: number): Buffer | null {
    if (!node) return null;
    if (node.type === 'leaf') {
      const leaf = node as LeafNode;
      if (nibbles.length !== leaf.nibbles.length) return null;
      for (let i = 0; i < nibbles.length; i++) if (nibbles[i] !== leaf.nibbles[i]) return null;
      return leaf.value;
    }
    if (node.type === 'extension') {
      const ext = node as ExtensionNode;
      for (let i = 0; i < ext.nibbles.length; i++) if (nibbles[depth + i] !== ext.nibbles[i]) return null;
      return this.getAt(ext.next, nibbles, depth + ext.nibbles.length);
    }
    const branch = node as BranchNode;
    if (nibbles.length <= depth) return branch.value ?? null;
    const idx = nibbles[depth];
    return this.getAt(branch.children[idx] ?? null, nibbles, depth + 1);
  }

  put(key: string, value: Buffer): void {
    const keyHex = key.startsWith('0x') ? key.slice(2) : Buffer.from(key, 'utf8').toString('hex');
    const nibbles = hexToNibbles(keyHex);
    this.root = this.putAt(this.root, nibbles, 0, value);
  }

  private putAt(node: TrieNode | null, nibbles: number[], depth: number, value: Buffer): TrieNode {
    if (!node) {
      const leaf: LeafNode = { type: 'leaf', nibbles, value, hash: createLeafHash(nibbles, value) };
      this.leafCount++;
      return leaf;
    }
    if (node.type === 'leaf') {
      const leaf = node as LeafNode;
      let prefixLen = 0;
      while (prefixLen < nibbles.length && prefixLen < leaf.nibbles.length && nibbles[prefixLen] === leaf.nibbles[prefixLen]) prefixLen++;
      if (prefixLen === nibbles.length && prefixLen === leaf.nibbles.length) {
        const newLeaf: LeafNode = { type: 'leaf', nibbles, value, hash: createLeafHash(nibbles, value) };
        this.leafCount++;
        return newLeaf;
      }
      if (prefixLen > 0) {
        const extNibbles = nibbles.slice(0, prefixLen);
        const extChild = this.putAt(null, nibbles.slice(prefixLen), 0, value);
        const branch = this.createBranchFromLeaves(leaf, leaf.nibbles.slice(prefixLen), extChild, nibbles.slice(prefixLen), value);
        return { type: 'extension', nibbles: extNibbles, next: branch, hash: '' } as ExtensionNode;
      }
      const branch = this.createBranchFromLeaves(leaf, leaf.nibbles, null, nibbles, value);
      return branch;
    }
    if (node.type === 'extension') {
      const ext = node as ExtensionNode;
      let prefixLen = 0;
      while (prefixLen < ext.nibbles.length && prefixLen < nibbles.length - depth && nibbles[depth + prefixLen] === ext.nibbles[prefixLen]) prefixLen++;
      if (prefixLen === ext.nibbles.length) {
        const newNext = this.putAt(ext.next, nibbles, depth + prefixLen, value);
        return { type: 'extension', nibbles: ext.nibbles, next: newNext, hash: '' } as ExtensionNode;
      }
      const splitExt: ExtensionNode = {
        type: 'extension',
        nibbles: ext.nibbles.slice(0, prefixLen),
        next: this.createBranchFromExtension(ext, prefixLen, nibbles, depth, value),
        hash: ''
      };
      return splitExt;
    }
    const branch = node as BranchNode;
    if (nibbles.length <= depth) {
      branch.value = value;
      return branch;
    }
    const idx = nibbles[depth];
    branch.children[idx] = this.putAt(branch.children[idx] ?? null, nibbles, depth + 1, value);
    return branch;
  }

  private createBranchFromLeaves(leaf: LeafNode, leafNibbles: number[], otherChild: TrieNode | null, otherNibbles: number[], otherValue: Buffer): BranchNode {
    const children: (TrieNode | null)[] = new Array(16).fill(null);
    if (leafNibbles.length === 0) {
      children[0] = null;
      const newLeaf: LeafNode = { type: 'leaf', nibbles: [], value: leaf.value, hash: createLeafHash([], leaf.value) };
      return { type: 'branch', children, value: leaf.value, hash: '' };
    }
    const idx = leafNibbles[0];
    const childLeaf: LeafNode = { type: 'leaf', nibbles: leafNibbles.slice(1), value: leaf.value, hash: createLeafHash(leafNibbles.slice(1), leaf.value) };
    children[idx] = childLeaf;
    if (otherChild && otherNibbles.length > 0) {
      const oidx = otherNibbles[0];
      const oLeaf: LeafNode = { type: 'leaf', nibbles: otherNibbles.slice(1), value: otherValue, hash: createLeafHash(otherNibbles.slice(1), otherValue) };
      children[oidx] = oLeaf;
    } else if (otherChild) {
      children[0] = otherChild;
    }
    return { type: 'branch', children, hash: '' };
  }

  private createBranchFromExtension(ext: ExtensionNode, prefixLen: number, nibbles: number[], depth: number, value: Buffer): BranchNode {
    const children: (TrieNode | null)[] = new Array(16).fill(null);
    const extIdx = ext.nibbles[prefixLen];
    const extRemaining = ext.nibbles.slice(prefixLen + 1);
    const extChild: ExtensionNode = extRemaining.length > 0
      ? { type: 'extension', nibbles: extRemaining, next: ext.next, hash: '' }
      : ext.next as ExtensionNode;
    children[extIdx] = extRemaining.length > 0 ? extChild : ext.next;
    const valIdx = nibbles[depth + prefixLen];
    const valNibbles = nibbles.slice(depth + prefixLen + 1);
    const valLeaf: LeafNode = { type: 'leaf', nibbles: valNibbles, value, hash: createLeafHash(valNibbles, value) };
    children[valIdx] = valLeaf;
    return { type: 'branch', children, hash: '' };
  }

  delete(key: string): boolean {
    const prev = this.get(key);
    if (!prev) return false;
    const keyHex = key.startsWith('0x') ? key.slice(2) : Buffer.from(key, 'utf8').toString('hex');
    const nibbles = hexToNibbles(keyHex);
    this.root = this.deleteAt(this.root, nibbles, 0);
    this.leafCount--;
    return true;
  }

  private deleteAt(node: TrieNode | null, nibbles: number[], depth: number): TrieNode | null {
    if (!node) return null;
    if (node.type === 'leaf') {
      const leaf = node as LeafNode;
      if (nibbles.length !== leaf.nibbles.length) return node;
      for (let i = 0; i < nibbles.length; i++) if (nibbles[i] !== leaf.nibbles[i]) return node;
      return null;
    }
    if (node.type === 'extension') {
      const ext = node as ExtensionNode;
      for (let i = 0; i < ext.nibbles.length; i++) if (nibbles[depth + i] !== ext.nibbles[i]) return node;
      const newNext = this.deleteAt(ext.next, nibbles, depth + ext.nibbles.length);
      if (!newNext) return null;
      return { type: 'extension', nibbles: ext.nibbles, next: newNext, hash: '' } as ExtensionNode;
    }
    const branch = node as BranchNode;
    if (nibbles.length <= depth) {
      branch.value = undefined;
      const nonNull = branch.children.filter(c => c);
      if (nonNull.length === 0) return null;
      if (nonNull.length === 1 && !branch.value) return nonNull[0]!;
      return branch;
    }
    const idx = nibbles[depth];
    branch.children[idx] = this.deleteAt(branch.children[idx] ?? null, nibbles, depth + 1);
    const nonNull = branch.children.filter(c => c);
    if (nonNull.length === 0 && !branch.value) return null;
    return branch;
  }

  contains(key: string): boolean {
    return this.get(key) !== null;
  }

  getProof(key: string): TrieProof | null {
    const value = this.get(key);
    const keyHex = key.startsWith('0x') ? key.slice(2) : Buffer.from(key, 'utf8').toString('hex');
    const nibbles = hexToNibbles(keyHex);
    const proof: string[] = [];
    this.collectProof(this.root, nibbles, 0, proof);
    return {
      key,
      value,
      proofNodes: proof,
      root: this.getRoot()
    };
  }

  private collectProof(node: TrieNode | null, nibbles: number[], depth: number, proof: string[]): boolean {
    if (!node) return false;
    const h = hashNode(node);
    if (node.type === 'leaf') {
      const leaf = node as LeafNode;
      if (nibbles.length !== leaf.nibbles.length) return false;
      for (let i = 0; i < nibbles.length; i++) if (nibbles[i] !== leaf.nibbles[i]) return false;
      proof.push(h);
      return true;
    }
    if (node.type === 'extension') {
      const ext = node as ExtensionNode;
      for (let i = 0; i < ext.nibbles.length; i++) if (nibbles[depth + i] !== ext.nibbles[i]) return false;
      proof.push(h);
      return this.collectProof(ext.next, nibbles, depth + ext.nibbles.length, proof);
    }
    const branch = node as BranchNode;
    proof.push(h);
    if (nibbles.length <= depth) return true;
    const idx = nibbles[depth];
    return this.collectProof(branch.children[idx] ?? null, nibbles, depth + 1, proof);
  }

  verifyProof(proof: TrieProof): boolean {
    const keyHex = proof.key.startsWith('0x') ? proof.key.slice(2) : Buffer.from(proof.key, 'utf8').toString('hex');
    const nibbles = hexToNibbles(keyHex);
    let computedRoot = proof.value !== null
      ? createLeafHash(nibbles, proof.value)
      : sha256(Buffer.alloc(0)).toString('hex');
    for (let i = proof.proofNodes.length - 1; i >= 0; i--) {
      computedRoot = sha256(Buffer.concat([Buffer.from(computedRoot, 'hex'), Buffer.from(proof.proofNodes[i], 'hex')])).toString('hex');
    }
    return computedRoot === proof.root;
  }

  getStats(): TrieStats {
    const depth = this.computeDepth(this.root, 0);
    return {
      nodeCount: this.nodeMap.size || 1,
      leafCount: this.leafCount,
      depth,
      size: this.leafCount
    };
  }

  private computeDepth(node: TrieNode | null, d: number): number {
    if (!node) return d;
    if (node.type === 'leaf') return d + 1;
    if (node.type === 'extension') return this.computeDepth((node as ExtensionNode).next, d + 1);
    const branch = node as BranchNode;
    let max = d;
    for (const c of branch.children) {
      if (c) max = Math.max(max, this.computeDepth(c, d + 1));
    }
    return max;
  }

  *entries(): Generator<[string, Buffer]> {
    yield* this.entriesAt(this.root, []);
  }

  private *entriesAt(node: TrieNode | null, prefix: number[]): Generator<[string, Buffer]> {
    if (!node) return;
    if (node.type === 'leaf') {
      const leaf = node as LeafNode;
      yield [nibblesToHex([...prefix, ...leaf.nibbles]), leaf.value];
      return;
    }
    if (node.type === 'extension') {
      const ext = node as ExtensionNode;
      yield* this.entriesAt(ext.next, [...prefix, ...ext.nibbles]);
      return;
    }
    const branch = node as BranchNode;
    if (branch.value) yield [nibblesToHex(prefix), branch.value];
    for (let i = 0; i < 16; i++) {
      if (branch.children[i]) yield* this.entriesAt(branch.children[i], [...prefix, i]);
    }
  }

  snapshot(): Map<string, Buffer> {
    const m = new Map<string, Buffer>();
    for (const [k, v] of this.entries()) m.set(k, v);
    return m;
  }

  static fromSnapshot(snap: Map<string, Buffer>): MerkleTrie {
    const trie = new MerkleTrie();
    for (const [k, v] of snap) trie.put(k, v);
    return trie;
  }
}
