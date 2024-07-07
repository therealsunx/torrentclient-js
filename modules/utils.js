import bencode from 'bencode';
import crypto from 'crypto';
import fs from 'fs'
// import bignum from 'bignum'

const readTorrentFile=(filiename)=>{
    const data=fs.readFileSync(filiename)
    return bencode.decode(data)
}

//for creating hash for info in torrent file
const infohash=(torrent)=>{
    const info=bencode.encode(torrent.info)
    return crypto.createHash('sha1').update(info).digest()//return 20 byte long as in pieces it contains hsh list of pieces which is of 20 bytes
}

const peerId=()=>{
   const id= crypto.randomBytes(20)
    Buffer.from('-CT0001-').copy(id,0);  //8 bytes for client informattion CT -for codeth client
    return id;
}


//ti get torrent size
const torrentSize = (torrent) => {
    const buf=Buffer.alloc(8)
    let total_size = 0;

    if (torrent.info.files) {
        torrent.info.files.forEach(element => {
            total_size += element.length;
        });
    } else {
        total_size = torrent.info.length;
    }
    // console.log(total_size%2**32,total_size-(total_size%2**32))
    // console.log(total_size)
    return [total_size-(total_size%2**32),total_size%2**32]
}


// infohash(readTorrentFile('espresso.torrent'))
// peerId()
// console.log(Buffer.alloc(8))
torrentSize(readTorrentFile('espresso.torrent'))

export {
    infohash,
    readTorrentFile,
    peerId,
    torrentSize
}