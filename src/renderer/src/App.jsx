import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Meetings from './pages/Meetings';
import MeetingForm from './pages/MeetingForm';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Meetings />} />
        <Route path='/meeting/:id' element={<MeetingForm />} />
      </Routes>
    </Router>
  );
}
