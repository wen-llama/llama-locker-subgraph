import { onchainTable } from "ponder";

export const counters = onchainTable("counters", (t) => ({
	id: t.text().primaryKey(),
	value: t.integer().notNull(),
}));

export const distributions = onchainTable("distributions", (t) => ({
	id: t.integer().primaryKey(),
	transactionHash: t.hex().notNull(),
	amount: t.bigint().notNull(),
	totalLocked: t.integer().notNull(),
	timestamp: t.bigint().notNull(),
	blockNumber: t.bigint().notNull(),
}));

export const allocations = onchainTable("allocations", (t) => ({
	id: t.text().primaryKey(),
	epoch: t.integer().notNull(),
	address: t.hex().notNull(),
	llamas: t.json().notNull(),
	shares: t.bigint().notNull(),
	allocation: t.bigint().notNull(),
	share: t.real().notNull(),
}));
