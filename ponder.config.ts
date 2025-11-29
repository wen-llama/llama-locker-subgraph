import { createConfig } from "ponder";
import { erc20Abi } from "viem";

export default createConfig({
	chains: {
		mainnet: {
			id: 1,
			rpc: process.env.PONDER_RPC_URL_1,
			pollingInterval: 3600_000,
		},
	},
	contracts: {
		ScrvUSD: {
			chain: "mainnet",
			abi: erc20Abi,
			address: "0x0655977feb2f289a4ab78af67bab0d17aab84367",
			// wl disabled @ block 22033895; tx hash 0xe9bf0cf4cbe1ad42e34583a49c6203c57f2ae33a42fb9d1ba4e0c6a1b5f3f3ef
			startBlock: 22033895,
			filter: {
				event: "Transfer",
				args: {
					from: "0x73Eb240a06f0e0747C698A219462059be6AacCc8",
					to: "0x99c3f30Bbc9137F6E917B03C74aEd8a4309B3E1b",
				},
			},
		},
	},
});
