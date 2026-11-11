import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './grid.css';
import './style.css';

function App() {
  const [rooms, setRooms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [room, setRoom] = useState({ name: 'Moja učionica', rows: 4, cols: 8, seats: {} });
  const [draft, setDraft] = useState({ name: '', rows: 4, cols: 8 });
  const [selected, setSelected] = useState(null);
  const [seatName, setSeatName] = useState('');
  const [dragged, setDragged] = useState(null);
  const [message, setMessage] = useState('');
  const occupied = Object.keys(room.seats).filter(key => room.seats[key]?.trim()).length;

  async function refresh(preferredId) {
    const response = await fetch('/api/classrooms');
    if (!response.ok) throw new Error('Spremanje nije dostupno. Pokrenite i API poslužitelj.');
    const data = await response.json();
    setRooms(data);
    const next = data.find(item => item.id === preferredId) || data[0];
    if (next) { setActiveId(next.id); setRoom(next); }
    else { setActiveId(null); setRoom({ name: 'Moja učionica', rows: 4, cols: 8, seats: {} }); }
  }

  useEffect(() => { refresh().catch(error => setMessage(error.message)); }, []);

  async function request(path, method, body) {
    const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    if (!response.ok) throw new Error((await response.json()).error || 'Dogodila se pogreška.');
    return response.json();
  }

  async function createRoom(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const rows = Number(draft.rows), cols = Number(draft.cols);
    if (!name || rows < 2 || rows > 20 || cols < 2 || cols > 20) return;
    try {
      const data = await request('/api/classrooms', 'POST', { name, rows, cols, seats: {} });
      const created = data.find(item => item.name === name && item.rows === rows && item.cols === cols);
      await refresh(created?.id);
      setDraft({ ...draft, name: '' }); setSelected(null); setMessage('Učionica je kreirana.');
    } catch (error) { setMessage(error.message); }
  }

  function choose(id) {
    const next = rooms.find(item => item.id === Number(id));
    if (next) { setActiveId(next.id); setRoom(next); setSelected(null); setMessage(''); }
  }

  function changeSeat(index, value) {
    setRoom(current => {
      const seats = { ...current.seats };
      if (value.trim()) seats[index] = value;
      else delete seats[index];
      return { ...current, seats };
    });
  }

  function openSeat(index) {
    setSelected(index);
    setSeatName(room.seats[index] || '');
  }

  function confirmSeat(event) {
    event.preventDefault();
    changeSeat(selected, seatName.trim());
    setSelected(null);
  }

  function moveSeat(from, to) {
    if (from === null || from === to) return;
    setRoom(current => {
      const seats = { ...current.seats };
      const target = seats[to];
      if (seats[from]) seats[to] = seats[from]; else delete seats[to];
      if (target) seats[from] = target; else delete seats[from];
      return { ...current, seats };
    });
    setSelected(to); setDragged(null);
  }

  async function saveRoom() {
    if (!activeId) return setMessage('Najprije kreirajte učionicu.');
    try { await request(`/api/classrooms/${activeId}`, 'PUT', room); await refresh(activeId); setMessage('Raspored je spremljen.'); }
    catch (error) { setMessage(error.message); }
  }

  async function deleteRoom() {
    if (!activeId || !window.confirm(`Obrisati učionicu „${room.name}”?`)) return;
    try { await request(`/api/classrooms/${activeId}`, 'DELETE'); await refresh(); setSelected(null); setMessage('Učionica je obrisana.'); }
    catch (error) { setMessage(error.message); }
  }

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">▦</div><div><strong>Raspored sjedenja</strong><span>Učionica po tvojoj mjeri</span></div><div className="topbar-note">PLANER UČIONICE <span>●</span> LOKALNA POHRANA</div></header>
    <main className="workspace">
      <aside className="sidebar">
        <div className="sidebar-heading"><div className="eyebrow">TVOJ RADNI PROSTOR</div><h1>Uredi učionicu.</h1><p>Posloži stolice, upiši imena i spremi raspored koji ti odgovara.</p></div>
        <form className="create-card" onSubmit={createRoom}><div className="section-title"><span className="number">01</span><h2>Nova učionica</h2></div><label>Naziv učionice<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="npr. 3. B — matematika" maxLength="80" required /></label><div className="field-pair"><label>Redovi<input type="number" min="2" max="20" value={draft.rows} onChange={e => setDraft({ ...draft, rows: e.target.value })} required /></label><label>Stupci<input type="number" min="2" max="20" value={draft.cols} onChange={e => setDraft({ ...draft, cols: e.target.value })} required /></label></div><button className="primary-button" type="submit"><span>＋</span> Kreiraj učionicu</button></form>
        <div className="rooms-card"><div className="section-title"><span className="number">02</span><h2>Spremljene učionice</h2></div>{rooms.length ? <div className="room-list">{rooms.map(item => <button type="button" className={`room-option ${item.id === activeId ? 'active' : ''}`} onClick={() => choose(item.id)} key={item.id}><span className="room-icon">▦</span><span><strong>{item.name}</strong><small>{item.rows} × {item.cols} mjesta</small></span><span className="room-arrow">›</span></button>)}</div> : <p className="empty-rooms">Kreiraj prvu učionicu kako bi spremio raspored.</p>}</div>
        <div className="tip"><span>✦</span><p><strong>Mali savjet</strong><br/>Povuci popunjenu stolicu na drugo mjesto. Ako je odredište zauzeto, učenici će zamijeniti mjesta.</p></div>
      </aside>
      <section className="main-panel"><div className="panel-header"><div><div className="eyebrow">PREGLED UČIONICE <span className="eyebrow-line"/></div><h2>{room.name}</h2><p>Klikni stolicu za unos imena ili je povuci za promjenu mjesta.</p></div><div className="header-actions"><span className="dimension-badge">{room.rows} × {room.cols} GRID</span><button type="button" className="save-button" onClick={saveRoom}>Spremi raspored <span>↗</span></button></div></div>
        <div className="canvas-card"><div className="canvas-toolbar"><span><i className="live-dot"/> TLOCRT UČIONICE</span><span>{occupied} / {room.rows * room.cols} popunjenih mjesta</span></div><div className="classroom-scroll" style={{ '--columns': room.cols }}><div className="classroom-grid">{Array.from({ length: room.rows * room.cols }, (_, index) => <div className={`seat-position ${index % room.cols === 0 ? 'edge-left' : ''} ${index % room.cols === room.cols - 1 ? 'edge-right' : ''}`} key={index}><button type="button" draggable={Boolean(room.seats[index])} onDragStart={event => { setDragged(index); event.dataTransfer.effectAllowed = 'move'; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); moveSeat(dragged, index); }} onDragEnd={() => setDragged(null)} onClick={() => openSeat(index)} className={`seat ${room.seats[index] ? 'occupied' : ''} ${selected === index ? 'selected' : ''}`} title={room.seats[index] || `Mjesto ${index + 1}`}><span className="chair-back"/><span className="chair-body">{room.seats[index] || '+'}</span><span className="seat-label">{room.seats[index] || `Mjesto ${index + 1}`}</span></button>{selected === index && <form className="seat-editor" onSubmit={confirmSeat}><label htmlFor={`seat-${index}`}>Ime učenika · mjesto {index + 1}</label><input id={`seat-${index}`} autoFocus value={seatName} onChange={event => setSeatName(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setSelected(null); }} placeholder="Ime i prezime" maxLength="80"/><div className="seat-editor-actions"><button type="button" onClick={() => setSelected(null)}>Odustani</button><button type="button" className="delete-seat" onClick={() => { changeSeat(index, ''); setSelected(null); }}>Obriši</button><button type="submit">Potvrdi</button></div></form>}</div>)}</div><div className="teacher-position"><div className="seat teacher-seat"><div className="chair-back"/><div className="chair-body">★</div><div className="seat-label">PROFESOR</div></div></div></div><div className="canvas-footer"><span><i className="legend-dot occupied-legend"/> Učenik</span><span><i className="legend-dot empty-legend"/> Slobodno mjesto</span><span><i className="legend-dot teacher-legend"/> Profesor</span></div></div>
        <div className="room-actions"><span>Promjene se spremaju pritiskom na „Spremi raspored”.</span><button type="button" onClick={deleteRoom} disabled={!activeId}>Obriši učionicu</button></div>
        {message && <div className="message" role="status" onClick={() => setMessage('')}>{message} ×</div>}
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
