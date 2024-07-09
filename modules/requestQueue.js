function checkTimeout(time,timeinterval)
{
if (Date.now()-time>timeinterval)
    return true
return false
}

export class jobQueue{
 constructor(){
    this.timeOut=2 //in second
    this.requestedJob=[]
    this.received=[]
    this.notAllowed=[]
 }

addJob(payload){
let index=String(payload.index)+ String(payload.begin)
let time=Date.now()
this.requestedJob.push([index,time,this.timeOut])
}

addReceived(payload){
let index=String(payload.index)+ String(payload.begin)
let time=Date.now()
this.received.push([index,time])
}

addnotAllowed(payload)
{
let index=String(payload.index)+ String(payload.begin)
let time=Date.now()
this.notAllowed.push([index,time,this.timeOut])
}

getJob(index){ //for not allowed
let result=this.notAllowed.filter((job)=>{
    return job[0]==index
})
return result[0]
}



nextRequest(){
    if(this.requestedJob.length==0)
        return false
    let req=this.requestedJob.shift()

    if (req in this.received){
        nextRequest()
    }
    else if(req in this.notAllowed){
        if(checkTimeout(req[0],req[1]))
        {
            req[2]*=2
            let job=getJob(req[0])
            job[2]*=2
            this.requestedJob.push(job)
            return req
        }
        else{
            this.requestedJob.push(req)
        }
    }
    else{
        this.notAllowed.push(req)
        return req
    }
}


}

//for the block
export class Block2Pieces{

    constructor(torrent){
        this.block_size=16*1024
        this.torrent=torrent
        this.size=Math.ceil(torrent.info['piece length']/this.block_size)
    //     this.requested=new Array(this.size).fill(false)
    //     this.received=new Array(this.size).fill(false)
    //     this.block=new Array(this.size).fill(0)
    }

    // addRequest(blockIndex)
    // {
    //     this.requested[blockIndex]=true
    // }

    // addReceived(blockIndex){
    //     this.received[blockIndex]=true
    // }

    // addBlock(pieceIndex){
    //     this.pieces[pieceIndex]+=1
    // }

    // getBlocks(){
    //     return this.block
    // }

    // needeBlock(blockIndex){
    //     return !this.requested[blockIndex]
    // }

    // getNumBlock(){
    //     return this.size
    // }

    getSizeBlock(blockIndex){
        return blockIndex==this.size-1?this.torrent.info['piece length']-(this.size-1)*this.block_size:this.block_size
    }

    blockpieces(index)
    {
        const blocks=[]
        for (let index=0;i<this.size;i++)
        {
            blocks.push(
                {
                    index:index,
                    begin:index*this.block_size,
                    length:index==this.size-1?this.torrent.info['piece length']-(this.size-1)*this.block_size:this.block_size
                }
            )
        }
        return blocks

    }

    
}