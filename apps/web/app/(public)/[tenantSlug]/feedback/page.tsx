'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';

export default function FeedbackPage() {
  const [message, setMessage] = useState('');

  async function submit() {
    await api.post('/feedback', { message });
    alert('Feedback submitted');
  }

  return (
    <div>
      <h2>Feedback</h2>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={submit}>Submit</button>
    </div>
  );
}
