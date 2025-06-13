// Verifies the deployed contract
async function main() {
  await hre.run("verify:verify", {
    address: "DEPLOYED_CONTRACT_ADDRESS",
    constructorArguments: [],
  });
}
