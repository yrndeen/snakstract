# Snakstract Game - Abstract Integration Setup Guide

## Overview
This guide will help you set up your Snakstract game to run properly on Abstract's infrastructure. The game has been updated to use Abstract's sponsored transaction system and proper chain configuration.

## What's Been Fixed

### 1. Contract ABI Updated
- Fixed the `joinGame` function signature to include the `referrer` parameter
- Added all necessary contract functions to the ABI
- Removed outdated referral code functions that don't exist in your contract

### 2. Abstract Integration
- Updated to use `abstractTestnet` chain instead of `abstract`
- Replaced `useContractWrite` with `useWriteContractSponsored` for sponsored transactions
- Proper Abstract wallet provider configuration

### 3. Transaction Handling
- Updated `handleJoinGame` function to use Abstract's sponsored transaction format
- Proper error handling for Abstract transactions

## Setup Steps

### 1. Environment Configuration

Create a `.env` file in your `frontend` directory:

```env
REACT_APP_GAME_SERVER=ws://localhost:2567
REACT_APP_CONTRACT_ADDRESS=0xE90a852e51e72325Cfe2880E40e13933622d0683
```

### 2. Deploy Your Smart Contract

Make sure your `Snakstract.sol` contract is deployed to the Abstract testnet:

```bash
# In your project root
npx hardhat run scripts/deploy.js --network abstract-testnet
```

### 3. Update Contract Address

After deployment, update the contract address in:
- `frontend/src/config.js`
- `frontend/src/contract/SnakstractABI.json` (if needed)

### 4. Install Dependencies

```bash
# In the frontend directory
npm install

# Make sure you have the latest Abstract packages
npm install @abstract-foundation/agw-client@latest @abstract-foundation/agw-react@latest
```

### 5. Start the Game Server

```bash
# In the server directory
npm install
npm start
```

### 6. Start the Frontend

```bash
# In the frontend directory
npm run dev
```

## Key Features Now Working

### ✅ Abstract Wallet Integration
- Users can connect their Abstract wallet
- Proper chain configuration for Abstract testnet
- Sponsored transactions for gas-free gameplay

### ✅ Game Transactions
- `joinGame` function now works with Abstract's sponsored system
- Proper parameter passing (referrer address)
- Error handling for transaction failures

### ✅ UI Integration
- Wallet connection status
- Transaction status indicators
- Proper error messages

## Testing the Integration

1. **Connect Wallet**: Click "Connect Abstract Wallet" and approve the connection
2. **Enter Wager**: On the main screen, enter a wager amount (minimum 0.001 ETH)
3. **Join Game**: Click "Join Game" - this will trigger a sponsored transaction
4. **Gameplay**: Once the transaction is confirmed, you can play the snake game
5. **Escape/Withdraw**: Use the escape and withdraw functions as needed

## Troubleshooting

### Common Issues

1. **"No wallet found" error**
   - Make sure you're using the Abstract wallet extension
   - Ensure you're on the Abstract testnet

2. **Transaction fails**
   - Check that your contract is deployed to the correct network
   - Verify the contract address in your config files
   - Ensure you have sufficient balance for the wager

3. **Game server connection fails**
   - Make sure the game server is running on port 2567
   - Check the `REACT_APP_GAME_SERVER` environment variable

### Debug Steps

1. Open browser developer tools
2. Check the console for error messages
3. Verify wallet connection status
4. Check transaction status in the Abstract wallet

## Abstract-Specific Features

### Sponsored Transactions
Your game now uses Abstract's sponsored transaction system, which means:
- Users don't pay gas fees for game transactions
- Transactions are sponsored by Abstract
- Better user experience for onboarding

### Chain Configuration
- Using `abstractTestnet` for development
- Proper RPC configuration for Abstract's network
- Compatible with Abstract's wallet infrastructure

## Next Steps

1. **Test thoroughly** on Abstract testnet
2. **Deploy to mainnet** when ready
3. **Update contract addresses** for production
4. **Configure production game server**
5. **Set up monitoring** for game transactions

## Support

If you encounter issues:
1. Check the Abstract documentation at docs.abs.xyz
2. Verify your contract deployment
3. Test with the Abstract integration example first
4. Check browser console for detailed error messages

Your game should now be fully compatible with Abstract's infrastructure and ready for users to play with gas-free transactions! 