import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const platformOptions = [
  'Other Platform',
  'Facebook',
  'Google',
  'Amazon',
  'Twitter',
  'Instagram',
  'LinkedIn',
];

const groupOptions = [
  'Default Group',
  'Work',
  'Personal',
];

const tabList = [
  'Platform Account Configuration',
  'Proxy Configuration',
  'Fingerprint Configuration',
  'Preference Settings',
];

const deviceTypes = ['PC', 'Mobile'];
const osOptions = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];
const browserOptions = ['Chrome', 'Firefox', 'Edge', 'Safari', 'Opera'];
const browserVersions = Array.from({ length: 135 - 91 + 1 }, (_, i) => (135 - i).toString());
const kernelVersions = ['Automatic Matching', 'Kernel v1', 'Kernel v2'];
const screenResOptions = ['Follow Device Setting', 'Custom'];
const fontOptions = ['System Default', 'Custom'];
const proxyTypes = [ 'Noproxy', 'HTTP', 'HTTPS', 'SOCKS5' ]; // already defined
const cpuOptions = ['2', '4', '8'];
const memoryOptions = ['2', '4', '8', '16'];

type Profile = {
  id: string;
  platform: string;
  url: string;
  name: string;
  group: string;
  username?: string;
  password?: string;
  twofa?: string;
  cookie?: string;
  notes?: string;
  fingerprintSeed: string; // Add fingerprintSeed
  extensionPath?: string; // Add extensionPath
};

const PROFILE_STORAGE_KEY = 'jamibrowser_profiles';

function loadProfiles(): Profile[] {
  const data = localStorage.getItem(PROFILE_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

const ProfileManager = forwardRef((_props, ref) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState(tabList[0]);
  const [form, setForm] = useState({
    platform: platformOptions[0],
    url: '',
    name: '',
    group: groupOptions[0],
    username: '',
    password: '',
    twofa: '',
    cookie: '',
    notes: '',
    proxyType: '',
    proxyHost: '',
    proxyPort: '',
    proxyUsername: '',
    proxyPassword: '',
    fingerprintSeed: uuidv4(), // Add fingerprintSeed
    extensionPath: '', // Add extensionPath
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [proxyTab, setProxyTab] = useState({
    ipDetection: false,
    proxyMethod: 'Custom',
    proxyType: 'Noproxy',
  });
  const [fingerprintTab, setFingerprintTab] = useState<{ [key: string]: any }>({
    deviceType: 'PC',
    os: 'Windows',
    browser: 'Chrome',
    browserVersion: '',
    userAgent: 'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    kernel: 'Automatic Matching',
    language: true,
    timezone: true,
    location: 'Ask',
    geo: true,
    screenRes: 'Follow Device Setting',
    fonts: 'System Default',
    webrtc: 'Replace',
    canvas: 'Noise',
    webglImage: 'Noise',
    webglMeta: 'Noise',
    webgpu: 'Based on WebGL',
    audio: 'Noise',
    media: 'Noise',
    cpu: '4',
    memory: '8',
    clientRects: 'Noise',
    speech: 'Noise',
    deviceName: 'Noise',
    dnt: 'Default',
    portScan: 'Enable',
    cloudflare: 'Default',
  });

  useImperativeHandle(ref, () => ({
    scrollToForm: () => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = formRef.current?.querySelector('input[name="name"]') as HTMLInputElement | null;
      input?.focus();
    },
  }));

  // Fetch profiles from backend
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/profiles');
      setProfiles(res.data);
    } catch (err) {
      console.error('Failed to fetch profiles', err);
    }
  };

  // Update handleChange to trim value for url
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'url') {
      console.log('URL value:', value, 'Trimmed:', value.trim());
    }
    setForm({
      ...form,
      [name]: name === 'url' ? value.trim() : value,
    });
  };

  // Add profile via backend
  const addProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form state on submit:', form);
    if (!form.name.trim() || !form.url.trim()) {
      console.log('Validation failed');
      return;
    }
    try {
      const payload = {
        platform: form.platform,
        url: form.url.trim(),
        name: form.name.trim(),
        groupName: form.group,
        username: form.username.trim() || undefined,
        password: form.password.trim() || undefined,
        twofa: form.twofa.trim() || undefined,
        cookie: form.cookie.trim() || undefined,
        notes: form.notes.trim() || undefined,
        proxyType: form.proxyType || undefined,
        proxyHost: form.proxyHost || undefined,
        proxyPort: form.proxyPort || undefined,
        proxyUsername: form.proxyUsername || undefined,
        proxyPassword: form.proxyPassword || undefined,
        fingerprintSeed: form.fingerprintSeed, // Send fingerprintSeed
        extensionPath: form.extensionPath, // Send extensionPath
      };
      await axios.post('http://localhost:4000/api/profiles', payload);
      fetchProfiles();
      setForm({
        platform: platformOptions[0], url: '', name: '', group: groupOptions[0], username: '', password: '', twofa: '', cookie: '', notes: '', proxyType: '', proxyHost: '', proxyPort: '', proxyUsername: '', proxyPassword: '', fingerprintSeed: uuidv4(), extensionPath: ''
      });
    } catch (err) {
      console.error('Failed to add profile', err);
    }
  };

  // Only Platform Account Configuration tab is functional for now
  const renderTabContent = () => {
    if (activeTab === 'Platform Account Configuration') {
      return (
        <form ref={formRef} onSubmit={addProfile} style={{ background: '#232733', padding: 24, borderRadius: 10, maxWidth: 600, margin: '0 auto', color: '#fff', boxShadow: '0 2px 16px #0002' }}>
          <h2 style={{ marginBottom: 24, color: '#fff' }}>Create Profile</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>* Platform</label>
              <select name="platform" value={form.platform} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>
                {platformOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: 'bold' }}>* Specified Url</label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                onBlur={e => setForm({ ...form, url: e.target.value.trim() })}
                placeholder="Please enter platform domain"
                style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}
                required
              />
              {!form.url && <span style={{ color: '#ff4d4f', fontSize: 12 }}>Please fill in the platform URL</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: 'bold' }}>* Profile Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Please enter the nickname for the profile" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>* Select Group</label>
              <select name="group" value={form.group} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>
                {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label>Username</label>
              <input name="username" value={form.username} onChange={handleChange} placeholder="Set platform login username" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Password</label>
              <input name="password" value={form.password} onChange={handleChange} placeholder="Set platform login password" type="password" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>2FA Key</label>
              <input name="twofa" value={form.twofa} onChange={handleChange} placeholder="Please enter the 2FA key" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Cookie</label>
            <textarea name="cookie" value={form.cookie} onChange={handleChange} placeholder="(Optional) Please enter the cookies with JSON format" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff', minHeight: 40 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Please Enter Notes" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff', minHeight: 40 }} maxLength={400} />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#aaa' }}>{form.notes.length}/400</div>
          </div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Proxy Type</label>
              <select name="proxyType" value={form.proxyType} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>
                <option value="">Select Type</option>
                <option value="socks5">SOCKS5</option>
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: 'bold' }}>Proxy Host</label>
              <input name="proxyHost" value={form.proxyHost} onChange={handleChange} placeholder="Proxy Host" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Proxy Port</label>
              <input name="proxyPort" value={form.proxyPort} onChange={handleChange} placeholder="Port" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
          </div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Proxy Username</label>
              <input name="proxyUsername" value={form.proxyUsername} onChange={handleChange} placeholder="Proxy Username" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>Proxy Password</label>
              <input name="proxyPassword" value={form.proxyPassword} onChange={handleChange} placeholder="Proxy Password" type="password" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold' }}>Extension Path</label>
            <input name="extensionPath" value={form.extensionPath} onChange={handleChange} placeholder="Path to Chrome extension folder (optional)" style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }} />
          </div>
          <button type="submit" style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 32px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginTop: 8 }}>Create Profile</button>
        </form>
      );
    }
    if (activeTab === 'Proxy Configuration') {
      return (
        <div style={{ background: '#232733', padding: 32, borderRadius: 10, maxWidth: 700, margin: '0 auto', color: '#fff', boxShadow: '0 2px 16px #0002' }}>
          <h2 style={{ marginBottom: 24, color: '#fff' }}>Proxy Configuration</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>IP Detection</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={proxyTab.ipDetection}
                onChange={() => setProxyTab((prev) => ({ ...prev, ipDetection: !prev.ipDetection }))}
                style={{ width: 32, height: 20, accentColor: '#4f8cff', marginRight: 8 }}
              />
              <span style={{ color: '#aaa', fontSize: 14 }}>
                Currently using a static proxy, no need to perform IP detection every time
              </span>
            </label>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              Notes: Turning on IP detection will affect the startup speed of the profile. If it is not a dynamic proxy, it does not need to be opened
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Proxy Method</label>
            <label style={{ marginRight: 18 }}>
              <input type="radio" name="proxyMethod" checked={proxyTab.proxyMethod === 'Purchased Residential Proxy'} onChange={() => setProxyTab((prev) => ({ ...prev, proxyMethod: 'Purchased Residential Proxy' }))} /> Purchased Residential Proxy
            </label>
            <label style={{ marginRight: 18 }}>
              <input type="radio" name="proxyMethod" checked={proxyTab.proxyMethod === 'Purchased Static Proxy'} onChange={() => setProxyTab((prev) => ({ ...prev, proxyMethod: 'Purchased Static Proxy' }))} /> Purchased Static Proxy
            </label>
            <label style={{ marginRight: 18 }}>
              <input type="radio" name="proxyMethod" checked={proxyTab.proxyMethod === 'API Extraction'} onChange={() => setProxyTab((prev) => ({ ...prev, proxyMethod: 'API Extraction' }))} /> API Extraction
            </label>
            <label style={{ marginRight: 18 }}>
              <input type="radio" name="proxyMethod" checked={proxyTab.proxyMethod === 'Custom'} onChange={() => setProxyTab((prev) => ({ ...prev, proxyMethod: 'Custom' }))} /> <span style={{ color: '#4f8cff' }}>Custom</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <button style={{ background: 'transparent', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Proxy referencing an existing profile
            </button>
            <button style={{ background: 'transparent', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Randomly Selected
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', marginRight: 8 }}>Proxy Type</label>
              <select
                value={proxyTab.proxyType}
                onChange={e => setProxyTab((prev) => ({ ...prev, proxyType: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}
              >
                {proxyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <button style={{ background: 'transparent', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', minWidth: 160 }}>
              Network Detection
            </button>
          </div>
        </div>
      );
    }
    if (activeTab === 'Fingerprint Configuration') {
      return (
        <div style={{ background: '#232733', padding: 32, borderRadius: 10, maxWidth: 900, margin: '0 auto', color: '#fff', boxShadow: '0 2px 16px #0002', fontSize: 15 }}>
          <h2 style={{ marginBottom: 24, color: '#fff' }}>Fingerprint Configuration</h2>
          {/* User Agent Section */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold' }}>User Agent</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <select value={fingerprintTab.deviceType} onChange={e => setFingerprintTab(f => ({ ...f, deviceType: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{deviceTypes.map(opt => <option key={opt}>{opt}</option>)}</select>
                <select value={fingerprintTab.os} onChange={e => setFingerprintTab(f => ({ ...f, os: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{osOptions.map(opt => <option key={opt}>{opt}</option>)}</select>
                <select value={fingerprintTab.browser} onChange={e => setFingerprintTab(f => ({ ...f, browser: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{browserOptions.map(opt => <option key={opt}>{opt}</option>)}</select>
                <select value={fingerprintTab.browserVersion} onChange={e => setFingerprintTab(f => ({ ...f, browserVersion: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff', minWidth: 120 }}>
                  <option value="">Please Select</option>
                  {browserVersions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <textarea value={fingerprintTab.userAgent} onChange={e => setFingerprintTab(f => ({ ...f, userAgent: e.target.value }))} style={{ width: '100%', marginTop: 8, background: '#181c23', color: '#fff', borderRadius: 4, border: 'none', padding: 8, minHeight: 40 }} />
            </div>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', height: 40, marginTop: 24 }}>↻</button>
          </div>
          {/* Kernel Version */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 12 }}>Kernel Version</label>
            <select value={fingerprintTab.kernel} onChange={e => setFingerprintTab(f => ({ ...f, kernel: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{kernelVersions.map(opt => <option key={opt}>{opt}</option>)}</select>
            <span style={{ color: '#aaa', marginLeft: 12 }}>Open profiles using this kernel</span>
          </div>
          {/* Language, Timezone, Location, Geo */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 8 }}>
            <label>Language <input type="checkbox" checked={fingerprintTab.language} onChange={() => setFingerprintTab(f => ({ ...f, language: !f.language }))} style={{ marginLeft: 8 }} /></label>
            <label>Timezone <input type="checkbox" checked={fingerprintTab.timezone} onChange={() => setFingerprintTab(f => ({ ...f, timezone: !f.timezone }))} style={{ marginLeft: 8 }} /></label>
            <label>Location
              <select value={fingerprintTab.location} onChange={e => setFingerprintTab(f => ({ ...f, location: e.target.value }))} style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>
                <option>Ask</option><option>Allow</option><option>Block</option>
              </select>
            </label>
            <label>Geo <input type="checkbox" checked={fingerprintTab.geo} onChange={() => setFingerprintTab(f => ({ ...f, geo: !f.geo }))} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#4f8cff', fontSize: 13, marginBottom: 2 }}>Generate corresponding national language based on Real IP</div>
            <div style={{ color: '#4f8cff', fontSize: 13, marginBottom: 2 }}>Generate corresponding timezone based on Real IP</div>
            <div style={{ color: '#4f8cff', fontSize: 13, marginBottom: 2 }}>Generate corresponding geographical location based on Real IP</div>
          </div>
          {/* Screen Resolution, Fonts */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            <label>Screen Resolution
              <select value={fingerprintTab.screenRes} onChange={e => setFingerprintTab(f => ({ ...f, screenRes: e.target.value }))} style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{screenResOptions.map(opt => <option key={opt}>{opt}</option>)}</select>
            </label>
            <label>Fonts
              <select value={fingerprintTab.fonts} onChange={e => setFingerprintTab(f => ({ ...f, fonts: e.target.value }))} style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff' }}>{fontOptions.map(opt => <option key={opt}>{opt}</option>)}</select>
            </label>
          </div>
          {/* WebRTC, Canvas, WebGL, etc. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16 }}>
            {[
              { label: 'WebRTC', key: 'webrtc', options: ['Replace', 'Real', 'Block'], info: 'Replace the public IP with a proxy and cover the local IP. If you need to configure a VPN tunnel, please go to the software settings page to perform WebRTC extension settings' },
              { label: 'Canvas', key: 'canvas', options: ['Noise', 'Close'], info: 'Will set different Canvas for profiles in the same computer' },
              { label: 'WebGL Image', key: 'webglImage', options: ['Noise', 'Close'], info: 'Will set different WebGL for profiles in the same computer' },
              { label: 'WebGL Metadata', key: 'webglMeta', options: ['Noise', 'Custom', 'Close'], info: 'Each browser profile uses default Random WebGL Info' },
              { label: 'WebGPU', key: 'webgpu', options: ['Based on WebGL', 'Real', 'Block'] },
              { label: 'AudioContext', key: 'audio', options: ['Noise', 'Close'], info: 'Will set different Audio for profiles in the same computer' },
              { label: 'Media Device', key: 'media', options: ['Noise', 'Close'], info: 'Use a appropriate value to replace the real Media devices ID' },
              { label: 'CPU Parameters', key: 'cpu', options: cpuOptions },
              { label: 'Memory', key: 'memory', options: memoryOptions },
              { label: 'ClientRects', key: 'clientRects', options: ['Noise', 'Close'], info: 'Will generate different ClientRects for each profile on the same computer' },
              { label: 'SpeechVices', key: 'speech', options: ['Noise', 'Close'], info: 'Use a appropriate value to replace the real SpeechVoices' },
              { label: 'Device Name', key: 'deviceName', options: ['Noise', 'Custom', 'Close'], info: 'The real device name will be replaced by an appropriate value' },
              { label: 'Do Not Track', key: 'dnt', options: ['Default', 'Enable', 'Close'], info: 'Not set by default' },
              { label: 'Port Scan', key: 'portScan', options: ['Enable', 'Close'], info: 'Enable to prevent the website from detecting which ports of the local network you used' },
              { label: 'Cloudflare', key: 'cloudflare', options: ['Optimized', 'Default'], info: 'Fully retain the anti-detection function, but this may disrupt the 5-second verification challenge, potentially leaving visitors stuck on the verification page.' },
            ].map(item => (
              <div key={item.key} style={{ minWidth: 180, marginBottom: 8 }}>
                <label style={{ fontWeight: 'bold' }}>{item.label}</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 2 }}>
                  {item.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFingerprintTab(f => ({ ...f, [item.key]: opt }))}
                      style={{
                        background: fingerprintTab[item.key] === opt ? '#4f8cff' : 'transparent',
                        color: fingerprintTab[item.key] === opt ? '#fff' : '#4f8cff',
                        border: '1px solid #4f8cff',
                        borderRadius: 4,
                        padding: '4px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {item.info && <div style={{ color: '#aaa', fontSize: 12 }}>{item.info}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activeTab === 'Preference Settings') {
      return (
        <div style={{ background: '#232733', padding: 32, borderRadius: 10, maxWidth: 900, margin: '0 auto', color: '#fff', boxShadow: '0 2px 16px #0002', fontSize: 15 }}>
          <h2 style={{ marginBottom: 24, color: '#fff' }}>Preference Settings</h2>
          {/* Cloud Backup */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Cloud Backup</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#4f8cff', fontSize: 13 }}>Cookies are backed up every time when the profile is closed, suitable for team collaboration or switching between multiple devices</span>
          </div>
          {/* Sync IndexedDB */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Sync IndexedDB</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#aaa', fontSize: 13 }}>Synchronize IndexedDB data, some sites will use IndexedDB auxiliary cookies</span>
          </div>
          {/* Sync Local Storage */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Sync Local Storage</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#aaa', fontSize: 13 }}>Synchronize Local Storage data, some sites use Local Storage to store login information</span>
          </div>
          {/* Synchronize extension data */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Synchronize extension data</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#ff4d4f', fontSize: 13 }}>It is not recommended to turn this function on when using a digital wallet extension. It is recommended to save the extension data locally!</span>
          </div>
          {/* Multi-open Settings */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Multi-open Settings</label>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer', marginRight: 8 }}>Enable</button>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
            <span style={{ color: '#aaa', fontSize: 13, marginLeft: 8 }}>When disabled, multiple users are not allowed to open the profile at the same time</span>
          </div>
          {/* Tag Management */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Tag Management</label>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer', marginRight: 8 }}>Open the specific URL</button>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Open the tabs from the profile was last closed</button>
          </div>
          {/* Open Specified URL */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Open Specified URL</label>
            <textarea style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#181c23', color: '#fff', minHeight: 40 }} placeholder="Enter multiple URLs separated by newlines (Optional)" />
          </div>
          {/* Block Image, Block Audio, Disable Password Saving Box, Prohibit Restoring Pages Pop-up, Disable Pop-up Interception */}
          {[
            { label: 'Block Image', info: 'When disabled, the profile loads images normally' },
            { label: 'Block Audio', info: 'When disabled, the audio will play normally by default' },
            { label: 'Disable Password Saving Box', info: 'When closed, the password saving box will popup normally' },
            { label: 'Prohibit Restoring Pages Pop-up', info: 'After enabling, if the profile does not close normally, the notification box for restoring pages will not pop-up after reopening the profile' },
            { label: 'Disable Pop-up Interception', info: 'When enabled, the web pop-ups will not be intercepted under any circumstances' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', marginRight: 16 }}>{item.label}</label>
              <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer', marginRight: 8 }}>Enable</button>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
              <span style={{ color: '#aaa', fontSize: 13, marginLeft: 8 }}>{item.info}</span>
            </div>
          ))}
          {/* JavaScript Memory Restrictions */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>JavaScript Memory Restrictions</label>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer', marginRight: 8 }}>Default</button>
            <button style={{ background: '#232733', color: '#4f8cff', border: '1px solid #4f8cff', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Maximum</button>
            <span style={{ color: '#aaa', fontSize: 13, marginLeft: 8 }}>Keep the default restrictions and do not need to be modified in normal cases</span>
          </div>
          {/* Information Page */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Information Page</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#4f8cff', fontSize: 13 }}>Show the default information page</span>
          </div>
          {/* Show Password */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Show Password</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#aaa', fontSize: 13 }}>After closing, the set platform login password will not be displayed on the information page</span>
          </div>
          {/* Load Imported Bookmarks */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Load Imported Bookmarks</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#aaa', fontSize: 13 }}>When enabled, the profiles will automatically import the bookmark data in "Import Bookmarks"; The opened profile will replace the existing bookmarks and only display the imported bookmarks; for example, if the profile has existing bookmark A and you imported bookmark B, the opened profile will display only the bookmark B</span>
          </div>
          {/* Bookmarks Bar */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 'bold', marginRight: 16 }}>Bookmarks Bar</label>
            <input type="checkbox" style={{ marginRight: 8 }} />
            <span style={{ color: '#aaa', fontSize: 13 }}>When disabled, the profile will hide the bookmarks bar by default</span>
          </div>
        </div>
      );
    }
    // Other tabs show Coming Soon
    return <div style={{ color: '#fff', fontSize: 24, textAlign: 'center', marginTop: 40 }}>{activeTab} (Coming Soon)</div>;
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20, border: '1px solid #333', borderRadius: 8, background: '#181c23' }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #232733', marginBottom: 24 }}>
        {tabList.map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 32px',
              cursor: 'pointer',
              background: activeTab === tab ? '#232733' : 'transparent',
              color: activeTab === tab ? '#4f8cff' : '#fff',
              fontWeight: activeTab === tab ? 'bold' : undefined,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              border: activeTab === tab ? '2px solid #4f8cff' : '2px solid transparent',
              borderBottom: activeTab === tab ? 'none' : undefined,
              marginBottom: -2,
            }}
          >
            {tab}
          </div>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
});

export default ProfileManager; 