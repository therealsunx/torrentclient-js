'use strict';

import dgram from "node:dgram";
import {parse} from "node:url";
import crypto from "node:crypto";
import { infoHash, size } from "./torrent-parser.js";
import { generateID, bufToStr } from "./utils.js";

export default function getPeers (torrent, recievePeersCallback) {
    const socket = dgram.createSocket('udp4');
    const url = parse(bufToStr(torrent.announce));
    //const url = parse('udp://93.158.213.92:1337');
    //const url = parse('udp://tracker.openbittorrent.com:80');
    //console.log(url.port);

    sendUDP(socket, connectionReqMsg(), url, err => {if(err) console.log("Error sending message : " , err)});

    socket.on('listening', () => {
        console.log("listening");
    });

    socket.on("message", res => {
        //console.log("recieved : ", res);
        if(responseType(res) === 'connect'){
            // recieve and parse connection response
            const _connResp = parseConnectResponse(res);
            // send announce req
            const _announceMsg = announceReqMsg(_connResp.connection_id, url.port, torrent);
            sendUDP(socket, _announceMsg, url);
        } else if(responseType(res) === 'announce'){
            // recieve and parse announce response
            const _announceResp = parseAnnounceResponse(res);
            // send peers to caller
            recievePeersCallback(_announceResp.peers);
        }
    });

    socket.on('error', err => {
        console.log(err);
        socket.close();
    });
};

function responseType(response){
    switch(response.readUint32BE(0)){
        case 0: return 'connect';
        case 1: return 'announce';
        case 2: return 'scrape';
        case 3: return 'error';
    }
}

function sendUDP(socket, message, url, callback = ()=>{}){
    socket.send(message, url.port, url.hostname, callback);
}

function connectionReqMsg(){
    const buf = Buffer.alloc(16);

    // this line threw error due to some logic in buffer writing mechanism
    // buf.writeBigUInt64BE(0x41727101980, 0); //0x417 27101980
    // can also: pid = Buffer.from('0000041727101980', 'hex') and copy into buf
    // so this is another way to write same thing
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    buf.writeUInt32BE(0, 8); // action : 0 => connect
    crypto.randomBytes(4).copy(buf, 12); // generate random transaction id

    console.log("Connection Req Msg : ", buf);
    
    return buf;
}

function parseConnectResponse(response){
    return {
        action : response.readUint32BE(0),
        transaction_id: response.readUint32BE(4),
        connection_id: response.slice(8)
    };
}

function announceReqMsg(connection_id, port, torrent){ // TODO
    const buf = Buffer.allocUnsafe(98);

    connection_id.copy(buf, 0);
    buf.writeUInt32BE(1, 8);
    crypto.randomBytes(4).copy(buf, 12);
    infoHash(torrent).copy(buf, 16);
    generateID().copy(buf, 36);
    Buffer.alloc(8).copy(buf, 56);
    size(torrent).copy(buf, 64);
    Buffer.alloc(8).copy(buf, 72);
    buf.writeUInt32BE(0, 80);
    buf.writeUInt32BE(0, 84);
    crypto.randomBytes(4).copy(buf, 88);
    buf.writeInt32BE(-1, 92);
    buf.writeUInt16BE(port, 96);

    console.log("announceReqMsg : ", buf);

    return buf;
}

function parseAnnounceResponse(response){
    const _peerdata = response.slice(20);
    const _peers = [];

    for(let i=0; i<_peerdata.length; i+=6){
        _peers.push({
            ip : _peerdata.slice(i, i+4).join('.'),
            port : _peerdata.readUInt16BE(i+4)
        });
    }

    return {
        action : response.readUint32BE(0),
        transaction_id : response.readUint32BE(4),
        interval : response.readUint32BE(8),
        leechers : response.readUint32BE(12),
        seeders : response.readUint32BE(16),
        peers : _peers
    };
}
