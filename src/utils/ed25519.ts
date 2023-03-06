// import bs58 from 'bs58';
import * as bip39 from 'bip39';
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { derivePath, getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key';

ed25519.utils.sha512Sync = (...m) => sha512(ed25519.utils.concatBytes(...m));

const DEFAULT_WALLET_ID = 3;
export const DEFAULT_DERIVATION_PATH = "m/44'/3566'/1'/0'/"; //
/**
 * Derivation path does not comform to BIP-0044:
 *
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * https://github.com/MyCryptoHQ/MyCrypto/issues/2070
 *
 * */
const walletPath = (walletId: number) =>
  DEFAULT_DERIVATION_PATH + walletId.toString() + "'";

type Ed25519SecretKey = Uint8Array;

export interface Ed25519Keypair {
  publicKey: Uint8Array;
  secretKey: Ed25519SecretKey;
}

export interface KeypairGenerateOptions {
  walletId?: number;
  strength?: number;
  mnemonic?: string;
}

function isOnCurve(publicKey: Uint8Array): boolean {
  try {
    ed25519.Point.fromHex(publicKey, true);
    return true;
  } catch (error) {
    return false;
  }
}

export class Ed25519Generator {
  static mnemonic = (strength: number) => bip39.generateMnemonic(strength);

  static fromMnemonic = (
    mnemonic: string,
    walletId?: number,
  ): Ed25519Keypair => {
    walletId = walletId ?? DEFAULT_WALLET_ID;
    const hexSeed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    const { key } = derivePath(walletPath(walletId), hexSeed);
    const publicKey = getPublicKey(key);
    const secretKey = new Uint8Array(64);
    secretKey.set(key);
    secretKey.set(publicKey.subarray(1), 32);
    return { publicKey, secretKey };
  };

  static random = (): Ed25519Keypair => {
    const secretKey = new Uint8Array(64);
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.sync.getPublicKey(privateKey);
    secretKey.set(privateKey);
    secretKey.set(publicKey, 32);

    return {
      publicKey,
      secretKey,
    };
  };
}

export const sign = (
  message: Parameters<typeof ed25519.sync.sign>[0],
  secretKey: Ed25519SecretKey,
) => ed25519.sync.sign(message, secretKey.subarray(0, 32));

export const verify = ed25519.sync.verify;
