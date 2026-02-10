import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../../api/customerApi';
import { FiPlus } from 'react-icons/fi';

const CustomerListPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getCustomers({ page: 0, size: 50, includeInactive: includeInactive || undefined })
      .then(res => setCustomers(res.data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [includeInactive]);

  return (
    <div>
      <div className="page-header">
        <h1>고객사 관리</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="checkbox-label" style={{ fontSize: 13, color: '#636e72' }}>
            <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
            비활성 포함
          </label>
          <button className="btn btn--primary" onClick={() => navigate('/customers/new')}>
            <FiPlus /> 고객사 등록
          </button>
        </div>
      </div>
      <div className="card">
        {loading ? <p>로딩 중...</p> : customers.length === 0 ? (
          <p style={{color:'#808e9b', textAlign:'center', padding:40}}>등록된 고객사가 없습니다.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>고객사명</th><th>코드</th><th>환경</th><th>K8s 버전</th><th>담당자</th><th>상태</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} onClick={() => navigate('/customers/' + c.id)}
                    style={{ cursor: 'pointer', opacity: c.isActive ? 1 : 0.55 }}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.code || '-'}</td>
                  <td>{c.environment || '-'}</td>
                  <td>{c.k8sVersion || '-'}</td>
                  <td>{c.contactName || '-'}</td>
                  <td><span className={'status-badge status-badge--' + (c.isActive ? 'active' : 'expired')}>{c.isActive ? '활성' : '비활성'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default CustomerListPage;