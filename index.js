'use strict';

import {openTorrent} from "./modules/torrent-parser.js";
import getPeers from "./modules/tracker.js";

const torrent = openTorrent('espresso.torrent');

getPeers(torrent, peers => {
    console.log("Peers recieved : ", peers);
});
