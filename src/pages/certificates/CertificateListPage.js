import React, { useState, useEffect } from 'react';
import { getCertificates, createCertificate, renewCertificate, deleteCertificate } from '../../api/certificateApi';
import { getCustomers } from '../../api/customerApi';
import { FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CertificateListPage = () => {
  const [certs, setCerts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [form, setForm] = useState({ customerId: '', domain: '', issuedAt: '', expiresAt: '', issuer: '', certType: 'LETS_ENCRYPT', autoRenew: true, memo: '' });
  const [renewForm, setRenewForm] = useState({ newExpiresAt: '', renewedBy: '', memo: '' });

  useEffect(() => {
    getCustomers({ size: 100 }).then(r => setCustomers(r.data?.content || r.data || [])).catch(() => {});
  }, []);

  const fetchCerts = () => {
    const params = { page, size: 20 };
    if (filterCustomerId) params.customerId = filterCustomerId;
    getCertificates(params).then(r => {
      setCerts(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    }).catch(() => toast.error('인증서 로딩 실패'));
  };

  useEffect(() => { fetchCerts(); }, [page, filterCustomerId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCertificate({ ...form, customerId: parseInt(form.customerId) });
      toast.success('인증서가 등록되었습니다.');
      setShowModal(false);
      fetchCerts();
    } catch (err) { toast.error(err.response?.data?.message || '등록 실패'); }
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    try {
      await renewCertificate(renewTarget.id, renewForm);
      toast.success('인증서가 갱신되었습니다.');
      setRenewTarget(null);
      fetchCerts();
    } catch (err) { toast.error(err.response?.data?.message || '갱신 실패'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 인증서를 삭제하시겠습니까?')) return;
    try { await deleteCertificate(id); toast.success('삭제 완료'); fetchCerts(); }
    catch { toast.error('삭제 실패'); }
  };

  const daysClass = (d) => d <= 7 ? 'expired' : d <= 30 ? 'warning' : 'active';

  return (
    <div>
      <div className="page-header">
        <h1>인증서 관리</h1>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}><FiPlus /> 인증서 등록</button>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterCustomerId} onChange={e => { setFilterCustomerId(e.target.value); setPage(0); }}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}>
          <option value="">전체 고객사</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        {certs.length === 0 ? <p style={{ textAlign: 'center', padding: 24, color: '#808e9b' }}>등록된 인증서가 없습니다.</p> : (
          <table className="data-table">
            <thead><tr><th>도메인</th><th>고객사</th><th>발급자</th><th>유형</th><th>만료일</th><th>D-Day</th><th>자동갱신</th><th>관리</th></tr></thead>
            <tbody>{certs.map(c => (
              <tr key={c.id}>
                <td><strong>{c.domain}</strong></td>
                <td>{c.customerName}</td>
                <td style={{ fontSize: 12 }}>{c.issuer || '-'}</td>
                <td><span className="status-badge">{c.certType || '-'}</span></td>
                <td style={{ fontSize: 12 }}>{c.expiresAt}</td>
                <td><span className={'status-badge status-badge--' + daysClass(c.daysUntilExpiry)}>D-{c.daysUntilExpiry}</span></td>
                <td>{c.autoRenew ? '✅' : '-'}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn--sm btn--ghost" onClick={() => { setRenewTarget(c); setRenewForm({ newExpiresAt: '', renewedBy: '', memo: '' }); }} title="갱신"><FiRefreshCw size={13} /></button>
                  <button className="btn btn--sm btn--ghost" onClick={() => handleDelete(c.id)} title="삭제"><FiTrash2 size={13} color="#e74c3c" /></button>
                </td>
              </tr>
            ))}</tbody>
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

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal__header"><h2>인증서 등록</h2><button className="btn btn--ghost" onClick={() => setShowModal(false)}><FiX /></button></div>
            <form onSubmit={handleCreate}>
              <div className="modal__body">
                <div className="form-group"><label>고객사 *</label>
                  <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                    <option value="">선택</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>도메인 *</label>
                  <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required placeholder="*.example.com" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>발급일</label><input type="date" value={form.issuedAt} onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))} /></div>
                  <div className="form-group"><label>만료일 *</label><input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>발급자</label><input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="Let's Encrypt" /></div>
                  <div className="form-group"><label>유형</label>
                    <select value={form.certType} onChange={e => setForm(f => ({ ...f, certType: e.target.value }))}>
                      <option value="LETS_ENCRYPT">Let's Encrypt</option><option value="SELF_SIGNED">Self-Signed</option>
                      <option value="CA_SIGNED">CA Signed</option><option value="WILDCARD">Wildcard</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label><input type="checkbox" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))} /> 자동 갱신 (cert-manager)</label></div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn--primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 갱신 모달 */}
      {renewTarget && (
        <div className="modal-overlay" onClick={() => setRenewTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal__header"><h2>인증서 갱신 - {renewTarget.domain}</h2><button className="btn btn--ghost" onClick={() => setRenewTarget(null)}><FiX /></button></div>
            <div className="modal__body">
              <p style={{ fontSize: 13, color: '#636e72', marginBottom: 12 }}>현재 만료일: {renewTarget.expiresAt} (D-{renewTarget.daysUntilExpiry})</p>
              <div className="form-group"><label>새 만료일 *</label><input type="date" value={renewForm.newExpiresAt} onChange={e => setRenewForm(f => ({ ...f, newExpiresAt: e.target.value }))} required /></div>
              <div className="form-group"><label>갱신자</label><input value={renewForm.renewedBy} onChange={e => setRenewForm(f => ({ ...f, renewedBy: e.target.value }))} /></div>
              <div className="form-group"><label>메모</label><textarea value={renewForm.memo} onChange={e => setRenewForm(f => ({ ...f, memo: e.target.value }))} rows={2} /></div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setRenewTarget(null)}>취소</button>
              <button className="btn btn--primary" onClick={handleRenew} disabled={!renewForm.newExpiresAt}>갱신</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CertificateListPage;
