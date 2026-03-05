/* ═══════════════════════════════════════════════════════════════════════
   20022Chain — SWIFT / IBAN Payment Network API
   ═══════════════════════════════════════════════════════════════════════
   REST API for certified banking entities to:
   • Query currencies, entities, stats
   • Initiate SWIFT/IBAN/SEPA transfers
   • Track payment status (UETR)
   • Manage API keys
   • Get real-time exchange rates
   ═══════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { getSwiftEngine } from '@/lib/blockchain/SwiftPayments';

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ────────────────────────── GET ──────────────────────────
export async function GET(req: NextRequest) {
  const engine = getSwiftEngine();
  const { searchParams: q } = new URL(req.url);
  const action = q.get('action') || 'overview';

  switch (action) {

    /* ═══ OVERVIEW ═══ */
    case 'overview':
      return json({ success: true, stats: engine.getStats() });

    /* ═══ CURRENCIES ═══ */
    case 'currencies': {
      const category = q.get('category');
      let currencies = engine.getCurrencies();
      if (category) currencies = currencies.filter(c => c.category === category);
      return json({ success: true, currencies, total: currencies.length });
    }

    case 'currency': {
      const iso = q.get('iso');
      if (!iso) return json({ success: false, error: 'Missing iso parameter' }, 400);
      const cur = engine.getCurrency(iso.toUpperCase());
      if (!cur) return json({ success: false, error: 'Currency not found' }, 404);
      return json({ success: true, currency: cur });
    }

    case 'rates': {
      const currencies = engine.getActiveCurrencies();
      const rates = currencies.map(c => ({
        iso4217: c.iso4217,
        name: c.name,
        symbol: c.symbol,
        contractName: c.contractName,
        exchangeRateUSD: c.exchangeRateUSD,
        lastUpdate: c.lastRateUpdate,
        category: c.category,
      }));
      return json({ success: true, rates, baseCurrency: 'USD', timestamp: Date.now() });
    }

    /* ═══ ENTITIES ═══ */
    case 'entities': {
      const type = q.get('type');
      const certified = q.get('certified');
      let entities = engine.getEntities();
      if (type) entities = entities.filter(e => e.type === type);
      if (certified === 'true') entities = entities.filter(e => e.verificationLevel === 'FULLY_CERTIFIED');
      // Strip API keys from public response
      const safe = entities.map(e => ({ ...e, apiKeys: e.apiKeys.map(k => ({ id: k.id, label: k.label, permissions: k.permissions, isActive: k.isActive, createdAt: k.createdAt })) }));
      return json({ success: true, entities: safe, total: safe.length });
    }

    case 'entity': {
      const id = q.get('id');
      const bic = q.get('bic');
      let entity;
      if (id) entity = engine.getEntity(id);
      else if (bic) entity = engine.getEntityByBIC(bic.toUpperCase());
      if (!entity) return json({ success: false, error: 'Entity not found' }, 404);
      // Strip secrets
      const safe = { ...entity, apiKeys: entity.apiKeys.map(k => ({ id: k.id, label: k.label, permissions: k.permissions, isActive: k.isActive, createdAt: k.createdAt })) };
      return json({ success: true, entity: safe });
    }

    /* ═══ PAYMENTS ═══ */
    case 'payments': {
      const limit = parseInt(q.get('limit') || '50');
      const entityId = q.get('entityId');
      let payments;
      if (entityId) payments = engine.getPaymentsByEntity(entityId);
      else payments = engine.getPayments(limit);
      return json({ success: true, payments, total: payments.length });
    }

    case 'payment': {
      const uetr = q.get('uetr') || q.get('id');
      if (!uetr) return json({ success: false, error: 'Missing uetr/id parameter' }, 400);
      const payment = engine.getPayment(uetr);
      if (!payment) return json({ success: false, error: 'Payment not found' }, 404);
      return json({ success: true, payment });
    }

    case 'track': {
      const uetr = q.get('uetr');
      if (!uetr) return json({ success: false, error: 'Missing uetr parameter' }, 400);
      const payment = engine.getPayment(uetr);
      if (!payment) return json({ success: false, error: 'Payment not found' }, 404);
      return json({
        success: true,
        tracking: {
          uetr: payment.id,
          status: payment.status,
          messageType: payment.messageType,
          currency: payment.currency,
          amount: payment.amount,
          senderBIC: payment.senderBIC,
          receiverBIC: payment.receiverBIC,
          createdAt: payment.createdAt,
          processedAt: payment.processedAt,
          settledAt: payment.settledAt,
          completedAt: payment.completedAt,
          txHash: payment.txHash,
          blockNumber: payment.blockNumber,
          amlStatus: payment.amlStatus,
          sanctionsCheck: payment.sanctionsCheck,
        }
      });
    }

    /* ═══ API DOCS (for UI) ═══ */
    case 'docs': {
      return json({
        success: true,
        api: {
          version: 'v1',
          baseUrl: '/api/swift',
          authentication: 'Bearer API Key in Authorization header → api_20022_xxxxx',
          endpoints: [
            { method: 'GET',  path: '?action=overview',         description: 'Network overview stats' },
            { method: 'GET',  path: '?action=currencies',       description: 'List all tokenized currencies' },
            { method: 'GET',  path: '?action=currency&iso=USD',  description: 'Get specific currency details' },
            { method: 'GET',  path: '?action=rates',             description: 'Real-time FX rates (base: USD)' },
            { method: 'GET',  path: '?action=entities',          description: 'List certified banking entities' },
            { method: 'GET',  path: '?action=entity&bic=CHASUS33', description: 'Get entity by SWIFT BIC' },
            { method: 'GET',  path: '?action=payments&limit=50', description: 'Recent payments' },
            { method: 'GET',  path: '?action=track&uetr=xxx',   description: 'Track payment by UETR' },
            { method: 'POST', path: '?action=transfer',         description: 'Initiate SWIFT/IBAN transfer' },
            { method: 'POST', path: '?action=register',         description: 'Register new banking entity' },
          ],
          messageTypes: [
            'pacs.008 — FI-to-FI Customer Credit Transfer',
            'pacs.009 — FI-to-FI Institution Credit Transfer',
            'pacs.002 — Payment Status Report',
            'pacs.004 — Payment Return',
            'pain.001 — Customer Credit Transfer Initiation',
            'sepa.sct — SEPA Credit Transfer',
            'sepa.sdd — SEPA Direct Debit',
            'swift.mt103 — SWIFT Customer Transfer',
            'swift.mt202 — SWIFT Bank Transfer',
            'swift.gpi — SWIFT GPI Tracker',
          ],
          sampleTransfer: {
            action: 'transfer',
            body: {
              apiKey: 'api_20022_your_key_here',
              receiverBIC: 'DEUTDEFF',
              receiverName: 'Deutsche Bank AG',
              receiverIBAN: 'DE89370400440532013000',
              currency: 'EUR',
              amount: 50000,
              messageType: 'pacs.008',
              remittanceInfo: 'Invoice #12345 — Trade settlement',
              priority: 'NORMAL',
              chargeType: 'SHA',
            }
          }
        }
      });
    }

    default:
      return json({ success: false, error: `Unknown action: ${action}` }, 400);
  }
}

// ────────────────────────── POST ──────────────────────────
export async function POST(req: NextRequest) {
  const engine = getSwiftEngine();

  try {
    const body = await req.json();
    const action = body.action || 'transfer';

    switch (action) {

      /* ═══ INITIATE TRANSFER ═══ */
      case 'transfer': {
        const { apiKey, receiverBIC, receiverIBAN, receiverName, currency, amount, messageType, remittanceInfo, priority, chargeType } = body;

        // API Key validation
        if (!apiKey) return json({ success: false, error: 'Missing apiKey — authentication required' }, 401);
        const auth = engine.validateAPIKey(apiKey);
        if (!auth.valid || !auth.entity) return json({ success: false, error: 'Invalid API key' }, 403);
        if (!auth.permissions?.includes('TRANSFER')) return json({ success: false, error: 'API key does not have TRANSFER permission' }, 403);

        // Validation
        if (!receiverBIC || !currency || !amount || !messageType) {
          return json({ success: false, error: 'Missing required fields: receiverBIC, currency, amount, messageType' }, 400);
        }

        const result = engine.initiatePayment({
          senderEntityId: auth.entity.id,
          receiverBIC,
          receiverIBAN,
          receiverName: receiverName || receiverBIC,
          currency: currency.toUpperCase(),
          amount: parseFloat(amount),
          messageType,
          remittanceInfo: remittanceInfo || '',
          priority: priority || 'NORMAL',
          chargeType: chargeType || 'SHA',
        });

        if ('error' in result) return json({ success: false, error: result.error }, 400);

        return json({
          success: true,
          payment: {
            uetr: result.id,
            status: result.status,
            messageType: result.messageType,
            currency: result.currency,
            amount: result.amount,
            fee: result.fee,
            senderBIC: result.senderBIC,
            receiverBIC: result.receiverBIC,
            priority: result.priority,
            valueDate: result.valueDate,
            createdAt: result.createdAt,
            trackUrl: `/api/swift?action=track&uetr=${result.id}`,
          }
        }, 201);
      }

      /* ═══ REGISTER ENTITY ═══ */
      case 'register': {
        const { name, legalName, type, swiftBIC, lei, country, regulatoryBody, licenseNumber, contactEmail } = body;
        if (!name || !legalName || !type || !swiftBIC || !lei || !country) {
          return json({ success: false, error: 'Missing required fields: name, legalName, type, swiftBIC, lei, country' }, 400);
        }

        // Check if BIC already registered
        if (engine.getEntityByBIC(swiftBIC)) {
          return json({ success: false, error: `Entity with BIC ${swiftBIC} already registered` }, 409);
        }

        const { createHash: ch, randomBytes: rb } = require('crypto');
        const entity = {
          id: rb(16).toString('hex'),
          name, legalName, type,
          swiftBIC: swiftBIC.toUpperCase(),
          lei, country: country.toUpperCase(),
          jurisdiction: body.jurisdiction || `${country} Regulatory Authority`,
          regulatoryBody: regulatoryBody || 'Pending',
          licenseNumber: licenseNumber || 'Pending',
          verificationLevel: 'KYB_SUBMITTED' as const,
          apiKeys: [],
          allowedCurrencies: ['USD', 'EUR'],  // Start with basics
          dailyLimit: 1_000_000,              // $1M initial limit
          monthlyVolume: 0,
          totalTransactions: 0,
          complianceScore: 0,
          amlRating: 'MEDIUM' as const,
          kybDocuments: [],
          walletAddress: `archt:bank:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}:${ch('sha256').update(name + Date.now().toString()).digest('hex').slice(0, 16)}`,
          ipWhitelist: [],
          createdAt: Date.now(),
          lastActivity: Date.now(),
          contactEmail: contactEmail || '',
          correspondentBanks: [],
          supportedRails: ['pacs.008', 'pacs.002'] as any[],
          settlementAccount: `archt:bank:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}-stl:${ch('sha256').update(name + 'stl').digest('hex').slice(0, 16)}`,
        };

        engine.entities.push(entity as any);

        return json({
          success: true,
          entity: {
            id: entity.id,
            name: entity.name,
            swiftBIC: entity.swiftBIC,
            walletAddress: entity.walletAddress,
            verificationLevel: entity.verificationLevel,
            message: 'Entity registered successfully. Submit KYB documents for full certification.',
            nextSteps: [
              '1. Upload KYB documents via POST ?action=kyb-upload',
              '2. Our compliance team will verify within 24-48 hours',
              '3. Once FULLY_CERTIFIED, generate API keys via POST ?action=generate-key',
              '4. Start making transfers via POST ?action=transfer',
            ]
          }
        }, 201);
      }

      /* ═══ GENERATE API KEY ═══ */
      case 'generate-key': {
        const { entityId, label, permissions } = body;
        const entity = engine.getEntity(entityId);
        if (!entity) return json({ success: false, error: 'Entity not found' }, 404);
        if (entity.verificationLevel !== 'FULLY_CERTIFIED') return json({ success: false, error: 'Entity must be FULLY_CERTIFIED to generate API keys' }, 403);

        const { randomBytes: rb, createHash: ch } = require('crypto');
        const keyStr = `api_20022_${rb(16).toString('hex')}`;
        const secretStr = rb(32).toString('hex');
        const newKey = {
          id: rb(16).toString('hex'),
          key: keyStr,
          secret: ch('sha256').update(secretStr).digest('hex'),
          label: label || 'API Key',
          permissions: permissions || ['READ', 'TRANSFER'],
          rateLimit: 5000,
          ipRestriction: [],
          createdAt: Date.now(),
          lastUsed: 0,
          isActive: true,
        };

        entity.apiKeys.push(newKey);

        return json({
          success: true,
          apiKey: {
            id: newKey.id,
            key: keyStr,
            secret: secretStr,   // Only shown ONCE
            label: newKey.label,
            permissions: newKey.permissions,
            warning: 'Store the secret securely — it will NOT be shown again.',
          }
        }, 201);
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400);
    }

  } catch (err: any) {
    return json({ success: false, error: err.message || 'Internal server error' }, 500);
  }
}
