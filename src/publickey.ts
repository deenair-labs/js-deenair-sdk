import BN from 'bn.js';
import bs58 from 'bs58';

export const MAX_SEED_LENGTH = 32;
export const PUBLIC_KEY_LENGTH = 32;

export type PublicKeyData = {
  _bn: BN;
};
export type PublicKeyInitData =
  | number
  | string
  | Uint8Array
  | Array<number>
  | PublicKeyData;
function isPublicKeyData(value: PublicKeyInitData): value is PublicKeyData {
  return (value as PublicKeyData)._bn !== undefined;
}

let uniquePublicKeyCounter = 1;

export class PublicKey {
  _bn: BN;
  constructor(value: PublicKeyInitData) {
    if (isPublicKeyData(value)) {
      this._bn = value._bn;
    } else {
      if (typeof value === 'string') {
        const decoded = bs58.decode(value);
        if (decoded.length != PUBLIC_KEY_LENGTH) {
          throw new Error(`Invalid public key input`);
        }
        this._bn = new BN(decoded);
      } else {
        this._bn = new BN(value);
      }
      if (this._bn.byteLength() > PUBLIC_KEY_LENGTH) {
        throw new Error(`Invalid public key input`);
      }
    }
  }

  equals(publicKey: PublicKey): boolean {
    return this._bn.eq(publicKey._bn);
  }

  toBuffer(): Buffer {
    const b = this._bn.toArrayLike(Buffer);
    if (b.length === PUBLIC_KEY_LENGTH) {
      return b;
    }
    const zeroPad = Buffer.alloc(32);
    b.copy(zeroPad, 32 - b.length);
    return zeroPad;
  }

  toBytes(): Uint8Array {
    const buf = this.toBuffer();
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  toBase58(): string {
    return bs58.encode(this.toBytes());
  }

  static unique(): PublicKey {
    const key = new PublicKey(uniquePublicKeyCounter);
    uniquePublicKeyCounter++;
    return new PublicKey(key.toBuffer());
  }
}
