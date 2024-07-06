# torrentclient-js

Developing a torrent client involves 2 major steps but we'll break it down further. Before we do, those 2 major steps are _Getting peer data from the tracker_ and _Connection and message/data passing._

## Initial Step

The first step in development of torrent client involves understanding and extracting the data from .torrent file. A raw torrent file is attached to this document. You can take a look at it. Ignore everything and only look at the top. There is a list of URLs of the trackers. In order to make sense of this data, we have to first parse it to proper format, i.e. Bencode. It is a data serialization format. 

After that, we can get the tracker information from the torrent file labeled as "announce".

Next thing to do is to send the connection request to the tracker. We'll be using UDP protocol as it has way less overhead compared to TCP. A series of steps has to be followed to get the required list of peers form the tracker.

**_[(Follow this documentation for UDP communication with tracker)](https://www.bittorrent.org/beps/bep_0015.html)_**

After this step we should have peers list with us.

## Peer Connection

Now that we have the list of peers (ip & port) with us, we are cleared to proceed to next step. We'll use TCP connection for communication with peer. We will attempt to establish the connection with all the peers received, some might fail, some might not be interested, but we'll use the connected ones to maximum extent. The first step of message passing is to shake hands. The link provided below provides the information on message-fields.

Unlike UDP, the messages of both ways are same in this protocol. Messages are identified using their 'id'.

**_[(Specs for the messages are provided here)](https://wiki.theory.org/BitTorrentSpecification#Handshake)_**
