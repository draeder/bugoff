const Gun = require('gun')
require('./index.js')

let gun = new Gun([{peers: 'https://relay.peer.ooo/gun'}])

gun.bugoff('some room identifier', { announce: 'wss://tracker.peer.ooo' })

console.log('My address:', gun.bugoff.address())

gun.bugoff.on('seen', (address) => {
  // Log the new peer's address
  console.log('Seen!', address)
  
  // Broadcast a message to all peers
  gun.bugoff.send('Broadcast test message')

  // Send a message directly to another peer
  gun.bugoff.send(address, 'SEA Direct test message')
})

// Log decrypted messages
gun.bugoff.on('decrypted', (address, message) => {
  console.log('Decrypted!', message, 'From:', address)
})

// Log only encrypted messages
gun.bugoff.on('message', (address, message) => {
  console.log('Encrypted:', message, 'From:', address)
})