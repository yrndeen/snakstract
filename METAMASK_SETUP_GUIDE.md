# MetaMask Setup Guide for Abstract Testnet

## 🦊 Setting Up MetaMask for Snakstract

Follow this guide to configure MetaMask for the Abstract testnet so you can play Snakstract.

### Step 1: Install MetaMask

If you don't have MetaMask installed:
1. Go to [metamask.io](https://metamask.io)
2. Click "Download" and install the extension
3. Create a new wallet or import an existing one

### Step 2: Add Abstract Testnet to MetaMask

#### Method 1: Automatic Network Addition (Recommended)

1. Open MetaMask
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add network"
4. Click "Add a network manually"
5. Fill in these details:

**Network Name:** `Abstract Testnet`
**New RPC URL:** `https://api.testnet.abs.xyz`
**Chain ID:** `11124`
**Currency Symbol:** `ETH`
**Block Explorer URL:** `https://sepolia.abscan.org/`

6. Click "Save"

#### Method 2: Import Network Configuration

1. Open MetaMask
2. Click the network dropdown
3. Click "Import network"
4. Paste this configuration:

```json
{
  "chainId": "0x2b7c",
  "chainName": "Abstract Testnet",
  "rpcUrls": ["https://api.testnet.abs.xyz"],
  "nativeCurrency": {
    "name": "Ether",
    "symbol": "ETH",
    "decimals": 18
  },
  "blockExplorerUrls": ["https://sepolia.abscan.org/"]
}
```

5. Click "Import"

### Step 3: Get Testnet ETH

To play Snakstract, you need some testnet ETH:

1. **Faucet Method (Recommended):**
   - Visit the Abstract testnet faucet
   - Connect your wallet
   - Request testnet ETH

2. **Bridge Method:**
   - Use [relay.link](https://relay.link) to bridge ETH from mainnet
   - Select Abstract testnet as destination

### Step 4: Import Your Private Key (Optional)

If you want to use a specific account for testing:

1. In MetaMask, click the account icon
2. Click "Import Account"
3. Paste your private key: `0x9c5b981ce7654399da9cb144929756710467f2de805893752667d766a06ad48d`
4. Click "Import"

⚠️ **Security Warning:** Only import private keys for testing accounts with no real funds.

### Step 5: Connect to Snakstract

1. Go to your Snakstract game
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve the connection
5. Switch to Abstract Testnet if prompted

### Step 6: Start Playing!

Once connected:
- Select your wager amount
- Click "Play Now"
- Enjoy Snakstract on Abstract testnet!

## 🔧 Troubleshooting

### "Wrong Network" Error
- Make sure you're connected to Abstract Testnet (Chain ID: 11124)
- Click the network dropdown and select "Abstract Testnet"

### "Insufficient Balance" Error
- Get testnet ETH from the faucet
- Check your balance in MetaMask

### Connection Issues
- Refresh the page
- Disconnect and reconnect your wallet
- Clear browser cache

### Transaction Failures
- Ensure you have enough testnet ETH for gas
- Check that you're on the correct network
- Try again in a few minutes

## 📱 Mobile Setup

For mobile users:
1. Install MetaMask mobile app
2. Follow the same network setup steps
3. Use MetaMask's built-in browser to access Snakstract

## 🔗 Useful Links

- **Abstract Testnet Explorer:** https://sepolia.abscan.org/
- **Abstract Documentation:** https://docs.abstract.money/
- **Relay Bridge:** https://relay.link
- **MetaMask Support:** https://support.metamask.io/

## 🎮 Ready to Play!

Once you've completed these steps, you're ready to play Snakstract on the Abstract testnet! 

- Connect your wallet
- Select your wager
- Start slithering and surviving!

Happy gaming! 🐍 