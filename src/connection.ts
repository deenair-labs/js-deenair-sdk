import type { Agent as NodeHttpAgent } from 'http';
import { Agent as NodeHttpsAgent } from 'https';
import HttpKeepAliveAgent, {
  HttpsAgent as HttpsKeepAliveAgent,
} from 'agentkeepalive';
// const HttpKeepAliveAgent = require('agentkeepalive');
// const HttpsKeepAliveAgent = require('agentkeepalive').HttpsAgent;
// import * as KeepAlive from 'agentkeepalive';
import RpcClient from 'jayson/lib/client/browser';
import { sleep } from './utils/sleep';
import { DeenairJSONRPCError } from './errors';
import { randomUUID } from 'crypto';
import { PublicKey } from './publickey';
import {
  IGetBlock,
  IGetStakes,
  IGetTransaction,
  IGetWalletTransactions,
  IGetWalletState,
  IGetCollection,
  IGetToken,
} from './types/rpc-params.interfaces';
import { any, create } from 'superstruct';
import {
  GetBlockRpcResult,
  GetFtList,
  GetFtRpcResult,
  GetLeaderRpcResult,
  GetNftCollectionRpcResult,
  GetNftRpcResult,
  GetNodeListRpcResult,
  GetTransactionRpcResult,
  GetTransactionsRpcResult,
  GetWalletStateRpcResult,
  NewTrxRpcResult,
} from './types/rpc.responses';
import { Transaction, WireTransaction } from './transaction/transaction';

type RpcRequest = (
  methodName: string,
  args: Array<any> | object,
) => Promise<any>;

type Stake = {
  stake: number;
  withdrawable: number;
};

function createRpcClient(
  url: string,
  httpAgent?: NodeHttpAgent | NodeHttpsAgent | null,
) {
  let agent: NodeHttpAgent | NodeHttpsAgent | undefined;
  if (process.env.BROWSER) {
    if (httpAgent != null) {
      console.warn(
        'You have supplied an `httpAgent` when creating a `Connection` in a browser environment.' +
          'It has been ignored; `httpAgent` is only used in Node environments.',
      );
    }
  } else {
    if (httpAgent == null) {
      if (url.startsWith('https:')) {
        agent = new HttpsKeepAliveAgent();
      } else {
        agent = new HttpKeepAliveAgent();
      }
    } else {
      // TODO: parse http agent
      agent = httpAgent;
    }
  }
  const clientBrowser = new RpcClient(async (request, callback) => {
    const options = {
      method: 'POST',
      body: request,
      agent,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      let too_many_requests_retries = 5;
      let res: Response;
      let waitTime = 500;
      for (;;) {
        res = await fetch(url, options);

        if (res.status !== 429 /* Too many requests */) {
          break;
        }
        too_many_requests_retries -= 1;
        if (too_many_requests_retries === 0) {
          break;
        }
        console.log(
          `Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`,
        );
        await sleep(waitTime);
        waitTime *= 2;
      }

      const text = await res.text();
      if (res.ok) {
        callback(null, text);
      } else {
        callback(new Error(`${res.status} ${res.statusText}: ${text}`));
      }
    } catch (err) {
      if (err instanceof Error) callback(err);
    }
  }, {});
  return clientBrowser;
}

function createRpcRequest(client: RpcClient): RpcRequest {
  return (method, args) => {
    return new Promise((resolve, reject) => {
      client.request(method, args, (err: any, response: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}

export class Connection {
  private _rpcEndpoint: string;
  private _rpcClient: RpcClient;
  private _rpcRequest: RpcRequest;
  constructor(endpoint: string) {
    this._rpcEndpoint = endpoint;
    this._rpcClient = createRpcClient(endpoint);
    this._rpcRequest = createRpcRequest(this._rpcClient);
  }

  get rpcEndpoint(): string {
    return this._rpcEndpoint;
  }

  _buildArgs(args: Array<any>) {
    return args;
  }

  async getBlock(block: 'latest' | number) {
    const params: IGetBlock =
      block === 'latest' ? {} : { blk: block.toString() };
    const unsafeRes = await this._rpcRequest('GetBlock', params);
    const res = create(unsafeRes, GetBlockRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to get block ${block}`);
    }
    return res.result;
  }

  async getNodeList() {
    const unsafeRes = this._rpcRequest('GetNodeList', []);
    const res = create(unsafeRes, GetNodeListRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to get node list`);
    }
    return res.result;
  }

  async getLeader() {
    const unsafeRes = await this._rpcRequest('GetLeader', []);
    const res = create(unsafeRes, GetLeaderRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to get leader`);
    }
    return res.result;
  }

  async getWalletState(publicKey: PublicKey) {
    const params: IGetWalletState = {
      wallet: publicKey.toBase58(),
    };
    const unsafeRes = await this._rpcRequest('GetWalletState', params);
    const res = create(unsafeRes, GetWalletStateRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to get wallet state`);
    }
    return res.result;
  }

  async getWalletTransactions(publicKey: PublicKey) {
    const params: IGetWalletTransactions = {
      wallet: publicKey.toBase58(),
    };
    const unsafeRes = await this._rpcRequest('GetWalletTrxs', params);
    const res = create(unsafeRes, GetTransactionsRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(
        res.error,
        `Failed to get transactions for wallet ${publicKey.toBase58()}`,
      );
    }
    return res.result;
  }

  async getTransaction(transactionId: string) {
    const params: IGetTransaction = {
      trxid: transactionId,
    };
    const unsafeRes = await this._rpcRequest('GetTrxInfo', params);
    const res = create(unsafeRes, GetTransactionRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(
        res.error,
        `Failed to get transaction ${transactionId}`,
      );
    }
    return res.result;
  }

  async getStakes(publicKey: PublicKey) {
    const transactions = await this.getWalletTransactions(publicKey);
    const timestamp = Date.now();
    const stakes: Record<string, Stake> = {};
    for (const transaction of transactions) {
      if (transaction.type !== 'remittance') continue;
      const messages = transaction.msgs;
      if (!messages) continue;
      for (const message of messages) {
        const diff = timestamp - Number.parseInt(message.time); // why time is string??
        const twoWeeksPassed = diff / 86400000 > 14;
        if (!(message.receiver in stakes)) {
          stakes[message.receiver] = { withdrawable: 0, stake: 0 };
        }
        if (message.type == 'stake delegate') {
          stakes[message.receiver].stake += Number.parseInt(message.sum);
          twoWeeksPassed
            ? (stakes[message.receiver].withdrawable += Number.parseInt(
                message.sum,
              ))
            : null;
        } else if (message.type == 'stake withdraw') {
          stakes[message.receiver].stake -= Number.parseInt(message.sum);
          stakes[message.receiver].withdrawable -= Number.parseInt(message.sum);
        }
      }
    }
    return stakes;
  }

  async getNftCollection(collection: PublicKey) {
    const params: IGetCollection = {
      coll: collection.toBase58(),
    };
    const unsafeRes = await this._rpcRequest('NftGetColl', params);
    const res = create(unsafeRes, GetNftCollectionRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(
        res.error,
        `Failed to get token IDs for collection ${collection.toBase58()}`,
      );
    }
    return res.result;
  }

  async getNftInfo(token: PublicKey) {
    const params: IGetToken = {
      token: token.toBase58(),
    };
    const unsafeRes = await this._rpcRequest('NftGetToken', params);
    const res = create(unsafeRes, GetNftRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(
        res.error,
        `Failed to get token ${token.toBase58()}`,
      );
    }
    return res.result;
  }

  async getFtInfo(token: PublicKey) {
    const params: IGetToken = {
      token: token.toBase58(),
    };
    const unsafeRes = await this._rpcRequest('FtGetToken', params);
    const res = create(unsafeRes, GetFtRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(
        res.error,
        `Failed to get token ${token.toBase58()}`,
      );
    }
    return res.result;
  }

  async getFtList() {
    const unsafeRes = await this._rpcRequest('FtGetTokenList', []);
    const res = create(unsafeRes, GetFtList);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to get FT list`);
    }
    return res.result;
  }

  async sendTransaction(transaction: Transaction) {
    const compiledTransaction = transaction.compileTransaction();
    return this.sendCompiledTransaction(compiledTransaction);
  }

  async sendCompiledTransaction(transaction: WireTransaction) {
    const unsafeRes = await this._rpcRequest('NewTrx', transaction);
    const res = create(unsafeRes, NewTrxRpcResult);
    if ('error' in res) {
      throw new DeenairJSONRPCError(res.error, `Failed to create transaction`);
    }
    return res.result;
  }
}
