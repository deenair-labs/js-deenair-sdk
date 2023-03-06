import { PublicKey } from './publickey';
import { Ed25519Keypair, Ed25519Generator } from './utils/ed25519';

const SECRET_KEY_LENGTH = 64;

export class KeyPair {
  private _keypair: Ed25519Keypair;
  public mnemonic: string;
  constructor(keypair?: Ed25519Keypair, mnemonic?: string) {
    this._keypair = keypair ?? Ed25519Generator.random();
    this.mnemonic = mnemonic ?? '';
  }

  static generate(): KeyPair {
    return new KeyPair(Ed25519Generator.random());
  }

  static generateMnemonic(opts: { strength: number }): string {
    return Ed25519Generator.mnemonic(opts.strength);
  }

  static fromMnemonic(opts: { mnemonic: string; walletId?: number }): KeyPair {
    return new KeyPair(
      Ed25519Generator.fromMnemonic(opts.mnemonic, opts.walletId),
      opts.mnemonic,
    );
  }

  static fromSecretKey(secretKey: Uint8Array): KeyPair {
    if (secretKey.byteLength !== SECRET_KEY_LENGTH) {
      throw new Error(`Bad secret key size`);
    }
    const publicKey = secretKey.slice(32, 64);
    return new KeyPair({ publicKey, secretKey });
  }

  get publicKey(): PublicKey {
    return new PublicKey(this._keypair.publicKey);
  }

  get secretKey(): Uint8Array {
    return new Uint8Array(this._keypair.secretKey);
  }
}
