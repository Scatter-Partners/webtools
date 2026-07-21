// Supported chains.
//
//   label    - shown in the chain dropdown
//   explorer - block explorer base URL for wallet links (/address/{wallet})
//   rpcs     - free public endpoints used for owner sweeps, in failover order
//   alchemy  - true when the chain is available on Alchemy. Those chains get
//              the fast getOwnersForContract path, plus the Alchemy RPC as a
//              failover when public endpoints start erroring mid-sweep.
//   batch    - ownerOf() calls packed into a single JSON-RPC batch request.
//              This is fixed per chain (some endpoints reject large batches,
//              hyperliquid rejects batching entirely).
//   workers  - how many batch requests to run in parallel at the start.
//              The pacer in scan.js raises/lowers this at runtime.
//   delay    - initial pause in ms between batches, also tuned at runtime.

export const ALCHEMY_KEY = 'fMmgGZu3G9n94wUFQw7Tw'

export const CHAINS = {
  'eth-mainnet': {
    label: 'Ethereum',
    explorer: 'https://etherscan.io',
    rpcs: [
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
    ],
    alchemy: true,
    batch: 3,
    workers: 1,
    delay: 0,
  },
  'base-mainnet': {
    label: 'Base',
    explorer: 'https://basescan.org',
    rpcs: [
      'https://base-rpc.publicnode.com',
      'https://base.drpc.org',
    ],
    alchemy: true,
    batch: 10,
    workers: 1,
    delay: 800,
  },
  'arb-mainnet': {
    label: 'Arbitrum',
    explorer: 'https://arbiscan.io',
    rpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arbitrum.drpc.org',
    ],
    alchemy: true,
    batch: 10,
    workers: 1,
    delay: 0,
  },
  'polygon-mainnet': {
    label: 'Polygon',
    explorer: 'https://polygonscan.com',
    rpcs: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon.drpc.org',
    ],
    alchemy: true,
    batch: 20,
    workers: 1,
    delay: 0,
  },
  'apechain-mainnet': {
    label: 'ApeChain',
    explorer: 'https://apescan.io',
    rpcs: ['https://rpc.apechain.com/http'],
    batch: 20,
    workers: 1,
    delay: 0,
  },
  'abstract-mainnet': {
    label: 'Abstract',
    explorer: 'https://abscan.org',
    rpcs: ['https://api.mainnet.abs.xyz'],
    batch: 20,
    workers: 1,
    delay: 0,
  },
  'ink-mainnet': {
    label: 'Ink',
    explorer: 'https://explorer.inkonchain.com',
    rpcs: ['https://rpc-gel.inkonchain.com'],
    batch: 20,
    workers: 1,
    delay: 0,
  },
  'superposition-mainnet': {
    label: 'Superposition',
    explorer: 'https://explorer.superposition.so',
    rpcs: ['https://rpc.superposition.so'],
    batch: 20,
    workers: 1,
    delay: 500,
  },
  'berachain-mainnet': {
    label: 'Berachain',
    explorer: 'https://berascan.com',
    rpcs: [
      'https://berachain-rpc.publicnode.com',
      'https://berachain.drpc.org',
    ],
    batch: 3,
    workers: 1,
    delay: 0,
  },
  'hyperliquid-mainnet': {
    label: 'Hyperliquid',
    explorer: 'https://www.hyperscan.com',
    rpcs: ['https://hyperliquid.drpc.org'],
    batch: 1, // endpoint rejects batched requests
    workers: 1,
    delay: 50,
  },
  'monad-mainnet': {
    label: 'Monad',
    explorer: 'https://monadexplorer.com',
    rpcs: ['https://rpc.monad.xyz'],
    batch: 15,
    workers: 1,
    delay: 1000,
  },
  'megaeth-mainnet': {
    label: 'MegaETH',
    explorer: 'https://megaeth.blockscout.com',
    rpcs: ['https://mainnet.megaeth.com/rpc'],
    batch: 20,
    workers: 1,
    delay: 0,
  },
  'robinhood-mainnet': {
    label: 'Robinhood',
    explorer: 'https://explorer.mainnet.chain.robinhood.com',
    rpcs: ['https://rpc.mainnet.chain.robinhood.com'],
    alchemy: true,
    batch: 20,
    workers: 1,
    delay: 500, // public endpoint 429s hard above ~34 calls/s
  },
}

export const chainSettings = (chain) => CHAINS[chain]
