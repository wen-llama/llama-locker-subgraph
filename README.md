# LLama Locker's Subgraph

#### What's being tracked like a bloodhound?
---
We're indexing reward distributions into LLama Locker. The `distributeRewardToken` function in LLama Locker doesn't emit an event to signal a reward distribution.

If we gallop back to the drawing board, we know the only token being distributed is scrvUSD (at this point in time) and that happens once per epoch when that function is executed by the treasury msig roughly every 28 days.

One idea was indexing call traces, but that takes way too long and we can't be burning through CUs like they grow on trees. Instead we can just check for canonical transfers of scrvUSD from the treasury to LLama Locker. Easy peasy, lemon-squeezy.

#### Running this locally?
---
```bash
bun install

bun run codegen

bun run dev
```

#### Queries
---
```graphql
# Get recent distributions
{
  distributionss(orderBy: "id", orderDirection: "desc", limit: 5) {
    items {
      id
      amount
      totalLocked
      timestamp
      blockNumber
      transactionHash
    }
  }
}

# Get epoch 1 allocations
{
  allocationss(where: { epoch: 1 }) {
    items {
      address
      llamas
      allocation
      share
    }
  }
}

# Get user's allocation history
{
  allocationss(where: { address: "0x..." }) {
    items {
      epoch
      allocation
      share
      llamas
    }
  }
}
```