import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [link, setLink] = useState(null); // Bağlantı linki için state
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const handleConnection = async () => {
    try {
      peerConnection.current = new RTCPeerConnection(configuration);
      console.log('Peer connection created');

      // ICE candidates' handling
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', JSON.stringify(event.candidate));
          // ICE adayını karşı tarafa iletmek için gerekli kod buraya eklenmeli
        }
      };

      // Data channel creation for messages
      dataChannel.current = peerConnection.current.createDataChannel('chat');
      console.log('Data channel created:', dataChannel.current);

      dataChannel.current.onmessage = (event) => {
        console.log('Message received from peer:', event.data);
        setChat((prevChat) => [...prevChat, { sender: 'Peer', message: event.data }]);
      };

      dataChannel.current.onopen = () => {
        console.log('Data channel is open');
      };

      dataChannel.current.onclose = () => {
        console.log('Data channel is closed');
      };

      // Offer oluştur ve yerel olarak ayarla
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Offer created:', JSON.stringify(offer));

      // Offer'ı linke ekle
      const encodedOffer = encodeURIComponent(JSON.stringify(offer));
      const link = `${window.location.origin}?offer=${encodedOffer}`;
      setLink(link);
      console.log('Link generated:', link);
    } catch (error) {
      console.error('Error in handleConnection:', error);
    }
  };

  const handleAnswer = async (offer) => {
    try {
      if (!peerConnection.current) {
        peerConnection.current = new RTCPeerConnection(configuration);
        console.log('Peer connection created in handleAnswer');
      }

      // ICE candidates' handling
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', JSON.stringify(event.candidate));
          // ICE adayını karşı tarafa iletmek için gerekli kod buraya eklenmeli
        }
      };

      peerConnection.current.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        console.log('Data channel received:', dataChannel.current);

        dataChannel.current.onmessage = (event) => {
          console.log('Message received from peer:', event.data);
          setChat((prevChat) => [...prevChat, { sender: 'Peer', message: event.data }]);
        };

        dataChannel.current.onopen = () => {
          console.log('Data channel is open');
        };

        dataChannel.current.onclose = () => {
          console.log('Data channel is closed');
        };
      };

      // Offer'ı setRemoteDescription olarak ayarla
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set with offer');

      // Answer oluştur ve yerel olarak ayarla
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('Answer created and local description set:', JSON.stringify(answer));

      setIsConnected(true);
    } catch (error) {
      console.error('Error in handleAnswer:', error);
    }
  };

  useEffect(() => {
    try {
      // URL'den offer parametresini al
      const params = new URLSearchParams(window.location.search);
      const offer = params.get('offer');
      if (offer) {
        const parsedOffer = JSON.parse(decodeURIComponent(offer));
        console.log('Offer received from URL:', parsedOffer);
        handleAnswer(parsedOffer);
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, []);

  const sendMessage = () => {
    try {
      if (dataChannel.current && dataChannel.current.readyState === 'open') {
        if (message) {
          dataChannel.current.send(message);
          console.log('Message sent:', message);
          setChat((prevChat) => [...prevChat, { sender: 'You', message }]);
          setMessage('');
        } else {
          console.log('No message to send');
        }
      } else {
        console.log('Data channel is not open or not ready');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
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
