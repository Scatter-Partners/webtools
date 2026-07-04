// Holder discovery for a single collection. The UI groups the resulting
// owner counts into tiers; this file only finds owners.
//
// Strategy, in order of preference:
//
//   1. Alchemy NFT API (getOwnersForContract) - one paginated endpoint that
//      returns every owner with balances. Only for chains Alchemy carries,
//      and only when the user kept the auto-detected range (the API always
//      covers the whole collection, so a manual range must sweep instead).
//
//   2. Owner sweep - walk every token id in [firstId, lastId] calling
//      ownerOf() in batched JSON-RPC requests against the chain's public
//      endpoint. Batch size is fixed per chain; parallelism and inter-batch
//      delay are tuned live by a small AIMD pacer (raise slowly while things
//      work, back off hard on errors) so we settle just under the endpoint's
//      rate limit.
//
//   3. If the public endpoint keeps failing mid-sweep, the sweep rotates to
//      the next public RPC and finally to the Alchemy RPC (when the chain
//      exists there), carrying on where it left off. Failed batches are
//      re-queued, not lost.
//
// The job object for scanHolders:
//   { chain, contract, firstId, lastId, preferApi, signal,
//     log, onPhase, onProgress, onOwners, onFailed }
//
//   log(kind, text)                    - activity log line
//   onPhase({ phase, ... })            - 'api' | 'sweep'
//   onProgress({ queried, total })     - sweep progress, cumulative
//   onOwners(Map<address, count>)      - owners found since the last call
//   onFailed([tokenIds])               - ids that resolved to no owner

import { chainSettings } from './chains.js'
import { CallError, alchemyRpcUrl, ownersOf, ownersPage, reason, totalSupply } from './calls.js'

const BACKOFF_MS = [1500, 3000, 6000, 12000]
const API_BACKOFF_MS = [1000, 3000, 8000]
const MAX_WORKERS = 8

// Thrown when a collection can't be scanned at all
export class SkipScan extends Error {}

// Returns:
//   {
//     source: 'api' | 'sweep',
//     holders: Map<address, tokenCount>,
//     tokens,        // owned tokens seen
//     queried,       // token ids checked (sweep) or tokens returned (api)
//     failedIds,     // sorted ids with no owner: burned, unminted, or lost to errors
//     lostToErrors,  // subset of failedIds caused by RPC failures
//     switchedRpc,   // sweep had to fail over to another endpoint
//   }
export async function scanHolders(job) {
  const settings = chainSettings(job.chain)

  if (job.preferApi && settings.alchemy) {
    try {
      return await viaAlchemyApi(job)
    } catch (err) {
      if (job.signal.aborted || err instanceof SkipScan) throw err
      job.log('warning', `NFT API unavailable (${reason(err)}), switching method: sweeping`)
    }
  }

  if (!Number.isInteger(job.firstId) || !Number.isInteger(job.lastId)) {
    throw new SkipScan('token range unknown - enter Start/End manually')
  }
  return viaSweep(job, settings)
}

// ---------------------------------------------------------------------------
// Range detection (fills the Start/End fields before a scan)
// ---------------------------------------------------------------------------

// Detects the token id range of an ERC-721 collection.
// Returns { startId, endId } - either is null when it couldn't be determined.
// totalSupply() undercounts after burns, so we probe above the estimate with
// a boundary search to find the real highest owned id.
export async function detectRange({ chain, contract, signal, wantStart = true, wantEnd = true }) {
  const settings = chainSettings(chain)
  const endpoints = [...(settings.rpcs || [])]
  if (settings.alchemy) endpoints.push(alchemyRpcUrl(chain))
  if (!endpoints.length) throw new SkipScan('no endpoint available for this chain')

  // walk the endpoints in failover order until one of them answers
  let found = { startId: null, endId: null }
  for (const url of endpoints) {
    signal.throwIfAborted()
    found = await probeRange(url, contract, settings, signal, wantStart, wantEnd)
    const empty = (!wantStart || found.startId === null) && (!wantEnd || found.endId === null)
    if (!empty) break
  }
  return found
}

async function probeRange(url, contract, settings, signal, wantStart, wantEnd) {
  let supply = null
  if (wantEnd) {
    try {
      supply = await totalSupply(url, contract, signal)
    } catch (err) {
      if (signal.aborted) throw err
      /* leave null */
    }
  }

  let startId = null
  if (wantStart) {
    for (const id of [0, 1]) {
      signal.throwIfAborted()
      try {
        const owners = await ownersOf(url, contract, [id], signal)
        if (owners.size > 0) {
          startId = id
          break
        }
      } catch (err) {
        if (signal.aborted) throw err
        /* keep probing */
      }
    }
  }

  let endId = null
  if (wantEnd && supply !== null) {
    endId = startId === 0 ? supply - 1 : supply
    const actualMax = await findMaxTokenId(url, contract, endId, settings.batch, signal)
    if (actualMax !== null) endId = actualMax
  }

  return { startId, endId }
}

// ownerOf() over a window of ids, split into chain-sized batches.
// Resolves to Map<tokenId, address> for the whole window.
const windowOwners = async (url, contract, ids, batch, signal) => {
  const owners = new Map()
  for (let i = 0; i < ids.length; i += batch) {
    signal.throwIfAborted()
    const found = await ownersOf(url, contract, ids.slice(i, i + batch), signal)
    for (const [id, address] of found) owners.set(id, address)
  }
  return owners
}

// Finds the highest owned token id above knownEnd (burns make totalSupply()
// unreliable). Returns null when nothing exists above knownEnd.
//
// Phase 1 - quick check: probe the window right above knownEnd; if it is
//   empty, nothing exists above and we return null immediately.
// Phase 2 - exponential jump: start at knownEnd+200 and double the distance
//   while windows keep having owners, giving [low(owned), high(empty)].
// Phase 3 - binary search: probe midpoint windows until the gap is small.
// Phase 4 - linear scan: read the remaining window and take the highest
//   owned id - that's the exact answer.
async function findMaxTokenId(url, contract, knownEnd, batch, signal) {
  const WINDOW = 20
  const BINARY_THRESHOLD = WINDOW * 3
  const MAX_JUMP = 100_000

  const idsFrom = (start, count) => Array.from({ length: count }, (_, i) => start + i)
  const ownedAbove = async (start) =>
    (await windowOwners(url, contract, idsFrom(start, WINDOW), batch, signal)).size > 0

  // Phase 1 - quick check
  try {
    if (!await ownedAbove(knownEnd + 1)) return null
  } catch (err) {
    if (signal.aborted) throw err
    return null
  }

  // Phase 2 - exponential jump to [low(owned), high(empty)]
  let low = knownEnd
  let high = knownEnd + 200
  while (high - knownEnd <= MAX_JUMP) {
    try {
      if (!await ownedAbove(high)) break
      low = high
      high += (high - knownEnd) // double the distance from the origin each time
    } catch (err) {
      if (signal.aborted) throw err
      break
    }
  }

  // Phase 3 - binary search down to a scannable window
  while (high - low > BINARY_THRESHOLD) {
    const mid = Math.floor((low + high) / 2)
    try {
      if (await ownedAbove(mid)) low = mid + WINDOW
      else high = mid
    } catch (err) {
      if (signal.aborted) throw err
      high = mid
    }
  }

  // Phase 4 - linear scan of the narrow window for the exact highest owned id
  try {
    const owners = await windowOwners(url, contract, idsFrom(low, high - low + WINDOW), batch, signal)
    let max = knownEnd
    for (const id of owners.keys()) if (id > max) max = id
    return max > knownEnd ? max : null
  } catch (err) {
    if (signal.aborted) throw err
    return low > knownEnd ? low : null
  }
}

// ---------------------------------------------------------------------------
// Strategy 1: Alchemy NFT API
// ---------------------------------------------------------------------------

async function viaAlchemyApi({ chain, contract, signal, log, onPhase, onOwners }) {
  const holders = new Map()
  let pageKey
  let page = 0

  onPhase?.({ phase: 'api', page: ++page })
  log('info', 'Method: NFT API')

  while (true) {
    signal.throwIfAborted()
    const result = await retrying(
      () => ownersPage(chain, contract, pageKey, signal),
      API_BACKOFF_MS,
      signal,
      (err, wait) => log('warning', `API page ${page} failed (${reason(err)}), retrying in ${wait / 1000}s`),
    )
    mergeCounts(holders, result.counts)
    onOwners?.(result.counts)
    if (!result.next) break
    pageKey = result.next
    onPhase?.({ phase: 'api', page: ++page })
  }

  let tokens = 0
  for (const count of holders.values()) tokens += count
  log('ok', `NFT API returned ${holders.size} owner(s), ${tokens} token(s)`)
  return { source: 'api', holders, tokens, queried: tokens, failedIds: [], lostToErrors: 0, switchedRpc: false }
}

// Retry an async call with fixed backoff, honouring Retry-After hints
async function retrying(call, backoff, signal, onRetry) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call()
    } catch (err) {
      signal.throwIfAborted()
      const retryable = !(err instanceof CallError) || err.status === 429 || err.status >= 500 || err.status === 0
      if (!retryable || attempt >= backoff.length) throw err
      const wait = Math.max(backoff[attempt], err.retryAfterMs || 0)
      onRetry?.(err, wait)
      await sleep(wait)
    }
  }
}

// ---------------------------------------------------------------------------
// Strategy 2 + 3: owner sweep with live pacing and endpoint failover
// ---------------------------------------------------------------------------

// AIMD pacing: after every clean streak admit one more worker and trim the
// delay; on any failure halve the workers and lengthen the delay. Converges
// just below whatever the endpoint tolerates.
function makePacer({ workers, delay }) {
  let streak = 0
  const pacer = {
    workers,
    delay,
    settled() {
      if (++streak < 10) return
      streak = 0
      pacer.workers = Math.min(MAX_WORKERS, pacer.workers + 1)
      pacer.delay = Math.floor(pacer.delay * 0.8)
    },
    stressed(retryAfterMs = 0) {
      streak = 0
      pacer.workers = Math.max(1, Math.ceil(pacer.workers / 2))
      pacer.delay = Math.min(5000, Math.max(300, pacer.delay * 2, retryAfterMs))
    },
    async rest() {
      if (pacer.delay > 0) await sleep(pacer.delay)
    },
  }
  return pacer
}

// Sweeps ownerOf() across [firstId, lastId].
//
// 1. Choose the first public RPC, or Alchemy RPC when none exists.
// 2. Batch ids and run them through an adaptive worker/delay pacer.
// 3. Retry failed batches, rotate public RPCs, then fall back to Alchemy.
async function viaSweep(job, settings) {
  const { chain, contract, firstId, lastId, signal, log, onPhase, onProgress, onOwners, onFailed } = job

  // --- endpoint selection + armed failover ----------------------------------
  const publicRpcs = settings.rpcs || []
  let publicRpcIndex = 0
  let usingAlchemy = publicRpcs.length === 0
  let switchedRpc = false
  let pacer = makePacer(settings)
  const endpoint = () => (usingAlchemy ? alchemyRpcUrl(chain) : publicRpcs[publicRpcIndex])

  const failover = () => {
    if (usingAlchemy) return false
    switchedRpc = true
    pacer = makePacer({ workers: 1, delay: settings.delay }) // fresh, conservative ramp
    if (publicRpcIndex + 1 < publicRpcs.length) {
      publicRpcIndex += 1
      log('warning', 'Public RPC is failing, trying another endpoint...')
      return true
    }
    if (!settings.alchemy) return false
    usingAlchemy = true
    log('warning', 'Public RPCs are failing, switching sweep to fallback RPC...')
    return true
  }

  if (usingAlchemy && !settings.alchemy) throw new SkipScan('no endpoint available for this chain')

  // --- split the range into a queue of batches ------------------------------
  const holders = new Map()
  const failedIds = []
  let queried = 0
  let lostToErrors = 0
  const total = lastId - firstId + 1

  const idsFrom = (start, end) => {
    const ids = []
    for (let i = start; i <= end; i++) ids.push(i)
    return ids
  }

  const queue = []
  for (let id = firstId; id <= lastId; id += settings.batch) {
    queue.push(idsFrom(id, Math.min(id + settings.batch - 1, lastId)))
  }

  onPhase?.({ phase: 'sweep', firstId, lastId, total })
  log('info', `Method: owner sweep via ${usingAlchemy ? 'fallback RPC' : endpoint()}`)
  log('info', `Token ids ${firstId} to ${lastId} (${total.toLocaleString()} ids, batches of ${settings.batch})`)

  // --- sweep the queue (retry -> failover -> give up per batch) -------------
  const record = (ids, found) => {
    mergeCounts(holders, toCounts(found))
    queried += ids.length
    const missing = ids.filter(id => !found.has(id))
    if (missing.length > 0) {
      failedIds.push(...missing)
      onFailed?.(missing)
    }
    if (found.size > 0) onOwners?.(toCounts(found))
    onProgress?.({ queried, total })
  }

  const runBatch = async (ids) => {
    for (let attempt = 0; ; attempt++) {
      if (signal.aborted) return
      try {
        const found = await ownersOf(endpoint(), contract, ids, signal)
        pacer.settled()
        record(ids, found)
        await pacer.rest()
        return
      } catch (err) {
        if (signal.aborted) return
        pacer.stressed(err.retryAfterMs)
        if (attempt < BACKOFF_MS.length) {
          const wait = Math.max(BACKOFF_MS[attempt], err.retryAfterMs || 0)
          const why = reason(err)
            .replace(/node error: Rate Limit Exceeded.*/i, 'Rate limit exceeded. Adjusting request rate...')
            .replace(/node error: Request timeout on the free tier.*/i, 'Timeout, Adjusting request rate...')
          log('warning', `Ids ${ids[0]}-${ids.at(-1)}: ${why}, retry ${attempt + 1}/${BACKOFF_MS.length}`)
          await sleep(wait)
          continue
        }
        if (failover()) {
          queue.push(ids) // rescan this batch on the new endpoint
          return
        }
        queried += ids.length
        lostToErrors += ids.length
        failedIds.push(...ids)
        onFailed?.(ids)
        log('error', `Ids ${ids[0]}-${ids.at(-1)}: giving up (${reason(err)})`)
        onProgress?.({ queried, total })
        return
      }
    }
  }

  // Dispatcher: keeps up to pacer.workers batches in flight. The worker
  // target moves while we run, and failed-over batches re-enter the queue.
  const inFlight = new Set()
  while ((queue.length > 0 || inFlight.size > 0) && !signal.aborted) {
    if (queue.length > 0 && inFlight.size < pacer.workers) {
      const tracked = runBatch(queue.shift()).finally(() => inFlight.delete(tracked))
      inFlight.add(tracked)
    } else {
      await Promise.race(inFlight)
    }
  }
  await Promise.allSettled(inFlight)
  signal.throwIfAborted()

  // --- settle the numbers ---------------------------------------------------
  onProgress?.({ queried, total })

  let tokens = 0
  for (const count of holders.values()) tokens += count

  if (queried > 0 && tokens === 0 && lostToErrors === queried) {
    throw new SkipScan('every batch failed - endpoint unusable')
  }

  failedIds.sort((a, b) => a - b)
  return { source: 'sweep', holders, tokens, queried, failedIds, lostToErrors, switchedRpc }
}

// support

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Map<tokenId, address> -> Map<address, tokenCount>
const toCounts = (ownersById) => {
  const counts = new Map()
  for (const address of ownersById.values()) counts.set(address, (counts.get(address) || 0) + 1)
  return counts
}

const mergeCounts = (into, from) => {
  for (const [address, count] of from) into.set(address, (into.get(address) || 0) + count)
}
