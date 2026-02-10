import React, { useState, useEffect, useRef } from 'react';
import { getAddons, getAddonVersions } from '../../api/addonApi';
import { getCustomers } from '../../api/customerApi';
import { getProjects } from '../../api/projectApi';
import { startBuild, getBuildStatus } from '../../api/packageApi';
import { FiPackage, FiDownload, FiCheck, FiLoader, FiWifi, FiWifiOff, FiLock } from 'react-icons/fi';
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
  const [deployEnv, setDeployEnv] = useState('INTERNET');
  const [registryUrl, setRegistryUrl] = useState('');

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

  // ======== TLS → Cert-Manager 자동 선택 ========
  useEffect(() => {
    if (tlsEnabled) {
      const certManager = addons.find(a => a.name === 'cert-manager');
      if (certManager && !selected[certManager.id]) {
        setSelected(prev => ({ ...prev, [certManager.id]: true }));
        if (!addonVersionsMap[certManager.id]) {
          getAddonVersions(certManager.id)
            .then(res => setAddonVersionsMap(prev => ({ ...prev, [certManager.id]: res.data || [] })))
            .catch(() => {});
        }
      }
    }
  }, [tlsEnabled, addons]);

  // ======== Keycloak SSO → Keycloak 자동 선택 ========
  useEffect(() => {
    if (keycloakEnabled) {
      const keycloak = addons.find(a => a.name === 'keycloak');
      if (keycloak && !selected[keycloak.id]) {
        setSelected(prev => ({ ...prev, [keycloak.id]: true }));
        if (!addonVersionsMap[keycloak.id]) {
          getAddonVersions(keycloak.id)
            .then(res => setAddonVersionsMap(prev => ({ ...prev, [keycloak.id]: res.data || [] })))
            .catch(() => {});
        }
      }
    }
  }, [keycloakEnabled, addons]);

  const isCertManager = (addon) => addon.name === 'cert-manager';
  const isKeycloak = (addon) => addon.name === 'keycloak';
  const isLocked = (addon) => (tlsEnabled && isCertManager(addon)) || (keycloakEnabled && isKeycloak(addon));

  const toggleAddon = async (id) => {
    const addon = addons.find(a => a.id === id);
    if (addon && isLocked(addon)) return;

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
      const next = {};
      addons.forEach(a => { if (isLocked(a)) next[a.id] = true; });
      setSelected(next);
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
    if (!domain.trim()) {
      toast.warn('도메인을 입력해주세요.');
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
        deployEnv,
        registryUrl: registryUrl.trim() || null,
        builtBy: 'web-user'
      });

      const hash = res.data.buildHash;
      const msg = deployEnv === 'AIRGAPPED'
        ? '폐쇄망 패키지 빌드 시작 (Chart + Image 포함, 시간이 소요됩니다)'
        : '빌드가 시작되었습니다.';
      toast.info(msg);

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

  const handleDownload = () => {
    if (!buildResult) return;
    const url = (process.env.REACT_APP_API_URL || '/api') + '/packages/download/' + buildResult.buildHash;
    const a = document.createElement('a');
    a.href = url;
    a.download = buildResult.buildHash + '.tar.gz';
    a.click();
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes > 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div>
      <div className="page-header">
        <h1>패키지 빌더</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {buildResult && (
            <button className="btn btn--secondary" onClick={handleDownload}>
              <FiDownload /> 다운로드 ({formatSize(buildResult.totalSize)})
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
                Hash: {buildResult.buildHash} | 크기: {formatSize(buildResult.totalSize)}
                {buildResult.deployEnv === 'AIRGAPPED' && ' | 📦 폐쇄망 패키지'}
              </span>
            </div>
            <button className="btn btn--primary btn--sm" onClick={handleDownload}><FiDownload /> 다운로드</button>
          </div>
        </div>
      )}

      {/* ======== 배포 환경 설정 ======== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>배포 환경</h3>

        {/* 배포 모드 선택 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { value: 'INTERNET', icon: <FiWifi />, label: '인터넷 환경', desc: 'Helm repo에서 chart 다운로드, 이미지 원격 pull' },
            { value: 'AIRGAPPED', icon: <FiWifiOff />, label: '폐쇄망 환경', desc: 'Chart(.tgz) + Image(.tar)를 패키지에 포함' }
          ].map(opt => (
            <div
              key={opt.value}
              onClick={() => setDeployEnv(opt.value)}
              style={{
                flex: 1, padding: '16px 20px', borderRadius: 8, cursor: 'pointer',
                border: deployEnv === opt.value ? '2px solid #0984e3' : '2px solid #dfe6e9',
                background: deployEnv === opt.value ? '#f0f8ff' : '#fff',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, color: deployEnv === opt.value ? '#0984e3' : '#636e72' }}>{opt.icon}</span>
                <strong style={{ color: deployEnv === opt.value ? '#0984e3' : '#2d3436' }}>{opt.label}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#636e72' }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        {/* 폐쇄망 레지스트리 설정 */}
        {deployEnv === 'AIRGAPPED' && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: '#fff3cd', border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: 13, color: '#856404', marginBottom: 8 }}>
              ⚠️ 폐쇄망 패키지는 Helm Chart(.tgz)와 컨테이너 이미지(.tar)를 포함합니다.
              빌드 서버에 <strong>docker</strong>와 <strong>helm</strong>이 설치되어 있어야 하며, 빌드 시간이 길고 파일 크기가 큽니다.
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13 }}>이미지 소스 레지스트리 (이미지를 pull할 주소)</label>
              <input
                value={registryUrl}
                onChange={e => setRegistryUrl(e.target.value)}
                placeholder="harbor.company.com (비워두면 Docker Hub에서 직접 pull)"
                style={{ fontSize: 13 }}
              />
              <div style={{ fontSize: 11, color: '#808e9b', marginTop: 4 }}>
                사내 Harbor에 이미 미러링된 이미지가 있으면 해당 주소를 입력하세요
              </div>
            </div>
          </div>
        )}

        {/* 고객사/프로젝트 */}
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

        {/* Namespace, Domain, TLS, Keycloak */}
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
            <label>TLS (cert-manager)</label>
            <label className="checkbox-label">
              <input type="checkbox" checked={tlsEnabled} onChange={e => setTlsEnabled(e.target.checked)} />
              {tlsEnabled ? '✅ cert-manager TLS 적용' : 'TLS 미적용'}
            </label>
          </div>
          <div className="form-group">
            <label>Keycloak SSO</label>
            <label className="checkbox-label">
              <input type="checkbox" checked={keycloakEnabled} onChange={e => setKeycloakEnabled(e.target.checked)} />
              {keycloakEnabled ? '✅ OIDC 연동' : 'SSO 미적용'}
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
        {addons.map(addon => {
          const locked = isLocked(addon);
          return (
            <div
              key={addon.id}
              className={'addon-card' + (selected[addon.id] ? ' addon-card--selected' : '')}
              onClick={() => toggleAddon(addon.id)}
              style={locked ? { opacity: 0.85, cursor: 'default' } : {}}
            >
              <div className="addon-card__header">
                <img className="addon-card__icon" src={addon.iconUrl} alt="" onError={e => e.target.style.display='none'} />
                <div>
                  <div className="addon-card__name">
                    {addon.displayName}
                    {locked && <FiLock style={{ marginLeft: 4, fontSize: 12, color: '#0984e3' }} title="자동 선택됨 (해제 불가)" />}
                  </div>
                  <div className="addon-card__category">{addon.category}</div>
                </div>
              </div>
              <div className="addon-card__description">{addon.description}</div>
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
                {locked && <span className="status-badge status-badge--success" style={{ fontSize: 10 }}>자동</span>}
                <span style={{ fontSize: 11, color: '#808e9b' }}>순서: {addon.installOrder}</span>
                <input type="checkbox" checked={!!selected[addon.id]} readOnly style={{ accentColor: '#0984e3' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PackageBuilderPage;