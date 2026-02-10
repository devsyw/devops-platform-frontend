import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getRecentBuilds, getExpiringCerts } from '../../api/dashboardApi';
import { FiUsers, FiShield, FiPackage, FiAlertTriangle, FiRefreshCw, FiDownload } from 'react-icons/fi';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [expiringCerts, setExpiringCerts] = useState([]);

  const fetchData = () => {
    getDashboardSummary().then(res => setSummary(res.data)).catch(() => {});
    getRecentBuilds().then(res => setRecentBuilds(res.data || [])).catch(() => {});
    getExpiringCerts(30).then(res => setExpiringCerts(res.data || [])).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const s = summary || {};
  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div>
      <div className="page-header">
        <h1>대시보드</h1>
        <button className="btn btn--ghost" onClick={fetchData}><FiRefreshCw /> 새로고침</button>
      </div>

      <div className="summary-grid">
        <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/customers')}>
          <div className="summary-card__icon" style={{ background: '#e3f2fd' }}><FiUsers color="#1976d2" /></div>
          <div><div className="summary-card__value">{s.customerCount || 0}</div><div className="summary-card__label">등록 고객사</div></div>
        </div>
        <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/certificates')}>
          <div className="summary-card__icon" style={{ background: '#fce4ec' }}><FiAlertTriangle color="#c62828" /></div>
          <div><div className="summary-card__value">{s.expiringCertCount || 0}</div><div className="summary-card__label">인증서 만료 임박 (30일)</div></div>
        </div>
        <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/addons')}>
          <div className="summary-card__icon" style={{ background: '#e8f5e9' }}><FiPackage color="#2e7d32" /></div>
          <div><div className="summary-card__value">{s.addonCount || 0}</div><div className="summary-card__label">관리 애드온</div></div>
        </div>
        <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/versions')}>
          <div className="summary-card__icon" style={{ background: '#fff3e0' }}><FiShield color="#e65100" /></div>
          <div><div className="summary-card__value">{s.newVersionCount || 0}</div><div className="summary-card__label">신규 버전 (7일)</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* 최근 빌드 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3>최근 빌드</h3>
            <button className="btn btn--sm btn--ghost" onClick={() => navigate('/packages/history')}>전체 보기</button>
          </div>
          {recentBuilds.length === 0 ? <p style={{ color: '#808e9b' }}>빌드 이력이 없습니다.</p> : (
            <table className="data-table">
              <thead><tr><th>해시</th><th>고객사</th><th>상태</th><th>크기</th><th>일시</th><th></th></tr></thead>
              <tbody>{recentBuilds.slice(0, 7).map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.buildHash}</td>
                  <td style={{ fontSize: 13 }}>{b.customerName || '-'}</td>
                  <td><span className={'status-badge status-badge--' + (b.status === 'SUCCESS' ? 'active' : b.status === 'FAILED' ? 'expired' : 'warning')}>
                    {b.status === 'SUCCESS' ? '완료' : b.status === 'FAILED' ? '실패' : '진행중'}</span></td>
                  <td style={{ fontSize: 12 }}>{b.totalSize ? (b.totalSize / 1024).toFixed(0) + ' KB' : '-'}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(b.createdAt)}</td>
                  <td>{b.status === 'SUCCESS' && <FiDownload size={13} style={{ cursor: 'pointer', color: '#0984e3' }}
                    onClick={() => { const a = document.createElement('a'); a.href = '/api/packages/download/' + b.buildHash; a.click(); }} />}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {/* 만료 임박 인증서 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3>만료 임박 인증서</h3>
            <button className="btn btn--sm btn--ghost" onClick={() => navigate('/certificates')}>전체 보기</button>
          </div>
          {expiringCerts.length === 0 ? <p style={{ color: '#808e9b' }}>만료 임박 인증서가 없습니다.</p> : (
            <div>{expiringCerts.slice(0, 5).map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 13 }}>{c.domain}</strong>
                  <div style={{ fontSize: 12, color: '#808e9b' }}>{c.customerName}</div>
                </div>
                <span className={'status-badge status-badge--' + (c.daysUntilExpiry <= 7 ? 'expired' : 'warning')}>
                  D-{c.daysUntilExpiry}
                </span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
