import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, deleteCustomer } from '../../api/customerApi';
import { getProjects, createProject, deleteProject } from '../../api/projectApi';
import { FiEdit, FiArrowLeft, FiTrash2, FiPlus, FiFolder, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', code: '', description: '', k8sVersion: '', namespace: '', domain: '', environment: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      getCustomer(id),
      getProjects(id)
    ]).then(([cRes, pRes]) => {
      setCustomer(cRes.data);
      setProjects(pRes.data || []);
    }).catch(() => toast.error('데이터 로딩 실패'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeleteCustomer = async () => {
    if (!window.confirm('이 고객사를 비활성화하시겠습니까?')) return;
    try { await deleteCustomer(id); toast.success('비활성화 완료'); navigate('/customers'); }
    catch { toast.error('처리 실패'); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(id, projectForm);
      toast.success('프로젝트가 등록되었습니다.');
      setShowProjectModal(false);
      setProjectForm({ name: '', code: '', description: '', k8sVersion: '', namespace: '', domain: '', environment: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || '저장 실패');
    }
  };

  const handleDeleteProject = async (projId, projName) => {
    if (!window.confirm(projName + ' 프로젝트를 비활성화하시겠습니까?')) return;
    try { await deleteProject(id, projId); toast.success('비활성화 완료'); fetchData(); }
    catch { toast.error('처리 실패'); }
  };

  if (loading) return <div className="card"><p>로딩 중...</p></div>;
  if (!customer) return <div className="card"><p>고객사를 찾을 수 없습니다.</p></div>;

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
      <span style={{ width: 120, color: '#808e9b', fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value || '-'}</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiArrowLeft style={{ cursor: 'pointer' }} onClick={() => navigate('/customers')} />
          <h1>{customer.name}</h1>
          <span className={'status-badge status-badge--' + (customer.isActive ? 'active' : 'expired')}>
            {customer.isActive ? '활성' : '비활성'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--secondary" onClick={() => navigate('/customers/' + id + '/edit')}><FiEdit /> 수정</button>
          <button className="btn btn--ghost" onClick={handleDeleteCustomer}><FiTrash2 color="#e74c3c" /> 비활성화</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>기본 정보</h3>
          <InfoRow label="코드" value={customer.code} />
          <InfoRow label="환경" value={customer.environment} />
          <InfoRow label="등록일" value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''} />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>인프라 정보</h3>
          <InfoRow label="K8s 버전" value={customer.k8sVersion} />
          <InfoRow label="OS" value={customer.osInfo} />
          <InfoRow label="노드 수" value={customer.nodeCount} />
          <InfoRow label="스토리지" value={customer.storageInfo} />
          <InfoRow label="네트워크" value={customer.networkInfo} />
          <InfoRow label="VPN" value={customer.vpnInfo} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>담당자</h3>
        <InfoRow label="이름" value={customer.contactName} />
        <InfoRow label="이메일" value={customer.contactEmail} />
        <InfoRow label="연락처" value={customer.contactPhone} />
        {customer.memo && <InfoRow label="메모" value={customer.memo} />}
      </div>

      {/* 프로젝트 트리 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>프로젝트 ({projects.length})</h3>
          <button className="btn btn--primary btn--sm" onClick={() => setShowProjectModal(true)}><FiPlus /> 프로젝트 추가</button>
        </div>
        {projects.length === 0 ? (
          <p style={{ color: '#808e9b', textAlign: 'center', padding: 24 }}>등록된 프로젝트가 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {projects.map(p => (
              <div key={p.id} style={{ border: '1px solid #e9ecef', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <FiFolder color="#0984e3" />
                    <strong>{p.name}</strong>
                    {p.code && <span style={{ fontSize: 12, color: '#808e9b' }}>({p.code})</span>}
                  </div>
                  <button className="btn btn--sm btn--ghost" onClick={() => handleDeleteProject(p.id, p.name)}>
                    <FiTrash2 size={13} color="#e74c3c" />
                  </button>
                </div>
                {p.description && <p style={{ fontSize: 13, color: '#636e72', margin: '8px 0 0' }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {p.namespace && <span className="status-badge">ns: {p.namespace}</span>}
                  {p.domain && <span className="status-badge">domain: {p.domain}</span>}
                  {p.environment && <span className="status-badge">{p.environment}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 프로젝트 등록 모달 */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal__header">
              <h2>프로젝트 추가</h2>
              <button className="btn btn--ghost" onClick={() => setShowProjectModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal__body">
                <div className="form-group">
                  <label>프로젝트명 *</label>
                  <input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                    required placeholder="컨테이너 플랫폼 구축" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>코드</label>
                    <input value={projectForm.code} onChange={e => setProjectForm(f => ({ ...f, code: e.target.value }))}
                      placeholder="CP-2026" />
                  </div>
                  <div className="form-group">
                    <label>환경</label>
                    <select value={projectForm.environment} onChange={e => setProjectForm(f => ({ ...f, environment: e.target.value }))}>
                      <option value="">선택</option>
                      <option value="PRODUCTION">운영</option>
                      <option value="STAGING">스테이징</option>
                      <option value="DEVELOPMENT">개발</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Namespace</label>
                    <input value={projectForm.namespace} onChange={e => setProjectForm(f => ({ ...f, namespace: e.target.value }))}
                      placeholder="devops" />
                  </div>
                  <div className="form-group">
                    <label>Domain</label>
                    <input value={projectForm.domain} onChange={e => setProjectForm(f => ({ ...f, domain: e.target.value }))}
                      placeholder="example.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowProjectModal(false)}>취소</button>
                <button type="submit" className="btn btn--primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
