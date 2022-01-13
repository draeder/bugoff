const { SEA } = require('gun')
const Bugoff = require('./index')

;(async ()=>{
  let bugoff = new Bugoff('test 12342533434646', { announce: 'wss://tracker.peer.ooo' })

  // Return this Bugoff swarm/room identifier
  console.log('Bugoff swarm ID:', bugoff.identifier)

  console.log('My address:', bugoff.address)
  // You may pass in your own Gun SEA pair
  bugoff.SEA(await SEA.pair())
  
  // Or let Bugoff generate a new SEA pair for you (this happens automatically)
  await bugoff.SEA()

  // Return the current SEA pair
  console.log(await bugoff.sea)

  bugoff.on('seen', address => {
    console.log('Seen!', address)
    // Broadcast message
    bugoff.send('Broadcast message test')
    // Direct message
    bugoff.send(address, 'Direct message test')
  })

  // Decrypted messages
  bugoff.on('decrypted', (address, pubkeys, message) => {
    console.log('From address:', address)
    console.log('Sender pubkeys:', pubkeys)
    console.log('Message:', message)
  })

  // Encrypted messages. May be useful for debugging.
  bugoff.on('message', (address, data) => console.log('From:', address, 'Received message!', data))

})()