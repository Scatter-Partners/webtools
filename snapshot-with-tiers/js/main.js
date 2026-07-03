// UI wiring. All scanning logic lives in scan.js; this file parses the form,
// auto-detects the token range, runs the scan and groups owners into tiers.

import { CHAINS, chainSettings } from './chains.js'
import { SkipScan, detectRange, scanHolders } from './scan.js'

const { createApp, reactive, ref, computed, nextTick } = window.Vue

const DEFAULT_RANGES = [
  { min: 1, max: 10, noLimit: false, color: '#f0a030' },
  { min: 11, max: 20, noLimit: false, color: '#9b72cf' },
  { min: 21, max: 30, noLimit: false, color: '#4a9edd' },
  { min: 31, max: 999, noLimit: true, color: '#3dbf90' },
]

const PALETTE = ['#f0a030', '#9b72cf', '#4a9edd', '#3dbf90', '#e05080', '#60b040', '#d06040', '#4080d0']

createApp({
  setup() {
    const form = reactive({
      chain: 'eth-mainnet',
      contract: '',
      tokenStart: '',
      tokenEnd: '',
      lockedStart: false,   // user typed a value; auto-detect leaves it alone
      lockedEnd: false,
    })

    const detect = reactive({
      message: '',
      type: '',             // ok | err | spin
      busyStart: false,
      busyEnd: false,
    })

    const ranges = ref(DEFAULT_RANGES.map(r => ({ ...r })))
    const tierOpen = reactive({})

    const status = reactive({ visible: false, message: '', type: '' })

    const run = reactive({
      active: false,
      stopping: false,
      open: false,          // results area (progress/stats/log) visible
      pct: 0,
      progressText: '\u2014',
      failedInfo: '',       // failed-ids explanation under the stats
    })

    const results = reactive({
      show: false,
      shortContract: '',
      totalHolders: '0',
      explorer: '',
      bucketed: [],         // { min, max, noLimit, color, wallets: [{ address, count }] }
    })

    const tally = reactive({ holders: 0, tokens: 0, failed: 0, queried: 0 })
    const logs = reactive([])
    const logPane = ref(null)

    let merged = new Map()  // address -> token count
    let failedIds = []
    let controller = null
    let detectController = null
    let detectTimer = null
    let detectRun = 0

    const cards = computed(() => ({
      holders: tally.holders.toLocaleString(),
      tokens: tally.tokens.toLocaleString(),
      failed: tally.failed.toLocaleString(),
      queried: tally.queried.toLocaleString(),
    }))

    // --- token range auto-detection ------------------------------------------

    const scheduleDetect = () => {
      clearTimeout(detectTimer)
      const contract = form.contract.trim()
      if (!contract.startsWith('0x') || contract.length < 42) {
        detect.message = ''
        detect.type = ''
        return
      }
      detect.message = 'Detecting token range...'
      detect.type = 'spin'
      detectTimer = setTimeout(runDetect, 700)
    }

    const runDetect = async () => {
      const contract = form.contract.trim().toLowerCase()
      if (!/^0x[0-9a-f]{40}$/.test(contract)) return

      if (form.lockedStart && form.lockedEnd) {
        detect.message = 'Range set manually - clear fields to re-detect'
        detect.type = 'err'
        return
      }

      detectController?.abort()
      detectController = new AbortController()
      const mine = ++detectRun

      detect.busyStart = !form.lockedStart
      detect.busyEnd = !form.lockedEnd
      detect.message = 'Detecting token range...'
      detect.type = 'spin'

      try {
        const found = await detectRange({
          chain: form.chain,
          contract,
          signal: detectController.signal,
          wantStart: !form.lockedStart,
          wantEnd: !form.lockedEnd,
        })
        if (mine !== detectRun) return

        if (!form.lockedStart && found.startId !== null) form.tokenStart = String(found.startId)
        if (!form.lockedEnd && found.endId !== null) form.tokenEnd = String(found.endId)

        const parts = [
          fieldLabel('Start', form.lockedStart, form.tokenStart, found.startId),
          fieldLabel('End', form.lockedEnd, form.tokenEnd, found.endId),
        ]
        const success = (!form.lockedStart && found.startId !== null) || (!form.lockedEnd && found.endId !== null)
        detect.message = `${success ? 'OK' : 'WARN'} ${parts.join('  \u00b7  ')}`
        detect.type = success ? 'ok' : 'err'
      } catch (err) {
        if (mine !== detectRun) return
        detect.message = `Detection failed: ${String(err?.message || '').slice(0, 60)}`
        detect.type = 'err'
      } finally {
        if (mine === detectRun) {
          detect.busyStart = false
          detect.busyEnd = false
        }
      }
    }

    const fieldLabel = (name, locked, manualValue, detected) => {
      if (locked) return `${name}: ${manualValue} (manual)`
      if (detected !== null) return `${name}: ${detected}`
      return `${name}: unknown`
    }

    // --- scanning -------------------------------------------------------------

    const startScan = async () => {
      if (run.active) return
      hideStatus()

      const contract = form.contract.trim().toLowerCase()
      if (!/^0x[0-9a-f]{40}$/.test(contract)) {
        showStatus('Enter a valid contract address (0x followed by 40 hex characters).')
        return
      }
      if (!ranges.value.length) {
        showStatus('Define at least one valid range.')
        return
      }

      const settings = chainSettings(form.chain)
      const preferApi = Boolean(settings.alchemy) && !form.lockedStart && !form.lockedEnd
      const firstId = parseInt(form.tokenStart, 10)
      const lastId = parseInt(form.tokenEnd, 10)
      const haveRange = Number.isInteger(firstId) && Number.isInteger(lastId)

      if (!preferApi && !haveRange) {
        showStatus('Token range not detected yet. Enter values manually or wait for auto-detect.')
        return
      }
      if (haveRange && lastId < firstId) {
        showStatus('Token end must be greater than or equal to token start.')
        return
      }

      // stop any detection traffic before the scan starts
      clearTimeout(detectTimer)
      detectController?.abort()

      run.active = true
      run.stopping = false
      run.open = true
      run.pct = 0
      run.progressText = '\u2014'
      run.failedInfo = ''
      results.show = false
      results.bucketed = []
      clearLog()
      merged = new Map()
      failedIds = []
      tally.holders = tally.tokens = tally.failed = tally.queried = 0
      controller = new AbortController()

      say('info', `Contract   : ${contract}`)
      say('info', `Chain      : ${CHAINS[form.chain].label}`)
      if (haveRange && !preferApi) {
        say('info', `Token range: ${firstId} -> ${lastId} (${(lastId - firstId + 1).toLocaleString()} tokens)`)
      }

      const startedAt = Date.now()
      try {
        const result = await scanHolders({
          chain: form.chain,
          contract,
          firstId: haveRange ? firstId : null,
          lastId: haveRange ? lastId : null,
          preferApi,
          signal: controller.signal,
          log: say,

          onPhase: (info) => {
            if (info.phase === 'api') run.progressText = `Fetching owners from NFT API... (page ${info.page})`
          },

          onProgress: ({ queried, total }) => {
            const pct = total > 0 ? Math.round((queried / total) * 100) : 0
            const elapsed = (Date.now() - startedAt) / 1000
            const rate = queried / Math.max(elapsed, 0.1)
            const remaining = rate > 0 ? Math.round((total - queried) / rate) : 0
            const eta = remaining > 0 ? ` \u00b7 ~${formatTime(remaining)} remaining` : ''
            run.pct = pct
            run.progressText = `${pct}% \u00b7 ${queried.toLocaleString()}/${total.toLocaleString()} tokens queried${eta}`
            tally.queried = queried
          },

          onOwners: (counts) => {
            for (const [address, count] of counts) {
              merged.set(address, (merged.get(address) || 0) + count)
              tally.tokens += count
            }
            tally.holders = merged.size
          },

          onFailed: (ids) => {
            failedIds.push(...ids)
            tally.failed = failedIds.length
          },
        })

        // settle live estimates on the exact result
        merged = result.holders
        failedIds = result.failedIds
        tally.holders = merged.size
        tally.tokens = result.tokens
        tally.queried = result.queried
        tally.failed = failedIds.length

        finishScan(result, contract, startedAt)
      } catch (err) {
        if (controller.signal.aborted) {
          say('warning', 'Scan cancelled.')
          run.progressText = 'Cancelled'
        } else {
          const why = err instanceof SkipScan ? err.message : String(err?.message || 'Scan failed.')
          showStatus(why)
          say('error', `Error: ${why}`)
        }
      }

      run.active = false
      run.stopping = false
    }

    const stopScan = () => {
      run.stopping = true
      controller?.abort()
    }

    const finishScan = (result, contract, startedAt) => {
      run.pct = 100

      const active = ranges.value
        .map(r => ({ min: +r.min || 0, max: r.noLimit ? Infinity : (+r.max || 0), color: r.color, noLimit: r.noLimit }))

      results.bucketed = active.map(range => {
        const wallets = [...merged.entries()]
          .filter(([, count]) => count >= range.min && count <= range.max)
          .sort((a, b) => b[1] - a[1])
          .map(([address, count]) => ({ address, count }))
        return { ...range, wallets }
      })
      results.bucketed.forEach((_, index) => { tierOpen[index] = true })

      results.shortContract = `${contract.slice(0, 6)}...${contract.slice(-4)}`
      results.totalHolders = merged.size.toLocaleString()
      results.explorer = CHAINS[form.chain].explorer
      results.show = true

      if (failedIds.length > 0) {
        run.failedInfo = `${failedIds.length} token IDs returned no owner (not yet minted, burned, or RPC error): ${failedIds.join(', ')}`
      }

      const took = Math.round((Date.now() - startedAt) / 1000)
      const via = result.switchedRpc ? ' (finished on fallback RPC)' : ''
      say('ok', `Done. ${merged.size} unique holders \u00b7 ${result.tokens} tokens \u00b7 ${failedIds.length} not found/burned${via}`)
      if (result.lostToErrors > 0) {
        say('warning', `Lost ${result.lostToErrors} id(s) to RPC errors \u2014 snapshot may be incomplete.`)
      }
      run.progressText = `100% \u00b7 Done in ${formatTime(took)}`
    }

    // --- ranges editor ---------------------------------------------------------

    const rangeLabel = (r) => r.noLimit ? `${r.min}+` : `${r.min} - ${r.max}`

    const addRange = () => {
      const color = PALETTE[ranges.value.length % PALETTE.length]
      const last = ranges.value.length ? ranges.value[ranges.value.length - 1].max || 0 : 0
      ranges.value.push({ min: last + 1, max: last + 10, noLimit: false, color })
    }

    const removeRange = (index) => { ranges.value.splice(index, 1) }

    const toggleNoLimit = (index, checked) => { ranges.value[index].noLimit = checked }

    // --- form events -----------------------------------------------------------

    const onContractInput = () => scheduleDetect()

    const onTokenStartInput = () => {
      form.lockedStart = String(form.tokenStart).trim() !== ''
      if (!form.lockedStart) scheduleDetect()
    }

    const onTokenEndInput = () => {
      form.lockedEnd = String(form.tokenEnd).trim() !== ''
      if (!form.lockedEnd) scheduleDetect()
    }

    const onChainChange = () => scheduleDetect()

    // --- results helpers --------------------------------------------------------

    const toggleBody = (index) => { tierOpen[index] = !tierOpen[index] }

    const isTierOpen = (index) => tierOpen[index] !== false

    const copyBucket = async (index, event) => {
      const bucket = results.bucketed[index]
      const text = bucket.wallets.map(w => `${w.address},${w.count}`).join('\n')
      await flashCopy(event.target, text, 'Copied!', 'Failed', 2000)
    }

    const copyWallet = async (wallet, event) => {
      await flashCopy(event.target, `${wallet.address},${wallet.count}`, '\u2713', '\u2717', 1500)
    }

    const flashCopy = async (button, text, okText, failText, holdMs) => {
      const original = button.textContent
      try {
        await navigator.clipboard.writeText(text)
        button.textContent = okText
      } catch {
        button.textContent = failText
      }
      await sleep(holdMs)
      button.textContent = original
    }

    // --- support ----------------------------------------------------------------

    const showStatus = (message) => {
      status.message = message
      status.type = 'error'
      status.visible = true
    }

    const hideStatus = () => {
      status.visible = false
      status.message = ''
      status.type = ''
    }

    const say = (kind, text) => {
      const pane = logPane.value
      const pinned = !pane || pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 24
      logs.push({ time: new Date().toLocaleTimeString(), kind, text })
      if (pinned) {
        nextTick(() => {
          if (logPane.value) logPane.value.scrollTop = logPane.value.scrollHeight
        })
      }
    }

    const clearLog = () => logs.splice(0)

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    const formatTime = (s) => {
      if (s < 60) return `${s}s`
      if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
      return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
    }

    return {
      CHAINS, form, detect, ranges, status, run, results, tally, cards, logs, logPane,
      startScan, stopScan, clearLog,
      onChainChange, onContractInput, onTokenStartInput, onTokenEndInput,
      addRange, removeRange, toggleNoLimit, rangeLabel,
      toggleBody, isTierOpen, copyBucket, copyWallet,
    }
  },
}).mount('#app')
