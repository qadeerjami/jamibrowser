const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 4000;
const fetch = require('node-fetch');
const { ProxyAgent } = require('proxy-agent');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const { Pool } = require('pg');

app.use(cors());
app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database('./proxies.db', (err) => {
  if (err) return console.error('DB open error:', err.message);
  console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS proxies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  tag TEXT,
  hostPort TEXT,
  ip TEXT,
  location TEXT,
  profiles INTEGER,
  binding TEXT,
  notes TEXT
)`);

// Get all proxies
app.get('/api/proxies', (req, res) => {
  db.all('SELECT * FROM proxies', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a proxy
app.post('/api/proxies', (req, res) => {
  const { type, tag, hostPort, ip, location, profiles, binding, notes } = req.body;
  db.run(
    'INSERT INTO proxies (type, tag, hostPort, ip, location, profiles, binding, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [type, tag, hostPort, ip, location, profiles, binding, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update a proxy
app.put('/api/proxies/:id', (req, res) => {
  const { type, tag, hostPort, ip, location, profiles, binding, notes } = req.body;
  db.run(
    'UPDATE proxies SET type=?, tag=?, hostPort=?, ip=?, location=?, profiles=?, binding=?, notes=? WHERE id=?',
    [type, tag, hostPort, ip, location, profiles, binding, notes, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// Delete a proxy
app.delete('/api/proxies/:id', (req, res) => {
  db.run('DELETE FROM proxies WHERE id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Batch delete used proxies (profiles > 0)
app.delete('/api/proxies', (req, res) => {
  db.run('DELETE FROM proxies WHERE profiles > 0', function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Test a proxy connection
app.post('/api/proxies/test', async (req, res) => {
  const { type, hostPort, account, password } = req.body;
  let proxyUrl = '';
  if (type && hostPort) {
    let auth = account && password ? `${encodeURIComponent(account)}:${encodeURIComponent(password)}@` : '';
    proxyUrl = `${type}://${auth}${hostPort}`;
  } else {
    return res.status(400).json({ success: false, error: 'Missing type or hostPort' });
  }
  try {
    let agent;
    if (type.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else if (type === 'http') {
      agent = new HttpProxyAgent(proxyUrl);
    } else if (type === 'https') {
      agent = new HttpsProxyAgent(proxyUrl);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported proxy type' });
    }
    const response = await axios.get('http://ip-api.com/json', { httpAgent: agent, httpsAgent: agent, timeout: 7000 });
    const data = response.data;
    if (data && data.query) {
      res.json({
        success: true,
        ip: data.query,
        country: data.country,
        state: data.regionName,
        city: data.city,
        data
      });
    } else {
      res.json({ success: false, error: 'No IP info returned', data });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- PROFILE TABLE SETUP ---
db.run(`CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT,
  url TEXT,
  name TEXT,
  groupName TEXT,
  username TEXT,
  password TEXT,
  twofa TEXT,
  cookie TEXT,
  notes TEXT
)`);

// --- PROFILE API ENDPOINTS ---
// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM profiles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a profile
app.post('/api/profiles', async (req, res) => {
  const profile = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO profiles 
        (platform, url, name, groupName, username, password, twofa, cookie, notes, proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword, fingerprintSeed, extensionPath)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        profile.platform, profile.url, profile.name, profile.groupName, profile.username, profile.password,
        profile.twofa, profile.cookie, profile.notes, profile.proxyType, profile.proxyHost, profile.proxyPort,
        profile.proxyUsername, profile.proxyPassword, profile.fingerprintSeed, profile.extensionPath
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a profile
app.put('/api/profiles/:id', async (req, res) => {
  const profile = req.body;
  try {
    const result = await pool.query(
      `UPDATE profiles SET 
        platform=$1, url=$2, name=$3, groupName=$4, username=$5, password=$6, twofa=$7, cookie=$8, notes=$9, 
        proxyType=$10, proxyHost=$11, proxyPort=$12, proxyUsername=$13, proxyPassword=$14, fingerprintSeed=$15, extensionPath=$16
       WHERE id=$17 RETURNING *`,
      [
        profile.platform, profile.url, profile.name, profile.groupName, profile.username, profile.password,
        profile.twofa, profile.cookie, profile.notes, profile.proxyType, profile.proxyHost, profile.proxyPort,
        profile.proxyUsername, profile.proxyPassword, profile.fingerprintSeed, profile.extensionPath, req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM profiles WHERE id=$1 RETURNING *', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 