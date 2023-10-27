import {
  BaseWallet,
  Mnemonic,
  SigningKey,
  dataSlice,
  ripemd160,
  sha256,
  Provider,
  KeystoreAccount,
  encryptKeystoreJson,
  getBytes,
  computeHmac,
  hexlify,
  decryptKeystoreJson,
  JsonRpcProvider
} from 'ethers';

import { BITCOIN_MASTERSECRET, START_PATH } from './utilities/constants';

export default class Account extends BaseWallet {
  readonly publicKey: string;
  readonly fingerprint!: string;
  readonly parentFingerprint!: string;
  readonly mnemonic!: Mnemonic;
  readonly chainCode!: string;
  readonly path!: null | string;
  readonly index!: number;
  readonly depth!: number;
  provider: Provider = null;

  constructor(
    signingKey: SigningKey,
    parentFingerprint: string,
    chainCode: string,
    path: null | string,
    index: number,
    depth: number,
    mnemonic: null | Mnemonic,
    provider: null | Provider
  ) {
    super(signingKey, provider);

    this.publicKey = signingKey.compressedPublicKey;
    this.fingerprint = dataSlice(ripemd160(sha256(this.publicKey)), 0, 4);

    this.parentFingerprint = parentFingerprint;
    this.chainCode = chainCode;
    this.path = path;
    this.index = index;
    this.depth = depth;
    this.mnemonic = mnemonic;
    this.provider = provider;
  }

  getKeystoreAccount(): KeystoreAccount {
    const account: KeystoreAccount = {
      address: this.address,
      privateKey: this.privateKey
    };
    const m = this.mnemonic;
    if (this.path && m && m.wordlist.locale === 'en' && m.password === '') {
      account.mnemonic = {
        path: this.path,
        locale: 'en',
        entropy: m.entropy
      };
    }

    return account;
  }

  connect(provider: Provider): Account {
    this.provider = provider;
    return this;
  }

  async encryptAccount(password: Uint8Array | string): Promise<Account> {
    return JSON.parse(
      await encryptKeystoreJson(this.getKeystoreAccount(), password)
    );
  }

  // STATIC METHODS
  static createFromMnemonic(mnemonic: Mnemonic, path?: string): Account {
    if (!path) {
      path = START_PATH;
    }

    const seed = getBytes(mnemonic.computeSeed(), 'seed');
    const I = getBytes(computeHmac('sha512', BITCOIN_MASTERSECRET, seed));
    const signingKey = new SigningKey(hexlify(I.slice(0, 32)));

    return new Account(
      signingKey,
      '0x00000000',
      hexlify(I.slice(32)),
      'm',
      0,
      0,
      mnemonic,
      null
    );
  }

  static async decryptKeyStoreJSON(
    json: string,
    password: string
  ): Promise<Account> {
    const account: KeystoreAccount = await decryptKeystoreJson(json, password);

    if (
      'mnemonic' in account &&
      account.mnemonic &&
      account.mnemonic.locale === 'en'
    ) {
      const mnemonic = Mnemonic.fromEntropy(account.mnemonic.entropy);
      const wallet = Account.createFromMnemonic(
        mnemonic,
        account.mnemonic.path
      );
      if (
        wallet.address === account.address &&
        wallet.privateKey === account.privateKey
      ) {
        return wallet;
      }
    }
  }

  static async loadMultiple(
    json: string,
    password: string
  ): Promise<Account[]> {
    const accounts: Account[] = [];
    const jsonKeystore = JSON.parse(json);

    for (const account of jsonKeystore.accounts) {
      const wallet = await Account.decryptKeyStoreJSON(
        JSON.stringify(account),
        password
      );
      accounts.push(wallet);
    }

    return accounts;
  }

  static async dumpMultiple(
    accounts: Account[],
    password: string
  ): Promise<string> {
    const jsonKeystore: { accounts: Account[] } = {
      accounts: []
    };

    for (const account of accounts) {
      jsonKeystore.accounts.push(await account.encryptAccount(password));
    }

    return JSON.stringify(jsonKeystore, null, 2);
  }
}
