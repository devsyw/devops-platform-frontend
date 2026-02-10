import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getUnreadCount } from '../../api/notificationApi';

const pageTitles = {
  '/dashboard': '대시보드',
  '/customers': '고객사 관리',
  '/packages': '패키지 빌더',
  '/addons': '애드온 관리',
  '/certificates': '인증서 관리',
  '/versions': '버전 관리',
  '/demo': '컨테이너 데모환경',
};

const Header = () => {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1];
  const title = pageTitles[basePath] || 'DevOps Platform';
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getUnreadCount().then(res => setUnread(res.data || 0)).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(res => setUnread(res.data || 0)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <h2 className="header__title">{title}</h2>
      <div className="header__actions">
        <div className="header__notification">
          <FiBell />
          {unread > 0 && <span className="header__badge">{unread}</span>}
        </div>
      </div>
    </header>
  );
};

export default Header;
