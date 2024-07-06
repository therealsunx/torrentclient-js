'use strict';

import { openTorrent } from "./modules/torrent-parser.js";
import getPeers from "./modules/tracker.js";
import getData from "./modules/peer_connection.js";

const torrent = openTorrent('espresso.torrent');

getPeers(torrent, peers => {
    //peers.forEach(peer => getData(peer, torrent));
    for(let p of peers){
        getData(p, torrent);
    }
});
