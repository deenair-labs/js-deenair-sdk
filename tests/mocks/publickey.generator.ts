import { KeyPair, PublicKey } from '../../src';

export function createTestKeys(count: number): Array<PublicKey> {
  return new Array(count).fill(0).map(() => PublicKey.unique());
}

export function createTestKeypairs(count: number): Array<KeyPair> {
  return new Array(count).fill(0).map(() => new KeyPair());
}
