import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { ABSTRACT_TESTNET } from '../config/security.js';

export async function checkIfStaked(address) {
  if (!address) return false;
  
  try {
    // Use Abstract testnet RPC to check if player is staked
    const response = await fetch(ABSTRACT_TESTNET.RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: '0x' + CONTRACT_ABI.find(item => item.name === 'getPlayerDetails')?.inputs?.map(() => '0000000000000000000000000000000000000000000000000000000000000000').join('') || '',
        }, 'latest'],
        id: 1,
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      // Parse the result to check if player has a stake
      const stake = BigInt(data.result.slice(0, 66));
      return stake > 0n;
    }
    return false;
  } catch (error) {
    console.error('Error checking stake:', error);
    return false;
  }
}
