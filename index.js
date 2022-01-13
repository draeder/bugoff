const crypto = require('crypto')
const Gun = require('gun')
const { SEA } = require('gun')
const Bugout = require('bugout')
const events = require('events')

function Bugoff(identifier, opts) {
  this.events = new events.EventEmitter()
  this.ID = sha(identifier)
  this.identifier = this.ID
  this.opts = opts
  this.bugout = new Bugout(identifier, opts)
  this.address = this.bugout.address()
  this.peers = {}

  this.SEA = async (pair) => {
    this.sea = pair || await SEA.pair()
    return this.sea
  }

  this.on = (events, callback) => {
    return this.bugout.on(events, callback)
  }

  this.once = (events, callback) => {
    return this.bugout.once(events, callback)
  }

  this.register = (callname, func, docstring) => {
    return this.bugout.register(callname, func, docstring)
  }

  this.rpc = (address, callname, args, callback) => {
    return this.bugout.rpc(address, callname, args, callback)
  }

  this.heartbeat = (interval) => {
    // Hearbeat patch while waiting for Bugout update in NPM
    return this.bugout.heartbeat(interval)
  }

  this.destroy = (callback) => {
    return this.bugout.destroy(callback)
  }

  this.events.on('encoded', encrypted => {
    if(typeof encrypted === 'object') this.bugout.send(encrypted[0], encrypted[1])
    else this.bugout.send(address, encrypted)
  })

  this.send = async (address, message) => {
    encrypt(address, message)
  }

  this.on('message', async (address, message) => {
    let decrypted = await decrypt(address, message)
    let addr = await decrypted.address
    let pubkeys = await decrypted.pubkeys
    let msg = await decrypted.message
    if(decrypted) this.bugout.emit('decrypted', addr, pubkeys, msg)
  })

  let encrypt = async (address, message) => {
    let peers = new Promise((resolve, reject) => {
      this.events.once('newPeer', (p)=>{
        resolve(p)
      })
    })
    
    await peers

    if(!message) {
      msg = address
      // this is a broadcast message, encrypt with this instance SEA pair
      for(peer in this.peers){
        let enc = [peer, await SEA.encrypt(msg, await SEA.secret(this.peers[peer].epub, this.sea))]
        this.events.emit('encoded', enc)
      }
    } else
    if(message){
      // this is a direct message
      let enc = await SEA.encrypt(message, await SEA.secret(this.peers[address].epub, this.sea))
      this.events.emit('encoded', [address, enc])
    }
  }

  let decrypt = async (address, message) => {
    let pubkeys
    for(peer in this.peers){
      if(peer === address){
        pubkeys = {pub: this.peers[peer].pub, epub: this.peers[peer].epub}
      }
    }

    let dec = await { address: address, pubkeys: pubkeys, message: SEA.decrypt(message, await SEA.secret(this.peers[address].epub, this.sea)) }
    return dec
  }

  this.register('peer', (address, sea, cb) =>{
    Object.assign(this.peers, {[address]:{pub: sea.pub, epub: sea.epub}})
    this.events.emit('newPeer', this.peers)
  })

  this.on('seen', async address => {
    this.rpc(address, 'peer', await this.sea)
  })

  function sha(input){
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
  }
}

module.exports = Bugoff
