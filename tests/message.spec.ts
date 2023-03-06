import {
  decodeData,
  encodeData,
  MessageInputData,
  MESSAGE_LAYOUTS,
} from '../src/transaction/message';
import { KeyPair, PublicKey } from '../src';
import { createTestKeys } from './mocks/publickey.generator';
import * as bs58 from 'bs58';
import { NftMetadata, SystemProgram } from '../src/programs/system';
import { getTestKey } from './mocks/keypair.generator';
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('Message', () => {
  let clock: sinon.SinonFakeTimers;
  before(() => {
    clock = sinon.useFakeTimers(new Date('2023-01-01'));
  });
  after(() => {
    clock.restore();
  });

  it('Test ser/der transfer', () => {
    const keys = createTestKeys(2);

    const transferMessage: MessageInputData['Transfer'] = {
      index: 2,
      timestamp: Date.now(),
      payer: keys[0].toBuffer(),
      receiver: keys[1].toBuffer(),
      amount: 10000,
      comment: 'test',
    };
    const encoded = encodeData(MESSAGE_LAYOUTS.Transfer, transferMessage);
    const decoded = decodeData(MESSAGE_LAYOUTS.Transfer, encoded);
  });

  it('Test transfer message serialization', () => {
    const expected = bs58.decode(
      '13n9DWgQKvfPbB8g9oQTseQxKipixpkstVGUB7C1pVa6pCyWeMfGZbZ56UW5SPtaLD3ipCzcwRbqVVMxQoE4wLmfuTka25bJRai1J291KyPECraLjJDgoV',
    );
    const key = 'deenAiRoven55555555555555555555555555555555';
    const payer = new PublicKey(key);
    const receiver = new PublicKey(key);
    const amount = 10000;
    const comment = 'test';
    const dtime = new Date(2023, 1, 1, 20, 30, 30);
    const timestamp = dtime.getTime();
    const transferMessage: MessageInputData['Transfer'] = {
      index: 2,
      timestamp: timestamp,
      payer: payer.toBuffer(),
      receiver: receiver.toBuffer(),
      amount,
      comment,
    };
    const encoded = new Uint8Array(
      encodeData(MESSAGE_LAYOUTS.Transfer, transferMessage),
    );
    expect(encoded).to.deep.equal(expected);
  });

  it('Test createNft message serialization', () => {
    const expected = bs58.decode(
      '1MYEGMRf8xfwN86tiJdjPpYsB9Lej7mmCehsEKmDdjouzMK64swKfXMsxppVhedW3GLoNq1usf7dEptjEvE25YdKS54hvYYXx3AMXYaDeC4211GdyXeU8FFKsDQVi5Kmg5NZQ9hWKbPeBYHNZDrPUtPgva41HZYjwLjnZfmjK8MopPmJZX454rs67Rh5Kdt6HNYcyn6bMfyxFrgxyB6Xvpr3UCzHfxsioyn7LhDLn9DL1cUwP2PrBHfDAxN7peY9gMXXM8Rnh49a9JeZiQfLNf1JAJo1xBJ8wEbQed2Q9ws6wUXbY8zSFuGEjVWMqsZfsaWnU2J4YT1EHcE29KP41yxCX3qmtUggdARdUkUNLqJ5a',
    );
    const metadata = {
      location: 'https://path/to/your/mediafile',
      trait_1: 'trait_1_value',
      trait_2: 'trait_2_value',
      trait_3: 'trait_3_value',
      royalty: {
        SOMEONE_ADDRESS: '10',
      },
    };
    const collection = getTestKey();
    const minter = new PublicKey('deenAiRoven55555555555555555555555555555555');
    const createNftMessageData = new Uint8Array(
      SystemProgram.createNft({
        metadata,
        collection: collection.publicKey,
        minter: minter,
      }).data,
    );
    expect(createNftMessageData).to.deep.equal(expected);
  });

  it('Test createNft message serialization with long metadata', () => {
    const expected = bs58.decode(
      '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',
    );
    const metadata: NftMetadata = {
      location: 'https://path/to/your/mediafile',
      royalty: {
        SOMEONE_ADDRESS: '10',
      },
    };
    for (let i = 0; i < 100; i++) {
      metadata[`trait_${i}`] = `trait_${i}_value`;
    }
    const collection = getTestKey();
    const minter = new PublicKey('deenAiRoven55555555555555555555555555555555');
    expect(() =>
      SystemProgram.createNft({
        metadata,
        collection: collection.publicKey,
        minter: minter,
      }),
    ).not.to.throw();
    const createNftMessageData = new Uint8Array(
      SystemProgram.createNft({
        metadata,
        collection: collection.publicKey,
        minter: minter,
      }).data,
    );
    expect(createNftMessageData).to.deep.equal(expected);
  });

  it('Test burnNFT', () => {
    const expected = bs58.decode(
      '13rMsrJxboEUdtJyqsK9Jxav1qnteuYrF9U579FwwPSnJSqmDu1apfenT',
    );
    const owner = PublicKey.unique();
    const token = new PublicKey('11111111111111111111111111111111');
    const burnNft = new Uint8Array(
      SystemProgram.burnNft({ owner, token }).data,
    );
    expect(burnNft).to.deep.equal(expected);
  });
});
