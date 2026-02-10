import React, { useState, useEffect } from 'react';
import { getAddons, getAddonVersions, addAddonVersion } from '../../api/addonApi';
import { manualSync, getSyncLogs } from '../../api/harborApi';
import { FiRefreshCw, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const VersionOverviewPage = () => {
  const [addons, setAddons] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(null);
  const [versionForm, setVersionForm] = useState({ version: '', helmChartVersion: '', isLatest: true });
  const [tab, setTab] = useState('versions');

  useEffect(() => {
    getAddons().then(res => setAddons(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'logs') {
      getSyncLogs({ size: 30 }).then(res => setSyncLogs(res.data?.content || [])).catch(() => {});
    }
  }, [tab]);

  const toggleVersions = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    try {
      const res = await getAddonVersions(id);
      setVersions(res.data || []);
      setExpandedId(id);
    } catch { toast.error('버전 로딩 실패'); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await manualSync();
      const r = res.data;
      toast.success(`동기화 완료: 성공 ${r.successCount}, 실패 ${r.failCount}, 신규 ${r.newVersionsFound}건`);
      getAddons().then(res => setAddons(res.data || [])).catch(() => {});
    } catch { toast.error('동기화 실패'); }
    finally { setSyncing(false); }
  };

  const handleAddVersion = async (addonId) => {
    try {
      await addAddonVersion(addonId, versionForm);
      toast.success('버전이 추가되었습니다.');
      setShowAddVersion(null);
      setVersionForm({ version: '', helmChartVersion: '', isLatest: true });
      const res = await getAddonVersions(addonId);
      setVersions(res.data || []);
    } catch (err) { toast.error(err.response?.data?.message || '추가 실패'); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div>
      <div className="page-header">
        <h1>버전 관리</h1>
        <button className="btn btn--primary" onClick={handleSync} disabled={syncing}>
          <FiRefreshCw className={syncing ? 'spin' : ''} /> {syncing ? '동기화 중...' : 'Harbor 수동 동기화'}
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button className={'btn btn--sm ' + (tab === 'versions' ? 'btn--primary' : 'btn--ghost')} onClick={() => setTab('versions')}>애드온 버전</button>
        <button className={'btn btn--sm ' + (tab === 'logs' ? 'btn--primary' : 'btn--ghost')} onClick={() => setTab('logs')}>동기화 이력</button>
      </div>

      {tab === 'versions' && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>애드온</th><th>카테고리</th><th>최신 버전</th><th>Helm Repo</th><th>이미지 수</th><th style={{ width: 80 }}>버전 추가</th></tr></thead>
            <tbody>
              {addons.map(a => {
                let imgCount = 0;
                try { imgCount = JSON.parse(a.upstreamImages || '[]').length; } catch {}
                return (
                  <React.Fragment key={a.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggleVersions(a.id)}>
                      <td><strong>{a.displayName}</strong></td>
                      <td><span className="status-badge">{a.category}</span></td>
                      <td style={{ fontFamily: 'monospace' }}>{a.latestVersion || '-'}</td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.helmRepoUrl || '-'}</td>
                      <td>{imgCount}</td>
                      <td>
                        <button className="btn btn--sm btn--ghost" onClick={e => { e.stopPropagation(); setShowAddVersion(showAddVersion === a.id ? null : a.id); }}>
                          <FiPlus size={14} />
                        </button>
                      </td>
                    </tr>
                    {showAddVersion === a.id && (
                      <tr><td colSpan={6} style={{ background: '#f0f9ff', padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 12 }}>버전 *</label>
                            <input value={versionForm.version} onChange={e => setVersionForm(f => ({ ...f, version: e.target.value }))} placeholder="26.0.7" style={{ width: 120 }} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: 12 }}>Helm Chart 버전</label>
                            <input value={versionForm.helmChartVersion} onChange={e => setVersionForm(f => ({ ...f, helmChartVersion: e.target.value }))} placeholder="1.0.0" style={{ width: 120 }} />
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <input type="checkbox" checked={versionForm.isLatest} onChange={e => setVersionForm(f => ({ ...f, isLatest: e.target.checked }))} /> Latest
                          </label>
                          <button className="btn btn--sm btn--primary" onClick={() => handleAddVersion(a.id)}>추가</button>
                          <button className="btn btn--sm btn--ghost" onClick={() => setShowAddVersion(null)}><FiX size={14} /></button>
                        </div>
                      </td></tr>
                    )}
                    {expandedId === a.id && (
                      <tr><td colSpan={6} style={{ background: '#f8f9fa', padding: '8px 24px' }}>
                        {versions.length === 0 ? <p style={{ color: '#808e9b', fontSize: 13 }}>등록된 버전 없음</p> : (
                          <table style={{ width: '100%', fontSize: 13 }}>
                            <thead><tr><th>버전</th><th>Helm Chart</th><th>Latest</th><th>동기화일</th><th>등록일</th></tr></thead>
                            <tbody>{versions.map(v => (
                              <tr key={v.id}>
                                <td style={{ fontFamily: 'monospace' }}>{v.version}</td>
                                <td>{v.helmChartVersion || '-'}</td>
                                <td>{v.isLatest ? '✅' : ''}</td>
                                <td>{formatDate(v.syncedAt)}</td>
                                <td>{formatDate(v.createdAt)}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        )}
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          {syncLogs.length === 0 ? <p style={{ textAlign: 'center', padding: 24, color: '#808e9b' }}>동기화 이력이 없습니다.</p> : (
            <table className="data-table">
              <thead><tr><th>애드온</th><th>유형</th><th>상태</th><th>신규 버전</th><th>에러</th><th>시작</th><th>완료</th></tr></thead>
              <tbody>{syncLogs.map(l => (
                <tr key={l.id}>
                  <td>{l.addonName}</td>
                  <td><span className="status-badge">{l.syncType}</span></td>
                  <td><span className={'status-badge status-badge--' + (l.status === 'SUCCESS' ? 'active' : l.status === 'FAILED' ? 'expired' : 'warning')}>{l.status}</span></td>
                  <td style={{ fontSize: 12 }}>{l.newVersionsFound || '-'}</td>
                  <td style={{ fontSize: 12, color: '#e74c3c', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.errorMessage || ''}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(l.startedAt)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(l.completedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
export default VersionOverviewPage;
