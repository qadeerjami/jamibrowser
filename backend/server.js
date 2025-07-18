const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;
const { Pool } = require('pg');

app.use(cors());
app.use(express.json());

// --- PROFILE TABLE SETUP ---
// REMOVE: const db = new sqlite3.Database('./proxies.db', (err) => {
// REMOVE: if (err) return console.error('DB open error:', err.message);
// REMOVE: console.log('Connected to SQLite database.');
// REMOVE: db.run(`CREATE TABLE IF NOT EXISTS proxies (
// REMOVE:   id INTEGER PRIMARY KEY AUTOINCREMENT,
// REMOVE:   type TEXT,
// REMOVE:   tag TEXT,
// REMOVE:   hostPort TEXT,
// REMOVE:   ip TEXT,
// REMOVE:   location TEXT,
// REMOVE:   profiles INTEGER,
// REMOVE:   binding TEXT,
// REMOVE:   notes TEXT
// REMOVE: )`);

// REMOVE: // Get all proxies
// REMOVE: app.get('/api/proxies', (req, res) => {
// REMOVE:   db.all('SELECT * FROM proxies', [], (err, rows) => {
// REMOVE:     if (err) return res.status(500).json({ error: err.message });
// REMOVE:     res.json(rows);
// REMOVE:   });
// REMOVE: });

// REMOVE: // Add a proxy
// REMOVE: app.post('/api/proxies', (req, res) => {
// REMOVE:   const { type, tag, hostPort, ip, location, profiles, binding, notes } = req.body;
// REMOVE:   db.run(
// REMOVE:     'INSERT INTO proxies (type, tag, hostPort, ip, location, profiles, binding, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
// REMOVE:     [type, tag, hostPort, ip, location, profiles, binding, notes],
// REMOVE:     function (err) {
// REMOVE:       if (err) return res.status(500).json({ error: err.message });
// REMOVE:       res.json({ id: this.lastID });
// REMOVE:     }
// REMOVE:   );
// REMOVE: });

// REMOVE: // Update a proxy
// REMOVE: app.put('/api/proxies/:id', (req, res) => {
// REMOVE:   const { type, tag, hostPort, ip, location, profiles, binding, notes } = req.body;
// REMOVE:   db.run(
// REMOVE:     'UPDATE proxies SET type=?, tag=?, hostPort=?, ip=?, location=?, profiles=?, binding=?, notes=? WHERE id=?',
// REMOVE:     [type, tag, hostPort, ip, location, profiles, binding, notes, req.params.id],
// REMOVE:     function (err) {
// REMOVE:       if (err) return res.status(500).json({ error: err.message });
// REMOVE:       res.json({ changes: this.changes });
// REMOVE:     }
// REMOVE:   );
// REMOVE: });

// REMOVE: // Delete a proxy
// REMOVE: app.delete('/api/proxies/:id', (req, res) => {
// REMOVE:   db.run('DELETE FROM proxies WHERE id=?', [req.params.id], function (err) {
// REMOVE:     if (err) return res.status(500).json({ error: err.message });
// REMOVE:     res.json({ changes: this.changes });
// REMOVE:   });
// REMOVE: });

// REMOVE: // Batch delete used proxies (profiles > 0)
// REMOVE: app.delete('/api/proxies', (req, res) => {
// REMOVE:   db.run('DELETE FROM proxies WHERE profiles > 0', function (err) {
// REMOVE:     if (err) return res.status(500).json({ error: err.message });
// REMOVE:     res.json({ changes: this.changes });
// REMOVE:   });
// REMOVE: });

// REMOVE: // Test a proxy connection
// REMOVE: app.post('/api/proxies/test', async (req, res) => {
// REMOVE:   const { type, hostPort, account, password } = req.body;
// REMOVE:   let proxyUrl = '';
// REMOVE:   if (type && hostPort) {
// REMOVE:     let auth = account && password ? `${encodeURIComponent(account)}:${encodeURIComponent(password)}@` : '';
// REMOVE:     proxyUrl = `${type}://${auth}${hostPort}`;
// REMOVE:   } else {
// REMOVE:     return res.status(400).json({ success: false, error: 'Missing type or hostPort' });
// REMOVE:   }
// REMOVE:   try {
// REMOVE:     let agent;
// REMOVE:     if (type.startsWith('socks')) {
// REMOVE:       agent = new SocksProxyAgent(proxyUrl);
// REMOVE:     } else if (type === 'http') {
// REMOVE:       agent = new HttpProxyAgent(proxyUrl);
// REMOVE:     } else if (type === 'https') {
// REMOVE:       agent = new HttpsProxyAgent(proxyUrl);
// REMOVE:     } else {
// REMOVE:       return res.status(400).json({ success: false, error: 'Unsupported proxy type' });
// REMOVE:     }
// REMOVE:     const response = await axios.get('http://ip-api.com/json', { httpAgent: agent, httpsAgent: agent, timeout: 7000 });
// REMOVE:     const data = response.data;
// REMOVE:     if (data && data.query) {
// REMOVE:       res.json({
// REMOVE:         success: true,
// REMOVE:         ip: data.query,
// REMOVE:         country: data.country,
// REMOVE:         state: data.regionName,
// REMOVE:         city: data.city,
// REMOVE:         data
// REMOVE:       });
// REMOVE:     } else {
// REMOVE:       res.json({ success: false, error: 'No IP info returned', data });
// REMOVE:     }
// REMOVE:   } catch (err) {
// REMOVE:     res.json({ success: false, error: err.message });
// REMOVE:   }
// REMOVE: });

// --- PROFILE TABLE SETUP ---
// REMOVE: const db = new sqlite3.Database('./proxies.db', (err) => {
// REMOVE:   if (err) return console.error('DB open error:', err.message);
// REMOVE:   console.log('Connected to SQLite database.');
// REMOVE: });

// REMOVE: db.run(`CREATE TABLE IF NOT EXISTS proxies (
// REMOVE:   id INTEGER PRIMARY KEY AUTOINCREMENT,
// REMOVE:   type TEXT,
// REMOVE:   tag TEXT,
// REMOVE:   hostPort TEXT,
// REMOVE:   ip TEXT,
// REMOVE:   location TEXT,
// REMOVE:   profiles INTEGER,
// REMOVE:   binding TEXT,
// REMOVE:   notes TEXT
// REMOVE: )`);

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