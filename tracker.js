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

    // console.log(connection_id)
    connection_id.copy(buf,0) //connection
    buf.writeUInt32BE(0x1,8); //announce
    crypto.randomBytes(4).copy(buf,12); //random transcation _id
    infohash(torrent).copy(buf,16) //info hash
    peerId().copy(buf,36) //peer id
    Buffer.alloc(8).copy(buf,56) //for downloaded
    Buffer.alloc(8).copy(buf,64) //left
    buf.writeUInt32BE(hsize,72)//uploaded higher
    buf.writeUint32BE(lsize,76)//'uploaded lower
    buf.writeUInt32BE(0x0,80);  //event
    buf.writeUInt32BE(0,84); //ip
    crypto.randomBytes(4).copy(buf,88) //key
    buf.writeInt32BE(-1,92); //num_want
    buf.writeUInt16BE(port, 96);

    return buf
}


//for which response type it is
const resType=(res)=>{
    // console.log('insiede the resType ')
    const action = res.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
    if(action==3) return 'error';
}


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
    const ip_addresses_length=(buffer.length-20)/6
    let ip_addresses=[]
    let ports=[]
    // console.log(buffer.length)
    for (let i=0;i<ip_addresses_length;i++)
    {
        let ip_address=buffer.slice(20+6*i,20+6*i+4).join('.')
        let port=buffer.readUInt16BE(24+6*i)
        ip_addresses.push(ip_address)
        ports.push(port)
    }
    console.log(ip_addresses.length)

    return {
        action:buffer.readUInt32BE(0),
        transaction_id:buffer.readUInt32BE(4),
        interval:buffer.readUInt32BE(8),
        leechers:buffer.readUInt32BE(12),
        seeders:buffer.readUInt32BE(16),
        peers:{
            ip:ip_addresses,
            port:ports
        }
    }
}



//for getting the peer
const getpeers=async ()=>{
    let i=0;
    const socket=dgram.createSocket('udp4');
    let url,port
    const urls=getTrackers(filename)

    udpSend(socket,BuildConnectionRequestMessage(),urls[i])
    socket.on('message',(response,rinfo)=>{
        url=urls[i]
        port=parse(url).port

        if(resType(response)=='connect'){
        const connResponse=BuildConnectionParse(response)
        // console.log(connResponse)
        const annouonceReq=announceRequestMessage(connResponse.connectionId,port)
        // console.log(port,annouonceReq,url)
        udpSend(socket,annouonceReq,url)
        }
        else if(resType(response)=='announce')
        {
            const announceResp = AnnounceRespParse(response)
            console.log(announceResp)
        }
        else if(resType(response)=='error')
        {
            console.log(response.toString())
        }
        
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

