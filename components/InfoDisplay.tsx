
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';

export default function InfoDisplay() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="info-display">
      <div className="time">{timeString}</div>
      <div className="date">{dateString}</div>
      <div className="weather">
        <span className="icon material-symbols-outlined">partly_cloudy_day</span>
        <span>72°F</span>
      </div>
    </div>
  );
}
