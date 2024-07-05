import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';
import dgram  from 'dgram';
import parse from 'url-parse'
import { peerId, readTorrentFile, torrentSize ,infohash} from './utils.js';


const filename='espresso.torrent'

//to get trackers
const getTrackers = (filename) => {
        const data = fs.readFileSync(filename);
        const decodedData=bencode.decode(data,'utf8');
        const trackers=[]

        decodedData['announce-list'].forEach(element => {
            if (element[0].startsWith('udp'))
            trackers.push(element[0])
        });
        return trackers
};


//for buildconnection request
const BuildConnectionRequestMessage=()=>{
    const buf=Buffer.alloc(16)
    buf.writeUInt32BE(0x417, 0); //connection_id
    buf.writeUInt32BE(0x27101980, 4);//connection_id
    buf.writeUInt32BE(0, 8); //0 for connect
    crypto.randomBytes(4).copy(buf, 12); //transaction id
    // console.log(buf)
    return buf;
}

//for announce request
const announceRequestMessage=(connection_id,port)=>{

    const torrent=readTorrentFile(filename)
    const buf=Buffer.alloc(98)
    const [hsize,lsize]=torrentSize(torrent)

    connection_id.copy(buf,0) //connection
    buf.writeUInt32BE(0x1,8); //announce
    crypto.randomBytes(4).copy(buf,12); //random transcation _id
    infohash(torrent).copy(buf,16) //info hash
    peerId().copy(buf,36) //peer id
    Buffer.alloc(8).copy(buf,56) //for downloaded
    Buffer.alloc(8).copy(buf,64) //left
    buf.writeUInt32BE(hsize)//uploaded higher
    buf.writeUint32BE(lsize)//'uploaded lower
    buf.writeUInt32BE(0x0,80);  //event
    buf.writeUInt32BE(0,84); //ip
    crypto.randomBytes(4).copy(buf,88) //key
    buf.writeUInt32BE(-1,92); //num_want
    buf.writeUInt16BE(port, 96);

    return buf
}


//for which response type it is
const resType=(res)=>{
    length=res.length
    if (length==16){
        return "connection"
    }
    else{
        return 'others'
    }
}


//for building the connection
const BuildConnectionParse=(buffer)=>{
    return {
        action: buffer.readUInt32BE(0),
        transactionId: buffer.readUInt32BE(4),
        connectionId: buffer.slice(8)
    }
}



//for getting the peer
const getpeers=async ()=>{
    let i=0;
    const socket=dgram.createSocket('udp4');
    let url
    const urls=getTrackers(filename)

    udpSend(socket,BuildConnectionRequestMessage(),urls[i])
    socket.on('message',(response,rinfo)=>{
        url=urls[i]
        if(resType(response)=='connect')
        const connResponse=BuildConnectionParse(response)
        console.log(`buildconnection response is`,connResponse,url)
        // const announceResponse=sendbuffers(socket,activeUrl,announceRequestMessage(connResponse.connectionId,port))
        
    })

    socket.on('error',(err)=>{
        i++;
        if(i<urls.length){
        udpSend(socket,BuildConnectionRequestMessage(),urls[i])
        }
        else{
            console.log(err)
            console.log(`coulnt establish connection to the tracker tried ${i} trackers`)
        }

    })

    // for (let url of urls){
    //     const response=await sendbuffers(socket,url,BuildConnectionRequestMessage())
    //     console.log(response)
    //     if(response){
    //         console.log(url)
    //         // activeUrl=url
    //         // port=parse(url).port
    //         // console.log(port)
    //         break
    //     }
        
    // }

}


//to send message in udp
// const sendbuffers= (socket,url,message)=>{
//     const {port,hostname}=parse(url)
//     return new Promise((resolve, reject) => {
//         socket.send(message, port, hostname, (err, bytes) => {
//             if (err) {
//                 console.error(`Error sending to ${hostname}:${port}`, err);
//                 reject(0);
//             }
//             else{
//                 resolve(1)
//             }
//         });
//     });
// }

const udpSend=(socket,message,url)=>{
    url = parse(url);
    socket.send(message, 0, message.length, url.port, url.hostname); 
}

const test=()=>{
    const socket=dgram.createSocket('udp4');
    socket.on('message',(msg,rinfo)=>{
        console.log(msg,rinfo)
        socket.close()
    })
    socket.bind(8081)

    socket.send('hi its me anish',8081,'localhost')
    
}


function main(){
// console.log(getTrackers('espresso.torrent'));
// connectionRequest()
getpeers()
// test()
}

main()

