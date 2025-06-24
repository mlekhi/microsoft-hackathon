export const STORAGE_KEY = 'salesly-meetings';

export function loadMeetings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveMeetings(meetings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}