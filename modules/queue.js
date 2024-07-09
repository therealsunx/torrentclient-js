export class Queue{

    constructor(torrent){
        this.torrent=torrent
        this.size=torrent.info.pieces.length/20
        this.requested=new Array(this.size).fill(false)
        this.received=new Array(this.size).fill(false)
        this.pieces=new Array(this.size).fill(0)
    }

    addRequest(pieceIndex)
    {
        this.requested[pieceIndex]=true
    }

    addReceived(pieceIndex){
        this.received[pieceIndex]=true
    }

    addPieces(pieceIndex){
        this.pieces[pieceIndex]+=1
    }

    getPieces(){
        return this.pieces
    }

    neededPiece(pieceIndex){
        return !this.requested[pieceIndex]
    }

    getSize(){
        let size=this.torrent.info['piece length']
        return size
    }
}

//blockqueue

export class BlockQueue{

    constructor(torrent){
        this.block_size=16*1024
        this.torrent=torrent
        this.size=Math.ceil(torrent.info['piece length']/this.block_size)
        this.requested=new Array(this.size).fill(false)
        this.received=new Array(this.size).fill(false)
        this.block=new Array(this.size).fill(0)
    }

    addRequest(blockIndex)
    {
        this.requested[blockIndex]=true
    }

    addReceived(blockIndex){
        this.received[blockIndex]=true
    }

    addBlock(pieceIndex){
        this.pieces[pieceIndex]+=1
    }

    getBlocks(){
        return this.block
    }

    needeBlock(blockIndex){
        return !this.requested[blockIndex]
    }

    getNumBlock(){
        return this.size
    }

    getSizeBlock(blockIndex){
        return blockIndex==this.size-1?this.torrent.info['piece length']-(this.size-1)*this.block_size:this.block_size
    }
}