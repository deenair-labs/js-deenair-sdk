import * as BufferLayout from '@solana/buffer-layout';
import { PublicKey } from '../publickey';

export interface IMessageInputData {
  readonly index: number;
  readonly timestamp: number;
}

export type MessageType<TInputData extends IMessageInputData> = {
  index: number;
  //   timestamp: number;
  layout: BufferLayout.Layout<TInputData>;
};

interface IDeenStringShim
  extends Omit<
    BufferLayout.Structure<
      Readonly<{
        length: number;
        lengthPadding: number;
        chars: Uint8Array;
      }>
    >,
    'decode' | 'encode' | 'replicate'
  > {
  alloc: (str: string) => number;
  decode: (b: Uint8Array, offset?: number) => string;
  encode: (str: string, b: Uint8Array, offset?: number) => number;
  replicate: (property: string) => this;
}

export const deenString = (length: number, property: string = 'string') => {
  let lengthLayout = new BufferLayout.UIntBE(length, 'length');
  const rsl = BufferLayout.struct<
    Readonly<{ length?: number; chars: Uint8Array }>
  >(
    [
      lengthLayout,
      // BufferLayout.u32be('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(lengthLayout, -length), 'chars'),
    ],
    property,
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  const rslShim = rsl as unknown as IDeenStringShim;
  rslShim.decode = (b: Uint8Array, offset?: number) => {
    const data = _decode(b, offset);
    return data['chars'].toString();
  };
  rslShim.encode = (str: string, b: Uint8Array, offset?: number) => {
    const data = {
      chars: Buffer.from(str, 'utf-8'),
    };
    return _encode(data, b, offset);
  };
  rslShim.alloc = (str: string) => {
    return (
      lengthLayout.span +
      // BufferLayout.u32be().span +
      Buffer.from(str, 'utf-8').length
    );
  };
  return rslShim;
};

export const publicKey = (property: string = 'publicKey') => {
  return BufferLayout.blob(32, property);
};

export type SystemMessageType =
  | 'Transfer'
  | 'CreateNft'
  | 'DonateNft'
  | 'BurnNft'
  | 'EmitFt'
  | 'TransferFt';

export type MessageInputData = {
  Transfer: IMessageInputData & {
    index: 2;
    payer: Uint8Array;
    receiver: Uint8Array;
    amount: number;
    comment: string;
  };
  CreateNft: IMessageInputData & {
    index: 7;
    coll: Uint8Array;
    token: Uint8Array;
    minter: Uint8Array;
    metadata: string;
  };
  DonateNft: IMessageInputData & {
    index: 12;
    token: Uint8Array;
    recipient: Uint8Array;
  };
  BurnNft: IMessageInputData & {
    index: 13;
    token: Uint8Array;
  };
  EmitFt: IMessageInputData & {
    index: 14;
    token: Uint8Array;
    'token name': string;
    owner: Uint8Array;
    wallet: Uint8Array;
    amount: number;
  };
  TransferFt: IMessageInputData & {
    index: 15;
    token: Uint8Array;
    payer: Uint8Array;
    recipient: Uint8Array;
    amount: number;
  };
  // Fee: IMessageInputData & {};
};

export const commonLayout = [
  BufferLayout.u16be('index'),
  BufferLayout.nu64be('timestamp'),
];

export const MESSAGE_LAYOUTS = Object.freeze<{
  [Message in SystemMessageType]: MessageType<MessageInputData[Message]>;
}>({
  Transfer: {
    index: 2,
    layout: BufferLayout.struct<MessageInputData['Transfer']>([
      ...commonLayout,
      publicKey('payer'),
      publicKey('receiver'),
      BufferLayout.nu64be('amount'),
      deenString(1, 'comment'),
    ]),
  },
  // Fee: {
  //   index: 4,
  //   layout: BufferLayout.struct<MessageInputData['Fee']>([]),
  // },
  CreateNft: {
    index: 7,
    layout: BufferLayout.struct<MessageInputData['CreateNft']>([
      ...commonLayout,
      publicKey('coll'),
      publicKey('token'),
      publicKey('minter'),
      deenString(4, 'metadata'),
    ]),
  },
  DonateNft: {
    index: 12,
    layout: BufferLayout.struct<MessageInputData['DonateNft']>([
      ...commonLayout,
      publicKey('token'),
      publicKey('recipient'),
    ]),
  },
  BurnNft: {
    index: 13,
    layout: BufferLayout.struct<MessageInputData['BurnNft']>([
      ...commonLayout,
      publicKey('token'),
    ]),
  },
  EmitFt: {
    index: 14,
    layout: BufferLayout.struct<MessageInputData['EmitFt']>([
      ...commonLayout,
      publicKey('token'),
      deenString(1, 'token name'),
      publicKey('owner'),
      publicKey('wallet'),
      BufferLayout.nu64be('amount'),
    ]),
  },
  TransferFt: {
    index: 15,
    layout: BufferLayout.struct<MessageInputData['TransferFt']>([
      ...commonLayout,
    ]),
  },
});

export function getAlloc(type: any, fields: any): number {
  const getItemAlloc = (item: any): number => {
    if (item.span >= 0) {
      return item.span;
    } else if (typeof item.alloc === 'function') {
      return item.alloc(fields[item.property]);
    } else if ('count' in item && 'elementLayout' in item) {
      const field = fields[item.property];
      if (Array.isArray(field)) {
        return field.length * getItemAlloc(item.elementLayout);
      }
    } else if ('fields' in item) {
      // This is a `Structure` whose size needs to be recursively measured.
      return getAlloc({ layout: item }, fields[item.property]);
    }
    // Couldn't determine allocated size of layout
    return 0;
  };

  let alloc = 0;
  type.layout.fields.forEach((item: any) => {
    alloc += getItemAlloc(item);
  });

  return alloc;
}

export function encodeData<TInputData extends IMessageInputData>(
  type: MessageType<TInputData>,
  fields?: any,
): Buffer {
  const allocLength = getAlloc(type, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign(
    {
      index: type.index,
    },
    fields,
  );
  type.layout.encode(layoutFields, data);
  return data;
}

export function decodeData<TInputData extends IMessageInputData>(
  type: MessageType<TInputData>,
  buffer: Buffer,
): TInputData {
  let data: TInputData;
  try {
    data = type.layout.decode(buffer);
  } catch (error) {
    throw new Error('Invalid instruction; ' + error);
  }
  return data;
}
