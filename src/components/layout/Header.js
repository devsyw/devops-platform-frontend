import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';

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

  return (
    <header className="header">
      <h2 className="header__title">{title}</h2>
      <div className="header__actions">
        <div className="header__notification">
          <FiBell />
          <span className="header__badge">3</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
