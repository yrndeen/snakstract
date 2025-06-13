// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Snakstract {
    address public treasury = 0xE90a852e51e72325Cfe2880E40e13933622d0683;

    struct Player {
        uint256 stake;
        bool inGame;
        uint256 lastEscape;
    }

    mapping(address => Player) public players;

    function joinGame() public payable {
        require(msg.value >= 0.001 ether, "Minimum 0.001 ETH");
        players[msg.sender] = Player(msg.value, true, 0);
    }

    function escapeGame() public {
        require(players[msg.sender].inGame, "Not in game");
        players[msg.sender].inGame = false;
        players[msg.sender].lastEscape = block.timestamp;
    }

    function withdraw() public {
        require(!players[msg.sender].inGame, "Player still in game");
        // send funds
    }
}
