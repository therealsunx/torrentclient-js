'use strict';

import crypto from "node:crypto";

let _id = null;
const decoder = new TextDecoder();

export const BLOCK_SIZE = 16384;

export const generateID = ()=>{
    if(!_id){
        _id = crypto.randomBytes(20);

        // its a convention followed
        Buffer.from('-AZ4712-').copy(_id, 0);  // AZ : Azureus : version : 4.7.1.2
    }
    return _id;
}

export const bufToStr = buf => decoder.decode(buf);
