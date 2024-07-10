### How to use it?

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

### Development

Developing a torrent client involves 2 major steps but we'll break it down further. Before we do, those 2 major steps are _Getting peer data from the tracker_ and _Connection and message/data passing._

_**Initial Step**_

The first step in development of torrent client involves understanding and extracting the data from .torrent file. A raw torrent file is attached to this document. You can take a look at it. Ignore everything and only look at the top. There is a list of URLs of the trackers. In order to make sense of this data, we have to first parse it to proper format, i.e. Bencode. It is a data serialization format. 
After that, we can get the tracker information from the torrent file labeled as "announce".
Next thing to do is to send the connection request to the tracker. We'll be using UDP protocol as it has way less overhead compared to TCP. A series of steps has to be followed to get the required list of peers form the tracker.

**_[(Follow this documentation for UDP communication with tracker)](https://www.bittorrent.org/beps/bep_0015.html)_**

After this step we should have peers list with us.

**_Peer Connection_**

Now that we have the list of peers (ip & port) with us, we are cleared to proceed to next step. We'll use TCP connection for communication with peer. We will attempt to establish the connection with all the peers received, some might fail, some might not be interested, but we'll use the connected ones to maximum extent. The first step of message passing is to shake hands.
Unlike UDP, the messages of both ways are same in this protocol. Messages are identified using their 'id'.

**_[(Specs for the messages are provided here)](https://wiki.theory.org/BitTorrentSpecification#Handshake)_**

Now, what's the message sequence to get the data properly?

- After connection is established with peer, we immediately send the _handshake_ message.
- Then, if we receive the _handshake_ message from the peer, we send _interested_ message.

_It should be noted that our state is uninterested, and peer state is choked._

- We might receive the _bitfield_ and _have_ messages immediately after handshake.
- However, we can't yet request the pieces yet. (We are still choked). We can do nothing until we are _unchoked._
- As soon as we get _unchoked,_ we start requesting the _pieces._

Now, it is easier said than done. The main question that comes to existence is, how do we manage pieces?

**_Piece Handling_**

There are many methods to go around these questions like, which piece to request, how to manage them among multiple peers? etc.
The way it is handled here is that a queue of available piece indices is maintained for each peer, and a list of requested and received pieces is also maintained globally. When we are unchoked, we start requesting the pieces in the queue, if the piece is not yet requested or received. Every time we receive a piece, we request new piece from that peer and write the received block of data to a file.
One issue is that the piece length in new torrent protocol is 2^15, but peer may not be able to transfer that much data at once. So, we break a piece into 2 blocks of 2^14 bytes size and request them one by one.
