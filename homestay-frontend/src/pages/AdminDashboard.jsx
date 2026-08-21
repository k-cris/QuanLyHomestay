import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { hostRequestService } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import { useResponsivePageSize } from '../hooks/useResponsivePageSize';
import ListPagination from '../components/ListPagination';

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
  const pageSize = useResponsivePageSize();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const {
    page,
    setPage,
    totalPages,
    pageItems,
    canPrevious,
    canNext
  } = usePagination({
    items: requests,
    pageSize,
    resetKey: filter
  });

  const fetchRequests = async (status = filter) => {
    try {
      setLoading(true);
      const params = status && status !== 'ALL' ? { status } : undefined;
      const res = await hostRequestService.getAll(params);
      setRequests(res.data || []);
    } catch (err) {
      toast.error(err.response?.data || 'Không tải được danh sách hồ sơ');
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
    <div className="container page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Duyệt Host</h1>
        <Link to="/admin/stats" className="btn btn-outline btn-sm">
          Thống kê doanh thu
        </Link>
      </div>

      

      <div className="filter-bar">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>Không có hồ sơ nào.</p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pageItems.map((req) => {
              const st = statusStyle[req.status] || statusStyle.PENDING;
              const images = getImages(req);
              return (
                <div key={req.id} className="list-card">
                  <img
                    className="list-card-thumb"
                    src={images[0] || 'https://placehold.co/120x120?text=No+Image'}
                    alt="Giấy tờ"
                  />
                  <div className="list-card-body">
                    <div className="list-card-title-row" style={{ alignItems: 'center' }}>
                      <h3>#{req.id} · {req.userFullName || 'N/A'}</h3>
                      <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="list-card-meta">
                      <div>{req.userEmail}</div>
                      <div>CCCD: {req.idCardNumber} · {images.length} ảnh giấy tờ</div>
                    </div>
                  </div>

                  <div className="list-card-actions">
                    <Link
                      to={`/admin/host-requests/${req.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={16} /> Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <ListPagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            canPrevious={canPrevious}
            canNext={canNext}
          />
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
