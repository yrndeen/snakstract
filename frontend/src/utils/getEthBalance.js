import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ABSTRACT_TESTNET } from '../config/security.js';

export async function getEthBalance(address) {
  if (!address) return '0';
  
  try {
    // Use Abstract testnet RPC
    const response = await fetch(ABSTRACT_TESTNET.RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      return formatEther(BigInt(data.result));
    }
    return '0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
}