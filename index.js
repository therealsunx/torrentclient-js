'use strict';

import fs from 'fs';
import bencode from 'bencode';

const torrent = bencode.decode(fs.readFileSync('test.torrent'));
const ss = String.fromCharCode.apply(null, torrent.announce);
console.log(ss);
