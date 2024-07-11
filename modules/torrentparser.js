import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';
import dgram  from 'dgram';
import parse from 'url-parse'
import { peerId, readTorrentFile, torrentSize ,infohash} from './utils.js';


const BLOCK_LEN=16*1024
//for building the connection
const BuildConnectionParse=(buffer)=>{
    return {
        action: buffer.readUInt32BE(0),
        transactionId: buffer.readUInt32BE(4),
        connectionId: buffer.slice(8)
    }
}

//for parse of the announce
const AnnounceRespParse=(buffer)=>{
    // const ip_addresses_length=(buffer.length-20)/6
    // let ip_addresses=[]
    // let ports=[]
    // console.log(buffer.length)
    // for (let i=0;i<ip_addresses_length;i++)
    // {
    //     let ip_address=buffer.slice(20+6*i,20+6*i+4).join('.')
    //     let port=buffer.readUInt16BE(24+6*i)
    //     ip_addresses.push(ip_address)
    //     ports.push(port)
    // }

    // console.log(ip_addresses.length)

    function group(iterable, groupSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
          groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
      }
    return {
        action:buffer.readUInt32BE(0),
        transaction_id:buffer.readUInt32BE(4),
        interval:buffer.readUInt32BE(8),
        leechers:buffer.readUInt32BE(12),
        seeders:buffer.readUInt32BE(16),
        peers:group(buffer.slice(20),6).map(address=>{
            return {
                ip:address.slice(0,4).join('.'),
                port:address.readUInt16BE(4)
            }
        })
    }
}


const pieceLen=(torrent,index)=>{
const total_size=torrent.info.files.reduce((total,b)=>{
    return total+b.length
    },0)
const pieceLength=torrent.info['piece length']
const total_pieces=Math.ceil(total_size/pieceLength)
return index==total_pieces-1?total_size-(index)*pieceLength:pieceLength
}

const blockLen=(pieceIndex,blockIndex)=>{

    const plen=pieceLen(pieceIndex)
const total_blocks=Math.ceil(plen/BLOCK_LEN)
return blockIndex==total_blocks-1?plen-(blockIndex)*BLOCK_LEN:BLOCK_LEN
}

const numBlocks=(torrent,pieceIndex)=>{
return Math.ceil(pieceLen(torrent,pieceIndex)/BLOCK_LEN)
}




export {
    BuildConnectionParse,
    AnnounceRespParse,
    BLOCK_LEN,
    pieceLen,
    numBlocks,
    blockLen
}