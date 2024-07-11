import fs from  'fs'
import { readTorrentFile } from './utils.js'
import {Buffer} from 'buffer'
import 'dotenv/config'

function createFile(torrent,path='./'){
    let filename;
    if (torrent.info)
    filename = new TextDecoder().decode(torrent.info.files[2].path[0]);
else
filename=torrent.filename
console.log(path+filename)
const file=fs.openSync(path+filename,'w')
return file
}

function saveBuffer(payload,piece_length,file){
    let offset=payload.index*piece_length+payload.begin
    fs.write(file,payload.block,0,payload.block.length,offset,()=>{})
}

function readSavedFile(path){
console.log(fs.readFileSync(path))
}

function closeFile(file)
{
    fs.closeSync(file)
}

// readSavedFile('./savedfile.txt')
export {
createFile,
saveBuffer,
readSavedFile,
closeFile
}