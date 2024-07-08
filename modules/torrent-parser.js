'use strict';

import bignum from "bignum";
import crypto from "node:crypto";
import fs from 'fs';
import bencode from 'bencode';

export const openTorrent = filepath => {
    return bencode.decode(fs.readFileSync(filepath));
}

export const infoHash = (torrent) => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
}

export const size = (torrent) => {
    return bignum.toBuffer(size_num(torrent), {size:8}); // 64b int
}
export const size_num = torrent => torrent.info.files?
    torrent.info.files.map(f => f.length).reduce((a, b) => a+b):
    torrent.info.length;
