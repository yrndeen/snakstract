# 🚀 Snakstract.io Deployment Guide

## 🌐 **Step 1: Domain Registration**

1. **Choose a Domain Registrar**:
   - Namecheap (recommended)
   - GoDaddy
   - Google Domains
   - Cloudflare

2. **Register Domain**:
   - Domain: `snakstract.io`
   - Cost: ~$30-50/year
   - Duration: 1-10 years

## 🏗️ **Step 2: Prepare Your Code**

### **Frontend Configuration**

1. **Create Production Environment File** (`frontend/.env.production`):
```env
VITE_GAME_SERVER_URL=wss://snakstract.io:2567
VITE_CONTRACT_ADDRESS=0x85DCA9a0ca49B1a929A2d7807639FD089a46027a
VITE_CHAIN_ID=11124
VITE_RPC_URL=https://rpc.mainnet.abs.xyz
VITE_EXPLORER_URL=https://explorer.mainnet.abs.xyz
VITE_WEBSITE_URL=https://snakstract.io
```

2. **Update Vite Config** (`frontend/vite.config.js`):
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 5173,
    host: true
  }
})
```

### **Backend Configuration**

1. **Update Server Environment** (`server/.env.production`):
```env
NODE_ENV=production
PORT=2567
DOMAIN=snakstract.io
SSL_KEY_PATH=/path/to/ssl/private.key
SSL_CERT_PATH=/path/to/ssl/certificate.crt
```

## 🚀 **Step 3: Choose Hosting Platform**

### **Option A: Vercel (Frontend) + Railway (Backend)**

#### **Frontend Deployment (Vercel)**:
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project: No
# - Project name: snakstract-frontend
# - Directory: ./
# - Override settings: No
```

#### **Backend Deployment (Railway)**:
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `server` folder
4. Set environment variables
5. Get the deployment URL

### **Option B: Netlify (Frontend) + Heroku (Backend)**

#### **Frontend Deployment (Netlify)**:
```bash
# Build the project
cd frontend
npm run build

# Deploy to Netlify
# Upload dist folder or connect GitHub repo
```

#### **Backend Deployment (Heroku)**:
```bash
# Install Heroku CLI
# Create Procfile in server directory
echo "web: node index.js" > server/Procfile

# Deploy
cd server
heroku create snakstract-backend
git push heroku main
```

### **Option C: AWS (Full Stack)**

#### **Frontend (S3 + CloudFront)**:
1. Create S3 bucket: `snakstract.io`
2. Enable static website hosting
3. Create CloudFront distribution
4. Configure custom domain

#### **Backend (EC2)**:
1. Launch EC2 instance
2. Install Node.js and dependencies
3. Set up PM2 for process management
4. Configure security groups

## 🔒 **Step 4: SSL Certificate**

### **Let's Encrypt (Free)**:
```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d snakstract.io -d www.snakstract.io

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Cloudflare (Recommended)**:
1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption
4. Set up DNS records

## 🌍 **Step 5: DNS Configuration**

### **A Records**:
```
Type: A
Name: @
Value: [Your Server IP]
TTL: 300
```

### **CNAME Records**:
```
Type: CNAME
Name: www
Value: snakstract.io
TTL: 300
```

### **WebSocket Subdomain**:
```
Type: A
Name: ws
Value: [Your Server IP]
TTL: 300
```

## 🔧 **Step 6: Server Setup**

### **Ubuntu Server Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx
```

### **Nginx Configuration** (`/etc/nginx/sites-available/snakstract.io`):
```nginx
server {
    listen 80;
    server_name snakstract.io www.snakstract.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name snakstract.io www.snakstract.io;

    ssl_certificate /etc/letsencrypt/live/snakstract.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/snakstract.io/privkey.pem;

    # Frontend
    location / {
        root /var/www/snakstract.io;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:2567;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:2567;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📊 **Step 7: Monitoring & Analytics**

### **Google Analytics**:
1. Create Google Analytics account
2. Add tracking code to frontend
3. Set up goals and events

### **Uptime Monitoring**:
- UptimeRobot (free)
- Pingdom
- StatusCake

### **Error Tracking**:
- Sentry
- LogRocket
- Bugsnag

## 🚀 **Step 8: Launch Checklist**

### **Pre-Launch**:
- [ ] Domain registered and configured
- [ ] SSL certificate installed
- [ ] Frontend deployed and tested
- [ ] Backend deployed and tested
- [ ] Database configured
- [ ] Environment variables set
- [ ] DNS records configured
- [ ] WebSocket connection working
- [ ] Smart contract deployed and verified
- [ ] Analytics tracking installed
- [ ] Error monitoring set up
- [ ] Backup strategy implemented

### **Launch Day**:
- [ ] Final testing on production
- [ ] Announce on social media
- [ ] Monitor for issues
- [ ] Respond to user feedback

## 💰 **Estimated Costs**

### **Monthly Costs**:
- **Domain**: $3-5/month
- **Hosting**: $10-50/month
- **SSL**: Free (Let's Encrypt)
- **CDN**: $0-20/month
- **Monitoring**: $0-30/month
- **Total**: $13-105/month

### **One-Time Costs**:
- **Domain Registration**: $30-50
- **Initial Setup**: $0-100 (if hiring help)

## 🔄 **Step 9: Maintenance**

### **Regular Tasks**:
- Monitor server performance
- Update dependencies
- Backup database
- Renew SSL certificates
- Monitor for security issues
- Update content and features

### **Automation**:
- Set up automatic backups
- Configure auto-scaling
- Set up monitoring alerts
- Automate SSL renewal

## 📞 **Support & Resources**

### **Useful Tools**:
- **Domain Checker**: [whois.com](https://whois.com)
- **SSL Checker**: [ssllabs.com](https://ssllabs.com)
- **DNS Checker**: [dnschecker.org](https://dnschecker.org)
- **Website Speed**: [pagespeed.web.dev](https://pagespeed.web.dev)

### **Community**:
- Stack Overflow
- Reddit (r/webdev, r/reactjs)
- Discord communities
- GitHub discussions

---

**Next Steps**: Choose your hosting platform and start with Step 1 (Domain Registration). The easiest path is Vercel + Railway for a quick launch, or AWS for full control and scalability. 
**`hardhat.config.js`**:
```javascript
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    abstractTestnet: {
      url: process.env.ABSTRACT_TESTNET_RPC || "https://api.testnet.abs.xyz",
      chainId: 11124,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    abstractMainnet: {
      url: process.env.ABSTRACT_MAINNET_RPC || "https://api.mainnet.abs.xyz",
      chainId: 2741,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      abstractTestnet: process.env.ABSCAN_API_KEY,
      abstractMainnet: process.env.ABSCAN_API_KEY,
    },
    customChains: [
      {
        network: "abstractTestnet",
        chainId: 11124,
        urls: {
          apiURL: "https://api-sepolia.abscan.org/api",
          browserURL: "https://sepolia.abscan.org/"
        }
      },
      {
        network: "abstractMainnet",
        chainId: 2741,
        urls: {
          apiURL: "https://api.abscan.org/api",
          browserURL: "https://abscan.org/"
        }
      }
    ]
  }
};
```

### Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network abstractTestnet
```

## 🚀 Step 6: Production Deployment

### Frontend Deployment

1. **Build for Production**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel/Netlify**:
   - Connect your repository
   - Set environment variables
   - Deploy

### Backend Deployment

1. **Deploy to Railway/Render**:
   - Connect your repository
   - Set environment variables
   - Deploy

2. **Update Frontend**:
   - Update `VITE_GAME_SERVER_URL` to your deployed server URL

## 🔒 Security Checklist

- [ ] No private keys in source code
- [ ] Environment variables properly configured
- [ ] `.env` files in `.gitignore`
- [ ] MetaMask properly configured
- [ ] Testnet ETH obtained
- [ ] Contract deployed (if needed)
- [ ] All dependencies installed
- [ ] Server running
- [ ] Frontend connected to server

## 🧪 Testing

### Test All Features

1. **Wallet Connection**:
   - Connect MetaMask
   - Verify network is Abstract Testnet

2. **Game Functions**:
   - Join game with wager
   - Play snake game
   - Escape and withdraw
   - Check SP accumulation

3. **Referral System**:
   - Generate referral code
   - View referral stats
   - Claim referral rewards

4. **History & Leaderboard**:
   - View game history
   - Check leaderboard
   - Verify SP display

## 🔧 Troubleshooting

### Common Issues

**"Wrong Network" Error**:
- Ensure MetaMask is on Abstract Testnet (Chain ID: 11124)
- Check network configuration

**"Insufficient Balance" Error**:
- Get testnet ETH from faucet
- Check wallet balance

**Connection Issues**:
- Verify server is running
- Check WebSocket URL
- Clear browser cache

**Transaction Failures**:
- Ensure enough ETH for gas
- Check network connection
- Verify contract address

## 📞 Support

- **Abstract Documentation**: https://docs.abstract.money/
- **Abstract Discord**: Join the Abstract community
- **MetaMask Support**: https://support.metamask.io/

## 🎉 Ready to Play!

Once everything is set up:

1. Connect your wallet
2. Select wager amount
3. Click "Play Now"
4. Enjoy Snakstract on Abstract!

---

**Remember**: This is a testnet deployment. For mainnet, update all configurations to use mainnet URLs and ensure proper security measures are in place. 