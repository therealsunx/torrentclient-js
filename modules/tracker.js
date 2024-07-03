import dgram from "node:dgram";
import buffer from "node:buffer";
import {parse} from "node:url";
import crypto from "node:crypto";
import { infoHash, size } from "./torrent-parser.js";
import { generateID } from "./utils.js";

export default function getPeers (torrent, recievePeersCallback) {
    const socket = dgram.createSocket('udp4');
    const url = parse(new TextDecoder().decode(torrent.announce));

    sendUDP(socket, connectionReqMsg(), url);

    socket.on("message", res => {
        if(responseType(res) === 'connect'){
            // recieve and parse connection response
            const con_resp = parseConnectResponse(res);
            // send announce req
            sendUDP(socket, announceReqMsg(con_resp.connection_id, url.port, torrent));
        } else if(responseType(res) === 'announce'){
            // recieve and parse announce response
            const announce_resp = parseAnnounceResponse(res);
            // send peers to caller
            recievePeersCallback(announce_resp.peers);
        }
    });
};

function sendUDP(socket, message, url, callback = ()=>{}){
    socket.send(message, url.port, url.host, callback);
}

function connectionReqMsg(){
    const buf = Buffer.alloc(16);

    // this line threw error due to some logic in buffer writing mechanism
    // buf.writeBigUInt64BE(0x41727101980, 0); //0x417 27101980
    // so this is another way to write same thing
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    buf.writeUInt32BE(0x0, 8); // action : 0 => connect
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

    return buf;
}

function parseAnnounceResponse(response){
    console.log("TODO : parseAnnounceResponse");
}
