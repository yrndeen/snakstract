const hre = require("hardhat");

async function main() {
  const Snakstract = await hre.ethers.getContractFactory("Snakstract");
  const game = await Snakstract.deploy();
  await game.deployed();
  console.log("Deployed to:", game.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
