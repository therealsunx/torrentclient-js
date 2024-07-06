import net from 'node:net'
import Buffer from 'node:buffer'
import {getpeers} from './tracker.js'
import 'dotenv/config'


function downlaod(peer){
const socket=net.connect(peer.port,peer.ip,function(){
    console.log('coonected to the server')
})

socket.on('error',(err)=>[
    console.log(err)
])

socket.on('data',data=>{
    console.log('data get on tcp connection')
})

}


//making tcp connection for all peers
const peerDownload=(torrent)=>{getpeers(torrent,(peers)=>{
    // console.log(process.env.filename)
    // console.log(peers)
peers.forEach(downlaod);
})
}

export {
    peerDownload
}



