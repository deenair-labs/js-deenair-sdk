export const transactionFixture = {
  status: 'approved',
  trxid: 'HFsmQune59PB98MS1BbCVLZiHsNvBVUjrHfVJ24615sj',
  type: 'remittance',
  msgs: [
    {
      comment: 'system reward',
      payer: 'deenAiRissuer777777777777777777777777777777',
      receiver: 'FaN54gXbj6mhDob8CXwHLLuGwgBGiiswdaMt6d1UmS3z',
      sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
      sum: '31802440',
      time: '1662457808465',
      type: 'emission',
    },
  ],
};

export const stakeTransactionsFixture = (
  pk: string,
  stake1: string,
  stake2: string,
) => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const transactions = [
    {
      status: 'approved',
      trxid: 'HFsmQune59PB98MS1BbCVLZiHsNvBVUjrHfVJ24615s0',
      type: 'remittance',
      msgs: [
        {
          comment: 'stake 1',
          payer: pk,
          receiver: stake1,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '100000',
          time: twoWeeksAgo.getTime().toString(),
          type: 'stake delegate',
        },
        {
          comment: 'stake 2',
          payer: pk,
          receiver: stake2,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '100000',
          time: twoWeeksAgo.getTime().toString(),
          type: 'stake delegate',
        },
      ],
    },
    {
      status: 'approved',
      trxid: 'HFsmQune59PB98MS1BbCVLZiHsNvBVUjrHfVJ24615s1',
      type: 'remittance',
      msgs: [
        {
          comment: 'stake 1',
          payer: pk,
          receiver: stake1,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '100000',
          time: weekAgo.getTime().toString(),
          type: 'stake delegate',
        },
        {
          comment: 'stake 2',
          payer: pk,
          receiver: stake2,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '100000',
          time: weekAgo.getTime().toString(),
          type: 'stake delegate',
        },
      ],
    },
    {
      status: 'approved',
      trxid: 'HFsmQune59PB98MS1BbCVLZiHsNvBVUjrHfVJ24615s2',
      type: 'remittance',
      msgs: [
        {
          comment: 'stake 1',
          payer: pk,
          receiver: stake1,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '50000',
          time: weekAgo.getTime().toString(),
          type: 'stake withdraw',
        },
        {
          comment: 'stake 2',
          payer: pk,
          receiver: stake2,
          sign: 'x1jHT4YybqPHeFmGZBuAw5vGoEhovNPA7vUq4LsFAAdReS9u1gQBovdfYwLds2Jm5pqHmrYaQxNNQyPCKkQKNuh',
          sum: '50000',
          time: weekAgo.getTime().toString(),
          type: 'stake withdraw',
        },
      ],
    },
  ];
  return transactions;
};

export const getNftInfoFixture = {
  coll: 'GnBgxYeVwFSqPgn2SgGUK5hUPKTdbycU7n7E3xdSTbmu',
  'last trx': '3ys5BPHdxnXwq83yzzHNCeokBFXsV8p3vjGmWTqLQEcM',
  metadata:
    '{"location":"https://path/to/your/mediafile","trait_1":"trait_1_value","trait_2":"trait_2_value","trait_3":"trait_3_value","royalty":{"6w3yfx5ww6hG6KAU5uvGCo7JVK6ZbcFCyMV6pk78WkFX":"10"}}',
  owner: '6TycKpDvqYszBxa5z2ce6wk17PiCFUhCtkw8J6uPNeef',
  token: 'AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs',
};

export const getFtInfoFixture = {
  name: 'USDT',
  owner: '6w3yfx5ww6hG6KAU5uvGCo7JVK6ZbcFCyMV6pk78WkFX',
  token: 'AnVZpQb9SfAEYyL3FQA2Pj9Uv4KhY4Xz7jP719E2zVs',
};

export const getBlockFixture = (blockId: string) => {
  return {
    blk: blockId,
    blkid: 'CUgGe4RMdRfvGah9yNEoaUv6DsBnpBLgQip9RaTmi7YD',
    trxs: [
      {
        status: 'approved',
        trxid: '4Kwwjiqf7S9QapRm3V6ibnNwgG8x2skKFyi9uCsTZ79a',
        type: 'system',
        votes: [
          {
            author: 'HW7d1jxu3emHanUwYSKoCS7A5zQ3XDN966MBAfW1VLib',
            block: '13',
            round: '1',
            sign: 'gmKYGBMTYb7bLMdgEnoGUPDKzQ5RXhPMQnQ2wyY4uTRabf7tpG6JdXZFjvgyETYre3P2Z9JiTdZuLc18DsZXuQS',
            vote: '2CieeTFDM9NxYbQMqxMhuGT2dhpdWbXBBzdhrCf47vA6',
          },
        ],
      },
      transactionFixture,
    ],
    validator: 'EUjRzCXg8sUZhiajPhPuYw8z72zTPzRzHFjMt4XXtY2K',
  };
};

export const getLeaderFixture = {
  nodeid: '8b7PH1SwGXPpNJz5Md7zrLwDNyu9qMM7TYTvY7jRtRaG',
};
