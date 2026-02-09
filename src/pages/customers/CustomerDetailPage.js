import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiArrowLeft } from 'react-icons/fi';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <FiArrowLeft style={{cursor:'pointer'}} onClick={() => navigate('/customers')} />
          <h1>고객사 상세</h1>
        </div>
        <button className="btn btn--secondary" onClick={() => navigate('/customers/' + id + '/edit')}>
          <FiEdit /> 수정
        </button>
      </div>
      <div className="card"><p>고객사 ID: {id} - 상세 페이지 구현 예정</p></div>
    </div>
  );
};
export default CustomerDetailPage;
