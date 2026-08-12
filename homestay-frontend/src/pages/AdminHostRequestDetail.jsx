import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
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

const AdminHostRequestDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await hostRequestService.getById(id);
      setReq(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Không tải được chi tiết hồ sơ' });
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
    loadDetail();
  }, [user, id]);

  const handleApprove = async () => {
    if (!window.confirm('Duyệt hồ sơ này? Tài khoản sẽ được nâng lên ROLE_HOST.')) return;
    try {
      setBusy(true);
      const res = await hostRequestService.approve(id);
      setReq(res.data);
      setMessage({ type: 'success', text: 'Đã duyệt. User đã thành HOST.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Duyệt thất bại' });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      setMessage({ type: 'error', text: 'Bắt buộc nhập adminNote khi từ chối' });
      return;
    }
    try {
      setBusy(true);
      const res = await hostRequestService.reject(id, adminNote.trim());
      setReq(res.data);
      setShowReject(false);
      setAdminNote('');
      setMessage({ type: 'success', text: 'Đã từ chối hồ sơ.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Từ chối thất bại' });
    } finally {
      setBusy(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;
  if (loading) return <div className="container" style={{ padding: '40px 0' }}>Đang tải chi tiết...</div>;
  if (!req) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <p>{message.text || 'Không tìm thấy hồ sơ'}</p>
        <Link to="/admin" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Quay lại danh sách</Link>
      </div>
    );
  }

  const st = statusStyle[req.status] || statusStyle.PENDING;
  const images = getImages(req);

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '960px' }}>
      <Link
        to="/admin"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 600, color: 'var(--color-text-dark)' }}
      >
        <ArrowLeft size={18} /> Quay lại danh sách
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Chi tiết hồ sơ #{req.id}</h1>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            background: st.bg,
            color: st.color
          }}>
            {st.label}
          </span>
        </div>

        {req.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={handleApprove}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Check size={16} /> Duyệt Host
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReject(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#FEE2E2',
                color: '#B91C1C',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <X size={16} /> Từ chối
            </button>
          </div>
        )}
      </div>

      {message.text && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: message.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: message.type === 'error' ? '#B91C1C' : '#166534'
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 28,
        padding: 20,
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 4 }}>Họ tên</div>
          <div style={{ fontWeight: 600 }}>{req.userFullName || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 4 }}>Email</div>
          <div style={{ fontWeight: 600 }}>{req.userEmail || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 4 }}>Số điện thoại</div>
          <div style={{ fontWeight: 600 }}>{req.userPhone || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 4 }}>Số CCCD</div>
          <div style={{ fontWeight: 600 }}>{req.idCardNumber || '—'}</div>
        </div>
        {req.adminNote && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 4 }}>Ghi chú Admin</div>
            <div style={{ color: '#B91C1C', fontWeight: 500 }}>{req.adminNote}</div>
          </div>
        )}
      </div>

      <h2 style={{ marginBottom: 12 }}>Ảnh giấy tờ ({images.length})</h2>
      {images.length === 0 ? (
        <p style={{ color: 'var(--color-text-light)' }}>Không có ảnh.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setPreviewUrl(url)}
              style={{
                padding: 0,
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#fff',
                textAlign: 'left'
              }}
            >
              <img
                src={url}
                alt={`Giấy tờ ${index + 1}`}
                style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                Ảnh {index + 1} · bấm để phóng to
              </div>
            </button>
          ))}
        </div>
      )}

      {showReject && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form
            onSubmit={handleReject}
            style={{ background: '#fff', padding: 28, borderRadius: 12, width: '90%', maxWidth: 480 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Từ chối hồ sơ #{req.id}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowReject(false)} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 12 }}>
              Theo Business Rule mục 5: từ chối phải lưu <strong>adminNote</strong>.
            </p>
            <textarea
              rows={4}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              required
              style={{ width: '100%', padding: 12, border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowReject(false)} style={{ padding: '10px 16px' }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: '10px 16px' }}>
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      )}

      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24
          }}
        >
          <img
            src={previewUrl}
            alt="Xem lớn"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminHostRequestDetail;
