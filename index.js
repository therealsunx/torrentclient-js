import {getpeers} from './modules/tracker.js'
import { peerDownload } from './modules/download.js'
import 'dotenv/config'

// getpeers('espresso.torrent',peers=>{
//     console.log('list of peers: ',peers)
// })

peerDownload(process.env.filename)