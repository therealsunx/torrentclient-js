'use strict';

import { blockLength, openTorrent, size, size_num } from "./modules/torrent-parser.js";
import getPeers from "./modules/tracker.js";
import getData from "./modules/peer_connection.js";
import { PiecesData } from "./modules/pieces.js";
import { BLOCK_SIZE } from "./modules/utils.js";

const torrent = openTorrent(process.argv[2]);  // node index.js __filename__
const debugMode = process.argv.length === 5 && process.argv[4] === "-D";
//const torrent = openTorrent('espresso.torrent');
console.log(process.argv, debugMode);

getPeers(torrent, peers => {
    //peers.forEach(peer => getData(peer, torrent));

//  var _l1 = torrent.info.pieces.length/20;
//  console.log(size_num(torrent)/_l1, torrent.info["piece length"]);
//  if(blockLength(torrent, _l1-1, 1)===0) _l1 = _l1*2-1;
//  else _l1 = _l1*2;
    
    const _len = Math.ceil(size_num(torrent)/BLOCK_SIZE);
    const pieces = new PiecesData(_len)
    for(let p of peers){
        getData(p, torrent, pieces, debugMode);
    }
});
