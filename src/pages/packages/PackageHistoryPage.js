import React, { useState, useEffect } from 'react';
import { getBuilds, downloadPackage } from '../../api/packageApi';
import { getCustomers } from '../../api/customerApi';
import { FiDownload, FiFilter, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
  SUCCESS: { label: '완료', cls: 'active' },
  BUILDING: { label: '빌드 중', cls: 'warning' },
  FAILED: { label: '실패', cls: 'expired' },
};

const PackageHistoryPage = () => {
  const [builds, setBuilds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers({ size: 100 }).then(res => {
      setCustomers(res.data?.content || res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, size: 15 };
    if (filterCustomerId) params.customerId = filterCustomerId;
    getBuilds(params)
      .then(res => {
        const data = res.data;
        setBuilds(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      })
      .catch(() => toast.error('빌드 이력 로딩 실패'))
      .finally(() => setLoading(false));
  }, [page, filterCustomerId]);

  // const handleDownload = (hash) => {
  //   const url = (process.env.REACT_APP_API_URL || '/api') + '/packages/download/' + hash;
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = hash + '.tar.gz';
  //   a.click();
  // };

  const handleDownload = async (hash) => {
      try {
          const res = await downloadPackage(hash);
          const blob = new Blob([res], { type: 'application/gzip' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = hash + '.tar.gz';
          a.click();
          window.URL.revokeObjectURL(url);
      } catch (e) {
          toast.error('다운로드 실패');
      }
  };

  const parseAddons = (json) => {
    try { return JSON.parse(json).map(a => a.displayName || a.addonName || a.name).join(', '); }
    catch { return '-'; }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div>
      <div className="page-header"><h1><FiClock style={{ marginRight: 8 }} />빌드 이력</h1></div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <FiFilter />
        <select value={filterCustomerId} onChange={e => { setFilterCustomerId(e.target.value); setPage(0); }}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}>
          <option value="">전체 고객사</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <p style={{ textAlign: 'center', padding: 24 }}>로딩 중...</p> : builds.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#808e9b' }}>빌드 이력이 없습니다.</p>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>빌드 해시</th><th>고객사</th><th>프로젝트</th><th>애드온</th><th>설정</th><th>크기</th><th>상태</th><th>빌드일</th><th style={{ width: 70 }}></th>
            </tr></thead>
            <tbody>
              {builds.map(b => {
                const st = STATUS_LABELS[b.status] || { label: b.status, cls: '' };
                return (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.buildHash}</td>
                    <td>{b.customerName || '-'}</td>
                    <td>{b.projectName || '-'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{parseAddons(b.selectedAddons)}</td>
                    <td style={{ fontSize: 12 }}>
                      {b.namespace && <span className="status-badge">ns:{b.namespace}</span>}
                      {b.tlsEnabled && <span className="status-badge status-badge--info">TLS</span>}
                      {b.keycloakEnabled && <span className="status-badge status-badge--info">SSO</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{formatSize(b.totalSize)}</td>
                    <td><span className={'status-badge status-badge--' + st.cls}>{st.label}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDate(b.createdAt)}</td>
                    <td>{b.status === 'SUCCESS' && (
                      <button className="btn btn--sm btn--ghost" onClick={() => handleDownload(b.buildHash)} title="다운로드"><FiDownload size={14} /></button>
                    )}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn--sm btn--ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</button>
            <span style={{ lineHeight: '32px', fontSize: 13 }}>{page + 1} / {totalPages}</span>
            <button className="btn btn--sm btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음</button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PackageHistoryPage;
