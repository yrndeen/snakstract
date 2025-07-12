# Security Guide for Snakstract

## ⚠️ CRITICAL SECURITY WARNING

**NEVER put private keys in your frontend code or commit them to version control.**

## Why This Matters

1. **Loss of Funds**: Anyone with access to your private key can steal all your assets
2. **Code Exposure**: If you commit to git, your private key becomes public forever
3. **Security Breach**: Frontend code is visible to anyone who visits your website

## The Private Key You Provided

The private key you mentioned (`0x9c5b981ce7654399da9cb144929756710467f2de805893752667d766a06ad48d`) should **NEVER** be used in this way.

## Proper Ways to Handle Private Keys

### 1. **For Development Testing (Recommended)**

Use Abstract's wallet connection instead of hardcoded private keys:

```javascript
// ✅ DO THIS - Let users connect their own wallets
import { useAccount } from 'wagmi';

function MyComponent() {
  const { address, isConnected } = useAccount();
  
  if (!isConnected) {
    return <button onClick={connectWallet}>Connect Wallet</button>;
  }
  
  return <div>Connected: {address}</div>;
}
```

### 2. **For Backend Services Only**

If you need a private key for backend operations (like contract deployment):

```bash
# ✅ Create a .env file (never commit this to git)
echo "PRIVATE_KEY=0x9c5b981ce7654399da9cb144929756710467f2de805893752667d766a06ad48d" > .env
echo ".env" >> .gitignore
```

```javascript
// ✅ Use environment variables in backend only
require('dotenv').config();
const privateKey = process.env.PRIVATE_KEY;
```

### 3. **For Contract Deployment**

Use Hardhat with environment variables:

```javascript
// hardhat.config.js
require('dotenv').config();

module.exports = {
  networks: {
    abstract: {
      url: process.env.ABSTRACT_RPC_URL,
      accounts: [process.env.PRIVATE_KEY], // Only for deployment
    }
  }
};
```

## What We've Implemented

Your Snakstract game now uses the **secure approach**:

1. **Abstract Wallet Integration**: Users connect their own wallets
2. **Sponsored Transactions**: Abstract pays gas fees for game entry
3. **No Private Keys in Code**: All authentication is wallet-based
4. **Real-time Updates**: Balances and stats update automatically

## Security Features in Your Code

✅ **Wallet Connection**: Users connect their own wallets securely
✅ **Abstract Integration**: Uses Abstract's account abstraction
✅ **Sponsored Transactions**: No gas fees for users
✅ **Environment Variables**: Sensitive data in .env files
✅ **No Hardcoded Keys**: Private keys never in source code

## If You Need to Test with a Specific Account

Instead of putting the private key in code, use these methods:

### Method 1: Import to MetaMask
1. Open MetaMask
2. Go to Account Details → Import Account
3. Paste your private key
4. Connect to Abstract testnet
5. Use the wallet connection in your app

### Method 2: Use Abstract's Account Abstraction
```javascript
// Let Abstract handle the account
import { useAbstractClient } from "@abstract-foundation/agw-react";

const { data: client } = useAbstractClient();
// Abstract manages the account securely
```

### Method 3: Environment Variables (Backend Only)
```bash
# Create .env file (add to .gitignore)
PRIVATE_KEY=0x9c5b981ce7654399da9cb144929756710467f2de805893752667d766a06ad48d
```

## Security Checklist

- [ ] No private keys in frontend code
- [ ] No private keys in version control
- [ ] Use wallet connection for user authentication
- [ ] Use environment variables for backend secrets
- [ ] Add .env to .gitignore
- [ ] Use Abstract's sponsored transactions
- [ ] Implement proper error handling
- [ ] Test with testnet first

## Your Game is Now Secure

Your Snakstract game uses the most secure approach:
- Users connect their own wallets
- Abstract handles gas fees
- No private keys in your code
- All transactions are user-signed

This is the **production-ready** way to handle blockchain interactions. 