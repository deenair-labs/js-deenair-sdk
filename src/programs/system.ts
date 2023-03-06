import { PublicKey } from '../publickey';
import {
  encodeData,
  MessageInputData,
  MESSAGE_LAYOUTS,
} from '../transaction/message';
import { TransactionInstruction } from '../transaction/transaction';
import { sha256 } from '@noble/hashes/sha256';

export const FEE_RECEIVER = new PublicKey(
  'deenAiRoven55555555555555555555555555555555',
);

export type TransferParams = {
  payer: PublicKey;
  receiver: PublicKey;
  amount: number;
  comment: string;
};

export type FeeParams = Omit<TransferParams, 'receiver'>;
// & {
//   receiver?: PublicKey;
// };
export type NftMetadata = {
  location: string;
  [key: string]: any;
  royalty: Record<string, string>;
};
export type CreateNftParams = {
  metadata: NftMetadata;
  collection: PublicKey;
  minter: PublicKey;
};
export type BurnNftParams = {
  token: PublicKey;
  owner: PublicKey;
};
export type DonateNftParams = {
  token: PublicKey;
  owner: PublicKey;
  recipient: PublicKey;
};
export type EmitFtParams = {
  ft: PublicKey;
  name: string;
  owner: PublicKey;
  receiver: PublicKey;
  amount: number;
};
export type TransferFtParams = {
  ft: PublicKey;
  sender: PublicKey;
  receiver: PublicKey;
  amount: number;
};

export class SystemProgram {
  static transfer(params: TransferParams) {
    const transferMessage: MessageInputData['Transfer'] = {
      index: 2,
      timestamp: Date.now(),
      payer: params.payer.toBuffer(),
      receiver: params.receiver.toBuffer(),
      amount: params.amount,
      comment: params.comment,
    };
    const data = encodeData(MESSAGE_LAYOUTS.Transfer, transferMessage);
    return new TransactionInstruction({
      data: data,
      message: transferMessage,
      signer: params.payer,
    });
  }

  static fee(params: FeeParams) {
    return this.transfer({ receiver: FEE_RECEIVER, ...params });
  }

  static createNft(params: CreateNftParams) {
    const metadata = JSON.stringify(params.metadata);
    const tokenId = sha256(metadata);
    const createNftMessage: MessageInputData['CreateNft'] = {
      index: 7,
      timestamp: Date.now(),
      coll: params.collection.toBuffer(),
      token: Buffer.from(tokenId),
      minter: params.minter.toBuffer(),
      metadata: metadata,
    };
    const data = encodeData(MESSAGE_LAYOUTS.CreateNft, createNftMessage);
    return new TransactionInstruction({
      data: data,
      message: createNftMessage,
      signer: params.collection,
    });
  }

  static donateNft(params: DonateNftParams) {
    const donateNftMessage: MessageInputData['DonateNft'] = {
      index: 12,
      timestamp: Date.now(),
      token: params.token.toBuffer(),
      recipient: params.recipient.toBuffer(),
    };
    const data = encodeData(MESSAGE_LAYOUTS.DonateNft, donateNftMessage);
    return new TransactionInstruction({
      data: data,
      message: donateNftMessage,
      signer: params.owner,
    });
  }

  static burnNft(params: BurnNftParams) {
    const burnNftMessage: MessageInputData['BurnNft'] = {
      index: 13,
      timestamp: Date.now(),
      token: params.token.toBuffer(),
    };
    const data = encodeData(MESSAGE_LAYOUTS.BurnNft, burnNftMessage);
    return new TransactionInstruction({
      data: data,
      message: burnNftMessage,
      signer: params.owner,
    });
  }

  static emitFt(params: EmitFtParams) {
    const emitFtMessage: MessageInputData['EmitFt'] = {
      index: 14,
      timestamp: Date.now(),
      token: params.ft.toBuffer(),
      'token name': params.name,
      owner: params.owner.toBuffer(),
      wallet: params.receiver.toBuffer(),
      amount: params.amount,
    };
    const data = encodeData(MESSAGE_LAYOUTS.EmitFt, emitFtMessage);
    return new TransactionInstruction({
      data: data,
      message: emitFtMessage,
      signer: params.owner,
    });
  }

  static transferFt(params: TransferFtParams) {
    const transferFtMessage: MessageInputData['TransferFt'] = {
      index: 15,
      timestamp: Date.now(),
      token: params.ft.toBuffer(),
      payer: params.sender.toBuffer(),
      recipient: params.receiver.toBuffer(),
      amount: params.amount,
    };
    const data = encodeData(MESSAGE_LAYOUTS.TransferFt, transferFtMessage);
    return new TransactionInstruction({
      data: data,
      message: transferFtMessage,
      signer: params.sender,
    });
  }
}
