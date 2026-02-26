const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting production deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the Snakstract contract
  console.log("📦 Deploying Snakstract contract...");
  const Snakstract = await ethers.getContractFactory("Snakstract");
  const snakstract = await Snakstract.deploy();
  await snakstract.deployed();

  console.log("✅ Snakstract deployed to:", snakstract.address);

  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const treasury = await snakstract.treasury();
  console.log("Treasury address:", treasury);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: snakstract.address,
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
    treasury: treasury
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-production.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to deployment-production.json");
  console.log("🎉 Production deployment complete!");
  
  console.log("\n📝 Next steps:");
  console.log("1. Update VITE_CONTRACT_ADDRESS in your production environment");
  console.log("2. Deploy your frontend to your hosting provider");
  console.log("3. Deploy your game server to your server provider");
  console.log("4. Update DNS and SSL certificates");
  console.log("5. Test the complete system");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
 