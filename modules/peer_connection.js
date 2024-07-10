'use strict';

import net from "node:net";
import { MessageBuilder, MessageParser } from "./message.js";
import { blockLength, pieceLength } from "./torrent-parser.js";
import fs from "node:fs";
import { BLOCK_SIZE } from "./utils.js";

export default function getData(peer, torrent, pieces){
    const file = fs.openSync("./hehe.mp3", 'w');

    const peerState = {
        count : 0,
        choked : true,
        queue : []   // TODO :: set timeout for requests and re-request the unrecieved pieces
    };

    const socket = new net.Socket();

    socket.connect(peer.port, peer.ip, ()=>{
        console.log("------- Connection established with : ", peer.ip, ":", peer.port);
        socket.write(MessageBuilder.handshake(torrent));
    });

    //socket.on('data', data => {
        //    console.log("------- Recieved data : length : ", data.length, "\n-----", data.subarray(1, 16)); // buf.subarray is deprecated
        //});


    onGetMsgComplete(msg => handleMessage(msg));

    //socket.on('data', d => console.log(`\n${peer.ip}:${peer.port} -- ${d.length} : `, d));
    //socket.on('error', console.log);
    socket.on('error', ()=>{});

    function handleMessage(message){
        if(MessageParser.isHandshake(message)){
            socket.write(MessageBuilder.interested());
            console.log(`--interested --> ${socket.remoteAddress}`);
        } else {
            const msg = MessageParser.parse(message);

            switch (msg.id){
                case 0: // choke handle
                    handleChokeMsg();
                    break;
                case 1: // unchoke handle
                    handleUnchokeMsg();
                    break;
                case 4: // have handle
                    handleHaveMsg(msg.payload);
                    break;
                case 5: // bit field handle
                    handleBitfieldMsg(msg.payload);
                    break;
                case 7: // piece handle
                    handlePieceMsg(msg.payload);
                    break;
                default:
                    console.log("------ routed to default", msg);
            }
        }
    }

    function handleChokeMsg(){
        console.log(`--${socket.remoteAddress} choke`);
        peerState.choked = true;
        socket.end();
    }

    function handleUnchokeMsg(){
        console.log(`--${socket.remoteAddress} unchoke`);
        peerState.choked = false;
        requestPiece();
    }

    function handlePieceMsg(payload){
        //console.log(`--${socket.remoteAddress} piece block : `, payload);
        addBlock(payload);
        peerState.count ++;
        console.log(`-- remaining : ${pieces.remaining} ::  got block : ${payload.index*2+(payload.begin>0?1:0)}`);
        requestPiece();
    }

    function addBlock(payload){
        if(pieces.addReceived(payload.index, payload.begin>0?1:0))
            fs.writeSync(file, payload.block, 0, payload.block.length, payload.index * torrent.info["piece length"]+payload.begin);
    }

    function requestPiece(){
        if(peerState.choked) return;

        //console.log(`requesting ${socket.remoteAddress}-- size remaining: `, peerState.queue.length);
        while(peerState.queue.length>0){
            const pIndex = peerState.queue.shift();
            if(pieces.checkNeeded(pIndex, 0)){
                socket.write(MessageBuilder.request(pIndex, 0, blockLength(torrent, pIndex, 0)));
                pieces.addRequested(pIndex, 0);
                break;
            }else if(pieces.checkNeeded(pIndex, 1)){
                socket.write(MessageBuilder.request(pIndex, BLOCK_SIZE, blockLength(torrent, pIndex, 1)));
                pieces.addRequested(pIndex, 1);
                break;
            } else{
                console.log("already requested/received : ", pIndex*2, pIndex*2+1);
            }

            /* if(pieces.checkNeeded(pIndex)){
                const plen = pieceLength(torrent, pIndex);
                socket.write(MessageBuilder.request(pIndex, 0, plen));
                socket.write(MessageBuilder.request(pIndex, plen, plen));
                pieces.addRequested(pIndex);
                break;
            }*/
        }
    }

    function handleHaveMsg(payload){  // if the piece is not requested, then request it
        console.log(`--${socket.remoteAddress} have : `, payload);

        const pIndex = payload.readUInt32BE(0);
        peerState.queue.push(pIndex);
        if(peerState.queue.length === 1) requestPiece(); 
    }

    function handleBitfieldMsg(payload){
        console.log(`--${socket.remoteAddress} len : ${payload.length} bitfields : `, payload);
        const _empflg = peerState.queue.length === 0;
        payload.forEach((x, i) => {
            for(let _=0; _<8; _++){
                if(x%2) peerState.queue.push(i*8+7-_);
                x>>=1;
            }
            if(_empflg) requestPiece(); 
        });
    }

    function onGetMsgComplete(callback){
        let savedBuf = Buffer.alloc(0);
        let handshake = true;  // first message is always handshake one. So, treat it differently

        socket.on('data', recvBuf => {
            // handshake message's first byte is 0x13 (19) always and message length is always 68
            //const msgLen = () => handshake ? recvBuf.readUInt8(0) + 49 : recvBuf.readInt32BE(0) + 4;
            const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
            savedBuf = Buffer.concat([savedBuf, recvBuf]);

            while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
                callback(savedBuf.subarray(0, msgLen()));
                savedBuf = savedBuf.subarray(msgLen());
                handshake = false;
            }
        });
    }
}
