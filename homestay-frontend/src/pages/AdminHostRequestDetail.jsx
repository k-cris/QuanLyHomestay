import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [showApprove, setShowApprove] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [previewIndex, setPreviewIndex] = useState(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await hostRequestService.getById(id);
      setReq(res.data);
    } catch (err) {
      toast.error(err.response?.data || 'Không tải được chi tiết hồ sơ');
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

  const images = getImages(req);

  useEffect(() => {
    if (previewIndex == null) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((i) => (i == null ? i : (i - 1 + images.length) % images.length));
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((i) => (i == null ? i : (i + 1) % images.length));
      }
    };

    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [previewIndex, images.length]);

  const executeApprove = async () => {
    setShowApprove(false);
    try {
      setBusy(true);
      const res = await hostRequestService.approve(id);
      setReq(res.data);
      toast.success('Đã duyệt. User đã thành HOST.');
    } catch (err) {
      toast.error(err.response?.data || 'Duyệt thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      toast.error('Bắt buộc nhập adminNote khi từ chối');
      return;
    }
    try {
      setBusy(true);
      const res = await hostRequestService.reject(id, adminNote.trim());
      setReq(res.data);
      setShowReject(false);
      setAdminNote('');
      toast.success('Đã từ chối hồ sơ.');
    } catch (err) {
      toast.error(err.response?.data || 'Từ chối thất bại');
    } finally {
      setBusy(false);
    }
  };

  const showPrev = () => {
    if (!images.length) return;
    setPreviewIndex((i) => (i - 1 + images.length) % images.length);
  };

  const showNext = () => {
    if (!images.length) return;
    setPreviewIndex((i) => (i + 1) % images.length);
  };

  if (!user || user.role !== 'ADMIN') return null;
  if (loading) return <div className="container page">Đang tải chi tiết...</div>;
  if (!req) {
    return (
      <div className="container page">
        <p>{message.text || 'Không tìm thấy hồ sơ'}</p>
        <Link to="/admin" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Quay lại danh sách</Link>
      </div>
    );
  }

  const st = statusStyle[req.status] || statusStyle.PENDING;
  const previewUrl = previewIndex != null ? images[previewIndex] : null;

  return (
    <div className="container page" style={{ maxWidth: 960 }}>
      <Link
        to="/admin"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 600, color: 'var(--color-text-dark)' }}
      >
        <ArrowLeft size={18} /> Quay lại danh sách
      </Link>

      <div className="page-header">
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => setShowApprove(true)}
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
              onClick={() => setPreviewIndex(index)}
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
                Ảnh {index + 1}
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

      {showApprove && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Xác nhận Duyệt</h3>
            <p style={{ lineHeight: 1.6, marginBottom: 24 }}>Duyệt hồ sơ này? Tài khoản sẽ được nâng lên ROLE_HOST.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowApprove(false)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={executeApprove}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div
          className="image-lightbox"
          onClick={() => setPreviewIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Xem ảnh giấy tờ ${previewIndex + 1} / ${images.length}`}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setPreviewIndex(null)}
            aria-label="Đóng"
          >
            <X size={22} />
          </button>

          <div className="image-lightbox-counter" onClick={(e) => e.stopPropagation()}>
            {previewIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="image-lightbox-nav image-lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={previewUrl}
            alt={`Giấy tờ ${previewIndex + 1}`}
            className="image-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              className="image-lightbox-nav image-lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminHostRequestDetail;
