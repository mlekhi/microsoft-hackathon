import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadMeetings, saveMeetings } from '../utils/storage';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  // Load on mount
  useEffect(() => {
    setMeetings(loadMeetings());
  }, []);

  // Delete handler
  const deleteMeeting = (id) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    saveMeetings(updated);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Meetings</h1>
      <button 
        onClick={() => navigate('/meeting/new')} 
        style={{ marginBottom: '16px' }}
      >
        + Add New Meeting
      </button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {meetings.map(({ id, title, createdAt }) => (
          <li key={id} style={{ marginBottom: '12px' }}>
            <Link to={`/meeting/${id}`} style={{ marginRight: '8px' }}>
              <strong>{title}</strong>
            </Link>
            <small>({new Date(createdAt).toLocaleString()})</small>
            <button 
              onClick={() => deleteMeeting(id)} 
              style={{ marginLeft: '12px' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
