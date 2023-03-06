export const printBuffer = (buf: Buffer | Uint8Array) =>
  // @ts-ignore
  Buffer.from(buf)
    .toString('hex')
    .match(/.{1,2}/g)
    .join(' ');
