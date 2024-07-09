import net from 'node:net'
import {Buffer} from 'node:buffer'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {message} from './message.js'
import { readTorrentFile } from './utils.js'
import { createFile, saveBuffer } from './filesave.js'
import { Block2Pieces, JobQueue } from './requestQueue.js'


function downlaod(peer,torrent,block2Pieces,jobQueue,file){

const socket = new net.Socket();
socket.on('error', (err)=>{console.log('err')});
socket.connect(peer.port, peer.ip, () => {
    // 1
    socket.write(message.buildHandshake(torrent));
});

onWholeMsg(socket, msg => msgHandler(msg, socket,block2Pieces,jobQueue,file));
}


//to get whoole message
const onWholeMsg=(socket,callback)=>{
let savedBuf=Buffer.alloc(0);
let handshake=true

socket.on('data',recvBuf=>{
    const msgLen=()=> handshake?savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) +4;
    savedBuf=Buffer.concat([savedBuf,recvBuf])

    while(savedBuf.length>=4 && savedBuf.length>=msgLen())
    {
        callback(savedBuf.slice(0,msgLen()))
        savedBuf=savedBuf.slice(msgLen())
        handshake=false
    }
})
}


//making tcp connection for all peers
const peerDownload=(filename)=>{getpeers(filename,(peers)=>{
    const torrent=readTorrentFile(filename)
    const block2Pieces=new Block2Pieces(torrent)
    const jobQueue=new JobQueue(torrent)
    const file=createFile(torrent)
peers.forEach(peer=>downlaod(peer,torrent,block2Pieces,jobQueue,file));
})
}

let count=0;
//messagehandler
function msgHandler(msg,socket,block2Pieces,jobQueue,file){
    if (isHandshake(msg)){
        socket.write(message.buildInterested()); //it sends choke,have etc
    }
    else{
        const m = message.parse(msg)
        // console.log(m)

        if (m.id === 0) chokeHandler(socket);
        // if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(socket,m.payload,block2Pieces,jobQueue);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload,block2Pieces,jobQueue,file);
    }
}


function isHandshake(msg){
    return msg.length==msg.readUInt8(0) + 49 && msg.toString('utf8',1,20) == 'BitTorrent protocol'
}


function chokeHandler(socket) {
socket.end()
}


//for have handler
function haveHandler(socket,payload,block2Pieces,jobQueue) {
const index=payload.readUInt32BE(0)
const blocks=block2Pieces.getBlockPieces(index)
blocks.map((block)=>{
    jobQueue.addJob(block)
})
const nextRequest=jobQueue.nextRequest()

if(nextRequest)
requestNextPiece(socket,nextRequest)

if(jobQueue.finished())
socket.end()
 }


 //for requesting next piece--make it callback priority
 function requestNextPiece(socket,payload){
    console.log(payload)
    socket.write(message.buildRequest(payload))
 }

//after getting piece
function pieceHandler(payload,block2Pieces,jobQueue,file){
    console.log('getted',payload)
jobQueue.addReceived(payload)
saveBuffer(payload,block2Pieces.getPieceLength(),file)
}

function bitfieldHandler(payload)
{
    console.log(payload)
}

    
export{
    peerDownload
}



