import { PublicKey } from '../src';
import { expect } from 'chai';

describe('Public Key', () => {
  it('invalid', () => {
    expect(() => {
      new PublicKey([
        3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);
    }).to.throw();

    expect(() => {
      new PublicKey(
        '0x300000000000000000000000000000000000000000000000000000000000000000000',
      );
    }).to.throw();
  });
});
