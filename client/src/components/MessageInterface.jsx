import React, { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '../services/api';

export default function MessageInterface({ user, target, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const name = target.name || target.company_name || target.contact_name || 'Conversation';
  const image = target.profile_image || target.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  const targetId = target.user_id || target.contact_id || target.id;

  const loadMessages = async () => {
    try {
      const result = await api.getChatHistory(targetId);
      setMessages(result.messages || []);
    } catch (error) {
      console.error('Could not load conversation:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [targetId]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await api.sendMessage({ receiver_id: targetId, message: text.trim() });
      setText('');
      await loadMessages();
    } catch (error) {
      window.alert(error.message || 'Could not send message.');
    }
  };

  return (
    <section className="full-page-view message-full-page">
      <div className="detail-toolbar"><button type="button" className="icon-back-button" onClick={onBack} aria-label="Back" title="Back"><ArrowLeft size={20} /></button><span>Messages</span></div>
      <div className="message-full-shell">
        <header className="message-full-header"><img src={image} alt="" /><div><h1>{name}</h1><p>{target.role === 'brand' || target.contact_role === 'brand' ? 'Brand' : 'Creator'}</p></div></header>
        <div className="message-history">{loading ? <p className="message-empty">Loading conversation...</p> : messages.length === 0 ? <p className="message-empty">No messages yet. Start the conversation.</p> : messages.map((message) => { const mine = Number(message.sender_id) === Number(user.id); return <div className={mine ? 'message-bubble-row mine' : 'message-bubble-row'} key={message.id}><div className="message-bubble">{message.message}</div></div>; })}</div>
        <form className="message-composer" onSubmit={send}><input className="input-field" value={text} onChange={(event) => setText(event.target.value)} placeholder="Message..." aria-label="Message" /><button type="submit" className="btn-primary" aria-label="Send message" title="Send message"><Send size={17} /></button></form>
      </div>
    </section>
  );
}
