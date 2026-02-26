// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Snakstract is ReentrancyGuard {
    address public treasury = 0xE90a852e51e72325Cfe2880E40e13933622d0683;

    uint256 public constant FEE_DENOMINATOR = 10000; // Represents 100% in basis points
    uint256 public constant TREASURY_FEE_BPS = 300; // 3% of total payout
    uint256 public constant REFERRAL_FEE_BPS = 200; // 2% of total payout
    // Removed SURVIVAL_REWARD_FEE_BPS

    // SP values
    uint256 public constant SP_PER_ORB = 5;
    uint256 public constant SP_PER_MINUTE = 10;
    uint256 public constant SP_PER_KILL = 500;
    uint256 public constant SP_PER_CAUSE_DEATH = 200;
    uint256 public constant SP_PER_WIN = 2000;
    uint256 public constant SP_PER_ESCAPE = 200;
    uint256 public constant SP_PER_KILL_AND_TAKE_ETH = 1000;

    struct Player {
        uint256 stake;
        bool inGame;
        uint256 lastEscape;
        uint256 gameStartTime;
        address referrer;
        uint256 referralEarnings;
        // Removed survivalRewards
        uint256 totalSurvivalTime;
        uint256 gamesPlayed;
        uint256 sp;
        string referralCode;
    }

    struct ReferralStats {
        uint256 totalReferrals;
        uint256 activeReferrals;
        uint256 totalEarnings;
    }

    struct Referral {
        address player;
        uint256 gamesPlayed;
        uint256 totalWagered;
        uint256 totalWon;
        uint256 netEarned;
        uint256 referralEarnings;
        uint256 lastActive;
        uint256 sp;
    }

    mapping(address => Player) public players;
    mapping(string => address) public referralCodeToAddress;
    mapping(address => string) public addressToReferralCode;
    mapping(address => address[]) public referrerToReferrals;
    mapping(address => ReferralStats) public referralStats;
    mapping(address => Referral[]) public referrerReferrals;
    
    // ETH orb winnings for each player (in wei)
    mapping(address => uint256) public ethOrbWinnings;
    // Removed totalSurvivalRewardsPool
    uint256 public totalGamesPlayed;

    address public gameServer;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier onlyGameServer() {
        require(msg.sender == gameServer, "Not game server");
        _;
    }

    event GameJoined(address player, uint256 stake, address referrer);
    event GameEscaped(address player, uint256 survivalTime);
    event Withdrawn(address player, uint256 amount, uint256 treasuryFee, uint256 referralFee);
    event ReferralPaid(address referrer, uint256 amount);
    // Removed SurvivalRewardEarned event
    event SPEarned(address player, uint256 amount, string reason);
    event ReferralCodeSet(address player, string code);
    event ReferrerSet(address player, address referrer);
    event EthOrbWinningsAdded(address indexed player, uint256 amount);
    event TreasuryAddressChanged(address oldTreasury, address newTreasury);

    constructor() {
        owner = msg.sender;
    }
    function setGameServer(address _server) external onlyOwner {
        require(_server != address(0), "Invalid address");
        gameServer = _server;
    }

    // Set referral code for a player
    function setReferralCode(string memory code) public {
        require(bytes(code).length == 5, "Referral code must be 5 characters");
        require(referralCodeToAddress[code] == address(0), "Referral code already taken");
        require(bytes(addressToReferralCode[msg.sender]).length == 0, "Referral code already set");
        
        // Convert to uppercase
        string memory upperCode = toUpperCase(code);
        
        addressToReferralCode[msg.sender] = upperCode;
        referralCodeToAddress[upperCode] = msg.sender;
        
        emit ReferralCodeSet(msg.sender, upperCode);
    }

    // Set referrer using referral code
    function setReferrer(string memory code) public {
        require(bytes(code).length == 5, "Referral code must be 5 characters");
        require(bytes(addressToReferralCode[msg.sender]).length == 0, "Referrer already set");
        
        string memory upperCode = toUpperCase(code);
        address referrer = referralCodeToAddress[upperCode];
        require(referrer != address(0), "Invalid referral code");
        require(referrer != msg.sender, "Cannot refer yourself");
        
        Player storage player = players[msg.sender];
        player.referrer = referrer;
        
        // Add to referrer's referral list
        referrerToReferrals[referrer].push(msg.sender);
        
        // Update referral stats
        ReferralStats storage stats = referralStats[referrer];
        stats.totalReferrals++;
        stats.activeReferrals++;
        
        emit ReferrerSet(msg.sender, referrer);
    }

    // Get referral code for an address
    function getReferralCode(address player) public view returns (string memory) {
        return addressToReferralCode[player];
    }

    // Get address by referral code
    function getAddressByReferralCode(string memory code) public view returns (address) {
        string memory upperCode = toUpperCase(code);
        return referralCodeToAddress[upperCode];
    }

    // Get referral stats for a referrer
    function getReferralStats(address referrer) public view returns (
        uint256 totalReferrals,
        uint256 activeReferrals,
        uint256 totalEarnings
    ) {
        ReferralStats storage stats = referralStats[referrer];
        return (stats.totalReferrals, stats.activeReferrals, stats.totalEarnings);
    }

    // Get referrals list for a referrer
    function getReferrals(address referrer) public view returns (Referral[] memory) {
        address[] memory referralAddresses = referrerToReferrals[referrer];
        Referral[] memory referrals = new Referral[](referralAddresses.length);
        
        for (uint i = 0; i < referralAddresses.length; i++) {
            address refAddr = referralAddresses[i];
            Player storage player = players[refAddr];
            
            referrals[i] = Referral({
                player: refAddr,
                gamesPlayed: player.gamesPlayed,
                totalWagered: player.stake,
                totalWon: 0, // No survival rewards, so totalWon = 0
                netEarned: 0, // No survival rewards, so netEarned = 0
                referralEarnings: player.referralEarnings,
                lastActive: player.lastEscape,
                sp: player.sp
            });
        }
        
        return referrals;
    }

    // Claim referral rewards
    function claimReferralRewards() public {
        Player storage player = players[msg.sender];
        require(player.referralEarnings > 0, "No rewards to claim");
        
        uint256 amount = player.referralEarnings;
        player.referralEarnings = 0;
        
        // Update referral stats
        ReferralStats storage stats = referralStats[msg.sender];
        stats.totalEarnings += amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    // Helper function to convert string to uppercase
    function toUpperCase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bUpper = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 97) && (uint8(bStr[i]) <= 122)) {
                bUpper[i] = bytes1(uint8(bStr[i]) - 32);
            } else {
                bUpper[i] = bStr[i];
            }
        }
        return string(bUpper);
    }

    function joinGame(address referrer) public payable {
        require(msg.value >= 0.001 ether, "Minimum 0.001 ETH");
        require(msg.sender != referrer, "Cannot refer yourself");
        
        Player storage player = players[msg.sender];
        player.stake = msg.value;
        player.inGame = true;
        player.lastEscape = 0;
        player.gameStartTime = block.timestamp;
        player.referrer = referrer;
        player.gamesPlayed++;
        
        // If referrer is valid, add to referral list and update stats
        if (referrer != address(0)) {
            referrerToReferrals[referrer].push(msg.sender);
            ReferralStats storage stats = referralStats[referrer];
            stats.totalReferrals++;
            stats.activeReferrals++;
        }
        
        emit GameJoined(msg.sender, msg.value, referrer);
    }

    // Call this from the game server when a player eats an orb
    function earnOrbSP(address playerAddr, uint256 orbs) external onlyGameServer {
        Player storage player = players[playerAddr];
        uint256 spAmount = orbs * SP_PER_ORB;
        player.sp += spAmount;
        emit SPEarned(playerAddr, spAmount, "orb");
    }

    // Call this from the game server when a player gets a kill
    function earnKillSP(address killer, bool tookEth) external onlyGameServer {
        Player storage player = players[killer];
        uint256 spAmount = SP_PER_KILL;
        if (tookEth) {
            spAmount += SP_PER_KILL_AND_TAKE_ETH;
        }
        player.sp += spAmount;
        emit SPEarned(killer, spAmount, tookEth ? "kill+eth" : "kill");
    }

    // Call this from the game server when a player causes another to die (collision)
    function earnCauseDeathSP(address causer) external onlyGameServer {
        Player storage player = players[causer];
        player.sp += SP_PER_CAUSE_DEATH;
        emit SPEarned(causer, SP_PER_CAUSE_DEATH, "cause_death");
    }

    // Call this from the game server when a player wins
    function earnWinSP(address winner) external onlyGameServer {
        Player storage player = players[winner];
        player.sp += SP_PER_WIN;
        emit SPEarned(winner, SP_PER_WIN, "win");
    }

    // Call this from the game server when a player escapes and claims ETH
    function earnEscapeSP(address escaper) external onlyGameServer {
        Player storage player = players[escaper];
        player.sp += SP_PER_ESCAPE;
        emit SPEarned(escaper, SP_PER_ESCAPE, "escape");
    }

    function escapeGame() public {
        Player storage player = players[msg.sender];
        require(player.inGame, "Not in game");
        
        uint256 survivalTime = block.timestamp - player.gameStartTime;
        player.totalSurvivalTime += survivalTime;
        
        player.inGame = false;
        player.lastEscape = block.timestamp;
        
        // SP for survival time
        uint256 minutesSurvived = survivalTime / 60;
        uint256 spSurvival = minutesSurvived * SP_PER_MINUTE;
        if (spSurvival > 0) {
            player.sp += spSurvival;
            emit SPEarned(msg.sender, spSurvival, "survival");
        }
        
        emit GameEscaped(msg.sender, survivalTime);
    }

    // Removed calculateSurvivalReward function

    // Called by the game server to credit ETH orb winnings to a player
    function addEthOrbWinnings(address player, uint256 amount) external onlyGameServer {
        require(amount > 0, "Amount must be positive");
        require(amount <= 10 ether, "Amount too large"); // Cap per win
        ethOrbWinnings[player] += amount;
        emit EthOrbWinningsAdded(player, amount);
    }

    function withdraw() public nonReentrant {
        Player storage player = players[msg.sender];
        require(!player.inGame, "Player still in game");
        uint256 amount = player.stake;
        require(amount > 0, "Nothing to withdraw");
        uint256 winnings = ethOrbWinnings[msg.sender];
        uint256 totalPayout = amount + winnings;
        bool noWinnings = winnings == 0;
        // Set fee rates
        uint256 treasuryFeeBps = TREASURY_FEE_BPS;
        uint256 referralFeeBps = REFERRAL_FEE_BPS;
        if (noWinnings) {
            // Reduce fees by 50% if no winnings
            treasuryFeeBps = treasuryFeeBps / 2; // 1.5%
            referralFeeBps = referralFeeBps / 2; // 1%
        }
        // Calculate fees
        uint256 treasuryFee = (totalPayout * treasuryFeeBps) / FEE_DENOMINATOR;
        uint256 referralFee = (totalPayout * referralFeeBps) / FEE_DENOMINATOR;
        uint256 totalFees = treasuryFee + referralFee;
        uint256 payout = totalPayout - totalFees;
        // Reset player data before transfers
        player.stake = 0;
        ethOrbWinnings[msg.sender] = 0;
        // Send to player
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer to player failed");
        // Send to treasury
        (success, ) = payable(treasury).call{value: treasuryFee}("");
        require(success, "Transfer to treasury failed");
        // Handle referral fee
        if (player.referrer != address(0) && player.referrer != msg.sender) {
            (success, ) = payable(player.referrer).call{value: referralFee}("");
            require(success, "Transfer to referrer failed");
            players[player.referrer].referralEarnings += referralFee;
            emit ReferralPaid(player.referrer, referralFee);
        } else {
            // If no valid referrer, send referral fee to treasury as well
            (success, ) = payable(treasury).call{value: referralFee}("");
            require(success, "Transfer of unallocated referral fee to treasury failed");
        }
        emit Withdrawn(msg.sender, payout, treasuryFee, referralFee);
    }

    // View function to get player details including referral, survival earnings, and SP
    function getPlayerDetails(address player) public view returns (
        uint256 stake,
        bool inGame,
        uint256 lastEscape,
        uint256 gameStartTime,
        address referrer,
        uint256 referralEarnings,
        uint256 totalSurvivalTime,
        uint256 gamesPlayed,
        uint256 sp
    ) {
        Player storage p = players[player];
        return (
            p.stake, 
            p.inGame, 
            p.lastEscape, 
            p.gameStartTime,
            p.referrer, 
            p.referralEarnings,
            p.totalSurvivalTime,
            p.gamesPlayed,
            p.sp
        );
    }

    // Remove getSurvivalRewardsInfo view function

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryAddressChanged(oldTreasury, newTreasury);
    }
}
