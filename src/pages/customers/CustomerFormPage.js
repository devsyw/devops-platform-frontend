import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const CustomerFormPage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <FiArrowLeft style={{cursor:'pointer'}} onClick={() => navigate('/customers')} />
          <h1>고객사 등록</h1>
        </div>
      </div>
      <div className="card"><p>등록 폼 구현 예정</p></div>
    </div>
  );
};
export default CustomerFormPage;
