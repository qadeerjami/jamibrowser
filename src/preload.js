const { contextBridge, ipcRenderer } = require('electron');

// Get fingerprintSeed from process.argv
function getFingerprintSeed() {
  if (typeof process !== 'undefined' && process.argv) {
    const arg = process.argv.find(a => a.startsWith('--fingerprint-seed='));
    return arg ? arg.replace('--fingerprint-seed=', '') : 'default-seed';
  }
  return 'default-seed';
}
const fingerprintSeed = getFingerprintSeed();

// Deterministic random generator (mulberry32)
function mulberry32(seed) {
  let t = 0;
  for (let i = 0; i < seed.length; i++) t += seed.charCodeAt(i);
  return function() {
    var x = Math.sin(t++) * 10000;
    return x - Math.floor(x);
  }
}
const rand = mulberry32(fingerprintSeed);

// WebRTC block (basic)
try {
  Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
  Object.defineProperty(window, 'webkitRTCPeerConnection', { value: undefined });
} catch (e) {}

// --- Fingerprint Spoofing ---
// Canvas fingerprint spoofing
const getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, ...args) {
  const ctx = getContext.call(this, type, ...args);
  if (type === '2d' || type === 'webgl' || type === 'webgl2') {
    // toDataURL spoof
    const originalToDataURL = this.toDataURL;
    this.toDataURL = function(...args) {
      let data = originalToDataURL.apply(this, args);
      // Add deterministic noise to the data URL (for demo)
      return data.replace(/.{10}/, rand().toString(36).substring(2, 12));
    };
  }
  return ctx;
};

// WebGL spoofing (simple example)
if (window.WebGLRenderingContext) {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    // Spoof some parameters
    if (param === 37445) return 'Fake GPU ' + Math.floor(rand()*1000); // UNMASKED_VENDOR_WEBGL
    if (param === 37446) return 'Fake Renderer ' + Math.floor(rand()*1000); // UNMASKED_RENDERER_WEBGL
    return getParameter.call(this, param);
  };
}

// WebGL extensions & parameters spoofing
try {
  if (window.WebGLRenderingContext) {
    // Spoof getSupportedExtensions
    const originalGetSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      return [
        'OES_texture_float', 'OES_element_index_uint', 'OES_standard_derivatives',
        'OES_vertex_array_object', 'WEBGL_debug_renderer_info'
      ];
    };

    // Spoof getParameter for more params
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      // Spoof some common fingerprinted params
      if (param === 37445) return 'Fake GPU'; // UNMASKED_VENDOR_WEBGL
      if (param === 37446) return 'Fake Renderer'; // UNMASKED_RENDERER_WEBGL
      if (param === 7936) return 'WebGL Inc.'; // VENDOR
      if (param === 7937) return 'WebGL Renderer'; // RENDERER
      if (param === 3379) return 16384; // MAX_TEXTURE_SIZE
      if (param === 36349) return 4096; // MAX_RENDERBUFFER_SIZE
      return originalGetParameter.call(this, param);
    };
  }
} catch (e) {}

// Fonts spoofing (deterministic)
try {
  const fontList = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Georgia', 'Comic Sans MS', 'Impact'];
  // Deterministically shuffle fonts based on rand()
  const shuffledFonts = fontList.slice().sort(() => rand() - 0.5).slice(0, 4);
  document.__lookupGetter__ = document.__lookupGetter__ || function(){};
  Object.defineProperty(document, 'fonts', {
    get: () => ({
      forEach: (cb) => shuffledFonts.forEach(cb),
      entries: () => shuffledFonts.entries(),
      values: () => shuffledFonts.values(),
      size: shuffledFonts.length
    })
  });
} catch (e) {}

// Timezone spoofing (deterministic)
try {
  const tzList = ['Europe/London', 'America/New_York', 'Asia/Kolkata', 'Asia/Karachi', 'Europe/Berlin'];
  const tz = tzList[Math.floor(rand() * tzList.length)];
  Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
    value: function() { return { timeZone: tz }; }
  });
} catch (e) {}

// Language spoofing (deterministic)
try {
  const langList = ['en-GB', 'en-US', 'fr-FR', 'de-DE', 'ur-PK'];
  const lang = langList[Math.floor(rand() * langList.length)];
  Object.defineProperty(navigator, 'language', { get: () => lang });
  Object.defineProperty(navigator, 'languages', { get: () => [lang, lang.split('-')[0]] });
} catch (e) {}

// Platform spoofing (deterministic)
try {
  const platList = ['Win32', 'Linux x86_64', 'MacIntel', 'Android', 'iPhone'];
  const plat = platList[Math.floor(rand() * platList.length)];
  Object.defineProperty(navigator, 'platform', { get: () => plat });
} catch (e) {}

// hardwareConcurrency spoofing (deterministic)
try {
  const cpuList = [2, 4, 8, 16];
  const cpu = cpuList[Math.floor(rand() * cpuList.length)];
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cpu });
} catch (e) {}

// deviceMemory spoofing (deterministic)
try {
  const memList = [2, 4, 8, 16];
  const mem = memList[Math.floor(rand() * memList.length)];
  Object.defineProperty(navigator, 'deviceMemory', { get: () => mem });
} catch (e) {}

// Plugins spoofing (deterministic)
try {
  const pluginList = [
    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Fake Plugin', filename: 'fake-plugin', description: 'Fake plugin for anti-detect' }
  ];
  const plugins = pluginList.slice(0, Math.floor(rand() * pluginList.length) + 1);
  Object.defineProperty(navigator, 'plugins', { get: () => plugins });
} catch (e) {}

// AudioContext fingerprint spoofing
try {
  const originalGetChannelData = window.AudioBuffer.prototype.getChannelData;
  window.AudioBuffer.prototype.getChannelData = function() {
    const data = originalGetChannelData.apply(this, arguments);
    // Add small noise to audio buffer (spoofing)
    for (let i = 0; i < data.length; i += 100) {
      data[i] = data[i] + (Math.random() - 0.5) * 0.00001;
    }
    return data;
  };
} catch (e) {}

// ClientRects & getBoundingClientRect spoofing
try {
  const originalGetClientRects = Element.prototype.getClientRects;
  Element.prototype.getClientRects = function() {
    const rects = originalGetClientRects.apply(this, arguments);
    // Add small noise to each rect
    for (let i = 0; i < rects.length; i++) {
      rects[i].x += (Math.random() - 0.5) * 0.1;
      rects[i].y += (Math.random() - 0.5) * 0.1;
      rects[i].width += (Math.random() - 0.5) * 0.1;
      rects[i].height += (Math.random() - 0.5) * 0.1;
    }
    return rects;
  };

  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    const rect = originalGetBoundingClientRect.apply(this, arguments);
    // Add small noise to the rect
    return {
      ...rect,
      x: rect.x + (Math.random() - 0.5) * 0.1,
      y: rect.y + (Math.random() - 0.5) * 0.1,
      width: rect.width + (Math.random() - 0.5) * 0.1,
      height: rect.height + (Math.random() - 0.5) * 0.1,
      top: rect.top + (Math.random() - 0.5) * 0.1,
      left: rect.left + (Math.random() - 0.5) * 0.1,
      right: rect.right + (Math.random() - 0.5) * 0.1,
      bottom: rect.bottom + (Math.random() - 0.5) * 0.1,
      toJSON: () => rect.toJSON ? rect.toJSON() : rect
    };
  };
} catch (e) {}

// Media Devices spoofing
try {
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      // Fake list of devices (e.g., ek fake mic aur ek fake camera)
      return Promise.resolve([
        {
          kind: 'audioinput',
          label: 'Fake Microphone',
          deviceId: 'fake-mic-id',
          groupId: 'fake-group-id'
        },
        {
          kind: 'videoinput',
          label: 'Fake Camera',
          deviceId: 'fake-cam-id',
          groupId: 'fake-group-id'
        }
      ]);
    };
  }
} catch (e) {}

// Screen & Display spoofing (deterministic)
try {
  const widthList = [1280, 1366, 1440, 1600, 1920];
  const heightList = [720, 768, 900, 1080, 1200];
  const w = widthList[Math.floor(rand() * widthList.length)];
  const h = heightList[Math.floor(rand() * heightList.length)];
  Object.defineProperty(window, 'devicePixelRatio', { get: () => 1 + rand() * 1 });
  Object.defineProperty(screen, 'width', { get: () => w });
  Object.defineProperty(screen, 'height', { get: () => h });
  Object.defineProperty(screen, 'availWidth', { get: () => w });
  Object.defineProperty(screen, 'availHeight', { get: () => h });
  Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
  Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
} catch (e) {}

// Navigator properties spoofing
try {
  // Do Not Track
  Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });

  // Max Touch Points
  Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });

  // webdriver (anti-bot detection)
  Object.defineProperty(navigator, 'webdriver', { get: () => false });

  // Connection spoofing
  Object.defineProperty(navigator, 'connection', {
    get: () => ({
      downlink: 10,
      effectiveType: '4g',
      rtt: 50,
      saveData: false,
      type: 'wifi'
    })
  });

  // Battery spoofing
  Object.defineProperty(navigator, 'getBattery', {
    get: () => () => Promise.resolve({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1,
      onchargingchange: null,
      onchargingtimechange: null,
      ondischargingtimechange: null,
      onlevelchange: null
    })
  });
} catch (e) {}

// --- End Fingerprint Spoofing ---

contextBridge.exposeInMainWorld('electronAPI', {
  launchProfile: (profile) => ipcRenderer.send('launch-profile', profile),
});
