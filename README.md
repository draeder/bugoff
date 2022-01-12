# Bugoff
A [Gun DB](https://github.com/amark/gun) extension that ships secure* ephemeral messaging between Gun peers using [Bugout](https://github.com/chr15m/bugout), secured by Gun's SEA suite

## About
Gun peers typically communicate messages with each other by listening for graph change events. That means those messages generally must be stored somewhere on the graph before a peer receives a message about it. Bugoff glues together Gun and Bugout (which is a decentralized messaging library based on WebRTC/WebTorrent) to provide ephemeral messaging between peers that does not need to -- but may -- be stored in a Gun DB graph.

Bugoff creates an SEA encryption pair for every Bugout connection, encrypts each message with a shared secret, then decrypts each message once received by the recipient peer(s).

Bugoff peers connect to each other through [Bugout](https://github.com/chr15m/bugout), which is a WebTorrent extension that swarms peers together based on an infohash shared to the WebTorrent network. The infohash represents a torrent containing the room name. This is displayed as clear text in the torrent. However, Bugoff abstracts that name away with a SHA256 hash of the room/swarm name. This way only those who know the room name and/or its SHA256 hash can join it. A way to secure the swarm further could be to pass in a Gun user's public SEA key as the swarm identifier.

Bugoff follows the [Bugout API](https://github.com/chr15m/bugout/blob/master/docs/API.md), with the exception that every message is encrypted using the Gun SEA suite, and will be further expanded / tested with [Gun chaining methods](https://gun.eco/docs/Adding-Methods-to-the-Gun-Chain) in mind.

### *Status
Bugoff is in an experimental state. Some intended features and functionality are not working correctly yet and has not been audited:

#### TODO
- Bugoff should work in the browser with Browserify, but has not yet been tested.
- Ability to pass in and use Gun SEA pairs. This may work if you experiment with it, but it is not built in yet.
- Gun method chaining has not yet been tested, although this *is* a Gun chain extension. Your mileage may vary.
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

// Log your Bugoff room/swarm identifier. This can be passed back in for other peers to join
console.log(gun.bugoff.id)

// Log your Bugoff/Bugout peer instance address
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

### Contact
All feedback, critique, bug reports are welcome and expected. Please [submit an issue](https://github.com/draeder/bugoff/issues), or [chat with me about it](https://chat.gun.eco)

#### MIT licensed