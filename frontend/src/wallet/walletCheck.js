import { ABSTRACT_TESTNET } from '../config/security.js';

export async function checkWalletStake() {
  if (!window.ethereum) throw new Error("No wallet found");
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      throw new Error("No accounts found");
    }
    
    const userAddress = accounts[0];
    
    // Use Abstract testnet RPC to check balance
    const response = await fetch(ABSTRACT_TESTNET.RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [userAddress, 'latest'],
        id: 1,
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      const balance = BigInt(data.result);
      return balance > 0n;
    }
    return false;
  } catch (error) {
    console.error('Error checking wallet stake:', error);
    return false;
  }
}
