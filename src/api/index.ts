import { db } from "ponder:api";
import schema, { allocations, distributions } from "ponder:schema";
import { Hono } from "hono";
import { asc, desc, eq, graphql } from "ponder";
import { type Address, formatUnits } from "viem";

const app = new Hono();

app.get("/", (c) => {
	return c.json({
		message: "Llama Locker Subgraph API",
		status: "ok",
		timestamp: new Date().toISOString(),
		endpoints: {
			graphql: "/graphql",
			api: {
				distributions: "/distributions",
				distributionByEpoch: "/distributions/:epoch",
				distributionAllocations: "/distributions/:epoch/allocations",
				userAllocations: "/allocations/:address",
			},
		},
	});
});

app.use("/graphql", graphql({ db, schema }));

app.get("/distributions", async (c) => {
	const result = await db
		.select()
		.from(distributions)
		.orderBy(asc(distributions.id));

	return c.json(
		result.map((distribution) => ({
			epoch: distribution.id,
			transactionHash: distribution.transactionHash,
			amount: formatUnits(distribution.amount, 18),
			totalLocked: distribution.totalLocked,
			timestamp: new Date(Number(distribution.timestamp) * 1000).toISOString(),
			blockNumber: distribution.blockNumber.toString(),
		})),
	);
});

app.get("/distributions/:epoch", async (c) => {
	const epoch = parseInt(c.req.param("epoch"), 10);

	const result = await db
		.select()
		.from(distributions)
		.where(eq(distributions.id, epoch))
		.limit(1);

	if (!result[0]) {
		return c.json({ error: "Distribution not found" }, 404);
	}

	return c.json({
		epoch: result[0].id,
		transactionHash: result[0].transactionHash,
		amount: formatUnits(result[0].amount, 18),
		totalLocked: result[0].totalLocked,
		timestamp: new Date(Number(result[0].timestamp) * 1000).toISOString(),
		blockNumber: result[0].blockNumber.toString(),
	});
});

app.get("/distributions/:epoch/allocations", async (c) => {
	const epoch = parseInt(c.req.param("epoch"), 10);

	const result = await db
		.select()
		.from(allocations)
		.where(eq(allocations.epoch, epoch))
		.orderBy(desc(allocations.share));

	return c.json(
		result.map((allocation) => ({
			epoch: allocation.epoch,
			address: allocation.address,
			llamas: allocation.llamas,
			allocation: formatUnits(allocation.allocation, 18),
			share: allocation.share,
		})),
	);
});

app.get("/allocations/:address", async (c) => {
	const address = c.req.param("address").toLowerCase() as Address;

	const result = await db
		.select({
			epoch: allocations.epoch,
			llamas: allocations.llamas,
			allocation: allocations.allocation,
			share: allocations.share,
			timestamp: distributions.timestamp,
		})
		.from(allocations)
		.innerJoin(distributions, eq(allocations.epoch, distributions.id))
		.where(eq(allocations.address, address))
		.orderBy(asc(allocations.epoch));

	return c.json(
		result.map((row) => ({
			epoch: row.epoch,
			llamas: row.llamas,
			allocation: formatUnits(row.allocation, 18),
			share: row.share,
			timestamp: new Date(Number(row.timestamp) * 1000).toISOString(),
		})),
	);
});

export default app;
