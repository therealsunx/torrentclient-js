'use strict';

import net from "node:net";
import { MessageBuilder, MessageParser } from "./message.js";

export default function getData(peer, torrent, stats){
    const socket = new net.Socket();

    socket.connect(peer.port, peer.ip, ()=>{
        console.log("------- Connection established with : ", peer.ip, ":", peer.port);
        socket.write(MessageBuilder.handshake(torrent));
    });

    //socket.on('data', data => {
    //    console.log("------- Recieved data : length : ", data.length, "\n-----", data.subarray(1, 16)); // buf.subarray is deprecated
    //});


    onGetMsgComplete(socket, msg => handleMessage(msg, socket, stats));

    //socket.on('data', d => console.log(`\n${peer.ip}:${peer.port} -- ${d.length} : `, d));
    //socket.on('error', console.log);
    socket.on('error', ()=>{});
}

function handleMessage(message, socket, stats){
    if(MessageParser.isHandshake(message)){
        socket.write(MessageBuilder.interested());
        console.log("-----interested message sent");
    } else {
        const msg = MessageParser.parse(message);

        switch (msg.id){
            //case 0: // choke handle
            //    break;
            //case 1: // unchoke handle
            //    break;
            case 4: // have handle
                handleHaveMsg(msg.payload, socket, stats);
                break;
            case 5: // bit field handle
                handleBitfieldMsg(msg.payload, socket, stats);
                break;
            case 7: // piece handle
                handlePieceMsg(msg.payload);
                break;
            default:
                console.log("------ routed to default", msg);
        }
    }
}

function handlePieceMsg(payload, socket){
    console.log(`--${socket.remoteAddress} piece block : `, payload);
}

function handleHaveMsg(payload, socket, stats){  // if the piece is not requested, then request it
    console.log(`--${socket.remoteAddress} have : `, payload);

    const pIndex = payload.readUInt32BE(0);
    if(!stats.requested[pIndex]){
        socket.write(MessageBuilder.request(pIndex, 0, stats.length));
    }
    stats.requested[pIndex] = true;
}

function handleBitfieldMsg(payload, socket, stats){
    console.log(`--${socket.remoteAddress} bitfields : `, payload);
}

function onGetMsgComplete(socket, callback){
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
