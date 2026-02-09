import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import PackageBuilderPage from './pages/packages/PackageBuilderPage';
import PackageHistoryPage from './pages/packages/PackageHistoryPage';
import AddonListPage from './pages/addons/AddonListPage';
import CertificateListPage from './pages/certificates/CertificateListPage';
import VersionOverviewPage from './pages/versions/VersionOverviewPage';
import DemoLauncherPage from './pages/demo/DemoLauncherPage';

function App() {
  return (
    <Layout>
      <Routes>
        {/* 대시보드 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 고객사 관리 */}
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />

        {/* 패키지 빌더 */}
        <Route path="/packages" element={<PackageBuilderPage />} />
        <Route path="/packages/history" element={<PackageHistoryPage />} />

        {/* 애드온 관리 */}
        <Route path="/addons" element={<AddonListPage />} />

        {/* 인증서 관리 */}
        <Route path="/certificates" element={<CertificateListPage />} />

        {/* 버전 관리 */}
        <Route path="/versions" element={<VersionOverviewPage />} />

        {/* 컨테이너 데모환경 */}
        <Route path="/demo" element={<DemoLauncherPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
