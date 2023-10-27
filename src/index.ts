import { ethers } from 'ethers';
import { MyWallet, Account } from './lib';
// import * as fs from 'fs';

const URL = 'https://sepolia.infura.io/v3/7746850a8fb348599a052c1c18d78a14';
const PASSWORD = 'password';

async function main() {
  // check if wallet file exists
  const wallet = await MyWallet.loadFromFile(PASSWORD);
  const provider = new ethers.JsonRpcProvider(URL);

  await wallet.connectProvider(provider);

  await wallet.showAccountsBalance();

  // const account1 = wallet.accountsAt(0);
  // const account2 = wallet.accountsAt(1);

  // const tx = await account1.sendTransaction({
  //   to: account2.address,
  //   value: ethers.parseEther('0.00001')
  // });

  // console.log(tx);

  // await wallet.showAccountsBalance();
}

main();
