'use strict';

import { infoHash } from "./torrent-parser.js";
import { generateID } from "./utils.js";

export class MessageBuilder{
    static handshake(torrent){
        const _buf = Buffer.alloc(68);
        _buf.writeUint8(19, 0);
        _buf.write('BitTorrent protocol', 1);
        _buf.writeUint32BE(0, 20);
        _buf.writeUint32BE(0, 24);
        infoHash(torrent).copy(_buf, 28);
        generateID().copy(_buf, 48);
        return _buf;
    }

    static keepalive (){
        return Buffer.alloc(4);
    }

    static choke () {
        const _buf = Buffer.alloc(5);
        _buf.writeUint32BE(1, 0);
        _buf.writeUint8(0, 4);
        return _buf;
    }

    static unchoke () {
        const _buf = Buffer.alloc(5);
        _buf.writeUint32BE(1, 0);
        _buf.writeUint8(1, 4);
        return _buf;
    }

    static interested () {
        const _buf = Buffer.alloc(5);
        _buf.writeUint32BE(1, 0);
        _buf.writeUint8(2, 4);
        return _buf;
    }

    static uninterested () {
        const _buf = Buffer.alloc(5);
        _buf.writeUint32BE(1, 0);
        _buf.writeUint8(3, 4);
        return _buf;
    }

    static have (payload) {
        const _buf = Buffer.alloc(9);
        _buf.writeUint32BE(5, 0);
        _buf.writeUint8(4, 4);
        _buf.writeUint32BE(payload, 5);
        return _buf;
    }

    static bitfield (bits){
        const _buf = Buffer.alloc(5 + bits.length);
        _buf.writeUint32BE(1+bits.length, 0);
        _buf.writeUint8(5, 4);
        bits.copy(_buf, 5);
        return _buf;
    }

    static request (index, begin, length){
        const _buf = Buffer.alloc(17);
        _buf.writeUint32BE(13, 0);
        _buf.writeUint8(6, 4);
        _buf.writeInt32BE(index, 5);
        _buf.writeInt32BE(begin, 9);
        _buf.writeInt32BE(length, 13);
        return _buf;
    }

    static piece (index, begin, block){
        const _buf = Buffer.alloc(13 + piece.block.length);
        _buf.writeInt32BE(9+piece.block.length, 0);
        _buf.writeUint8(7, 4);
        _buf.writeUint32BE(index, 5);
        _buf.writeUint32BE(begin, 9);
        block.copy(_buf, 13);
        return _buf;
    }

    static cancel (index, begin, length){
        const _buf = Buffer.alloc(17);
        _buf.writeUint32BE(13, 0);
        _buf.writeUint8(8, 4);
        _buf.writeInt32BE(index, 5);
        _buf.writeInt32BE(begin, 9);
        _buf.writeInt32BE(length, 13);
        return _buf;
    }

    static port (port){
        const _buf = Buffer.alloc(7);
        _buf.writeUint32BE(3, 0);
        _buf.writeUint8(9, 4);
        _buf.writeUint16BE(port, 5);
        return _buf;
    }
}

export class MessageParser{

    static isHandshake(message){
        //console.log(message.toString('utf8', 1, 20));
        return message.length === (message.readUInt8(0)+49) && message.toString('utf8', 1, 20) === "BitTorrent protocol";
    }

    static parse(msg){
        const id = msg.length > 4? msg.readInt8(4) : null;
        let payload = msg.length>5? msg.slice(5) : null;

        if([6,7,8].includes(id)){
            const _rem = payload.slice(8);
            payload = {
                index : payload.readUInt32BE(0),
                begin : payload.readUInt32BE(4),
                [id===7?'block':'length'] : _rem
            }
        }

        return {
            size : msg.readUInt32BE(0),
            id : id,
            payload : payload
        }
    }
}
