// Network layer: raw JSON-RPC calls and the Alchemy NFT API.
// Everything here throws CallError on failure and knows nothing about
// scanning strategy, retries or pacing - that lives in scan.js.

import { ALCHEMY_KEY } from './chains.js'

const SIG_OWNER_OF = '0x6352211e'     // ownerOf(uint256)
const SIG_TOTAL_SUPPLY = '0x18160ddd' // totalSupply()
const ZERO_ADDRESS = '0x' + '0'.repeat(40)

const RPC_TIMEOUT = 30_000
const API_TIMEOUT = 20_000

const httpJson = async (url, options, timeoutMs, signal) => {
  let response
  try {
    response = await fetch(url, { ...options, signal: combineSignals(signal, timeoutMs) })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new CallError('network error or timeout')
  }
  if (!response.ok) {
    throw new CallError(`HTTP ${response.status}`, {
      status: response.status,
      retryAfterMs: parseRetryAfter(response),
    })
  }
  try {
    return await response.json()
  } catch {
    throw new CallError('unparseable response')
  }
}

const rpcCall = (url, payload, signal) =>
  httpJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, RPC_TIMEOUT, signal)

// ownerOf() for many token ids in one batched request.
// Resolves to Map<tokenId, ownerAddress>; burned or unminted ids are simply absent.
// Throws CallError if the response is unusable and the batch should be retried.
export const ownersOf = async (url, contract, tokenIds, signal) => {
  const payload = tokenIds.map((tokenId, index) => ({
    jsonrpc: '2.0',
    id: index,
    method: 'eth_call',
    params: [{ to: contract, data: SIG_OWNER_OF + tokenId.toString(16).padStart(64, '0') }, 'latest'],
  }))

  const body = await rpcCall(url, tokenIds.length === 1 ? payload[0] : payload, signal)
  const rows = Array.isArray(body) ? body : [body]

  const owners = new Map()
  for (const row of rows) {
    if (!row || !Number.isInteger(row.id) || row.id < 0 || row.id >= tokenIds.length) {
      throw new CallError('malformed batch response')
    }
    if (row.error) {
      if (isRevert(row.error)) continue
      throw new CallError('node error: ' + String(row.error.message || row.error.code).slice(0, 40))
    }
    const address = resultToAddress(row.result)
    if (address) owners.set(tokenIds[row.id], address)
  }
  return owners
}

// totalSupply() - null when the contract doesn't implement it or returns nonsense
export const totalSupply = async (url, contract, signal) => {
  const body = await rpcCall(url, {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
    params: [{ to: contract, data: SIG_TOTAL_SUPPLY }, 'latest'],
  }, signal)

  if (!body || body.error || !body.result || body.result === '0x') return null
  const supply = parseInt(body.result, 16)
  return Number.isFinite(supply) && supply > 0 && supply < 10_000_000 ? supply : null
}

// Alchemy balances arrive as numbers, decimal strings or hex strings
const asCount = (value) => {
  if (typeof value === 'number') return Math.max(0, Math.floor(value)) || 0
  if (typeof value !== 'string') return 0
  return (parseInt(value.trim(), value.trim().startsWith('0x') ? 16 : 10)) || 0
}

// One page of Alchemy's getOwnersForContract NFT API.
// Resolves to { counts: Map<ownerAddress, tokenCount>, next: pageKey | undefined }
export const ownersPage = async (chain, contract, pageKey, signal) => {
  const url = new URL(`https://${chain}.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getOwnersForContract`)
  url.searchParams.set('contractAddress', contract)
  url.searchParams.set('withTokenBalances', 'true')
  if (pageKey) url.searchParams.set('pageKey', pageKey)

  const body = await httpJson(url, {}, API_TIMEOUT, signal)
  if (!Array.isArray(body?.owners)) throw new CallError('unexpected API response')

  const counts = new Map()
  for (const { ownerAddress, tokenBalances } of body.owners) {
    const address = String(ownerAddress || '').toLowerCase()
    if (!/^0x[0-9a-f]{40}$/.test(address)) continue
    let count = 0
    for (const balance of tokenBalances || []) count += asCount(balance.balance)
    if (count > 0) counts.set(address, (counts.get(address) || 0) + count)
  }
  return { counts, next: body.pageKey }
}

// support

export class CallError extends Error {
  constructor(message, { status = 0, retryAfterMs = 0 } = {}) {
    super(message)
    this.name = 'CallError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

export const alchemyRpcUrl = (chain) => `https://${chain}.g.alchemy.com/v2/${ALCHEMY_KEY}`

// Short human-readable reason for the activity log
export const reason = (err) => {
  if (err instanceof CallError) return err.message
  if (err?.name === 'TimeoutError') return 'timed out'
  if (err?.name === 'AbortError') return 'aborted'
  return String(err?.message || err).slice(0, 60)
}

const combineSignals = (signal, timeoutMs) => {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

const parseRetryAfter = (response) => {
  const value = response.headers.get('Retry-After')
  if (!value) return 0
  const seconds = Number(value)
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now()
  return ms > 0 ? Math.min(ms, 30_000) : 0
}

// A revert means "this token id doesn't exist" - that's an answer, not a failure
const isRevert = (error) =>
  error.code === 3 || String(error.message || '').toLowerCase().includes('revert')

const resultToAddress = (hex) => {
  if (typeof hex !== 'string' || hex.length < 66) return null
  const address = '0x' + hex.slice(-40).toLowerCase()
  return address === ZERO_ADDRESS ? null : address
}
