'use strict';

import fs from "fs";
import bencode from "bencode";
import getPeers from "./modules/tracker.js";

const torrent = bencode.decode(fs.readFileSync('test.torrent'));

getPeers(torrent, peers => {
    console.log("Peers recieved : ", peers);
});
