import { numBlocks, pieceLen ,BLOCK_LEN} from "./torrentparser.js";

class Pieces{
    
    constructor(torrent) {
      function createArray()
      {
        const plen=torrent.info.pieces.length/20
        const pArray=new Array(plen).fill(null)
        const bArray=pArray.map((_,index)=>{
          return new Array(numBlocks(torrent,index)).fill(false)
        })
        return bArray
      }


    this.requested=createArray()
    this.received=createArray()
    }

    blockIndex(begin,pieceIndex){
      return Math.floor(begin/BLOCK_LEN)
    }
  
    addRequested(payload) {
      const blockIndex=Math.floor(payload.begin/BLOCK_LEN)
      this.requested[payload.index][blockIndex]=true
    }
  
    addReceived(payload) {
      const blockIndex=Math.floor(payload.begin/BLOCK_LEN)
      this.received[payload.index][blockIndex]= true;
    }
  
    needed(payload) {
      if (this.requested.every((blocks)=>
        blocks.every((block)=>block)
      ))
      {
        this.requested=this.received.map((piece)=>piece.slice())
      }

      const blockIndex=Math.floor(payload.begin/BLOCK_LEN)
      return !this.requested[payload.index][blockIndex]
    }
  
    isDone() {
      return this.requested.every((blocks)=>
        blocks.every((block)=>block)
      )
    }
  };

  export {
    Pieces
  }