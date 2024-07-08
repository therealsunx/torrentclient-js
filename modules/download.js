import net from 'node:net'
import {Buffer} from 'node:buffer'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {message} from './message.js'
import { readTorrentFile } from './utils.js'
import { Queue } from './queue.js'


function downlaod(peer,torrent,queue){

const socket = new net.Socket();
socket.on('error', (err)=>{console.log('err')});
socket.connect(peer.port, peer.ip, () => {
    // 1
    socket.write(message.buildHandshake(torrent));
    // console.log('connected')
});



onWholeMsg(socket, msg => msgHandler(msg, socket,queue));
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
const queue=new Queue(torrent)
peers.forEach(peer=>downlaod(peer,torrent,queue));
})
}


//messagehandler
function msgHandler(msg,socket,queue){
    if (isHandshake(msg)){
        socket.write(message.buildInterested()); //it sends choke,have etc
    }
    else{
        const m = message.parse(msg)
        // console.log(m)

        if (m.id === 0) chokeHandler(socket);
        // if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(socket,m.payload,queue);
        // if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload,queue);
    }
}

function isHandshake(msg){
    return msg.length==msg.readUInt8(0) + 49 && msg.toString('utf8',1,20) == 'BitTorrent protocol'
}


function chokeHandler(socket) {
socket.end()
}


//for have handler
function haveHandler(socket,payload,queue) {
let index=payload.readInt32BE(0)
if (queue.neededPiece(index)){
queue.addPieces(payload)
// let nextIndex=priority(queue.getPieces())
let nextIndex=index
requestNextPiece(socket,queue,nextIndex)
}
 }

 //for getting which index to request


 //for requesting next piece--make it callback priority
 function requestNextPiece(socket,queue,index){

    const payload={
        index:index,
        begin:0,
        length:queue.getSize()
    }
    socket.write(message.buildRequest(payload))  
    console.log('requesting index',index,message.buildRequest(payload))
 }

//after getting piece
function pieceHandler(payload,queue){
// console.log(message.parse(payload))
queue.addReceived(payload.index)
console.log('getted',payload)
}

    
export{
    peerDownload
}



