import { KeyPair } from '../../src';

export const getTestKey = () => {
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
  return KeyPair.fromMnemonic({ mnemonic, walletId });
};
