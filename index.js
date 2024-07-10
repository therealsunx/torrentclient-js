'use strict';

import { openTorrent, size, size_num } from "./modules/torrent-parser.js";
import getPeers from "./modules/tracker.js";
import getData from "./modules/peer_connection.js";
import { PiecesData } from "./modules/pieces.js";

const torrent = openTorrent('espresso.torrent');

getPeers(torrent, peers => {
    //peers.forEach(peer => getData(peer, torrent));
    const pieces = new PiecesData(torrent.info.pieces.length/20)
    for(let p of peers){
        getData(p, torrent, pieces);
    }
});
