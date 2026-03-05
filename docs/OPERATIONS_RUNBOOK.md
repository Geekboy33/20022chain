# 20022Chain Operations Runbook

Quick operational guide for keeping `20022chain` stable in local/dev environments.

## Services and Ports

- Frontend/API (Next.js): `http://localhost:3005`
- Rust node API: `http://127.0.0.1:3002`

## One-command clean restart

From project root:

```bash
npm run restart:clean
```

What it does:

1. Kills any process bound to port `3005`
2. Deletes `.next` cache
3. Starts `npm run dev`

## Health checks

### Unified health endpoint

```bash
npm run health:check
```

Expected: JSON with `"ok": true`.

### Blockchain integration check

```bash
npm run verify-chain
```

Expected: `Blockchain ACTIVA. Nodo respondiendo correctamente.`

## Common incidents

### 1) UI does not load on `:3005`

Symptoms:

- Browser fails to open page
- HTTP 500 intermittently

Recovery:

1. `npm run restart:clean`
2. Hard refresh browser (`Ctrl + F5`)
3. Re-check `npm run health:check`

### 2) API returns 500 with module/chunk errors

Symptoms:

- Errors like `Cannot find module './xxx.js'`
- Missing `.next/routes-manifest.json`

Recovery:

1. `npm run restart:clean`
2. Wait for compile to finish
3. Retry endpoint

### 3) Blockchain disconnected from frontend

Symptoms:

- `/api/health` shows `"ok": false`
- `verify-chain` fails

Recovery:

1. Ensure Rust node is running on `127.0.0.1:3002`
2. Confirm `.env.local` includes:
   - `CHAIN_BACKEND=rust`
   - `CHAIN_API_URL=http://127.0.0.1:3002`
3. Restart frontend: `npm run restart:clean`

## Daily pre-flight checklist

- `npm run build` passes
- `npm run audit:prod` shows 0 vulnerabilities
- `npm run health:check` returns `"ok": true`
- `npm run verify-chain` succeeds

