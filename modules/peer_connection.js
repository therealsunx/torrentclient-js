'use strict';

import net from "node:net";
import { bufToStr, generateID } from "./utils.js";
import { infoHash } from "./torrent-parser.js";

export default function getData(peer){
    const socket = new net.Socket();

    socket.connect(peer.port, peer.ip, ()=>{
        console.log("------- Connection established with : ", peer.ip, ":", peer.port);
    });

    socket.on('data', data => {
        console.log("------- Recieved data : ", data.subarray(0, 16)); // buf.slice is deprecated
    });

    socket.on('error', err => console.log("-------" , err));
}

