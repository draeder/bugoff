const crypto = require('crypto')
const Gun = require('gun')
const { SEA } = require('gun')
const Bugout = require('bugout')

Gun.chain.bugoff = async function(identifier, opts) {
  "use strict"
  let id = sha(identifier)


  let gun = this
  let bugoff = this.bugoff = new Bugout(id, opts)

  bugoff.id = id

  bugoff.roomSEA = { pair: await SEA.pair(), timestamp: new Date().getTime() }

  bugoff.sea = await SEA.pair()

  bugoff.register('peer', (address, epub, cb) =>{
    bugoff.peers[address].epub = epub
    cb(bugoff.peers)
    bugoff.emit('epub', bugoff.peers)
  })

  bugoff.register('room', (address, roomSEA, cb) =>{
    if(roomSEA.timestamp < bugoff.roomSEA.timestamp) {
      bugoff.roomSEA = {pair: roomSEA.pair, timestamp: roomSEA.timestamp}
    }
    cb(roomSEA)
  })

  bugoff.on('seen', async address => {
    bugoff.rpc(address, 'peer', await bugoff.sea.epub)
    bugoff.rpc(address, 'room', await bugoff.roomSEA)
  })

  bugoff.on('message', async (address, message) => {
    (async function checkEpub(){
      if(bugoff.peers[address] && !bugoff.peers[address].epub) {
        setTimeout(checkEpub, 50)
        return
      }
      try {
        let dec = await SEA.decrypt(message, await SEA.secret(bugoff.peers[address].epub, bugoff.sea))
        if(dec) bugoff.emit('decrypted', address, dec)
      } 
      catch (err) {
        try {
          let msg = await SEA.verify(message, bugoff.roomSEA.pair.pub)
          let dec = await SEA.decrypt(msg, bugoff.roomSEA.pair)
          let proof = await SEA.work(dec, bugoff.roomSEA.pair)
          if(dec && proof) bugoff.emit('decrypted', address, dec)
        } catch (err) {}
      }
    })()
  })
  
  async function patchSend(value, args){
    let epub = new Promise(async (resolve, reject) => {  
      bugoff.on('epub', peers => {
        resolve(peers)
      })
    })

    if(await epub){
      let address, message
      if(args.length === 2) {
        // this is a direct message
        address = args[0]
        message = args[1]
        let enc = await SEA.encrypt(message, await SEA.secret(bugoff.peers[address].epub, bugoff.sea))
        return [address, enc]
      } else
      if(args.length === 1) {
        // this is a broadcast message
        message = args[0]
        let enc = await SEA.encrypt(message, await bugoff.roomSEA.pair)
        let data = await SEA.sign(enc, bugoff.roomSEA.pair)
        return [data]
      }
    }
  }

  bugoff.send = (function(){
    var send = bugoff.send
    return async function(){
      return send.apply(this, await patchSend(this, arguments))
    }
  })()

  function sha(input){
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
  }

  return gun
}