import React, { useState, useEffect, useCallback } from 'react';
import { getAddons, getAllAddons, createAddon, updateAddon, deleteAddon, activateAddon, getAddonVersions } from '../../api/addonApi';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'INFRA', label: '인프라' },
  { value: 'SECURITY', label: '보안' },
  { value: 'SOURCE', label: '소스관리' },
  { value: 'CI_CD', label: 'CI/CD' },
  { value: 'QUALITY', label: '품질관리' },
  { value: 'ARTIFACT', label: '아티팩트' },
  { value: 'MONITORING', label: '모니터링' },
  { value: 'NETWORK', label: '네트워크' },
];

const emptyForm = {
  name: '', displayName: '', category: 'INFRA', description: '',
  iconUrl: '', upstreamImages: '', helmRepoUrl: '', helmChartName: '',
  keycloakEnabled: false, keycloakClientTemplate: '', keycloakValuesTemplate: '',
  installOrder: 50, dependencies: '[]'
};

const AddonListPage = () => {
  const [addons, setAddons] = useState([]);
  const [filter, setFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState(null);
  const [versions, setVersions] = useState([]);

  const fetchAddons = useCallback(() => {
    const promise = showInactive ? getAllAddons() : getAddons(filter || undefined);
    promise.then(res => setAddons(res.data || [])).catch(() => toast.error('애드온 로딩 실패'));
  }, [filter, showInactive]);

  useEffect(() => { fetchAddons(); }, [fetchAddons]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (addon) => {
    setForm({
      name: addon.name, displayName: addon.displayName, category: addon.category,
      description: addon.description || '', iconUrl: addon.iconUrl || '',
      upstreamImages: addon.upstreamImages || '', helmRepoUrl: addon.helmRepoUrl || '',
      helmChartName: addon.helmChartName || '', keycloakEnabled: addon.keycloakEnabled || false,
      keycloakClientTemplate: addon.keycloakClientTemplate || '',
      keycloakValuesTemplate: addon.keycloakValuesTemplate || '',
      installOrder: addon.installOrder || 50, dependencies: addon.dependencies || '[]'
    });
    setEditingId(addon.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { name, ...updateData } = form;
        await updateAddon(editingId, updateData);
        toast.success('애드온이 수정되었습니다.');
      } else {
        await createAddon(form);
        toast.success('애드온이 등록되었습니다.');
      }
      setShowModal(false);
      fetchAddons();
    } catch (err) {
      toast.error(err.response?.data?.message || '저장 실패');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(name + ' 애드온을 비활성화하시겠습니까?')) return;
    try { await deleteAddon(id); toast.success('비활성화 완료'); fetchAddons(); }
    catch { toast.error('처리 실패'); }
  };

  const handleActivate = async (id) => {
    try { await activateAddon(id); toast.success('활성화 완료'); fetchAddons(); }
    catch { toast.error('처리 실패'); }
  };

  const toggleVersions = async (addonId) => {
    if (expandedId === addonId) { setExpandedId(null); return; }
    try {
      const res = await getAddonVersions(addonId);
      setVersions(res.data || []);
      setExpandedId(addonId);
    } catch { toast.error('버전 로딩 실패'); }
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <h1>애드온 관리</h1>
        <button className="btn btn--primary" onClick={openCreate}><FiPlus /> 새 애드온 추가</button>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c.value}
            className={'btn btn--sm ' + (filter === c.value ? 'btn--primary' : 'btn--ghost')}
            onClick={() => setFilter(c.value)}>{c.label}</button>
        ))}
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#808e9b' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          비활성 포함
        </label>
      </div>

      {/* 테이블 */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>이름</th>
              <th>카테고리</th>
              <th>Helm Chart</th>
              <th>최신버전</th>
              <th>SSO</th>
              <th>순서</th>
              <th>상태</th>
              <th style={{ width: 100 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {addons.map(a => (
              <React.Fragment key={a.id}>
                <tr style={{ opacity: a.isActive ? 1 : 0.5 }}>
                  <td style={{ cursor: 'pointer' }} onClick={() => toggleVersions(a.id)}>
                    {expandedId === a.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </td>
                  <td><strong>{a.displayName}</strong><br /><span style={{ fontSize: 12, color: '#808e9b' }}>{a.name}</span></td>
                  <td><span className="status-badge">{a.category}</span></td>
                  <td style={{ fontSize: 12 }}>{a.helmChartName || '-'}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 13 }}>{a.latestVersion || '-'}</span></td>
                  <td>{a.keycloakEnabled ? '✅' : '—'}</td>
                  <td>{a.installOrder}</td>
                  <td>
                    <span className={'status-badge status-badge--' + (a.isActive ? 'active' : 'expired')}>
                      {a.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn--sm btn--ghost" onClick={() => openEdit(a)} title="수정"><FiEdit2 size={14} /></button>
                      {a.isActive
                        ? <button className="btn btn--sm btn--ghost" onClick={() => handleDelete(a.id, a.displayName)} title="비활성화"><FiTrash2 size={14} color="#e74c3c" /></button>
                        : <button className="btn btn--sm btn--ghost" onClick={() => handleActivate(a.id)} title="활성화"><FiCheckCircle size={14} color="#27ae60" /></button>
                      }
                    </div>
                  </td>
                </tr>
                {expandedId === a.id && (
                  <tr>
                    <td colSpan={9} style={{ background: '#f8f9fa', padding: '8px 24px' }}>
                      <strong style={{ fontSize: 13 }}>버전 이력</strong>
                      {versions.length === 0 ? <p style={{ color: '#808e9b', fontSize: 13 }}>등록된 버전이 없습니다.</p> : (
                        <table style={{ width: '100%', fontSize: 13, marginTop: 8 }}>
                          <thead><tr><th>버전</th><th>Helm Chart</th><th>이미지 태그</th><th>Latest</th><th>동기화</th></tr></thead>
                          <tbody>
                            {versions.map(v => (
                              <tr key={v.id}>
                                <td style={{ fontFamily: 'monospace' }}>{v.version}</td>
                                <td>{v.helmChartVersion || '-'}</td>
                                <td style={{ maxWidth: 300, wordBreak: 'break-word', fontSize: 12 }}>{v.imageTags || '-'}</td>
                                <td>{v.isLatest ? '✅' : ''}</td>
                                <td>{v.syncedAt ? new Date(v.syncedAt).toLocaleDateString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal__header">
              <h2>{editingId ? '애드온 수정' : '새 애드온 추가'}</h2>
              <button className="btn btn--ghost" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>시스템 이름 *</label>
                    <input value={form.name} onChange={e => setField('name', e.target.value)}
                      placeholder="keycloak" required disabled={!!editingId} />
                  </div>
                  <div className="form-group">
                    <label>표시 이름 *</label>
                    <input value={form.displayName} onChange={e => setField('displayName', e.target.value)}
                      placeholder="Keycloak" required />
                  </div>
                  <div className="form-group">
                    <label>카테고리 *</label>
                    <select value={form.category} onChange={e => setField('category', e.target.value)}>
                      {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>설치 순서</label>
                    <input type="number" value={form.installOrder} onChange={e => setField('installOrder', parseInt(e.target.value) || 50)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Helm Repo URL</label>
                    <input value={form.helmRepoUrl} onChange={e => setField('helmRepoUrl', e.target.value)}
                      placeholder="https://charts.example.io" />
                  </div>
                  <div className="form-group">
                    <label>Helm Chart Name</label>
                    <input value={form.helmChartName} onChange={e => setField('helmChartName', e.target.value)}
                      placeholder="chart-name" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Upstream 이미지 (JSON 배열)</label>
                  <textarea value={form.upstreamImages} onChange={e => setField('upstreamImages', e.target.value)}
                    rows={2} placeholder='["quay.io/keycloak/keycloak"]' />
                </div>
                <div className="form-group">
                  <label>의존 애드온 (JSON 배열)</label>
                  <input value={form.dependencies} onChange={e => setField('dependencies', e.target.value)}
                    placeholder='["cert-manager"]' />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.keycloakEnabled} onChange={e => setField('keycloakEnabled', e.target.checked)} />
                    Keycloak SSO 연동 가능
                  </label>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn--primary">{editingId ? '수정' : '등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonListPage;