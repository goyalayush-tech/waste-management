require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Only include these networks when PRIVATE_KEY is properly set
    ...(process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length >= 64 ? {
      polygon: {
        url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
        accounts: [process.env.PRIVATE_KEY]
      },
      ethereum: {
        url: process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/your-infura-key",
        accounts: [process.env.PRIVATE_KEY]
      }
    } : {})
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};