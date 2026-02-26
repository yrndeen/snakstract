const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  // Get the signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const Snakstract = await hre.ethers.getContractFactory("Snakstract");
  console.log("Deploying Snakstract...");
  
  const game = await Snakstract.deploy();
  console.log("Waiting for deployment...");
  
  await game.waitForDeployment();
  
  const deployedAddress = await game.getAddress();
  console.log("Snakstract deployed to:", deployedAddress);
  
  const treasury = await game.treasury();
  console.log("Treasury address:", treasury);
  console.log("Referral system: Active");
  console.log("XP system: Active");
  console.log("Achievement system: Active");
  
  // Verify deployment
  console.log("Verification - Treasury:", treasury);
  
  console.log("Deployment completed successfully!");
  
  // Save the contract address for frontend use
  console.log("\n=== CONTRACT ADDRESS FOR FRONTEND ===");
  console.log("CONTRACT_ADDRESS =", deployedAddress);
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
