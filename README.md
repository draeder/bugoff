# Bugoff
A Gun DB extension that ships *secure ephemeral messaging between Gun peers using Bugout, secured by Gun's SEA suite

# About
Gun peers typically communicate messages with each other by listening for graph change events. That means those messages generally must be stored somewhere on the graph before a peer receives a message about it. Bugoff glues together Gun and Bugout (which is a decentralized messaging library based on WebRTC/WebTorrent).

Bugoff creates an SEA encryption pair for every Bugout connection, encrypts each message with a shared secret, then decrypts the message once received by the recipient peer(s).

## Status*
Bugoff is in an experimental state. Some intended features and functionality are not working correctly yet and has not been audited:

- Ability to pass in and use Gun SEA pairs. This may work if you experiment with it, but it is not built in yet.
- Gun method chaining has not yet been tested, although this is a Gun chain extension.
- Implement/improve swarm-wide encryption. Although broadcast message encryption is present, it is based on an SEA pair all peers share.
- A bug exists with broadcast message decryption logging `Could not decrypt` to the console, despite decryption occurring successfully.

### Example
```js
const Gun = require('gun')
require('./index.js')

let gun = new Gun()

// opts is optional, for example, use your own WebTorrent tracker server:
// { announce: 'wss://yourtracker/' }
gun.bugoff('some room identifier', opts)

// Log your Bugoff/Bugout instance address
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

// Log the encrypted messages (may be useful for debugging)
gun.bugoff.on('message', (address, message) => {
  console.log('Encrypted:', message, 'From:', address)
})
```

# Contact
All feedback, critique, bug reports are welcome and expected. Please [submit an issue](https://github.com/draeder/bugoff/issues), or [chat with me about it](https://chat.gun.eco)