"use client";

import { createThirdwebClient, getContract } from "thirdweb";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { claimTo } from "thirdweb/extensions/erc1155";
import { useSendCalls } from "thirdweb/wallets/eip5792";

// Only certain chains supported: https://www.smartwallet.dev/FAQ#what-networks-are-supported
// NOTE: To use mainnet chains, you need to add a credit card to your thirdweb account.
// To use testnets, such as baseSepolia, no card is required.

import { arbitrum } from "thirdweb/chains";
const chainToUse = arbitrum;

const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export default function Home() {
  const account = useActiveAccount();

  // This is so we can use a paymaster service to pay for the transaction gas fees
  const { mutateAsync: sendCalls } = useSendCalls({
    client: thirdwebClient,
    waitForResult: true,
  });

  // Function to send the claim NFT transaction with gas fees covered.
  async function sendSponsoredTransaction() {
    const claimTx = claimTo({
      // contract using a chain + contract address combo
      contract: getContract({
        client: thirdwebClient,
        chain: chainToUse,
        address: "0x1093C2Bd8437664bd523A7a86AE5825c8e274Da5",
      }),
      quantity: BigInt(1), 
      to: account?.address!,
      tokenId: BigInt(0),
    });

    // Send the transaction with the paymaster service
    return await sendCalls({
      calls: [claimTx], // The claim transaction. We could put multiple transactions here in theory.
      capabilities: {
        paymasterService: {
          // Docs: https://portal.thirdweb.com/connect/account-abstraction/infrastructure
          url: `https://${chainToUse.id}.bundler.thirdweb.com/${thirdwebClient.clientId}`,
        },
      },
    });
  }

  return (
    <div className="bg-blue-400 flex flex-col items-center justify-center h-screen">
      <ConnectButton
        client={thirdwebClient}
        // The array of wallets we want to show to users, we just provide 1 - Coinbase Wallet
        wallets={[
          // Use com.coinbase.wallet for Coinbase Wallet
          createWallet("com.coinbase.wallet", {
            walletConfig: {
              // Specify we do not want coinbase wallet browser extension support, just smart wallet
              options: "smartWalletOnly",
            },
            // What chains we want to support in our app
            chains: [chainToUse],
            // This is the metadata that shows up when prompting the user to connect their wallet
            appMetadata: {
              logoUrl: `https://github.com/jarrodwatts/polygon-coinbase-smart-wallet/blob/main/public/wizard-hat.png?raw=true`,
              name: "Blockchain through Coinbase Smart Wallet by pandit",
              description: "Mint NFTs on Polygon using Coinbase Smart Wallet",
            },
          }),
        ]}
      />
      {/* <TransactionButton
        transaction={() =>
          // @ts-expect-error: Just a type issue, can probably be fixed easily
          sendSponsoredTransaction()
        }
        payModal={false}
      >
        CoinBASE
      </TransactionButton> */}
    </div>
  );
}
