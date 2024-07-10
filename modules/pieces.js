export class PiecesData {
    constructor(size){
        this.requested = new Array(size).fill(false);
        this.recieved = new Array(size).fill(false);
    }

    addRequested(index){
        this.requested[index] = true;
    }

    addRecieved(index){
        this.recieved[index] =true;
    }

    checkNeeded(index){
        // if every piece is requested, everything might not be recieved,
        // so, might have to request again
        if(this.requested.every(_=>_)) this.requested = this.recieved.slice();
        return !this.requested[index];
    }

    isDone() {
        return this.recieved.every(_=>_);
    }
}

