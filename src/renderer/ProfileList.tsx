import React, { useEffect, useState } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    electronAPI?: {
      launchProfile: (profile: any) => void;
    };
  }
}

interface Profile {
  id: number;
  platform: string;
  url: string;
  name: string;
  groupName: string;
  username?: string;
  password?: string;
  twofa?: string;
  cookie?: string;
  notes?: string;
  proxyType?: string;
  proxyHost?: string;
  proxyPort?: string;
  proxyUsername?: string;
  proxyPassword?: string;
}

const ProfileList: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<Profile | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = () => {
    axios.get('http://localhost:4000/api/profiles').then(res => setProfiles(res.data));
  };

  const handleEditClick = (profile: Profile) => {
    setEditProfile(profile);
    setEditForm({ ...profile });
    setShowEdit(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await axios.put(`http://localhost:4000/api/profiles/${editForm.id}`, editForm);
      setShowEdit(false);
      setEditProfile(null);
      setEditForm(null);
      fetchProfiles();
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/profiles/${id}`);
      fetchProfiles();
    } catch (err) {
      console.error('Failed to delete profile', err);
    }
  };

  const handleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selected.length === profiles.length) {
      setSelected([]);
    } else {
      setSelected(profiles.map(p => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('Are you sure you want to delete selected profiles?')) return;
    try {
      await Promise.all(selected.map(id => axios.delete(`http://localhost:4000/api/profiles/${id}`)));
      setSelected([]);
      fetchProfiles();
    } catch (err) {
      console.error('Failed to delete selected profiles', err);
    }
  };

  return (
    <div style={{ color: '#fff', padding: 24, background: '#181c23', borderRadius: 10, boxShadow: '0 2px 16px #0002', margin: '24px auto', maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Profile List</h2>
        <button style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>+ Create Profile</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={handleDeleteSelected} disabled={selected.length === 0} style={{ background: selected.length ? '#ff4d4f' : '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold', fontSize: 15, cursor: selected.length ? 'pointer' : 'not-allowed', marginRight: 16 }}>
          Delete Selected
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#232733', borderRadius: 8, overflow: 'hidden', fontSize: 15 }}>
        <thead>
          <tr style={{ background: '#232733', color: '#aaa', fontWeight: 'bold', fontSize: 14 }}>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>
              <input type="checkbox" checked={selected.length === profiles.length && profiles.length > 0} onChange={handleSelectAll} />
            </th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>No.</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Group</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Tag</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Profile Name</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Proxy Information</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Notes</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Time</th>
            <th style={{ padding: '12px 8px', borderBottom: '1px solid #333' }}>Operation</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 ? (
            <tr><td colSpan={8} style={{ color: '#aaa', textAlign: 'center', padding: 32 }}>No profiles found.</td></tr>
          ) : (
            profiles.map((profile, idx) => (
              <tr key={profile.id} style={{ background: idx % 2 === 0 ? '#232b3b' : '#232733' }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333', textAlign: 'center' }}>
                  <input type="checkbox" checked={selected.includes(profile.id)} onChange={() => handleSelect(profile.id)} />
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{profile.groupName || 'Default Group'}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}><span style={{ color: '#4f8cff', cursor: 'pointer' }}>Add Tag</span></td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333', fontWeight: 'bold' }}>{profile.name}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>
                  <span style={{ color: '#4f8cff', fontWeight: 'bold' }}>{profile.proxyType || '--'}</span><br />
                  <span style={{ color: '#aaa', fontSize: 13 }}>{profile.proxyHost ? `${profile.proxyHost}:${profile.proxyPort}` : '--'}</span>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{profile.notes || '--'}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>{new Date().toISOString().slice(0, 10)}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #333', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => window.electronAPI && window.electronAPI.launchProfile(profile)}
                    style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                  >Open</button>
                  <button onClick={() => handleEditClick(profile)} style={{ background: '#232733', color: '#aaa', border: '1px solid #444', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>⚙️</button>
                  <button style={{ background: '#232733', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>★</button>
                  <button onClick={() => handleDelete(profile.id)} style={{ background: '#232733', color: '#ff4d4f', border: 'none', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 16, color: '#aaa', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{profiles.length} in Total</span>
        <span>50/page</span>
        <span>1</span>
        <span>Go to <input type="number" min="1" max="1" defaultValue="1" style={{ width: 40, marginLeft: 4, background: '#181c23', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '2px 6px' }} /></span>
      </div>
      {/* Edit Modal */}
      {showEdit && editForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#232733', borderRadius: 10, padding: 32, minWidth: 400, maxWidth: 500, boxShadow: '0 2px 16px #0008', color: '#fff', position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', color: '#aaa', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
            <h2 style={{ marginBottom: 24, color: '#fff', fontSize: 22 }}>Edit Profile</h2>
            <form onSubmit={handleEditSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>Profile Name</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>Platform</label>
                <input name="platform" value={editForm.platform} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>URL</label>
                <input name="url" value={editForm.url} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>Group</label>
                <input name="groupName" value={editForm.groupName} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold' }}>Proxy Type</label>
                  <select name="proxyType" value={editForm.proxyType || ''} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>
                    <option value="">Select Type</option>
                    <option value="socks5">SOCKS5</option>
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: 'bold' }}>Proxy Host</label>
                  <input name="proxyHost" value={editForm.proxyHost || ''} onChange={handleEditChange} placeholder="Proxy Host" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold' }}>Proxy Port</label>
                  <input name="proxyPort" value={editForm.proxyPort || ''} onChange={handleEditChange} placeholder="Port" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold' }}>Proxy Username</label>
                  <input name="proxyUsername" value={editForm.proxyUsername || ''} onChange={handleEditChange} placeholder="Proxy Username" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold' }}>Proxy Password</label>
                  <input name="proxyPassword" value={editForm.proxyPassword || ''} onChange={handleEditChange} placeholder="Proxy Password" type="password" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>Notes</label>
                <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff', minHeight: 40 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button type="button" onClick={() => setShowEdit(false)} style={{ background: '#232733', color: '#fff', border: '1px solid #444', borderRadius: 4, padding: '8px 32px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 32px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileList; 