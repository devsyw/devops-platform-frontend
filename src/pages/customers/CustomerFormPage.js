import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomer, createCustomer, updateCustomer } from '../../api/customerApi';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';

const emptyForm = {
  name: '', code: '', environment: '', k8sVersion: '', osInfo: '',
  nodeCount: '', storageInfo: '', networkInfo: '', vpnInfo: '',
  contactName: '', contactEmail: '', contactPhone: '', memo: ''
};

const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getCustomer(id).then(res => {
        const c = res.data;
        setForm({
          name: c.name || '', code: c.code || '', environment: c.environment || '',
          k8sVersion: c.k8sVersion || '', osInfo: c.osInfo || '',
          nodeCount: c.nodeCount || '', storageInfo: c.storageInfo || '',
          networkInfo: c.networkInfo || '', vpnInfo: c.vpnInfo || '',
          contactName: c.contactName || '', contactEmail: c.contactEmail || '',
          contactPhone: c.contactPhone || '', memo: c.memo || ''
        });
      }).catch(() => toast.error('고객사 로딩 실패'));
    }
  }, [id, isEdit]);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, nodeCount: form.nodeCount ? parseInt(form.nodeCount) : null };
      if (isEdit) {
        await updateCustomer(id, data);
        toast.success('고객사 정보가 수정되었습니다.');
        navigate('/customers/' + id);
      } else {
        const res = await createCustomer(data);
        toast.success('고객사가 등록되었습니다.');
        navigate('/customers/' + res.data.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || '저장 실패');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiArrowLeft style={{ cursor: 'pointer' }} onClick={() => navigate(-1)} />
          <h1>{isEdit ? '고객사 수정' : '고객사 등록'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>기본 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>고객사명 *</label>
              <input value={form.name} onChange={e => setField('name', e.target.value)} required placeholder="LG에너지솔루션" />
            </div>
            <div className="form-group">
              <label>코드</label>
              <input value={form.code} onChange={e => setField('code', e.target.value)} placeholder="LGES" />
            </div>
            <div className="form-group">
              <label>환경</label>
              <select value={form.environment} onChange={e => setField('environment', e.target.value)}>
                <option value="">선택</option>
                <option value="PRODUCTION">운영</option>
                <option value="STAGING">스테이징</option>
                <option value="DEVELOPMENT">개발</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>인프라 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>K8s 버전</label>
              <input value={form.k8sVersion} onChange={e => setField('k8sVersion', e.target.value)} placeholder="1.28.0" />
            </div>
            <div className="form-group">
              <label>OS 정보</label>
              <input value={form.osInfo} onChange={e => setField('osInfo', e.target.value)} placeholder="Ubuntu 22.04" />
            </div>
            <div className="form-group">
              <label>노드 수</label>
              <input type="number" value={form.nodeCount} onChange={e => setField('nodeCount', e.target.value)} placeholder="3" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>스토리지</label>
              <input value={form.storageInfo} onChange={e => setField('storageInfo', e.target.value)} placeholder="NFS, Ceph 등" />
            </div>
            <div className="form-group">
              <label>네트워크</label>
              <input value={form.networkInfo} onChange={e => setField('networkInfo', e.target.value)} placeholder="Calico, Cilium 등" />
            </div>
            <div className="form-group">
              <label>VPN 정보</label>
              <input value={form.vpnInfo} onChange={e => setField('vpnInfo', e.target.value)} placeholder="OpenVPN, WireGuard 등" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>담당자 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>담당자명</label>
              <input value={form.contactName} onChange={e => setField('contactName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>이메일</label>
              <input type="email" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} />
            </div>
            <div className="form-group">
              <label>연락처</label>
              <input value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>메모</label>
            <textarea value={form.memo} onChange={e => setField('memo', e.target.value)} rows={3} placeholder="기타 참고 사항" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            <FiSave /> {loading ? '저장 중...' : (isEdit ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;
