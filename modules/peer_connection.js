'use strict';

import net from "node:net";
import { MessageBuilder } from "./message.js";

export default function getData(peer, torrent){
    const socket = new net.Socket();

    socket.connect(peer.port, peer.ip, ()=>{
        console.log("------- Connection established with : ", peer.ip, ":", peer.port);
        socket.write(MessageBuilder.handshake(torrent));
    });

    //socket.on('data', data => {
    //    console.log("------- Recieved data : length : ", data.length, "\n-----", data.subarray(1, 16)); // buf.subarray is deprecated
    //});


    onGetMsgComplete(socket, data => {
        console.log(`\n${peer.ip}:${peer.port} len : ${data.length} data : `, data);
    });

    //socket.on('data', d => console.log(`\n${peer.ip}:${peer.port} -- ${d.length} : `, d));
    socket.on('error', console.log);
}

function onGetMsgComplete(socket, callback){
    let savedBuf = Buffer.alloc(0);
    let handshake = true;  // first message is always handshake one. So, treat it differently

    socket.on('data', recvBuf => {
        // handshake message's first byte is 0x13 (19) always and message length is always 68
        const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, recvBuf]);

        while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
            callback(savedBuf.subarray(0, msgLen()));
            savedBuf = savedBuf.subarray(msgLen());
            handshake = false;
        }
    });
}
