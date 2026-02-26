import { useEffect, useState } from 'react';

export function useENSorAddress(provider, address) {
  const [ensName, setEnsName] = useState('');

  useEffect(() => {
    async function fetchENS() {
      if (provider && address) {
        try {
          const name = await provider.lookupAddress(address);
          setEnsName(name || shortenAddress(address));
        } catch {
          setEnsName(shortenAddress(address));
        }
      }
    }
    fetchENS();
  }, [provider, address]);

  return ensName;
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}