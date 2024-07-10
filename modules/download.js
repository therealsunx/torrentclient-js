import net from 'node:net'
import {Buffer} from 'node:buffer'
import Pieces from './Pieces.js'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {message} from './message.js'
import { readTorrentFile } from './utils.js'
import { createFile, saveBuffer } from './filesave.js'
import { Block2Pieces, JobQueue } from './requestQueue.js'



const peerDownload = torrent => {
  tracker.getPeers(torrent, peers => {
    const pieces = new Pieces(torrent.info.pieces.length / 20);
    peers.forEach(peer => download(peer, torrent,pieces));
  });
};

function download(peer, torrent,pieces) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  const queue={queue:[],choked:true} //as we are choked at first
  onWholeMsg(socket, msg => msgHandler(msg, socket,pieces,queue));
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}

function msgHandler(msg, socket) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket,pieces,queue);
    if (m.id === 4) haveHandler(m.payload);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload);
  }
}

function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
         msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}


function requestPiece(socket, pieces, peerQueue) {
if (peerQueue.choked)
    return false

while(peerQueue.queue.length>0)
{
    const pieceIndex=peerQueue.queue.shift()
    if(pieces.needed(pieceIndex))
    {
        socket.write(message.buildRequest(pieceIndex))
        pieces.addRequested(pieceIndex)
        break
    }
}
  }

function chokeHandler(socket) {
socket.end()
}

function unchokeHandler(socket,pieces,peerQueue) {
peerQueue.choked=false
requestPiece(socket,pieces,peerQueue)
}

function haveHandler(payload, socket, requested, peerQueue) {
    const pieceIndex = payload.readUInt32BE(0);
    peerQueue.push(pieceIndex)
    if (peerQueue.length==1)
    {
        requestPiece(socket,requested,peerQueue)
    }
}

function bitfieldHandler() {
  // ...
}

function pieceHandler() {
  // ...
}
    
export{
    peerDownload
}



/