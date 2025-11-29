import { ponder } from "ponder:registry";
import { allocations, counters, distributions } from "ponder:schema";
import type { Address } from "viem";

import { llamaLockerAbi } from "../abis/llama_locker";

ponder.on("ScrvUSD:Transfer", async ({ event, context }) => {
	const counter = await context.db.find(counters, { id: "epoch" });
	const epoch = counter ? counter.value + 1 : 1;

	if (counter) {
		await context.db.update(counters, { id: "epoch" }).set({ value: epoch });
	} else {
		await context.db.insert(counters).values({ id: "epoch", value: epoch });
	}

	const snapshotBlock = event.block.number - 1n;

	const result = (await context.client.readContract({
		address: "0x99c3f30Bbc9137F6E917B03C74aEd8a4309B3E1b",
		abi: llamaLockerAbi,
		functionName: "getLocks",
		blockNumber: snapshotBlock,
	})) as Array<{ owner: string; lockedAt: bigint; tokenId: bigint }>;

	const data = new Map<string, bigint[]>();

	for (const lock of result) {
		const owner = lock.owner.toLowerCase();
		if (!data.has(owner)) {
			data.set(owner, []);
		}
		data.get(owner)?.push(lock.tokenId);
	}

	let totalShares = 0n;
	const llamas = new Map<
		string,
		{
			address: string;
			llamas: bigint[];
			shares: bigint;
			allocation: bigint;
			share: number;
		}
	>();

	for (const [address, tokenIds] of data) {
		const shares = BigInt(tokenIds.length) * BigInt(1e18);
		totalShares += shares;

		llamas.set(address, {
			address,
			llamas: tokenIds,
			shares,
			allocation: 0n,
			share: 0,
		});
	}

	for (const llama of llamas.values()) {
		llama.allocation = (llama.shares * event.args.value) / totalShares;
		llama.share = Number((llama.shares * 10000n) / totalShares) / 100;
	}

	await context.db.insert(distributions).values({
		id: epoch,
		transactionHash: event.transaction.hash,
		amount: event.args.value,
		totalLocked: result.length,
		timestamp: event.block.timestamp,
		blockNumber: event.block.number,
	});

	for (const [address, llama] of llamas) {
		await context.db.insert(allocations).values({
			id: `${epoch}-${address}`,
			epoch: epoch,
			address: address as Address,
			llamas: llama.llamas.map((id) => id.toString()),
			shares: llama.shares,
			allocation: llama.allocation,
			share: llama.share,
		});
	}
});
