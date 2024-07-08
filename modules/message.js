import { Buffer } from 'node:buffer';
import { peerId, readTorrentFile, torrentSize, infohash } from './utils.js';
import { BuildConnectionParse, AnnounceRespParse } from './torrentparser.js';
import 'dotenv/config';

class message{
    static buildHandshake(torrent) {
        const buf = Buffer.alloc(68);
        buf.writeUInt8(19, 0); // BitTorrent protocol
        buf.write('BitTorrent protocol', 1); // pstr
        buf.writeUInt32BE(0, 20); // reserved h
        buf.writeUInt32BE(0, 24); // reserved l
        infohash(torrent).copy(buf, 28); // info hash
        peerId().copy(buf, 48);
        return buf;
    }

    static buildKeepAlive() {
        return Buffer.alloc(4);
    }

    static buildChoke() {
        const buf = Buffer.alloc(5);
        buf.writeUInt32BE(1, 0);
        buf.writeUInt8(0, 4);
        return buf;
    }

    static buildUnchoke() {
        const buf = Buffer.alloc(5);
        buf.writeUInt32BE(1, 0);
        buf.writeUInt8(1, 4);
        return buf;
    }

    static buildInterested() {
        const buf = Buffer.alloc(5);
        buf.writeUInt32BE(1, 0);
        buf.writeUInt8(2, 4);
        return buf;
    }

    static buildUninterested() {
        const buf = Buffer.alloc(5);
        buf.writeUInt32BE(1, 0);
        buf.writeUInt8(3, 4);
        return buf;
    }

    static buildHave(payload) {
        const buf = Buffer.alloc(9);
        buf.writeUInt32BE(5, 0); // len
        buf.writeUInt8(4, 4); // id 4 is for have message
        buf.writeUInt32BE(payload, 5);
        return buf;
    }

    static buildBitfield(bitfield) {
        const buf = Buffer.alloc(14); // bitfield: <len=0001+X><id=5><bitfield>
        buf.writeUInt32BE(bitfield.length + 1, 0);
        buf.writeUInt8(5, 4);
        bitfield.copy(buf, 5);
        return buf;
    }

    static buildRequest(payload) {
        const buf = Buffer.alloc(17);
        buf.writeUInt32BE(13, 0); // len
        buf.writeUInt8(6, 4); // id
        buf.writeUInt32BE(payload.index, 5);
        // begin
        buf.writeUInt32BE(payload.begin, 9);
        // length
        buf.writeUInt32BE(payload.length, 13);
        return buf;
    }

    static buildPiece(payload) {
        const buf = Buffer.alloc(payload.block.length + 13);
        // length
        buf.writeUInt32BE(payload.block.length + 9, 0);
        // id
        buf.writeUInt8(7, 4);
        // piece index
        buf.writeUInt32BE(payload.index, 5);
        // begin
        buf.writeUInt32BE(payload.begin, 9);
        // block
        payload.block.copy(buf, 13);
        return buf;
    }

    static buildCancel(payload) {
        const buf = Buffer.alloc(17);
        // length
        buf.writeUInt32BE(13, 0);
        // id
        buf.writeUInt8(8, 4);
        // piece index
        buf.writeUInt32BE(payload.index, 5);
        // begin
        buf.writeUInt32BE(payload.begin, 9);
        // length
        buf.writeUInt32BE(payload.length, 13);
        return buf;
    }

    static buildPort(payload) {
        const buf = Buffer.alloc(7);
        // length
        buf.writeUInt32BE(3, 0);
        // id
        buf.writeUInt8(9, 4);
        // listen-port
        buf.writeUInt16BE(payload, 5);
        return buf;
    }

    static parse(msg) {
        const id = msg.length > 4 ? msg.readUInt8(4) : null;
        let payload = msg.length > 5 ? msg.slice(5) : null;

        if (id > 5 && id < 9) {
            const rest = payload.slice(8);
            payload = {
                index: payload.readUInt32BE(0),
                begin: payload.readUInt32BE(4)
            };
            payload[id == 7 ? 'block' : 'length'] = rest;
        }
        return {
          size:msg.readInt32BE(0),
          id:id,
          payload:payload
        }
    }
}

// const torrent = readTorrentFile(process.env.filename);

export {message}
