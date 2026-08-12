import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { hostRequestService } from '../services/api';

const statusStyle = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', label: 'PENDING' },
  APPROVED: { bg: '#DCFCE7', color: '#166534', label: 'APPROVED' },
  REJECTED: { bg: '#FEE2E2', color: '#B91C1C', label: 'REJECTED' }
};

const getImages = (req) => {
  if (req?.documentImageUrls?.length) return req.documentImageUrls;
  if (req?.licenseImageUrl) return [req.licenseImageUrl];
  return [];
};

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchRequests = async (status = filter) => {
    try {
      setLoading(true);
      const params = status && status !== 'ALL' ? { status } : undefined;
      const res = await hostRequestService.getAll(params);
      setRequests(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Không tải được danh sách hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchRequests(filter);
  }, [user, filter]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: '8px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 0, marginTop: 8 }}>
            Danh sách hồ sơ xin trở thành Chủ Homestay — mở chi tiết để xem xét rồi duyệt/từ chối
          </p>
        </div>
        <Link to="/admin/stats" className="btn btn-outline" style={{ padding: '10px 16px' }}>
          Thống kê doanh thu
        </Link>
      </div>

      {message.text && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: message.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: message.type === 'error' ? '#B91C1C' : '#166534'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={filter === s ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : requests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--color-text-light)' }}>Không có hồ sơ nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((req) => {
            const st = statusStyle[req.status] || statusStyle.PENDING;
            const images = getImages(req);
            return (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <img
                  src={images[0] || 'https://placehold.co/120x120?text=No+Image'}
                  alt="Giấy tờ"
                  style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>#{req.id} · {req.userFullName || 'N/A'}</h3>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '999px',
                      background: st.bg,
                      color: st.color
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: 1.7 }}>
                    <div>{req.userEmail}</div>
                    <div>CCCD: {req.idCardNumber} · {images.length} ảnh giấy tờ</div>
                  </div>
                </div>

                <Link
                  to={`/admin/host-requests/${req.id}`}
                  className="btn btn-primary"
                  style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={16} /> Xem chi tiết
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
