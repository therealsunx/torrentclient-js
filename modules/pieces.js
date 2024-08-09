export class PiecesData {
    constructor(size){
        this.lastblock = size-1;
        this.requested = new Array(size).fill(false);
        this.recieved = new Array(size).fill(false);
        this.remaining = size;
    }

    addRequested(pindex, bindex){
        const i = pindex*2+bindex;
        if(i > this.lastblock) return;
        this.requested[i] = true;
    }

    addReceived(pindex, bindex){
        const i = pindex*2+bindex;
        if(i > this.lastblock) return false;
        if(this.recieved[i]) return false;
        this.remaining--;
        this.recieved[i] =true;
        return true;
    }

    checkNeeded(pindex, bindex){
        // if every piece is requested, everything might not be recieved,
        // so, might have to request again
        const i = pindex*2+bindex;
        if(i > this.lastblock) return false;

        if(this.requested.every(_=>_)) this.requested = this.recieved.slice();
        return !this.requested[i];
    }

    isDone() {
        if(this.remaining > 0) return false;
        return this.recieved.every(_=>_);
    }

    completed(){
        return (1 - this.remaining/(this.lastblock+1)) * 100;
    }
}

