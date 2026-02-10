import React, { useState, useEffect, useRef } from 'react';
import { getAddons, getAddonVersions } from '../../api/addonApi';
import { getCustomers } from '../../api/customerApi';
import { getProjects } from '../../api/projectApi';
import { startBuild, getBuildStatus, downloadPackage } from '../../api/packageApi';

import { FiPackage, FiDownload, FiCheck, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PackageBuilderPage = () => {
  const [addons, setAddons] = useState([]);
  const [selected, setSelected] = useState({});
  const [addonVersionsMap, setAddonVersionsMap] = useState({});
  const [selectedVersions, setSelectedVersions] = useState({});
  const [tlsEnabled, setTlsEnabled] = useState(false);
  const [keycloakEnabled, setKeycloakEnabled] = useState(false);
  const [namespace, setNamespace] = useState('devops');
  const [domain, setDomain] = useState('');

  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');

  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    getAddons().then(res => setAddons(res.data || [])).catch(() => {});
    getCustomers({ size: 100 }).then(res => {
      const list = res.data?.content || res.data || [];
      setCustomers(list);
    }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (customerId) {
      getProjects(customerId).then(res => setProjects(res.data || [])).catch(() => {});
      setProjectId('');
    } else {
      setProjects([]);
    }
  }, [customerId]);

  const toggleAddon = async (id) => {
    const next = !selected[id];
    setSelected(prev => ({ ...prev, [id]: next }));
    if (next && !addonVersionsMap[id]) {
      try {
        const res = await getAddonVersions(id);
        setAddonVersionsMap(prev => ({ ...prev, [id]: res.data || [] }));
      } catch { /* ignore */ }
    }
  };

  const selectAll = () => {
    const allSelected = addons.every(a => selected[a.id]);
    if (allSelected) {
      setSelected({});
    } else {
      const next = {};
      addons.forEach(a => { next[a.id] = true; });
      setSelected(next);
      addons.forEach(async (a) => {
        if (!addonVersionsMap[a.id]) {
          try {
            const res = await getAddonVersions(a.id);
            setAddonVersionsMap(prev => ({ ...prev, [a.id]: res.data || [] }));
          } catch { /* ignore */ }
        }
      });
    }
  };

  const handleBuild = async () => {
    const selectedAddons = addons
      .filter(a => selected[a.id])
      .map(a => ({
        addonId: a.id,
        addonName: a.name,
        version: selectedVersions[a.id] || null,
        helmChartVersion: null
      }));

    if (selectedAddons.length === 0) {
      toast.warn('애드온을 1개 이상 선택해주세요.');
      return;
    }

    setBuilding(true);
    setBuildResult(null);
    setProgress(0);

    try {
      const res = await startBuild({
        customerId: customerId || null,
        projectId: projectId || null,
        addons: selectedAddons,
        namespace, domain, tlsEnabled, keycloakEnabled,
        builtBy: 'web-user'
      });

      const hash = res.data.buildHash;
      toast.info('빌드가 시작되었습니다.');

      pollRef.current = setInterval(async () => {
        try {
          const status = await getBuildStatus(hash);
          const build = status.data;
          setProgress(build.progress || 0);

          if (build.status === 'SUCCESS') {
            clearInterval(pollRef.current);
            setBuildResult(build);
            setBuilding(false);
            toast.success('빌드 완료! 다운로드 가능합니다.');
          } else if (build.status === 'FAILED') {
            clearInterval(pollRef.current);
            setBuilding(false);
            toast.error('빌드에 실패했습니다.');
          }
        } catch {
          clearInterval(pollRef.current);
          setBuilding(false);
        }
      }, 2000);
    } catch (err) {
      setBuilding(false);
      toast.error(err.response?.data?.message || '빌드 시작 실패');
    }
  };

  // 빌드 결과에서 hash 추출
  const hash = buildResult?.data?.buildHash || buildResult?.buildHash;

  const handleDownload = async () => {
      const hash = buildResult?.data?.buildHash || buildResult?.buildHash;
      if (!hash) {
          toast.error('빌드 해시가 없습니다.');
          return;
      }
      try {
          const blob = await downloadPackage(hash);
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

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <h1>패키지 빌더</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {buildResult && (
            <button className="btn btn--secondary" onClick={handleDownload}>
              <FiDownload /> 다운로드 ({(buildResult.totalSize / 1024).toFixed(0)} KB)
            </button>
          )}
          <button className="btn btn--primary" disabled={selectedCount === 0 || building} onClick={handleBuild}>
            {building ? <><FiLoader className="spin" /> 빌드 중 ({progress}%)</> : <><FiPackage /> 빌드 ({selectedCount}개)</>}
          </button>
        </div>
      </div>

      {/* 진행률 바 */}
      {building && (
        <div style={{ marginBottom: 16, background: '#e9ecef', borderRadius: 8, height: 8, overflow: 'hidden' }}>
          <div style={{ width: progress + '%', height: '100%', background: '#0984e3', transition: 'width 0.5s' }} />
        </div>
      )}

      {/* 빌드 완료 배너 */}
      {buildResult && (
        <div className="card" style={{ marginBottom: 16, background: '#d4edda', border: '1px solid #c3e6cb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <FiCheck color="#28a745" style={{ marginRight: 8 }} />
              <strong>빌드 완료</strong>
              <span style={{ marginLeft: 12, fontSize: 13, color: '#636e72' }}>
                Hash: {buildResult.buildHash} | 크기: {(buildResult.totalSize / 1024).toFixed(0)} KB
              </span>
            </div>
            <button className="btn btn--primary btn--sm" onClick={handleDownload}><FiDownload /> 다운로드</button>
          </div>
        </div>
      )}

      {/* 고객사/프로젝트 + 배포설정 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>배포 설정</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label>고객사</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">선택 안함</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.code ? '(' + c.code + ')' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>프로젝트</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!customerId}>
              <option value="">선택 안함</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Namespace</label>
            <input value={namespace} onChange={e => setNamespace(e.target.value)} placeholder="devops" />
          </div>
          <div className="form-group">
            <label>Domain</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />
          </div>
          <div className="form-group">
            <label>TLS</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input type="checkbox" checked={tlsEnabled} onChange={e => setTlsEnabled(e.target.checked)} />
              {tlsEnabled ? 'cert-manager TLS 적용' : 'TLS 미적용'}
            </label>
          </div>
          <div className="form-group">
            <label>Keycloak SSO</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input type="checkbox" checked={keycloakEnabled} onChange={e => setKeycloakEnabled(e.target.checked)} />
              {keycloakEnabled ? 'OIDC 연동' : 'SSO 미적용'}
            </label>
          </div>
        </div>
      </div>

      {/* 전체 선택 */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn--sm btn--ghost" onClick={selectAll}>
          {addons.every(a => selected[a.id]) ? '전체 해제' : '전체 선택'}
        </button>
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
            {/* 버전 선택 (선택 시 표시) */}
            {selected[addon.id] && addonVersionsMap[addon.id] && addonVersionsMap[addon.id].length > 0 && (
              <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                <select
                  style={{ width: '100%', fontSize: 12, padding: '4px 8px' }}
                  value={selectedVersions[addon.id] || ''}
                  onChange={e => setSelectedVersions(prev => ({ ...prev, [addon.id]: e.target.value }))}
                >
                  <option value="">최신 버전 (자동)</option>
                  {addonVersionsMap[addon.id].map(v => (
                    <option key={v.id} value={v.version}>
                      {v.version} {v.isLatest ? '(latest)' : ''} {v.helmChartVersion ? '- chart ' + v.helmChartVersion : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="addon-card__footer">
              {addon.keycloakEnabled && <span className="status-badge status-badge--info">SSO</span>}
              <span style={{ fontSize: 11, color: '#808e9b' }}>순서: {addon.installOrder}</span>
              <input type="checkbox" checked={!!selected[addon.id]} readOnly style={{ accentColor: '#0984e3' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PackageBuilderPage;
