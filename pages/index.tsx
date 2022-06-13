import type { NextPage } from 'next'
import Head from 'next/head'

import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import myEpicNft from '../public/MyEpicNFT.json';
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-p54gsrgrc2';
const CONTRACT_ADDRESS = "0x476D0131e701B8A273232aD2Ced77Da407B9190c";
const RINKEBY_ID = "0x4";

const Home: NextPage = () => {
  // State variables to store user  wallet
  const [currentAccount, setCurrentAccount] = useState("");

  const isRinkeby = async () => {
    const { ethereum } = window;

    if (!ethereum) return false;
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    if (chainId !== RINKEBY_ID) return false;
    return true;
  }

  const setOnChainChange = () => {
    const { ethereum } = window;
    if (!ethereum) return;
    ethereum.on("chainChanged", (chainId: any) => {
      console.log(`chainId: ${chainId}`);
      if (chainId === RINKEBY_ID) window.location.reload();
    });
  };

  const clearMessage = () => {
    const container = document.querySelector("#message");
    if (!(container instanceof HTMLElement)) {
      console.error("message container is not HTMLElement");
      return;
    }

    container.innerHTML = "";
  }

  const appendMessage = (content: string) => {
    const container = document.querySelector("#message");
    if (!(container instanceof HTMLElement)) {
      console.error("message container is not HTMLElement");
      return;
    }

    const div = document.createElement("div");
    div.innerHTML = content;
    container.append(div);
  }

  // Check wallet is connected
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if the wallet is authorized
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // Use the first account
    if (Array.isArray(accounts) && accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
      setOnChainChange();
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // Request access to account
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!Array.isArray(accounts)) {
        alert("Error: failed to get account info");
        return;
      }

      console.log("Conencted", accounts[0]);
      setCurrentAccount(accounts[0]);
      setupEventListener();
      setOnChainChange();
    } catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          const mintedUrl = `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`;
          const mintedMessage = `New NFT minted on <a href="${mintedUrl}">OpenSea</a>`;
          appendMessage(mintedMessage);
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {

    try {
      const { ethereum } = window;

      if (ethereum) {
        if (await isRinkeby() !== true) {
          alert("Change to Rinkeby testnet!");
          return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        clearMessage();

        const miningMessage = "⛏Mining...";
        console.log(miningMessage);
        appendMessage(miningMessage);
        await nftTxn.wait();

        const minedMessage = "Mined.";
        console.log(minedMessage);
        appendMessage(minedMessage);

        const txnUrl = `https://rinkeby.etherscan.io/tx/${nftTxn.hash}`;
        const txnMessage = `View transaction: <a href="${txnUrl}">${nftTxn.hash}</a>`;
        console.log(txnMessage);
        appendMessage(txnMessage);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div>
      <Head>
        <title>My NFT</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="App">
        <div className="container">
          <div className="header-container">
            <p className="header gradient-text">My NFT Collection</p>
            <p className="sub-text">
              Each unique. Each beautiful. Discover your NFT today🧚
            </p>
            <a href={OPENSEA_LINK}>
              <button className="cta-button opensea-button">
                View Collection on OpenSea
              </button>
            </a>
            {currentAccount === "" ? (
              renderNotConnectedContainer()
            ) : (
              <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                  Mint NFT
              </button>
            )}
          </div>
          <div id="message"></div>
        </div>
      </div>
    </div>
  )
}

export default Home
