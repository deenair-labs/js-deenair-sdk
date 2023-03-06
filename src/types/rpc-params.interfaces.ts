import { PublicKey } from '../publickey';

export interface IGetBlock {
  blk?: string;
}

export interface IGetWalletState {
  wallet: string;
}

export interface IGetWalletTransactions {
  wallet: string;
}

export interface IGetTransaction {
  trxid: string;
}

export interface IGetStakes {
  wallet: string;
}

export interface IGetCollection {
  coll: string;
}

export interface IGetToken {
  token: string;
}
