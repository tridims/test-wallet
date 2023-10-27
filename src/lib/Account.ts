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
  decryptKeystoreJson
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
    path: string,
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

  getKeystoreFormat(): KeystoreAccount {
    const account: KeystoreAccount = {
      address: this.address,
      privateKey: this.privateKey
    };

    const m = this.mnemonic;

    account.mnemonic = {
      path: this.path,
      locale: 'en',
      entropy: m.entropy
    };

    return account;
  }

  connect(provider: Provider): Account {
    this.provider = provider;
    return this;
  }

  async encryptAccount(password: Uint8Array | string): Promise<Account> {
    return JSON.parse(
      await encryptKeystoreJson(this.getKeystoreFormat(), password)
    );
  }

  // STATIC METHODS
  static createFromMnemonic(
    mnemonic: Mnemonic,
    path: string = START_PATH
  ): Account {
    const seed = getBytes(mnemonic.computeSeed(), 'seed');
    const I = getBytes(computeHmac('sha512', BITCOIN_MASTERSECRET, seed));
    const signingKey = new SigningKey(hexlify(I.slice(0, 32)));

    return new Account(
      signingKey,
      '0x00000000',
      hexlify(I.slice(32)),
      path,
      0,
      0,
      mnemonic,
      null
    );
  }

  static async decryptKeyStore(
    json: string,
    password: string
  ): Promise<Account> {
    const keyStoreAccount: KeystoreAccount = await decryptKeystoreJson(
      json,
      password
    );

    const mnemonic = Mnemonic.fromEntropy(keyStoreAccount.mnemonic.entropy);
    const account = Account.createFromMnemonic(
      mnemonic,
      keyStoreAccount.mnemonic.path
    );
    return account;
  }
}
