import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadMeetings, saveMeetings } from '../utils/storage';

export default function MeetingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = useState({ title: '', context: '' });

  // If editing, load existing data
  useEffect(() => {
    if (!isNew) {
      const meetings = loadMeetings();
      const meeting = meetings.find(m => m.id === id);
      if (meeting) {
        setForm({ title: meeting.title, context: meeting.context });
      }
    }
  }, [id, isNew]);

  // Save (create or update)
  const handleSave = () => {
    const meetings = loadMeetings();
    if (isNew) {
      const newMeeting = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      saveMeetings([...meetings, newMeeting]);
    } else {
      const updated = meetings.map(m =>
        m.id === id ? { ...m, ...form, updatedAt: new Date().toISOString() } : m
      );
      saveMeetings(updated);
    }
    navigate('/');
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>{isNew ? 'New Meeting' : 'Edit Meeting'}</h1>

      <div style={{ marginBottom: '12px' }}>
        <label>
          Title:<br />
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>
          Context:<br />
          <textarea
            rows="5"
            value={form.context}
            onChange={e => setForm({ ...form, context: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
          />
        </label>
      </div>

      <button onClick={handleSave} style={{ marginRight: '8px' }}>
        {isNew ? 'Create' : 'Save'}
      </button>
      <button onClick={() => navigate('/')}>Cancel</button>
    </div>
  );
}
