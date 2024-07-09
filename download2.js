import net from 'node:net'
import {Buffer} from 'node:buffer'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {message} from './message.js'
import { readTorrentFile } from './utils.js'
import { Queue ,BlockQueue} from './queue.js'
import { createFile, saveBuffer } from './filesave.js'


function downlaod(peer,torrent,queue,file,saveBuffer){
const blockQueue=new BlockQueue(torrent)
const socket = new net.Socket();
socket.on('error', (err)=>{console.log('err')});
socket.connect(peer.port, peer.ip, () => {
    // 1
    socket.write(message.buildHandshake(torrent));
    // console.log('connected')
});

onWholeMsg(socket, msg => msgHandler(msg, socket,queue,blockQueue,saveBuffer));
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
    // console.log(process.env.filename)
    // console.log(peers)
    const torrent=readTorrentFile(filename)
    const file=createFile(torrent)
const queue=new Queue(torrent)
peers.forEach(peer=>downlaod(peer,torrent,queue,file,saveBuffer));
})
}


//messagehandler
function msgHandler(msg,socket,queue,blockQueue,file,saveBuffer){
    if (isHandshake(msg)){
        socket.write(message.buildInterested()); //it sends choke,have etc
    }
    else{
        const m = message.parse(msg)
        // console.log(m)

        if (m.id === 0) chokeHandler(socket);
        // if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(socket,m.payload,queue,blockQueue);
        // if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload,queue,blockQueue,file,saveBuffer);
    }
}


function isHandshake(msg){
    return msg.length==msg.readUInt8(0) + 49 && msg.toString('utf8',1,20) == 'BitTorrent protocol'
}


function chokeHandler(socket) {
socket.end()
}


//for have handler
function haveHandler(socket,payload,queue,blockQueue) {
let index=payload.readInt32BE(0)
if (queue.neededPiece(index)){
queue.addPieces(payload)
// let nextIndex=priority(queue.getPieces())
let nextIndex=index
requestNextPiece(socket,queue,blockQueue,nextIndex)
}
 }


 //for requesting next piece--make it callback priority
 function requestNextPiece(socket,queue,blockQueue,index){

    const payload={
        index:index,
        begin:0,
        length:queue.getSize()
    }

    for (let i=0;i<blockQueue.getNumBlock();i++)
    {
        blockQueue.addRequest(i)
        payload.begin=i*blockQueue.getSizeBlock(i)
        payload.length=blockQueue.getSizeBlock(i)//blockQueue.getSizeBlock(i)
        console.log(payload)
        socket.write(message.buildRequest(payload))
    }
 }

//after getting piece
function pieceHandler(payload,queue,blockQueue,file,saveBuffer){
// console.log(message.parse(payload))
// queue.addReceived(payload.index)
saveBuffer(payload,blockQueue.getSizeBlock(piece.index),file)
console.log('getted',payload)
}

    
export{
    peerDownload
}



