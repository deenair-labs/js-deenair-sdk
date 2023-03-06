import base58 = require('bs58');
import { PublicKey } from '../src';
import { KeyPair } from '../src/keypair';
import { SystemProgram } from '../src/programs/system';
import { Transaction } from '../src/transaction/transaction';
import { sign, verify } from '../src/utils/ed25519';
import { expect } from 'chai';

describe('Keypair', () => {
  it('generate', () => {
    const keypair = new KeyPair();
    expect(keypair.publicKey).to.be.ok;
    expect(keypair.secretKey).to.be.ok;
    expect(keypair.secretKey).to.have.length(64);
  });

  it('Restore from mnemonic and wallet ID', () => {
    const mnemonic =
      'team foot shop author visa add chicken degree left author hen umbrella';
    const keypair1 = KeyPair.fromMnemonic({ mnemonic, walletId: 1 });
    const keypair2 = KeyPair.fromMnemonic({ mnemonic, walletId: 1 });
    const keypair3 = KeyPair.fromMnemonic({ mnemonic, walletId: 2 });
    expect(keypair1.publicKey.equals(keypair2.publicKey)).to.be.true;
    expect(keypair1.secretKey).to.deep.equal(keypair2.secretKey);
    expect(keypair1.secretKey).not.to.deep.equal(keypair3.secretKey);
    expect(keypair1.publicKey.equals(keypair3.publicKey)).to.be.false;
  });

  it('Stores mnemonic', () => {
    const mnemonic =
      'team foot shop author visa add chicken degree left author hen umbrella';
    const keypair2 = KeyPair.fromMnemonic({ mnemonic, walletId: 1 });
    expect(mnemonic).to.equal(keypair2.mnemonic);
  });

  it('Sign and verify with generated key', () => {
    const keypair = new KeyPair();
    const message = Buffer.alloc(8).fill('t');
    const signature = sign(message, keypair.secretKey.subarray(0, 32));
    expect(verify(signature, message, keypair.publicKey.toBuffer())).to.be.true;
  });

  it('Sign and verify with mnemonic key', () => {
    const mnemonic =
      'team foot shop author visa add chicken degree left author hen umbrella';
    const keypair = KeyPair.fromMnemonic({ mnemonic });
    const message = Buffer.alloc(8).fill('t');
    const signature = sign(message, keypair.secretKey.subarray(0, 32));
    expect(verify(signature, message, keypair.publicKey.toBuffer())).to.be.true;
  });

  it('Test recover from mnemonic', () => {
    const mnemonic = [
      'loud',
      'refuse',
      'inner',
      'diamond',
      'census',
      'polar',
      'swear',
      'enhance',
      'shift',
      'knock',
      'fresh',
      'disease',
    ].join(' ');
    const walletId = 3;
    const keypair = KeyPair.fromMnemonic({ mnemonic, walletId });
    expect(keypair.publicKey.toBase58()).to.equal(
      '3V23V8UmvxMyWmcJx3dJ47uwHinWfm6Q94Ar3RoD1B3Y',
    );
    expect(base58.encode(keypair.secretKey.subarray(0, 32))).to.equal(
      'BBJCCyHDtrdNwvRRJCRCEZwxY2mLZCm8QkNDwa7VaKfh',
    );
  });
});
