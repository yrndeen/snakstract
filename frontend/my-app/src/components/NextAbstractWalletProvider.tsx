"use client";

import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { abstractTestnet } from "viem/chains";

export default function AbstractWalletWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AbstractWalletProvider 
      chain={abstractTestnet}
      options={{
        // Ensure proper initialization
        autoConnect: true,
        // Add error handling
        onError: (error) => {
          console.error("Abstract Wallet Error:", error);
        }
      }}
    >
      {children}
    </AbstractWalletProvider>
  );
}
