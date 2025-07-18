import React, { useState, useRef } from 'react';
import StaticProxyTable from './StaticProxyTable';
import ProfileManager from './ProfileManager';
import ProfileList from './ProfileList';

const sidebarStructure = [
  {
    label: 'Browser Profile',
    icon: '🗂️',
    children: [
      { label: 'Profile List', icon: '📄' },
      { label: 'Profile Group', icon: '🗃️' },
      { label: 'Tag Management', icon: '🏷️' },
      { label: 'Profiles Recycle Bin', icon: '🗑️' },
      { label: 'Profile Transfer Record', icon: '🔄' },
      { label: 'API', icon: '🔌' },
    ],
  },
  {
    label: 'Proxy Resources',
    icon: '🌐',
    children: [
      { label: 'Static Proxy', icon: '📋' },
      { label: 'Residential Proxy', icon: '🎛️' },
    ],
  },
  { label: 'Extension Management', icon: '⚙️' },
  {
    label: 'Team Management',
    icon: '👥',
    children: [
      { label: 'Member Management', icon: '👤' },
      { label: 'Apply for approval', icon: '📝' },
      { label: 'Operation Log', icon: '📚' },
      { label: 'Join The Team', icon: '➕' },
    ],
  },
  { label: 'Order & Recharge', icon: '💳' },
  { label: 'Affiliate Rewards', icon: '🏆', red: true },
];

const sectionContent: Record<string, React.ReactNode> = {
  'Profile Group': <div style={{ color: '#fff', fontSize: 24 }}>Profile Group Section (Coming Soon)</div>,
  'Tag Management': <div style={{ color: '#fff', fontSize: 24 }}>Tag Management Section (Coming Soon)</div>,
  'Profiles Recycle Bin': <div style={{ color: '#fff', fontSize: 24 }}>Profiles Recycle Bin (Coming Soon)</div>,
  'Profile Transfer Record': <div style={{ color: '#fff', fontSize: 24 }}>Profile Transfer Record (Coming Soon)</div>,
  'API': <div style={{ color: '#fff', fontSize: 24 }}>API Section (Coming Soon)</div>,
  'Static Proxy': <StaticProxyTable />, // Show the actual table
  'Residential Proxy': <div style={{ color: '#fff', fontSize: 24 }}>Residential Proxy Section (Coming Soon)</div>,
  'Extension Management': <div style={{ color: '#fff', fontSize: 24 }}>Extension Management (Coming Soon)</div>,
  'Member Management': <div style={{ color: '#fff', fontSize: 24 }}>Member Management (Coming Soon)</div>,
  'Apply for approval': <div style={{ color: '#fff', fontSize: 24 }}>Apply for Approval (Coming Soon)</div>,
  'Operation Log': <div style={{ color: '#fff', fontSize: 24 }}>Operation Log (Coming Soon)</div>,
  'Join The Team': <div style={{ color: '#fff', fontSize: 24 }}>Join The Team (Coming Soon)</div>,
  'Order & Recharge': <div style={{ color: '#fff', fontSize: 24 }}>Order & Recharge (Coming Soon)</div>,
  'Affiliate Rewards': <div style={{ color: '#ff4d4f', fontSize: 24 }}>Affiliate Rewards (Coming Soon)</div>,
};

interface AppLayoutProps {
  children: React.ReactNode;
  profileManagerRef?: React.RefObject<any>;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, profileManagerRef }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({ 'Browser Profile': true });
  const [tabs, setTabs] = useState<string[]>(['Profile List']);
  const [active, setActive] = useState<string>('Profile List');
  const createProfileTab = '+ Create Profile';

  const handleGroupClick = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleItemClick = (label: string) => {
    setTabs((prev) => (prev.includes(label) ? prev : [...prev, label]));
    setActive(label);
  };

  const handleTabClick = (label: string) => {
    setActive(label);
  };

  const handleTabClose = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (label === 'Profile List') return;
    setTabs((prev) => prev.filter((tab) => tab !== label));
    setTimeout(() => {
      setActive((prevActive) => {
        if (prevActive === label) {
          const idx = tabs.indexOf(label);
          if (idx > 0) return tabs[idx - 1];
          return 'Profile List';
        }
        return prevActive;
      });
    }, 0);
  };

  // New: Create Profile button handler
  const handleCreateProfile = () => {
    setTabs((prev) => (prev.includes(createProfileTab) ? prev : [...prev, createProfileTab]));
    setActive(createProfileTab);
    setExpanded((prev) => ({ ...prev, 'Browser Profile': true }));
    setTimeout(() => {
      profileManagerRef?.current?.scrollToForm?.();
    }, 100);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#181c23', color: '#fff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#232733', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 'bold', fontSize: 26, letterSpacing: 1, marginBottom: 4 }}>
            <span style={{ verticalAlign: 'middle', marginRight: 8 }}>
              {/* Monochrome browser icon (emoji) */}
              <span style={{ fontSize: 32 }}>🖥️</span>
            </span>
            JamiBrowser
          </div>
          <div style={{ fontSize: 12, color: '#aaa' }}>v1.0.0</div>
        </div>
        {/* Browser Profile group with Create Profile button */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 32px', fontWeight: 'bold', background: expanded['Browser Profile'] ? '#232b3b' : 'transparent' }} onClick={() => handleGroupClick('Browser Profile')}>
            <span style={{ marginRight: 12 }}>🗂️</span>
            Browser Profile
            <span style={{ marginLeft: 'auto', fontSize: 14 }}>{expanded['Browser Profile'] ? '▼' : '▶'}</span>
          </div>
          {expanded['Browser Profile'] && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <button onClick={handleCreateProfile} style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>
                  + Create Profile
                </button>
              </div>
              <div style={{ marginLeft: 16 }}>
                {sidebarStructure[0].children?.map((child) => (
                  <div
                    key={child.label}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '10px 24px', cursor: 'pointer',
                      background: active === child.label ? '#2d3547' : 'transparent',
                      color: active === child.label ? '#fff' : '#ccc',
                      borderLeft: active === child.label ? '4px solid #4f8cff' : '4px solid transparent',
                    }}
                    onClick={() => handleItemClick(child.label)}
                  >
                    <span style={{ marginRight: 10 }}>{child.icon}</span>
                    {child.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Rest of sidebar groups */}
        {sidebarStructure.slice(1).map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 32px', cursor: 'pointer', fontWeight: 'bold',
                    background: expanded[item.label] ? '#232b3b' : 'transparent',
                  }}
                  onClick={() => handleGroupClick(item.label)}
                >
                  <span style={{ marginRight: 12 }}>{item.icon}</span>
                  {item.label}
                  <span style={{ marginLeft: 'auto', fontSize: 14 }}>{expanded[item.label] ? '▼' : '▶'}</span>
                </div>
                {expanded[item.label] && (
                  <div style={{ marginLeft: 16 }}>
                    {item.children.map((child) => (
                      <div
                        key={child.label}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '10px 24px', cursor: 'pointer',
                          background: active === child.label ? '#2d3547' : 'transparent',
                          color: active === child.label ? '#fff' : '#ccc',
                          borderLeft: active === child.label ? '4px solid #4f8cff' : '4px solid transparent',
                        }}
                        onClick={() => handleItemClick(child.label)}
                      >
                        <span style={{ marginRight: 10 }}>{child.icon}</span>
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 32px', cursor: 'pointer', fontWeight: item.red ? 'bold' : undefined,
                  color: item.red ? '#ff4d4f' : '#ccc',
                  borderLeft: item.red ? '4px solid #ff4d4f' : '4px solid transparent',
                  background: active === item.label ? '#2d3547' : 'transparent',
                }}
                onClick={() => handleItemClick(item.label)}
              >
                <span style={{ marginRight: 12 }}>{item.icon}</span>
                {item.label}
              </div>
            )}
          </div>
        ))}
      </aside>
      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#232733', borderBottom: '2px solid #232733', minHeight: 48 }}>
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: '12px 32px',
                cursor: 'pointer',
                background: active === tab ? '#232733' : 'transparent',
                color: active === tab ? '#4f8cff' : '#fff',
                fontWeight: active === tab ? 'bold' : undefined,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                border: active === tab ? '2px solid #4f8cff' : '2px solid transparent',
                borderBottom: active === tab ? 'none' : undefined,
                marginBottom: -2,
                position: 'relative',
              }}
            >
              {tab}
              {tab !== 'Profile List' && (
                <span
                  onClick={(e) => handleTabClose(tab, e)}
                  style={{ marginLeft: 12, color: '#aaa', cursor: 'pointer', fontWeight: 'normal', fontSize: 18 }}
                >
                  ×
                </span>
              )}
            </div>
          ))}
        </div>
        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#181c23' }}>
          {active === 'Profile List' && <ProfileList />}
          {active === createProfileTab && <ProfileManager ref={profileManagerRef} />}
          {/* ...existing sectionContent logic for other tabs... */}
          {active !== 'Profile List' && active !== createProfileTab && sectionContent[active]}
        </div>
      </div>
    </div>
  );
};

export default AppLayout; 