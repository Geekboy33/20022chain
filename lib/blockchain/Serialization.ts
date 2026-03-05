// ═══════════════════════════════════════════════════════════════
// 20022CHAIN — Serialization (RLP, SSZ, ABI)
// Ethereum-compatible encoding for interoperability
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// RLP (Recursive Length Prefix)
// ─────────────────────────────────────────────────────────────

export function rlpEncode(input: Buffer | Buffer[] | (Buffer | Buffer[])[]): Buffer {
  if (Buffer.isBuffer(input)) {
    if (input.length === 1 && input[0] < 0x80) return input;
    return Buffer.concat([encodeLength(input.length, 0x80), input]);
  }
  const encoded = Buffer.concat((input as (Buffer | Buffer[])[]).map(item => 
    Array.isArray(item) ? rlpEncode(item as Buffer[]) : rlpEncode(item as Buffer)
  ));
  return Buffer.concat([encodeLength(encoded.length, 0xc0), encoded]);
}

function encodeLength(len: number, offset: number): Buffer {
  if (len < 56) return Buffer.from([offset + len]);
  const blen = Buffer.allocUnsafe(8);
  blen.writeBigUInt64BE(BigInt(len));
  let i = 0;
  while (i < 8 && blen[i] === 0) i++;
  return Buffer.concat([Buffer.from([offset + 55 + (8 - i)]), blen.subarray(i)]);
}

export function rlpDecode(data: Buffer): Buffer | (Buffer | Buffer[])[] {
  if (data.length === 0) return Buffer.alloc(0);
  const first = data[0];
  if (first < 0x80) return data.subarray(0, 1);
  if (first < 0xb8) {
    const len = first - 0x80;
    return data.subarray(1, 1 + len);
  }
  if (first < 0xc0) {
    const lenLen = first - 0xb7;
    let len = 0;
    for (let i = 0; i < lenLen; i++) len = (len << 8) | data[1 + i];
    return data.subarray(1 + lenLen, 1 + lenLen + len);
  }
  if (first < 0xf8) {
    const len = first - 0xc0;
    return decodeList(data.subarray(1, 1 + len));
  }
  const lenLen = first - 0xf7;
  let len = 0;
  for (let i = 0; i < lenLen; i++) len = (len << 8) | data[1 + i];
  return decodeList(data.subarray(1 + lenLen, 1 + lenLen + len));
}

function decodeList(data: Buffer): (Buffer | Buffer[])[] {
  const result: (Buffer | Buffer[])[] = [];
  let i = 0;
  while (i < data.length) {
    const first = data[i];
    let len: number;
    if (first < 0x80) { len = 1; result.push(data.subarray(i, i + 1)); }
    else if (first < 0xb8) { len = first - 0x80; result.push(data.subarray(i + 1, i + 1 + len)); len++; }
    else if (first < 0xc0) {
      const lenLen = first - 0xb7;
      let l = 0;
      for (let j = 0; j < lenLen; j++) l = (l << 8) | data[i + 1 + j];
      len = 1 + lenLen + l;
      result.push(data.subarray(i + 1 + lenLen, i + len));
    } else if (first < 0xf8) {
      len = first - 0xc0;
      result.push(decodeList(data.subarray(i + 1, i + 1 + len)) as any);
      len++;
    } else {
      const lenLen = first - 0xf7;
      let l = 0;
      for (let j = 0; j < lenLen; j++) l = (l << 8) | data[i + 1 + j];
      len = 1 + lenLen + l;
      result.push(decodeList(data.subarray(i + 1 + lenLen, i + len)) as any);
    }
    i += len;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Keccak256
// ─────────────────────────────────────────────────────────────

export function keccak256(data: Buffer): Buffer {
  return crypto.createHash('sha3-256').update(data).digest();
}

export function rlpHash(data: Buffer | Buffer[]): Buffer {
  return keccak256(Buffer.isBuffer(data) ? rlpEncode(data) : rlpEncode(data));
}

// ─────────────────────────────────────────────────────────────
// ABI Encoding
// ─────────────────────────────────────────────────────────────

export type ABIType = 'uint8' | 'uint256' | 'int256' | 'address' | 'bool' | 'bytes' | 'string' | 'bytes32';

export function abiEncode(types: ABIType[], values: (number | bigint | string | boolean | Buffer)[]): Buffer {
  const head: Buffer[] = [];
  const tail: Buffer[] = [];
  let headOffset = 32 * types.length;
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const v = values[i];
    if (t === 'bytes' || t === 'string') {
      const buf = typeof v === 'string' && !Buffer.isBuffer(v) ? Buffer.from(v, 'utf8') : v as Buffer;
      head.push(Buffer.alloc(32));
      head[head.length - 1].writeBigUInt64BE(BigInt(headOffset), 24);
      tail.push(uint256ToBuf(BigInt(buf.length)));
      tail.push(buf);
      if (buf.length % 32) tail.push(Buffer.alloc(32 - buf.length % 32));
      headOffset += 32 + Math.ceil(buf.length / 32) * 32;
    } else {
      head.push(abiEncodeArg(t, v));
    }
  }
  return Buffer.concat([...head, ...tail]);
}

function abiEncodeArg(t: ABIType, v: number | bigint | string | boolean | Buffer): Buffer {
  const buf = Buffer.alloc(32);
  if (t === 'uint8' || t === 'uint256') buf.writeBigUInt64BE(BigInt(v as number), 24);
  else if (t === 'int256') buf.writeBigInt64BE(BigInt(v as number), 24);
  else if (t === 'address') {
    const hex = (v as string).replace(/^0x/, '').slice(-40);
    Buffer.from(hex, 'hex').copy(buf, 12);
  } else if (t === 'bool') buf[31] = v ? 1 : 0;
  else if (t === 'bytes32') (v as Buffer).copy(buf);
  return buf;
}

function uint256ToBuf(n: bigint): Buffer {
  const buf = Buffer.alloc(32);
  buf.writeBigUInt64BE(n & BigInt('0xffffffffffffffff'), 24);
  buf.writeBigUInt64BE((n >> BigInt(64)) & BigInt('0xffffffffffffffff'), 16);
  buf.writeBigUInt64BE((n >> BigInt(128)) & BigInt('0xffffffffffffffff'), 8);
  buf.writeBigUInt64BE((n >> BigInt(192)) & BigInt('0xffffffffffffffff'), 0);
  return buf;
}

export function abiDecode(types: ABIType[], data: Buffer): (number | bigint | string | boolean | Buffer)[] {
  const result: (number | bigint | string | boolean | Buffer)[] = [];
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    if (t === 'bytes' || t === 'string') {
      const offset = Number(data.readBigUInt64BE(i * 32));
      const len = Number(data.readBigUInt64BE(offset));
      result.push(t === 'string' ? data.subarray(offset + 32, offset + 32 + len).toString('utf8') : data.subarray(offset + 32, offset + 32 + len));
    } else {
      result.push(abiDecodeArg(t, data.subarray(i * 32, (i + 1) * 32)));
    }
  }
  return result;
}

function abiDecodeArg(t: ABIType, buf: Buffer): number | bigint | string | boolean | Buffer {
  if (t === 'uint8' || t === 'uint256') return buf.readBigUInt64BE(24);
  if (t === 'int256') return buf.readBigInt64BE(24);
  if (t === 'address') return '0x' + buf.subarray(12).toString('hex');
  if (t === 'bool') return buf[31] !== 0;
  if (t === 'bytes32') return buf;
  return buf.readBigUInt64BE(24);
}

// ─────────────────────────────────────────────────────────────
// Function Selector (first 4 bytes of keccak256(signature))
// ─────────────────────────────────────────────────────────────

export function fnSelector(signature: string): Buffer {
  return keccak256(Buffer.from(signature, 'utf8')).subarray(0, 4);
}

// ─────────────────────────────────────────────────────────────
// SSZ (Simple Serialize) - Minimal implementation
// ─────────────────────────────────────────────────────────────

export function sszEncodeUint64(n: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(n);
  return buf;
}

export function sszDecodeUint64(buf: Buffer): bigint {
  return buf.readBigUInt64LE(0);
}

// ─────────────────────────────────────────────────────────────
// EIP-712 Typed Data Hash (simplified)
// ─────────────────────────────────────────────────────────────

export function typedDataHash(domainSeparator: Buffer, structHash: Buffer): Buffer {
  return keccak256(Buffer.concat([Buffer.from('1901', 'hex'), domainSeparator, structHash]));
}
