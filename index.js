const { SEA } = require('gun')
const Bugout = require('bugout')

Bugout.prototype.pair = async function(address, epub) {
  this.SEA = await SEA.pair()
  return this.SEA
}

Bugout.prototype.exchange = async function(address, local, epub, cb){
  this.send(address, {[local]: {epub: epub}}) // this should be an rpc?
  this.once('message', (address, message) => {
    if(typeof message === 'object' && message[address]){
      this.peers[address].epub = message[address].epub
      cb(this.peers)
    }
  })
}

Bugout.prototype.transmit = async function(pair, address, message) {
  let enc = await SEA.encrypt(message, await SEA.secret(await this.peers[address].epub, pair))
  this.send(address, enc)
}

Bugout.prototype.receive = async function(pair, cb) {
  this.once('message', async (address, message) => {
    let dec = await SEA.decrypt(message, await SEA.secret(this.peers[address].epub, pair))
    cb(address, dec)
  })
}

async function Bugoff(identifier, opts) {
  let b = new Bugout(identifier)

  console.log('My address:', b.address())

  let pair = await b.pair()

  b.on('seen', async address => {
    
    await b.exchange(address, b.address(), pair.epub, async (cb) => {
      await b.transmit(pair, address, 'hi there')

      await b.receive(pair, (address, message) =>{
        console.log(message)
      })
    })
  
  })

  // all other bugout messages
  b.on('message', (address, message) => {
    //console.log(address, message)
  })

}

module.exports = Bugoff