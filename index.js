import {getpeers} from './tracker.js'

getpeers('espresso.torrent',peers=>{
    console.log('list of peers: ',peers)
})