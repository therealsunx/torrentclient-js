import net from 'node:net'
import {Buffer} from 'node:buffer'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {buildHandshake,buildInterested,parse,chokeHandler,unchokeHandler,haveHandler,bitfieldHandler,pieceHandler} from './message.js'
import { readTorrentFile } from './utils.js'



function downlaod(peer,torrent){

const socket = new net.Socket();
socket.on('error', (err)=>{console.log('err')});
socket.connect(peer.port, peer.ip, () => {
    // 1
    socket.write(buildHandshake(torrent));
});


// socket.on('data',(response)=>{
//     console.log(response,response.readUInt8(0))
// })

onWholeMsg(socket, (msg)=> {
    // handle response here
    if (isHandshake(msg))
        socket.write(buildInterested())
  });
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
peers.forEach(peer=>downlaod(peer,torrent));
})
}


//messagehandler
function msgHandler(msg,socket){
    if (isHandshake(msg)){
        socket.write(message.buildInterested());
    }
    else{
        const m = parse(msg)

        if (m.id === 0) chokeHandler();
        if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(m.payload);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload);
    }
}

function isHandshake(msg){
    console.log(msg)
    return msg.length==msg.readUInt8(0) + 49 && msg.toString('utf8',1) == 'BitTorrent protocol'
}

// function chokeHandler() { ... }

// function unchokeHandler() { ... }

// function haveHandler(payload) { ... }

// function bitfieldHandler(payload) { ... }

// function pieceHandler(payload) { ... }


export {
    peerDownload
}



