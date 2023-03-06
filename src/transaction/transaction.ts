import { KeyPair } from '../keypair';
import { SystemProgram } from '../programs/system';
import { PublicKey } from '../publickey';
import { MessageType } from '../types/message.type';
import { sign } from '../utils/ed25519';
import { IMessageInputData } from './message';
import * as bs58 from 'bs58';

export type TransactionMessage = {
  messageType: MessageType;
  keypair: KeyPair;
  receiever: PublicKey;
  amount: number;
};

export type AccountMeta = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};

export type SignaturePubkeyPair = {
  signature: Buffer | null;
  publicKey: PublicKey;
};
// export type Transaction = Array<TransactionMessage>;

export type TransactionInstructionCtorFields = {
  // keys: Array<AccountMeta>;
  // programId: PublicKey;
  signer: PublicKey;
  message: any;
  data?: Buffer;
};

export type WireMessage = {
  type: number;
  time: number;
  [key: string]: any;
  sign: string;
};

export type WireTransaction = {
  messages: WireMessage[];
};

export const STATIC_FEE_PART = 160;

export class TransactionInstruction {
  // keys: Array<AccountMeta>;
  // programId: PublicKey;
  signer: PublicKey;
  data: Buffer = Buffer.alloc(0);
  message: IMessageInputData & any;

  constructor(opts: TransactionInstructionCtorFields) {
    // this.programId = opts.programId;
    // this.keys = opts.keys;
    this.message = opts.message;
    this.signer = opts.signer;
    if (opts.data) {
      this.data = opts.data;
    }
  }
}

export class Transaction {
  // signers: Array<KeyPair> = [];
  signers: Map<string, KeyPair> = new Map();
  signatures: Array<SignaturePubkeyPair> = [];

  get signature(): Buffer | null {
    if (this.signatures.length > 0) {
      return this.signatures[0].signature;
    }
    return null;
  }

  feePayer?: PublicKey;
  feeAmount: number = 0;

  instructions: Array<TransactionInstruction> = [];

  constructor() {}

  calculateFee(instruction: TransactionInstruction): number {
    return (instruction.data.byteLength + STATIC_FEE_PART) * 10 + 10000;
  }

  add(...items: Array<Transaction | TransactionInstruction>): Transaction {
    if (items.length === 0) {
      throw new Error('No instructions');
    }
    for (const item of items) {
      if ('instructions' in item) {
        for (const instruction of item.instructions) {
          this.instructions.push(instruction);
          this.feeAmount += this.calculateFee(instruction);
        }
        // this.instructions = this.instructions.concat(item.instructions);
      } else if ('data' in item) {
        this.instructions.push(item);
        this.feeAmount += this.calculateFee(item);
      }
    }
    return this;
  }

  addSigners(...keyPairs: Array<KeyPair>) {
    for (const keyPair of keyPairs)
      this.signers.set(keyPair.publicKey.toBase58(), keyPair);
  }

  compileTransaction(): WireTransaction {
    if (this.signers.size === 0) {
      throw new Error(`No signers present in the transaction.`);
    }
    if (!this.feePayer) {
      this.feePayer = new PublicKey(this.signers.entries().next().value[0]);
    }
    const feeInstruction = SystemProgram.fee({
      payer: this.feePayer,
      amount: this.feeAmount,
      comment: '',
    });
    this.add(feeInstruction);
    const wireTransaction: WireTransaction = {
      messages: [],
    };
    for (const instruction of this.instructions) {
      const signer = this.signers.get(instruction.signer.toBase58());
      if (!signer)
        throw new Error(
          `Signer ${instruction.signer.toBase58()} is not present`,
        );
      const signature = sign(
        instruction.data,
        signer.secretKey.subarray(0, 32),
      );
      const { index, timestamp, ...actualMessage } = instruction.message;
      const wireMessage: WireMessage = {
        type: index,
        time: timestamp,
        sign: bs58.encode(signature),
      };
      for (const key in actualMessage) {
        if (Buffer.isBuffer(actualMessage[key])) {
          wireMessage[key] = bs58.encode(actualMessage[key]);
        } else {
          wireMessage[key] = actualMessage[key];
        }
      }
      wireTransaction.messages.push(wireMessage);
    }
    return wireTransaction;
  }
}
