import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const db = new DatabaseSync(join(dirname(fileURLToPath(import.meta.url)), 'ucionice.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rows INTEGER NOT NULL,
  cols INTEGER NOT NULL,
  seats TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
};
const list = () => db.prepare('SELECT * FROM classrooms ORDER BY updated_at DESC, id DESC').all().map(row => ({ ...row, seats: JSON.parse(row.seats) }));
const valid = body => typeof body.name === 'string' && body.name.trim().length > 0 && body.name.length <= 80 && Number.isInteger(body.rows) && body.rows >= 2 && body.rows <= 20 && Number.isInteger(body.cols) && body.cols >= 2 && body.cols <= 20 && body.seats && typeof body.seats === 'object' && !Array.isArray(body.seats) && Object.entries(body.seats).every(([key, value]) => /^\d+$/.test(key) && Number(key) < body.rows * body.cols && typeof value === 'string' && value.length <= 80);

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && path === '/api/classrooms') return send(res, 200, list());
  const match = path.match(/^\/api\/classrooms\/(\d+)$/);
  if (!((req.method === 'POST' && path === '/api/classrooms') || (match && ['PUT', 'DELETE'].includes(req.method)))) return send(res, 404, { error: 'Nije pronađeno.' });
  if (req.method === 'DELETE') {
    db.prepare('DELETE FROM classrooms WHERE id = ?').run(Number(match[1]));
    return send(res, 200, list());
  }
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 100000) return send(res, 413, { error: 'Prevelik zahtjev.' });
    }
    const body = JSON.parse(raw);
    if (!valid(body)) return send(res, 400, { error: 'Provjerite naziv, dimenzije i imena.' });
    const values = [body.name.trim(), body.rows, body.cols, JSON.stringify(body.seats)];
    if (req.method === 'POST') db.prepare('INSERT INTO classrooms (name, rows, cols, seats) VALUES (?, ?, ?, ?)').run(...values);
    else db.prepare('UPDATE classrooms SET name = ?, rows = ?, cols = ?, seats = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(...values, Number(match[1]));
    send(res, 200, list());
  } catch { send(res, 400, { error: 'Neispravan zahtjev.' }); }
}).listen(3001, () => console.log('SQLite API: http://localhost:3001'));
