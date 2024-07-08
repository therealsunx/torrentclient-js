'use strict';

import { openTorrent, size, size_num } from "./modules/torrent-parser.js";
import getPeers from "./modules/tracker.js";
import getData from "./modules/peer_connection.js";

const torrent = openTorrent('espresso.torrent');

getPeers(torrent, peers => {
    //peers.forEach(peer => getData(peer, torrent));
    const stats = {
        size : size_num(torrent),
        length : torrent.info["piece length"],
        requested : []
    };
    console.log(stats);
    for(let p of peers){
        getData(p, torrent, stats);
    }
});
