import {
  type as pick,
  Struct,
  union,
  literal,
  string,
  unknown,
  optional,
  any,
  coerce,
  create,
  nullable,
  number,
  enums,
  array,
} from 'superstruct';

function createRpcResult<T, U>(result: Struct<T, U>) {
  return union([
    pick({
      jsonrpc: literal('2.0'),
      id: string(),
      result,
    }),
    pick({
      jsonrpc: literal('2.0'),
      id: string(),
      error: pick({
        code: unknown(),
        message: string(),
        data: optional(any()),
      }),
    }),
  ]);
}

export const UnknownRpcResult = createRpcResult(unknown());

export function jsonRpcResult<T, U>(schema: Struct<T, U>) {
  return coerce(createRpcResult(schema), UnknownRpcResult, value => {
    if ('error' in value) {
      return value;
    } else {
      return {
        ...value,
        result: create(value.result, schema),
      };
    }
  });
}

function jsonRpcResultAndContext<T, U>(value: Struct<T, U>) {
  return jsonRpcResult(
    pick({
      context: pick({
        slot: number(),
      }),
      value,
    }),
  );
}

const TransactionStatus = enums(['approved']);
const TransactionType = enums(['remittance', 'system']);
const MessageType = enums(['emission', 'stake delegate', 'stake withdraw']);
const TransactionMessage = pick({
  comment: string(),
  payer: string(),
  receiver: string(),
  sign: string(),
  sum: string(), // actually number
  time: string(),
  type: MessageType,
});
const TransactionVote = pick({
  author: string(),
  block: string(), // actually number
  round: string(), // actually number
  sign: string(),
  vote: string(),
});

const Transaction = pick({
  status: TransactionStatus,
  trxid: string(),
  type: TransactionType,
  msgs: optional(nullable(array(TransactionMessage))),
  votes: optional(nullable(array(TransactionVote))),
});

export const GetBlockRpcResult = jsonRpcResult(
  nullable(
    pick({
      blk: string(),
      blkid: string(),
      trxs: optional(nullable(array(Transaction))),
      validator: string(),
    }),
  ),
);

export const GetLeaderRpcResult = jsonRpcResult(
  pick({
    nodeid: string(),
  }),
);

const Node = pick({
  comment: string(),
  'ip address': string(), // ???
  'ip port': string(), // ???
  nodeid: string(),
  public: string(),
  stake: string(),
  storage: string(),
});

export const GetNodeListRpcResult = jsonRpcResult(array(Node));

export const GetWalletStateRpcResult = jsonRpcResult(
  pick({
    balance: string(),
    'last trx': string(),
    wallet: string(),
  }),
);

export const GetTransactionsRpcResult = jsonRpcResult(array(Transaction));

export const GetTransactionRpcResult = jsonRpcResult(Transaction);

export const GetNftCollectionRpcResult = jsonRpcResult(array(string()));

export const GetNftRpcResult = jsonRpcResult(
  pick({
    coll: string(),
    'last trx': string(),
    metadata: string(), // JSON encoded
    owner: string(),
    token: string(),
  }),
);

export const GetFtRpcResult = jsonRpcResult(
  pick({
    name: string(),
    owner: string(),
    token: string(),
  }),
);

export const GetFtList = jsonRpcResult(array(string()));

export const NewTrxRpcResult = jsonRpcResult(any());
