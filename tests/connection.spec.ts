import { Connection, KeyPair, PublicKey } from '../src';
import { DeenairJSONRPCError } from '../src/errors';
import {
  getBlockFixture,
  getFtInfoFixture,
  getLeaderFixture,
  getNftInfoFixture,
  stakeTransactionsFixture,
  transactionFixture,
} from './mocks/request.fixtures';
import { mockErrorResponse, MockRpcNode } from './mocks/rpc-http';
import * as mockttp from 'mockttp';
import { Transaction } from '../src/transaction/transaction';
import { SystemProgram } from '../src/programs/system';
import { expect } from 'chai';
import * as sinon from 'sinon';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const MOCK_PORT = 8989;
const url = `http://localhost:${MOCK_PORT}`;

describe('DeenAiR connection', () => {
  let connection: Connection;
  const mockServer = mockttp.getLocal();
  const mockRpc = new MockRpcNode(mockServer);
  let clock: sinon.SinonFakeTimers;
  before(() => {
    clock = sinon.useFakeTimers(new Date('2023-01-01'));
    connection = new Connection(url);
  });
  after(() => {
    clock.restore();
  });
  if (mockServer) {
    after(() => {
      mockServer.stop();
    });
  }

  it('Get block request', async () => {
    await mockRpc.mockRpcResponse({
      method: 'GetBlock',
      params: { blk: '1' },
      result: getBlockFixture('1'),
    });
    await expect(connection.getBlock(1)).to.eventually.deep.equal(
      getBlockFixture('1'),
    );
  });

  it('Get block request - non existent', async () => {
    await mockRpc.mockRpcResponse({
      method: 'GetBlock',
      params: { blk: '1' },
      error: mockErrorResponse,
    });
    await expect(connection.getBlock(1)).to.eventually.be.rejectedWith(
      DeenairJSONRPCError,
    );
  });

  it('Get leader', async () => {
    await mockRpc.mockRpcResponse({
      method: 'GetLeader',
      params: [],
      result: getLeaderFixture,
    });
    await expect(connection.getLeader()).to.eventually.deep.equal(
      getLeaderFixture,
    );
  });

  it('Get leader - error', async () => {
    await mockRpc.mockRpcResponse({
      method: 'GetLeader',
      params: [],
      error: mockErrorResponse,
    });
    await expect(connection.getLeader()).to.eventually.be.rejectedWith(
      DeenairJSONRPCError,
    );
  });

  it('Get wallet state', async () => {
    const publicKey = PublicKey.unique();
    const result = {
      balance: '10000',
      'last trx': 'test',
      wallet: publicKey.toBase58(),
    };
    await mockRpc.mockRpcResponse({
      method: 'GetWalletState',
      params: { wallet: publicKey.toBase58() },
      result,
    });
    await expect(connection.getWalletState(publicKey)).to.eventually.deep.equal(
      result,
    );
  });

  it('Get wallet state - error', async () => {
    const publicKey = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'GetWalletState',
      params: { wallet: publicKey.toBase58() },
      error: mockErrorResponse,
    });
    await expect(
      connection.getWalletState(publicKey),
    ).to.eventually.be.rejectedWith(DeenairJSONRPCError);
  });

  it('Get wallet transactions', async () => {
    const publicKey = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'GetWalletTrxs',
      params: { wallet: publicKey.toBase58() },
      result: [transactionFixture],
    });
    await expect(
      connection.getWalletTransactions(publicKey),
    ).to.eventually.deep.equal([transactionFixture]);
  });

  it('Get wallet transactions - error', async () => {
    const publicKey = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'GetWalletTrxs',
      params: { wallet: publicKey.toBase58() },
      error: mockErrorResponse,
    });
    await expect(
      connection.getWalletTransactions(publicKey),
    ).to.eventually.be.rejectedWith(DeenairJSONRPCError);
  });

  it('Get transaction', async () => {
    const transactionId = 'test';
    await mockRpc.mockRpcResponse({
      method: 'GetTrxInfo',
      params: { trxid: transactionId },
      result: transactionFixture,
    });
    await expect(
      connection.getTransaction(transactionId),
    ).to.eventually.deep.equal(transactionFixture);
  });

  it('Get transaction - error', async () => {
    const transactionId = 'test';
    await mockRpc.mockRpcResponse({
      method: 'GetTrxInfo',
      params: { trxid: transactionId },
      error: mockErrorResponse,
    });
    await expect(
      connection.getTransaction(transactionId),
    ).to.eventually.be.rejectedWith(DeenairJSONRPCError);
  });

  it('Get stakes', async () => {
    const publicKey = PublicKey.unique();
    const stake1 = PublicKey.unique();
    const stake2 = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'GetWalletTrxs',
      params: { wallet: publicKey.toBase58() },
      result: stakeTransactionsFixture(
        publicKey.toBase58(),
        stake1.toBase58(),
        stake2.toBase58(),
      ),
    });
    await expect(connection.getStakes(publicKey)).to.eventually.deep.equal({
      [stake1.toBase58()]: {
        stake: 150000,
        withdrawable: 50000,
      },
      [stake2.toBase58()]: {
        stake: 150000,
        withdrawable: 50000,
      },
    });
  });

  it('Get stakes - error', async () => {
    const publicKey = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'GetWalletTrxs',
      params: { wallet: publicKey.toBase58() },
      error: mockErrorResponse,
    });
    await expect(connection.getStakes(publicKey)).to.eventually.be.rejectedWith(
      DeenairJSONRPCError,
    );
  });

  it('Get Nft collection', async () => {
    const collection = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'NftGetColl',
      params: { coll: collection.toBase58() },
      result: ['AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs'],
    });
    await expect(
      connection.getNftCollection(collection),
    ).to.eventually.deep.equal(['AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs']);
  });

  it('Get Nft collection - error', async () => {
    const collection = PublicKey.unique();
    await mockRpc.mockRpcResponse({
      method: 'NftGetColl',
      params: { coll: collection.toBase58() },
      error: mockErrorResponse,
    });
    await expect(
      connection.getNftCollection(collection),
    ).to.eventually.be.rejectedWith(DeenairJSONRPCError);
  });

  it('Get NFT', async () => {
    const token = new PublicKey('AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs');
    await mockRpc.mockRpcResponse({
      method: 'NftGetToken',
      params: { token: token.toBase58() },
      result: getNftInfoFixture,
    });
    await expect(connection.getNftInfo(token)).to.eventually.deep.equal(
      getNftInfoFixture,
    );
  });

  it('Get NFT - error', async () => {
    const token = new PublicKey('AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs');
    await mockRpc.mockRpcResponse({
      method: 'NftGetToken',
      params: { token: token.toBase58() },
      error: mockErrorResponse,
    });
    await expect(connection.getNftInfo(token)).to.eventually.be.rejectedWith(
      DeenairJSONRPCError,
    );
  });

  it('Get FT', async () => {
    const token = new PublicKey('AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs');
    await mockRpc.mockRpcResponse({
      method: 'FtGetToken',
      params: { token: token.toBase58() },
      result: getFtInfoFixture,
    });
    await expect(connection.getFtInfo(token)).to.eventually.deep.equal(
      getFtInfoFixture,
    );
  });

  it('Get FT - error', async () => {
    const token = new PublicKey('AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs');
    await mockRpc.mockRpcResponse({
      method: 'FtGetToken',
      params: { token: token.toBase58() },
      error: mockErrorResponse,
    });
    await expect(connection.getFtInfo(token)).to.eventually.be.rejectedWith(
      DeenairJSONRPCError,
    );
  });

  it('Get FT list', async () => {
    await mockRpc.mockRpcResponse({
      method: 'FtGetTokenList',
      params: [],
      result: ['CyR9v5yPQZjatM1uky9tSb5uqozvyfw5QkJLNqA9cZAi'],
    });
    await expect(connection.getFtList()).to.eventually.deep.equal([
      'CyR9v5yPQZjatM1uky9tSb5uqozvyfw5QkJLNqA9cZAi',
    ]);
  });

  it('Send transaction', async () => {
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
    transaction.feePayer = keypair.publicKey;
    transaction.addSigners(keypair);
    const compiledTransaction = transaction.compileTransaction();
    await mockRpc.mockRpcResponse({
      method: 'NewTrx',
      params: compiledTransaction,
      result: {
        success: true,
      },
    });
    await expect(
      connection.sendCompiledTransaction(compiledTransaction),
    ).to.eventually.deep.equal({ success: true });
  });
});
