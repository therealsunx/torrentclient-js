import net from 'node:net'
import {Buffer} from 'node:buffer'
import {Pieces} from './Pieces.js'
import {getpeers} from './tracker.js'
import 'dotenv/config'
import {message} from './message.js'
import { readTorrentFile } from './utils.js'
import { closeFile, createFile, saveBuffer } from './filesave.js'
import { Block2Pieces, JobQueue } from './requestQueue.js'
import { BlockQueue } from './queue.js'
import { pieceLen } from './torrentparser.js'



const peerDownload = filename => {
  const torrent=readTorrentFile('./espresso.torrent')
  const file=createFile(torrent)
  getpeers(filename, peers => {
    const pieces = new Pieces(torrent);
    peers.forEach(peer => download(peer, torrent,pieces,file,torrent));
  });
};

function download(peer, torrent,pieces,file) {
  const socket = new net.Socket();
  socket.id=`${peer.ip}`
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  const blockQueue=new BlockQueue(torrent)//as we are choked at first
  onWholeMsg(socket, msg => msgHandler(msg, socket,pieces,blockQueue,file,torrent));
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

function msgHandler(msg, socket,pieces,blockQueue,file,torrent) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket,pieces,blockQueue);
    if (m.id === 4) haveHandler(socket,pieces,blockQueue,m.payload);
    if (m.id === 5) bitfieldHandler(socket,pieces,blockQueue,m.payload);
    if (m.id === 7) pieceHandler(socket,pieces,blockQueue,m.payload,file,torrent);
  }
}

function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
         msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}


function requestPiece(socket, pieces, blockQueue) {
if (blockQueue.choked)
    return null


while(blockQueue.length()>0)
{

    const payload=blockQueue.dequeue()
    if(pieces.needed(payload))
    {
        socket.write(message.buildRequest(payload))
        pieces.addRequested(payload)
        break
    }
}
  }

function chokeHandler(socket) {
console.log('choked',socket.id)
socket.end()
}

function unchokeHandler(socket,pieces,blockQueue) {
blockQueue.choked=false
console.log('unchocked',socket.id)
requestPiece(socket,pieces,blockQueue)
}

function haveHandler(socket,pieces,blockQueue,payload) {
    const pieceIndex = payload.readUInt32BE(0);
    blockQueue.enqueue(payload)
    if (blockQueue.length()==0)
    {
        requestPiece(socket,pieces,blockQueue)
    }
}

function bitfieldHandler(socket,pieces,blockQueue,payload) {
  payload.forEach((byte,index)=>{
    for(let i=0;i<8;i++)
    {
      if(byte & (1<<7-i))
        blockQueue.enqueue(i+index*8)
    }
  })


  if(blockQueue.length())
    requestPiece(socket,pieces,blockQueue)
}

function pieceHandler(socket,pieces,blockQueue,payload,file,torrent) {
console.log(payload)
pieces.addReceived(payload)
saveBuffer(payload,torrent.info['piece length'],file)

if(pieces.isDone())
{
  socket.end()
  console.log('all received')
  closeFile(file)
}
else
{
  requestPiece(socket,pieces,blockQueue)
}
}
    
export{
    peerDownload
}



