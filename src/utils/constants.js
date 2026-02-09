export const ADDON_CATEGORIES = {
  SECURITY: '보안/인증', CI_CD: 'CI/CD', MONITORING: '모니터링',
  SOURCE: '소스관리', INFRA: '인프라', ARTIFACT: '아티팩트',
  NETWORK: '네트워크', QUALITY: '품질관리'
};
export const INSTALL_STATUS = {
  PLANNED: { label: '예정', color: 'info' }, IN_PROGRESS: { label: '진행중', color: 'warning' },
  COMPLETED: { label: '완료', color: 'active' }, FAILED: { label: '실패', color: 'expired' }
};
export const CERT_STATUS = {
  ACTIVE: { label: '유효', color: 'active' }, EXPIRED: { label: '만료', color: 'expired' },
  REVOKED: { label: '폐기', color: 'expired' }
};
