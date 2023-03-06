import { FEE_RECEIVER, SystemProgram } from '../src/programs/system';
import { MessageInputData } from '../src/transaction/message';
import { Transaction, WireTransaction } from '../src/transaction/transaction';
import { verify } from '../src/utils/ed25519';
import {
  createTestKeypairs,
  createTestKeys,
} from './mocks/publickey.generator';
import * as bs58 from 'bs58';
import { KeyPair, PublicKey } from '../src';
import { expect } from 'chai';
import * as sinon from 'sinon';
import chai = require('chai');
import chaiExclude from 'chai-exclude';
chai.use(chaiExclude);

describe('Transaction', () => {
  let clock: sinon.SinonFakeTimers;
  before(() => {
    clock = sinon.useFakeTimers(new Date('2023-01-01'));
  });
  after(() => {
    clock.restore();
  });

  it('Create and compile transaction without signers', () => {
    const keys = createTestKeys(2);
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        payer: keys[0],
        receiver: keys[1],
        amount: 10000,
        comment: 'test',
      }),
    );
    expect(() => transaction.compileTransaction()).to.throw(
      `No signers present in the transaction.`,
    );
  });

  it('Create transaction with one message and check fee', () => {
    const keys = createTestKeys(1);
    const keypairs = createTestKeypairs(1);
    const transaction = new Transaction();
    const transferInstruction = SystemProgram.transfer({
      payer: keypairs[0].publicKey,
      receiver: keys[0],
      amount: 10000,
      comment: 'test',
    });
    transaction.add(transferInstruction);
    transaction.addSigners(...keypairs);
    const compiledTransaction = transaction.compileTransaction();
    expect(
      verify(
        bs58.decode(compiledTransaction.messages[0].sign),
        transferInstruction.data,
        keypairs[0].publicKey.toBuffer(),
      ),
    ).to.be.true;
    const feeInstruction = transaction.instructions.at(-1);
    if (!feeInstruction) throw new Error();
    const feeMessage: MessageInputData['Transfer'] = feeInstruction.message;
    expect(feeMessage.index).to.equal(2);
    expect(bs58.encode(feeMessage.receiver)).to.deep.equal(
      FEE_RECEIVER.toBase58(),
    );
  });

  it('Create and compile with multiple messages and 1 absent signer', () => {
    const keypairs = createTestKeypairs(1);
    const keys = createTestKeys(1);
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[0].publicKey,
        receiver: keys[0],
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.add(
      SystemProgram.transfer({
        payer: keys[0],
        receiver: keypairs[0].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.addSigners(...keypairs);
    expect(() => transaction.compileTransaction()).to.throw(
      `Signer ${keys[0].toBase58()} is not present`,
    );
  });

  it('Create and compile with multiple messages and all signers', () => {
    const keypairs = createTestKeypairs(2);
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[0].publicKey,
        receiver: keypairs[1].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[1].publicKey,
        receiver: keypairs[0].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.addSigners(...keypairs);
    expect(() => transaction.compileTransaction()).not.to.throw();
  });

  it('Compile', () => {
    const transaction = new Transaction();
    const keypair = new KeyPair();
    const pkey = PublicKey.unique();
    transaction.add(
      SystemProgram.transfer({
        payer: keypair.publicKey,
        receiver: pkey,
        amount: 10000,
        comment: 'test',
      }),
    );

    transaction.addSigners(keypair);
    const compiledTransaction = transaction.compileTransaction();
    const expected: WireTransaction = {
      messages: [
        /** Transfer message */
        {
          type: 2,
          time: Date.now(),
          sign: '',
          payer: keypair.publicKey.toBase58(),
          receiver: pkey.toBase58(),
          amount: 10000,
          comment: 'test',
        },
        /** Fee message */
        {
          type: 2,
          time: Date.now(),
          sign: '',
          payer: keypair.publicKey.toBase58(),
          receiver: FEE_RECEIVER.toBase58(),
          amount: 12470,
          comment: '',
        },
      ],
    };
    compiledTransaction.messages.map(msg => expect(msg.sign).to.be.string);
    expect(compiledTransaction).excludingEvery('sign').to.deep.equal(expected);
  });

  it('Fee payer explicit', () => {
    const keypairs = createTestKeypairs(2);
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[0].publicKey,
        receiver: keypairs[1].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[1].publicKey,
        receiver: keypairs[0].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.addSigners(...keypairs);
    transaction.feePayer = keypairs[1].publicKey;
    transaction.compileTransaction();
    const feeInstruction = transaction.instructions.at(-1);
    if (!feeInstruction) throw new Error();
    const feeMessage: MessageInputData['Transfer'] = feeInstruction.message;
    expect(feeMessage.index).to.equal(2);
    expect(bs58.encode(feeMessage.payer)).to.deep.equal(
      keypairs[1].publicKey.toBase58(),
    );
    expect(bs58.encode(feeMessage.receiver)).to.deep.equal(
      FEE_RECEIVER.toBase58(),
    );
  });

  it('Fee payer implicit (first signer)', () => {
    const keypairs = createTestKeypairs(2);
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[0].publicKey,
        receiver: keypairs[1].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.add(
      SystemProgram.transfer({
        payer: keypairs[1].publicKey,
        receiver: keypairs[0].publicKey,
        amount: 10000,
        comment: 'test',
      }),
    );
    transaction.addSigners(...keypairs);
    transaction.compileTransaction();
    const feeInstruction = transaction.instructions.at(-1);
    if (!feeInstruction) throw new Error();
    const feeMessage: MessageInputData['Transfer'] = feeInstruction.message;
    expect(feeMessage.index).to.equal(2);
    expect(bs58.encode(feeMessage.payer)).to.deep.equal(
      keypairs[0].publicKey.toBase58(),
    );
    expect(bs58.encode(feeMessage.receiver)).to.deep.equal(
      FEE_RECEIVER.toBase58(),
    );
  });

  it('Transaction with create NFT', () => {
    const transaction = new Transaction();
    const keypair = new KeyPair();
    const collection = new KeyPair();
    const metadata = {
      location: 'https://path/to/your/mediafile',
      trait_1: 'trait_1_value',
      trait_2: 'trait_2_value',
      trait_3: 'trait_3_value',
      royalty: {
        SOMEONE_ADDRESS: '10',
      },
    };
    transaction.add(
      SystemProgram.createNft({
        metadata,
        minter: keypair.publicKey,
        collection: collection.publicKey,
      }),
    );
    transaction.addSigners(collection, keypair);
    transaction.feePayer = keypair.publicKey;
    const compiledTransaction = transaction.compileTransaction();
    const createSig = compiledTransaction.messages[0].sign;
    expect(
      verify(
        bs58.decode(createSig),
        transaction.instructions[0].data,
        collection.publicKey.toBuffer(),
      ),
    ).to.be.true;
    const expected: WireTransaction = {
      messages: [
        /** Create NFT message */
        {
          type: 7,
          time: Date.now(),
          coll: collection.publicKey.toBase58(),
          token: '', // expect.any(String),
          minter: keypair.publicKey.toBase58(),
          metadata: JSON.stringify(metadata),
          sign: '', // expect.any(String),
        },
        /** Fee message */
        {
          type: 2,
          time: Date.now(),
          sign: '', // expect.any(String),
          payer: keypair.publicKey.toBase58(),
          receiver: FEE_RECEIVER.toBase58(),
          amount: '', // expect.any(Number),
          comment: '',
        },
      ],
    };
    expect(compiledTransaction)
      .excludingEvery(['sign', 'amount', 'token'])
      .to.deep.equal(expected);
    compiledTransaction.messages.map(msg => {
      expect(msg.sign).to.be.string;
    });
    expect(compiledTransaction.messages[0].token).to.be.string;
    expect(compiledTransaction.messages[1].amount).to.be.a('number');
  });

  it('Transaction with burn signer', () => {
    const transaction = new Transaction();
    const keypair = new KeyPair();
    const token = new PublicKey('11111111111111111111111111111111');
    transaction.add(
      SystemProgram.burnNft({ owner: keypair.publicKey, token: token }),
    );
    transaction.addSigners(keypair);
    const compiledTransaction = transaction.compileTransaction();
    const burnSig = compiledTransaction.messages[0].sign;
    expect(
      verify(
        bs58.decode(burnSig),
        transaction.instructions[0].data,
        keypair.publicKey.toBuffer(),
      ),
    ).to.be.true;
    expect(compiledTransaction.messages.length).to.equal(2);
    const expected: WireTransaction = {
      messages: [
        /** Burn NFT message */
        {
          type: 13,
          time: Date.now(),
          sign: '', // expect.any(String),
          token: token.toBase58(),
        },
        /** Fee message */
        {
          type: 2,
          time: Date.now(),
          sign: '', // expect.any(String),
          payer: keypair.publicKey.toBase58(),
          receiver: FEE_RECEIVER.toBase58(),
          amount: '', // expect.any(Number),
          comment: '',
        },
      ],
    };
    compiledTransaction.messages.map(msg => expect(msg.sign).to.be.string);
    expect(compiledTransaction.messages[1].amount).to.be.a('number');
    expect(compiledTransaction)
      .excludingEvery(['sign', 'amount'])
      .to.deep.equal(expected);
  });
});
