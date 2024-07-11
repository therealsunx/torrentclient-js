
import {BLOCK_LEN, numBlocks,blockLen} from './torrentparser.js'

class BlockQueue {
  constructor(torrent) {
    this.torrent = torrent;
    this.queue = [];
    this.choked = true;
  }

  enqueue(pieceIndex) {
    const nBlocks=numBlocks(this.torrent,pieceIndex)
    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock = {
        index: pieceIndex,
        begin: i * BLOCK_LEN,
        length: blockLen(this.torrent, pieceIndex, i)
      };
      this.queue.push(pieceBlock);
    }
  }

  dequeue() { return this.queue.shift(); }

  peek() { return this.queue[0]; }

  length() { return this.queue.length; }
};

export {
  BlockQueue
}