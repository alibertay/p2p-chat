import React, { useState, useEffect, useRef } from 'react';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Bağlantı bekleniyor...');
  const [offerLink, setOfferLink] = useState('');

  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  useEffect(() => {
    // URL'den offer parametresini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const offer = urlParams.get('offer');

    if (offer) {
      // Eğer offer varsa, cevap veren tarafız
      handleReceivedOffer(offer);
    } else {
      // Eğer offer yoksa, teklif oluşturan tarafız
      createOffer();
    }
  }, []);

  const createOffer = async () => {
    peerConnection.current = new RTCPeerConnection();
    dataChannel.current = peerConnection.current.createDataChannel('chat');
    setupDataChannel();

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    // Offer'ı URL'ye kodla
    const offerString = btoa(JSON.stringify(offer));
    const fullLink = `${window.location.href}?offer=${offerString}`;
    setOfferLink(fullLink);
    setConnectionStatus('Bağlantı bekleniyor. Linki karşı tarafa gönderin.');
  };

  const handleReceivedOffer = async (offerString) => {
    peerConnection.current = new RTCPeerConnection();
    peerConnection.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      setupDataChannel();
    };

    const offer = JSON.parse(atob(offerString));
    await peerConnection.current.setRemoteDescription(offer);

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    // Answer'ı konsola yazdır (gerçek uygulamada bunu karşı tarafa göndermeniz gerekir)
    console.log('Answer:', btoa(JSON.stringify(answer)));
    setConnectionStatus('Cevap oluşturuldu. Konsoldaki cevabı karşı tarafa gönderin.');
  };

  const setupDataChannel = () => {
    dataChannel.current.onopen = () => setConnectionStatus('Bağlantı kuruldu!');
    dataChannel.current.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, { text: event.data, fromMe: false }]);
    };
  };

  const sendMessage = () => {
    if (inputMessage && dataChannel.current?.readyState === 'open') {
      dataChannel.current.send(inputMessage);
      setMessages((prevMessages) => [...prevMessages, { text: inputMessage, fromMe: true }]);
      setInputMessage('');
    }
  };

  return (
    <div>
      <h2>P2P Chat</h2>
      <div>{connectionStatus}</div>
      {offerLink && (
        <div>
          <p>Bu linki karşı tarafa gönderin:</p>
          <input type="text" value={offerLink} readOnly style={{width: '100%'}} />
        </div>
      )}
      <div style={{height: '300px', overflowY: 'scroll', border: '1px solid #ccc', margin: '10px 0'}}>
        {messages.map((msg, index) => (
          <div key={index} style={{textAlign: msg.fromMe ? 'right' : 'left'}}>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Mesajınızı yazın..."
      />
      <button onClick={sendMessage}>Gönder</button>
    </div>
  );
};

export default ChatComponent;