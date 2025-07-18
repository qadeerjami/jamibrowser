import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Proxy type define karein
interface Proxy {
  id: number;
  type: string;
  tag: string;
  hostPort: string;
  ip: string;
  location: string;
  profiles: number;
  binding: string;
  notes: string;
}

const proxyTypes = ['socks5', 'http', 'https'];
const proxyDetectionOptions = ['Proxy Detection(Global Line)', 'Option 2', 'Option 3'];

const StaticProxyTable: React.FC = () => {
  // Yahan type specify karein
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    type: '',
    host: '',
    port: '',
    account: '',
    password: '',
    enableSystem: 'global',
    proxy: proxyDetectionOptions[0],
    notes: '',
  });
  const [batchOpen, setBatchOpen] = useState(false);
  const [testResult, setTestResult] = useState<null | { success: boolean; ip?: string; country?: string; error?: string }>();
  const [testing, setTesting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [editProxy, setEditProxy] = useState<null | Proxy>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch proxies from backend
  useEffect(() => {
    fetchProxies();
  }, []);

  // Fix: always reload proxies
  const fetchProxies = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/proxies');
      setProxies(res.data);
      setSelected([]);
    } catch (err) {
      console.error('Failed to fetch proxies', err);
    }
  };

  // Add new proxy
  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        type: addForm.type,
        tag: 'Own Proxy',
        hostPort: `${addForm.host}:${addForm.port}\nUsername:${addForm.account}`,
        ip: addForm.host,
        location: '',
        profiles: 0,
        binding: '',
        notes: addForm.notes,
      };
      await axios.post('http://localhost:4000/api/proxies', payload);
      setShowAdd(false);
      setAddForm({ type: '', host: '', port: '', account: '', password: '', enableSystem: 'global', proxy: proxyDetectionOptions[0], notes: '' });
      fetchProxies();
    } catch (err) {
      console.error('Failed to add proxy', err);
    }
  };

  // Delete proxy
  const handleDeleteProxy = async (id: string) => {
    try {
      await axios.delete(`http://localhost:4000/api/proxies/${id}`);
      fetchProxies();
    } catch (err) {
      console.error('Failed to delete proxy', err);
    }
  };

  // Batch delete used proxies
  const handleDeleteUsedProxies = async () => {
    try {
      await axios.delete('http://localhost:4000/api/proxies');
      fetchProxies();
      setBatchOpen(false);
    } catch (err) {
      console.error('Failed to batch delete proxies', err);
    }
  };

  // Multi-select logic
  const handleSelect = (id: number) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };
  const handleSelectAll = () => {
    if (selected.length === proxies.length) setSelected([]);
    else setSelected(proxies.map(p => p.id));
  };

  // Batch delete selected proxies
  const handleDeleteSelected = async () => {
    for (const id of selected) {
      await axios.delete(`http://localhost:4000/api/proxies/${id}`);
    }
    fetchProxies();
    setBatchOpen(false);
  };

  // Test proxy from add form
  const handleTestProxy = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        type: addForm.type,
        hostPort: `${addForm.host}:${addForm.port}`,
        account: addForm.account,
        password: addForm.password,
      };
      const res = await axios.post('http://localhost:4000/api/proxies/test', payload);
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  // Edit logic
  const openEditModal = (proxy: Proxy) => {
    setEditProxy(proxy);
    setEditForm({ ...proxy });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((f: any) => ({ ...f, [name]: value }));
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`http://localhost:4000/api/proxies/${editProxy!.id}`, editForm);
      setEditProxy(null);
      setEditForm(null);
      fetchProxies();
    } catch (err) {
      alert('Failed to update proxy');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div style={{ background: '#232733', padding: 24, borderRadius: 10, maxWidth: 1200, margin: '0 auto', color: '#fff', boxShadow: '0 2px 16px #0002', fontSize: 15 }}>
      {/* Top Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, position: 'relative' }}>
        <button style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>+ Purchased Proxy</button>
        <button onClick={() => setShowAdd(true)} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add</button>
        <button onClick={fetchProxies} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Refresh</button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setBatchOpen(o => !o)} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Batch Operations {selected.length > 0 ? `[${selected.length} selected]` : '[0 selected]'}</button>
          {batchOpen && (
            <div style={{ position: 'absolute', top: 40, left: 0, background: '#232733', border: '1px solid #4f8cff', borderRadius: 6, minWidth: 220, zIndex: 10, boxShadow: '0 2px 8px #0008' }}>
              <button onClick={handleDeleteSelected} disabled={selected.length === 0} style={{ width: '100%', background: 'transparent', color: selected.length === 0 ? '#888' : '#ff4d4f', border: 'none', padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', cursor: selected.length === 0 ? 'not-allowed' : 'pointer', borderBottom: '1px solid #333' }}>
                Delete Selected Proxies
              </button>
              <button onClick={handleDeleteUsedProxies} style={{ width: '100%', background: 'transparent', color: '#ff4d4f', border: 'none', padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                Delete All Used Proxies
              </button>
            </div>
          )}
        </div>
        <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Tag Management</button>
      </div>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232733' }}>
          <thead>
            <tr style={{ background: '#232733', color: '#aaa', fontWeight: 'bold', fontSize: 14 }}>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}><input type="checkbox" checked={selected.length === proxies.length && proxies.length > 0} onChange={handleSelectAll} /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>ID.</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Proxy Type /<br />Obtain Method</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Tag</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Proxy Host:Port</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>IP Address</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Profiles in Use</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Automatic Renewal/<br />Expiration Date</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Binding Profile</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Notes</th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>Operation</th>
            </tr>
          </thead>
          <tbody>
            {proxies.map((proxy, idx) => (
              <tr key={proxy.id} style={{ background: idx % 2 === 0 ? '#232b3b' : '#232733' }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}><input type="checkbox" checked={selected.includes(proxy.id)} onChange={() => handleSelect(proxy.id)} /></td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.id}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.type}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}><span style={{ background: '#222', color: '#4f8cff', borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>{proxy.tag}</span> <a href="#" style={{ color: '#4f8cff', marginLeft: 8, fontSize: 13 }}>Add Tag</a></td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333', whiteSpace: 'pre-line' }}>{proxy.hostPort}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.ip}<br /><span style={{ color: '#aaa', fontSize: 13 }}>{proxy.location}</span></td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.profiles}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>--</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.binding} <button style={{ background: 'transparent', color: '#ff4d4f', border: 'none', marginLeft: 8, cursor: 'pointer' }}>Unbind</button></td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{proxy.notes || '--'}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>
                  <button onClick={() => openEditModal(proxy)} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 4, width: 60 }}>Edit</button><br />
                  <button onClick={() => alert('View feature coming soon!')} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 4, width: 60 }}>View</button><br />
                  <button onClick={() => handleDeleteProxy(proxy.id.toString())} style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', width: 60 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination (dummy) */}
      <div style={{ marginTop: 16, color: '#aaa', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{proxies.length} in Total</span>
        <span>10/page</span>
        <span>1</span>
        <span>Go to <input type="number" min="1" max="1" defaultValue="1" style={{ width: 40, marginLeft: 4, background: '#181c23', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '2px 6px' }} /></span>
      </div>
      {/* Add Proxy Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#232733', borderRadius: 12, padding: 36, minWidth: 420, maxWidth: 480, boxShadow: '0 2px 24px #000a', color: '#fff', position: 'relative', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'transparent', color: '#aaa', border: 'none', fontSize: 26, cursor: 'pointer' }}>×</button>
            <h2 style={{ marginBottom: 28, color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: 0.5 }}>Add</h2>
            <form onSubmit={handleAddProxy}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> Proxy Type
                  <span title="Proxy protocol type" style={{ color: '#4f8cff', marginLeft: 6, cursor: 'pointer' }}>?</span>
                </label>
                <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }}>
                  <option value="">Please select a proxy</option>
                  {proxyTypes.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> Proxy Host
                  <span title="Proxy server address" style={{ color: '#4f8cff', marginLeft: 6, cursor: 'pointer' }}>?</span>
                </label>
                <input value={addForm.host} onChange={e => setAddForm(f => ({ ...f, host: e.target.value }))} placeholder="Please enter the host address (optional)" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> Proxy Port
                  <span title="Proxy server port" style={{ color: '#4f8cff', marginLeft: 6, cursor: 'pointer' }}>?</span>
                </label>
                <input value={addForm.port} onChange={e => setAddForm(f => ({ ...f, port: e.target.value }))} placeholder="Please enter a port (optional)" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Proxy Account</label>
                  <input value={addForm.account} onChange={e => setAddForm(f => ({ ...f, account: e.target.value }))} placeholder="Please enter username (optional)" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Proxy Password</label>
                  <input value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Please enter password (optional)" type="password" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Enable System</label>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 4 }}>
                  <label style={{ color: addForm.enableSystem === 'global' ? '#4f8cff' : '#fff', fontWeight: addForm.enableSystem === 'global' ? 'bold' : 'normal', cursor: 'pointer' }}>
                    <input type="radio" name="enableSystem" checked={addForm.enableSystem === 'global'} onChange={() => setAddForm(f => ({ ...f, enableSystem: 'global' }))} /> Follow global settings
                  </label>
                  <label style={{ color: addForm.enableSystem === 'enable' ? '#4f8cff' : '#fff', fontWeight: addForm.enableSystem === 'enable' ? 'bold' : 'normal', cursor: 'pointer' }}>
                    <input type="radio" name="enableSystem" checked={addForm.enableSystem === 'enable'} onChange={() => setAddForm(f => ({ ...f, enableSystem: 'enable' }))} /> Enable
                  </label>
                  <label style={{ color: addForm.enableSystem === 'disable' ? '#4f8cff' : '#fff', fontWeight: addForm.enableSystem === 'disable' ? 'bold' : 'normal', cursor: 'pointer' }}>
                    <input type="radio" name="enableSystem" checked={addForm.enableSystem === 'disable'} onChange={() => setAddForm(f => ({ ...f, enableSystem: 'disable' }))} /> Disable
                  </label>
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Proxy</label>
                <select value={addForm.proxy} onChange={e => setAddForm(f => ({ ...f, proxy: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }}>
                  {proxyDetectionOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', minHeight: 40, fontSize: 15 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
                <button type="button" onClick={handleTestProxy} style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 6, padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }} disabled={testing}>
                  {testing ? 'Testing...' : 'Test Proxy'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} style={{ background: '#232733', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '10px 36px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>Cancel</button>
                <button type="submit" style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 36px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>Confirm</button>
              </div>
              {testResult && (
                <div style={{ marginTop: 16, color: testResult.success ? '#4f8cff' : '#ff4d4f', fontWeight: 'bold' }}>
                  {testResult.success ? `Success! IP: ${testResult.ip} (${testResult.country})` : `Failed: ${testResult.error || 'Unknown error'}`}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      {/* Edit Proxy Modal */}
      {editProxy && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#232733', borderRadius: 12, padding: 36, minWidth: 420, maxWidth: 480, boxShadow: '0 2px 24px #000a', color: '#fff', position: 'relative', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
            <button onClick={() => setEditProxy(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'transparent', color: '#aaa', border: 'none', fontSize: 26, cursor: 'pointer' }}>×</button>
            <h2 style={{ marginBottom: 28, color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: 0.5 }}>Edit Proxy</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Proxy Type</label>
                <input name="type" value={editForm.type} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Tag</label>
                <input name="tag" value={editForm.tag} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Host:Port</label>
                <input name="hostPort" value={editForm.hostPort} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>IP</label>
                <input name="ip" value={editForm.ip} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Location</label>
                <input name="location" value={editForm.location} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Profiles</label>
                <input name="profiles" value={editForm.profiles} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Binding</label>
                <input name="binding" value={editForm.binding} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #333', background: '#181c23', color: '#fff', minHeight: 40, fontSize: 15 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
                <button type="button" onClick={() => setEditProxy(null)} style={{ background: '#232733', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '10px 36px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>Cancel</button>
                <button type="submit" disabled={editLoading} style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 36px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticProxyTable; 