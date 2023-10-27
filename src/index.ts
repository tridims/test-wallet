import { ethers } from 'ethers';
import { MyWallet, Account } from './lib';
// import * as fs from 'fs';

const URL = 'https://sepolia.infura.io/v3/7746850a8fb348599a052c1c18d78a14';
const PASSWORD = 'password';

async function main() {
  // const wallet = new MyWallet('testing password');
  const wallet = await MyWallet.loadFromFile('testing password');
  // const wallet = await MyWallet.loadFromFile(PASSWORD, 'my-wallet-old.json');

  const provider = new ethers.JsonRpcProvider(URL);
  await wallet.connectProvider(provider);

  // BALANCE
  await wallet.showAccountsBalance();

  // const account1 = wallet.accountsAt(0);
  // const account2 = wallet.accountsAt(2);

  // ACCOUNT INFO
  // console.log(account1);

  // TRANSFER
  // const tx = await account1.sendTransaction({
  //   to: account2.address,
  //   value: ethers.parseEther('0.00001')
  // });

  // console.log(tx);

  // CREATE ACCOUNT
  // const newAccount = await wallet.createNewAccount();
  // console.log(newAccount);
}

main();
