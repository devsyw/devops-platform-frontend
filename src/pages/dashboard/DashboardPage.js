import React from 'react';
import { FiUsers, FiShield, FiPackage, FiAlertTriangle } from 'react-icons/fi';

const DashboardPage = () => {
  return (
    <div>
      <div className="page-header">
        <h1>대시보드</h1>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card__icon" style={{background:'#e3f2fd'}}><FiUsers color="#1976d2" /></div>
          <div><div className="summary-card__value">0</div><div className="summary-card__label">등록 고객사</div></div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon" style={{background:'#fce4ec'}}><FiAlertTriangle color="#c62828" /></div>
          <div><div className="summary-card__value">0</div><div className="summary-card__label">인증서 만료 임박</div></div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon" style={{background:'#e8f5e9'}}><FiPackage color="#2e7d32" /></div>
          <div><div className="summary-card__value">12</div><div className="summary-card__label">관리 애드온</div></div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon" style={{background:'#fff3e0'}}><FiShield color="#e65100" /></div>
          <div><div className="summary-card__value">0</div><div className="summary-card__label">새 버전 업데이트</div></div>
        </div>
      </div>
      <div className="card">
        <h3 style={{marginBottom:16}}>최근 설치 이력</h3>
        <p style={{color:'#808e9b'}}>아직 설치 이력이 없습니다.</p>
      </div>
    </div>
  );
};
export default DashboardPage;
