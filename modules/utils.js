'use strict';

import crypto from "node:crypto";

let _id = null;

export const generateID = ()=>{
    if(!_id){
        _id = crypto.randomBytes(20);

        // its a convention followed
        Buffer.from('-AZ4712-').copy(_id, 0);  // AZ : Azureus : version : 4.7.1.2
    }
    return _id;
}

