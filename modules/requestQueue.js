

export class JobQueue{
 constructor(torrent){
    this.timeOut=2 //in second
    this.requestedJob=[]
    this.received=[]
    this.notAllowed=[]
    this.torrent=torrent
    this.block_size=16*1024
    this.totalBlock=(this.torrent.info.pieces.length/20)*Math.ceil(torrent.info['piece length']/this.block_size)
 }



checkTimeout(time,timeinterval)
{
if (Date.now()-time>timeinterval)
    return true
return false
}

addJob(payload){
    let index=String(payload.index)+ '_'+String(payload.begin)+'_'+String(payload.length)
let time=Date.now()
this.requestedJob.push([index,time,this.timeOut])
}

addReceived(payload){
let index=String(payload.index)+ '_'+String(payload.begin)+'_'+String(payload.length)
let time=Date.now()
this.received.push([index,time])
}

addnotAllowed(payload)
{
    let index=String(payload.index)+ '_'+String(payload.begin)+'_'+String(payload.length)
let time=Date.now()
this.notAllowed.push([index,time,this.timeOut])
}

getJob(index){ //for not allowed
let result=this.notAllowed.filter((job)=>{
    return job[0]==index
})
return result[0]
}

parseRequest(req){
let res=req.split('_')
return {
    index:parseInt(res[0],10),
    begin:parseInt(res[1],10),
    length:parseInt(res[2],10)
}
}

finished(){
return this.totalBlock==this.received.length
}


nextRequest(){
    if(this.requestedJob.length==0)
        return false
    let req=this.requestedJob.shift()

    if (req in this.received){
        this.nextRequest()
    }
    else if(req in this.notAllowed){
        if(this.checkTimeout(req[0],req[1]))
        {
            req[2]*=2
            let job=this.getJob(req[0])
            job[2]*=2
            this.requestedJob.push(job)
            return this.parseRequest(req[0])
        }
        else{
            this.requestedJob.push(req)
        }
    }
    else{
        this.notAllowed.push(req)
        return this.parseRequest(req[0])
    }
}


}

//for the block
export class Block2Pieces{

    constructor(torrent){
        this.block_size=16*1024
        this.torrent=torrent
        this.size=Math.ceil(torrent.info['piece length']/this.block_size)
    }

    getPieceLength(){
        return this.torrent.info['piece length']
    }

    getSizeBlock(blockIndex){
        return blockIndex==this.size-1?this.torrent.info['piece length']-(this.size-1)*this.block_size:this.block_size
    }

    getBlockPieces(index)
    {
        const blocks=[]
        for (let i=0;i<this.size;i++)
        {
            blocks.push(
                {
                    index:index,
                    begin:i*this.block_size,
                    length:index==this.size-1?this.torrent.info['piece length']-(this.size-1)*this.block_size:this.block_size
                }
            )
        }
        return blocks

    }

    
}