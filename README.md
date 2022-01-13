# Bugoff
A [Gun DB](https://github.com/amark/gun) extension that ships secure* ephemeral messaging between Gun peers using [Bugout](https://github.com/chr15m/bugout), secured by Gun's SEA suite

## About
Bugoff creates an SEA encryption pair for every Bugout connection, encrypts each message with a shared secret, then decrypts those messages received by the recipient peer(s). It supports and encrypts direct (peer-to-peer) and broadcast (one-to-many) messages.

Gun peers typically communicate messages with each other by listening for graph change events. That means those messages generally must be stored somewhere on the graph before a peer receives a message about it. Bugoff glues together Gun and Bugout (a decentralized messaging library based on WebRTC/WebTorrent) to provide ephemeral messaging between peers that does not need to -- but may -- be stored in a Gun DB graph.

Bugoff peers connect to each other through [Bugout](https://github.com/chr15m/bugout), which is a WebTorrent extension that swarms peers together based on an infohash shared to the WebTorrent network. The infohash represents a torrent containing the swarm name. Since this is clear text in the torrent, Bugoff abstracts that name away with a SHA256 hash. This way, only those who know the SHA256 hash can join the Bugoff swarm. A way to secure the swarm further could be to pass in a Gun user's public SEA key as the swarm identifier.

### Status
*Bugoff is in an experimental state. Some intended features and functionality may not yet work correctly. Please use with care!

### Example
```js
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
```

### API
Bugoff follows the [Bugout API](https://github.com/chr15m/bugout/blob/master/docs/API.md), with this primary exception:

1. Every message is encrypted using the Gun SEA suite, so the `bugoff.on()` and `bugoff.once()` methods require a new listener for decryption: `bugout.on('decrypted', (address, pubkeys, message))` & `bugout.once('decrypted', (address, pubkeys, message))`

Bugoff will be further expanded / tested for [Gun chaining methods](https://gun.eco/docs/Adding-Methods-to-the-Gun-Chain) in later versions.

#### Properties
##### `bugoff.identifier`
Returns the Bugoff swarm identifier, a SHA256 hash of the identifier that is passed in to create the swarm.

##### `bugoff.address`
Returns this instance's Bugoff address. This can be used by other peers to directly send messages to this instance.

###### Example
```js
console.log('Bugoff swarm ID:', bugoff.identifier)
console.log('My address:', bugoff.address)
```

#### Methods
##### `bugoff.SEA([pair])`
Generate or pass in a Gun SEA pair. If `pair` is not specified, Bugoff will generate and use its own pair for this instance.

This is an asychronous call and must be used with `await`.

##### `bugoff.sea`
Return the Gun SEA pair this instance is using.

This is an asychronous call and must be used with `await`.

#### Events
##### 'decrypted', (address, pubkeys, message)
Returns decrypted messages on the target Bugoff instance.

###### Example
```js
bugoff.on('decrypted', (address, pubkeys, message) => {
  console.log('From address:', address)
  console.log('Sender pubkeys:', pubkeys)
  console.log('Message:', message)
})
```

### TODO
- Test with browsers. Bugoff *should* work in the browser with Browserify.
- Extend to Gun as a Gun chain extension.

### Contact
All feedback, critique, bug reports are welcome and expected. Please [submit an issue](https://github.com/draeder/bugoff/issues), or [chat with me about it](https://chat.gun.eco)

#### MIT licensed