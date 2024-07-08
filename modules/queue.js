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
        console.log(size)
        return Math.floor(size/100)
    }
}