import React, { useRef } from 'react';
import ReactDOM from 'react-dom/client';
import ProfileManager from './ProfileManager';
import AppLayout from './AppLayout';

const profileManagerRef = React.createRef<any>();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <AppLayout profileManagerRef={profileManagerRef}>
    <ProfileManager ref={profileManagerRef} />
  </AppLayout>
); 