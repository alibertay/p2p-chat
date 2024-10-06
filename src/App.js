import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [link, setLink] = useState(null); // Bağlantı linki için state
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  const handleConnection = async () => {
    peerConnection.current = new RTCPeerConnection(configuration);

    // ICE candidates' handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', JSON.stringify(event.candidate));
      }
    };

    // Data channel creation for messages
    dataChannel.current = peerConnection.current.createDataChannel('chat');
    dataChannel.current.onmessage = (event) => {
      setChat((prevChat) => [...prevChat, { sender: 'Peer', message: event.data }]);
    };

    // Offer oluştur ve yerel olarak ayarla
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    console.log('Offer:', JSON.stringify(offer));

    // Offer'ı linke ekle
    const encodedOffer = encodeURIComponent(JSON.stringify(offer));
    const link = `${window.location.origin}?offer=${encodedOffer}`;
    setLink(link);
  };

  const handleAnswer = async (offer) => {
    if (!peerConnection.current) {
      peerConnection.current = new RTCPeerConnection(configuration);
    }

    // ICE candidates' handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', JSON.stringify(event.candidate));
      }
    };

    peerConnection.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      dataChannel.current.onmessage = (event) => {
        setChat((prevChat) => [...prevChat, { sender: 'Peer', message: event.data }]);
      };
    };

    // Offer'ı setRemoteDescription olarak ayarla
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

    // Answer oluştur ve yerel olarak ayarla
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    console.log('Answer:', JSON.stringify(answer));
    setIsConnected(true);
  };

  useEffect(() => {
    // URL'den offer parametresini al
    const params = new URLSearchParams(window.location.search);
    const offer = params.get('offer');
    if (offer) {
      const parsedOffer = JSON.parse(decodeURIComponent(offer));
      handleAnswer(parsedOffer);
    }
  }, []);

  const sendMessage = () => {
    if (dataChannel.current && message) {
      dataChannel.current.send(message);
      setChat((prevChat) => [...prevChat, { sender: 'You', message }]);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>P2P Chat</h2>
      <div>
        <button onClick={handleConnection}>Start Chat and Generate Link</button>
        {link && (
          <div>
            <p>Send this link to your peer:</p>
            <a href={link}>{link}</a>
          </div>
        )}
      </div>
      <div>
        <h3>Chat</h3>
        <div>
          {chat.map((entry, index) => (
            <div key={index}>
              <strong>{entry.sender}:</strong> {entry.message}
            </div>
          ))}
        </div>
        {isConnected && (
          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
