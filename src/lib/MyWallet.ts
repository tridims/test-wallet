import {
  JsonRpcProvider,
  LangEn,
  Mnemonic,
  Provider,
  formatEther,
  randomBytes
} from 'ethers';
import Account from './Account';
import * as fs from 'fs';
import { START_PATH } from './utilities/constants';

const DEFAULT_FILE = 'my-wallet.json';

export default class MyWallet {
  readonly #password: string;
  readonly #mnemonic: Mnemonic;

  #provider?: Provider;
  #accounts: Account[];

  // construct new empty wallet
  constructor(password: string, provider?: Provider, accounts: Account[] = []) {
    this.#accounts = accounts;
    this.#password = password;
    this.#provider = provider;

    const wordlist = LangEn.wordlist();
    this.#mnemonic = Mnemonic.fromEntropy(randomBytes(16), '', wordlist);
  }

  get accounts() {
    return this.#accounts;
  }

  get mnemonic() {
    return this.#mnemonic.phrase;
  }

  // create new account using mnemonic and path
  async createNewAccount() {
    const path = `${START_PATH}${this.#accounts.length}`;
    const account = await Account.createFromMnemonic(this.#mnemonic, path);

    account.connect(this.#provider);
    this.#accounts.push(account);

    this.saveToFile();

    return account;
  }

  accountsAt(index: number) {
    return this.#accounts[index];
  }

  async connectProvider(provider: JsonRpcProvider) {
    this.#provider = provider;
    this.#accounts.forEach((account) => account.connect(provider));
  }

  async showAccountsBalance() {
    for (const account of this.#accounts) {
      const balance = await this.#getBalance(account.address);
      console.log(`${account.address} : ${formatEther(balance)}`);
    }
  }

  async #getBalance(address: string) {
    return this.#provider.getBalance(address);
  }

  async saveToFile(file?: string) {
    const _file = file || DEFAULT_FILE;
    const jsonKeystore = await Account.dumpMultiple(
      this.#accounts,
      this.#password
    );

    fs.writeFileSync(_file, jsonKeystore);
  }

  // STATIC
  static async loadFromFile(
    password: string,
    file?: string
  ): Promise<MyWallet> {
    const _file = file || DEFAULT_FILE;
    const jsonKeystore = fs.readFileSync(_file, 'utf8');

    const accounts = await Account.loadMultiple(jsonKeystore, password);

    return new MyWallet(password, undefined, accounts);
  }
}
