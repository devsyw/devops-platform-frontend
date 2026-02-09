import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <Header />
      <main className="layout__content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
