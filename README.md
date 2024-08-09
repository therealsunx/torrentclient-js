## How to use it?

First off, clone the repo and install the dependencies.

```

git clone https://github.com/therealsunx/torrentclient-js

cd torrentclient-js

npm i

```

Then, simply run it.

```

node ./index.js __torrent_file__ __output_filename__

```

For enabling debug mode, add '-D' flag at last.

```

node ./index.js __torrent_file__ __output_filename__ -D

```

## Development

Developing a torrent client involves two major steps: getting peer data from the tracker and connection and message/data passing with peers.

### Initial Step

The first step in developing a torrent client involves understanding and extracting data from a \`.torrent\` file. Take a raw torrent file and open it in an editor. Focus on the top of the file, where there is a list of URLs of the trackers. To make sense of this data, it must be parsed into the proper format, Bencode, which is a data serialization format. After parsing, extract the tracker information labeled as "announce".

Next, send a connection request to the tracker using the UDP protocol, as it has less overhead compared to TCP. Follow a series of steps to get the required list of peers from the tracker.

### UDP tracker protocol 

All values are sent in network byte order (big endian). Do not expect packets to be exactly of a certain size. Future extensions could increase the size of packets. _[Specs here](https://www.bittorrent.org/beps/bep_0015.html)._

**Connect**

Before announcing or scraping, you have to obtain a connection ID.

1. Choose a random transaction ID.
2. Fill the connect request structure.
3. Send the packet.

connect request:

```

Offset  Size            Name            Value

0       64-bit integer  protocol_id     0x41727101980 // magic constant

8       32-bit integer  action          0 // connect

12      32-bit integer  transaction_id

```

4. Receive the packet.
5. Check whether the packet is at least 16 bytes.
6. Check whether the transaction ID is equal to the one you chose.
7. Check whether the action is connect.
8. Store the connection ID for future use.

connect response:

```

Offset  Size            Name            Value

0       32-bit integer  action          0 // connect

4       32-bit integer  transaction_id

8       64-bit integer  connection_id

16

```

**Announce**

9. Choose a random transaction ID.
10. Fill the announce request structure.
11. Send the packet.

IPv4 announce request:

```

Offset  Size    Name    Value

0       64-bit integer  connection_id

8       32-bit integer  action          1 // announce

12      32-bit integer  transaction_id

16      20-byte string  info_hash

36      20-byte string  peer_id

56      64-bit integer  downloaded

64      64-bit integer  left

72      64-bit integer  uploaded

80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped

84      32-bit integer  IP address      0 // default

88      32-bit integer  key

92      32-bit integer  num_want        -1 // default

96      16-bit integer  port

98

```

12. Receive the packet.
13. Check whether the packet is at least 20 bytes.
14. Check whether the transaction ID is equal to the one you chose.
15. Check whether the action is announce.
16. Do not announce again until interval seconds have passed or an event has occurred.

_Do note that most trackers will only honor the IP address field under limited circumstances._

IPv4 announce response:

```

Offset      Size            Name            Value

0           32-bit integer  action          1 // announce

4           32-bit integer  transaction_id

8           32-bit integer  interval

12          32-bit integer  leechers

16          32-bit integer  seeders

20 + 6 * n  32-bit integer  IP address

24 + 6 * n  16-bit integer  TCP port

20 + 6 * N

```

After this step we should have peers list with us.

**Peer Connection**

Now that we have the list of peers (ip & port) with us, we are cleared to proceed to next step. We'll use TCP connection for communication with peer. We will attempt to establish the connection with all the peers received, some might fail, some might not be interested, but we'll use the connected ones to maximum extent. The first step of message passing is to shake hands.

Unlike UDP, the messages of both ways are same in this protocol. Messages are identified using their 'id'. **_[(Specs here)](https://wiki.theory.org/BitTorrentSpecification#Handshake)_**

### **_Handshake_**

The handshake is a required message and must be the first message transmitted by the client. It is (49+len(pstr)) bytes long.

_**Format:** <pstrlen><pstr><reserved><info_hash><peer_id>_

- **pstrlen**: string length of <pstr>, as a single raw byte
- **pstr**: string identifier of the protocol
- **reserved**: eight (8) reserved bytes. All current implementations use all zeroes. Each bit in these bytes can be used to change the behavior of the protocol. _An email from Bram suggests that trailing bits should be used first, so that leading bits may be used to change the meaning of trailing bits._
- **info_hash**: 20-byte SHA1 hash of the info key in the metainfo file. This is the same info_hash that is transmitted in tracker requests.
- **peer_id**: 20-byte string used as a unique ID for the client.

**Messages**

All of the remaining messages in the protocol take the form of <length prefix><message ID><payload>. The length prefix is a four byte big-endian value. The message ID is a single decimal byte. The payload is message dependent.

#### **keep-alive**: _<len=0000>_

The **keep-alive** message is a message with zero bytes, specified with the length prefix set to zero. There is no message ID and no payload. Peers may close a connection if they receive no messages (**keep-alive** or any other message) for a certain period of time, so a keep-alive message must be sent to maintain the connection _alive_ if no command have been sent for a given amount of time. This amount of time is generally two minutes.

#### **choke**: _<len=0001><id=0>_

The **choke** message is fixed-length and has no payload.

#### **unchoke**: _<len=0001><id=1>_

The **unchoke** message is fixed-length and has no payload.

#### **interested**: _<len=0001><id=2>_

The **interested** message is fixed-length and has no payload.

#### **not interested**: _<len=0001><id=3>_

The **not interested** message is fixed-length and has no payload.

#### **have**: _<len=0005><id=4><piece index>_

The **have** message is fixed length. The payload is the zero-based index of a piece that has just been successfully downloaded and verified via the hash.

_A malicious peer might also choose to advertise having pieces that it knows the peer will never download. Due to this attempting to model peers using this information is a **bad idea**_.

#### **bitfield**: _<len=0001+X><id=5><bitfield>_

The **bitfield** message may only be sent immediately after the handshaking sequence is completed, and before any other messages are sent. It is optional, and need not be sent if a client has no pieces.

The **bitfield** message is variable length, where X is the length of the bitfield. The payload is a bitfield representing the pieces that have been successfully downloaded. The high bit in the first byte corresponds to piece index 0. Bits that are cleared indicated a missing piece, and set bits indicate a valid and available piece. Spare bits at the end are set to zero.

Some clients (Deluge for example) send **bitfield** with missing pieces even if it has all data. Then it sends rest of pieces as **have** messages. They are saying this helps against ISP filtering of BitTorrent protocol. It is called **lazy bitfield**.

_A bitfield of the wrong length is considered an error. Clients should drop the connection if they receive bitfields that are not of the correct size, or if the bitfield has any of the spare bits set._

#### **request**: _<len=0013><id=6><index><begin><length>_

The **request** message is fixed length, and is used to request a block. The payload contains the following information:

- **index**: integer specifying the zero-based piece index
- **begin**: integer specifying the zero-based byte offset within the piece
- **length**: integer specifying the requested length.

**Sequence**

The message sequence to get the data properly is as follows:

- After connection is established with peer, we immediately send the _handshake_ message.
- Then, if we receive the _handshake_ message from the peer, we send _interested_ message.

_It should be noted that our state is uninterested, and peer state is choked._

- We might receive the _bitfield_ and _have_ messages immediately after handshake.
- However, we can't yet request the pieces yet. (We are still choked). We can do nothing until we are _unchoked._
- As soon as we get _unchoked,_ we start requesting the _pieces._

Now, it is easier said than done. The main question that comes to existence is, how do we manage pieces?

**Piece Handling**

There are many methods to go around these questions like, which piece to request, how to manage them among multiple peers? etc.

The way it is handled here is that a queue of available piece indices is maintained for each peer, and a list of requested and received pieces is also maintained globally. When we are unchoked, we start requesting the pieces in the queue, if the piece is not yet requested or received. Every time we receive a piece, we request new piece from that peer and write the received block of data to a file.

One issue is that the piece length in new torrent protocol is 2^15, but peer may not be able to transfer that much data at once. So, we break a piece into 2 blocks of 2^14 bytes size and request them one by one.
