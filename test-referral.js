const { ethers } = require("hardhat");

async function testReferral() {
  console.log("Testing referral system...");
  
  // Get the contract
  const Snakstract = await ethers.getContractFactory("Snakstract");
  const contract = Snakstract.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  
  console.log("Owner address:", owner.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);
  
  try {
    // Test 1: Set referral code for user1
    console.log("\n1. Setting referral code 'ABCDE' for user1...");
    const tx1 = await contract.connect(user1).setReferralCode("ABCDE");
    await tx1.wait();
    console.log("✅ Referral code set successfully");
    
    // Test 2: Get referral code for user1
    console.log("\n2. Getting referral code for user1...");
    const code = await contract.getReferralCode(user1.address);
    console.log("Referral code:", code);
    
    // Test 3: Get address by referral code
    console.log("\n3. Getting address for referral code 'ABCDE'...");
    const address = await contract.getAddressByReferralCode("ABCDE");
    console.log("Address:", address);
    console.log("Expected:", user1.address);
    console.log("Match:", address === user1.address ? "✅" : "❌");
    
    // Test 4: Set referrer for user2 using the code
    console.log("\n4. Setting referrer for user2 using code 'ABCDE'...");
    const tx2 = await contract.connect(user2).setReferrer("ABCDE");
    await tx2.wait();
    console.log("✅ Referrer set successfully");
    
    // Test 5: Get player details for user2
    console.log("\n5. Getting player details for user2...");
    const details = await contract.getPlayerDetails(user2.address);
    console.log("Referrer:", details.referrer);
    console.log("Expected:", user1.address);
    console.log("Match:", details.referrer === user1.address ? "✅" : "❌");
    
    // Test 6: Get referral stats for user1
    console.log("\n6. Getting referral stats for user1...");
    const stats = await contract.getReferralStats(user1.address);
    console.log("Total referrals:", stats.totalReferrals.toString());
    console.log("Active referrals:", stats.activeReferrals.toString());
    console.log("Total earnings:", ethers.formatEther(stats.totalEarnings), "ETH");
    
    console.log("\n🎉 All referral tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testReferral()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 