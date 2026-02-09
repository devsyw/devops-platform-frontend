import React, { useState, useEffect } from 'react';
import { getAddons } from '../../api/addonApi';
import { FiPlus } from 'react-icons/fi';

const AddonListPage = () => {
  const [addons, setAddons] = useState([]);
  useEffect(() => { getAddons().then(res => setAddons(res.data || [])).catch(() => {}); }, []);
  return (
    <div>
      <div className="page-header">
        <h1>애드온 관리</h1>
        <button className="btn btn--primary"><FiPlus /> 새 애드온 추가</button>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>이름</th><th>카테고리</th><th>Keycloak</th><th>설치순서</th><th>상태</th></tr></thead>
          <tbody>
            {addons.map(a => (
              <tr key={a.id}>
                <td><strong>{a.displayName}</strong></td>
                <td>{a.category}</td>
                <td>{a.keycloakEnabled ? '✅' : '—'}</td>
                <td>{a.installOrder}</td>
                <td><span className={'status-badge status-badge--' + (a.isActive ? 'active' : 'expired')}>{a.isActive ? '활성' : '비활성'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AddonListPage;
