import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiPackage, FiGrid, FiShield, FiGitBranch, FiPlay } from 'react-icons/fi';

const menuItems = [
  { section: '서비스 1: 패키지 표준화' },
  { path: '/dashboard', label: '대시보드', icon: FiHome },
  { path: '/customers', label: '고객사 관리', icon: FiUsers },
  { path: '/packages', label: '패키지 빌더', icon: FiPackage },
  { path: '/addons', label: '애드온 관리', icon: FiGrid },
  { path: '/certificates', label: '인증서 관리', icon: FiShield },
  { path: '/versions', label: '버전 관리', icon: FiGitBranch },
  { section: '서비스 2: 데모환경' },
  { path: '/demo', label: '컨테이너 데모', icon: FiPlay },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="sidebar">
      <div className="sidebar__logo">
        <span>DevOps</span> Platform
      </div>
      <ul className="sidebar__menu">
        {menuItems.map((item, idx) => {
          if (item.section) {
            return <li key={idx} className="sidebar__section">{item.section}</li>;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <li
              key={item.path}
              className={'sidebar__item' + (isActive ? ' sidebar__item--active' : '')}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              {item.label}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
