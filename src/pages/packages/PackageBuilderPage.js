import React, { useState, useEffect } from 'react';
import { getAddons } from '../../api/addonApi';

const PackageBuilderPage = () => {
  const [addons, setAddons] = useState([]);
  const [selected, setSelected] = useState({});
  const [tlsEnabled, setTlsEnabled] = useState(false);
  const [namespace, setNamespace] = useState('devops');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    getAddons().then(res => setAddons(res.data || [])).catch(() => {});
  }, []);

  const toggleAddon = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <h1>패키지 빌더</h1>
        <button className="btn btn--primary" disabled={selectedCount === 0}>
          패키지 빌드 ({selectedCount}개 선택)
        </button>
      </div>

      {/* 설정 영역 */}
      <div className="card" style={{marginBottom:16}}>
        <h3 style={{marginBottom:16}}>배포 설정</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          <div className="form-group">
            <label>Namespace</label>
            <input value={namespace} onChange={e => setNamespace(e.target.value)} placeholder="devops" />
          </div>
          <div className="form-group">
            <label>Domain</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />
          </div>
          <div className="form-group">
            <label>TLS 적용</label>
            <label className="toggle" style={{marginTop:4}}>
              <input type="checkbox" checked={tlsEnabled} onChange={e => setTlsEnabled(e.target.checked)} />
              <span className="toggle__slider"></span>
              <span>{tlsEnabled ? 'TLS 적용' : 'TLS 미적용'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* 애드온 카드 */}
      <div className="addon-grid">
        {addons.map(addon => (
          <div
            key={addon.id}
            className={'addon-card' + (selected[addon.id] ? ' addon-card--selected' : '')}
            onClick={() => toggleAddon(addon.id)}
          >
            <div className="addon-card__header">
              <img className="addon-card__icon" src={addon.iconUrl} alt="" onError={e => e.target.style.display='none'} />
              <div>
                <div className="addon-card__name">{addon.displayName}</div>
                <div className="addon-card__category">{addon.category}</div>
              </div>
            </div>
            <div className="addon-card__description">{addon.description}</div>
            <div className="addon-card__footer">
              {addon.keycloakEnabled && <span className="status-badge status-badge--info">SSO 연동</span>}
              <input type="checkbox" checked={!!selected[addon.id]} readOnly style={{accentColor:'#0984e3'}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PackageBuilderPage;
