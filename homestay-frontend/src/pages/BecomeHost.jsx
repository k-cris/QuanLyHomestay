import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { hostRequestService, uploadService } from '../services/api';

const statusLabel = {
  PENDING: 'Đang chờ Admin duyệt',
  APPROVED: 'Đã được duyệt thành Host',
  REJECTED: 'Đã bị từ chối'
};

const toFullUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  return path.startsWith('http') ? path : `http://localhost:8080${path}`;
};

const BecomeHost = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [idCardNumber, setIdCardNumber] = useState('');
  const [documentImages, setDocumentImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [latestRequest, setLatestRequest] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const loadLatest = async () => {
    try {
      setLoading(true);
      const res = await hostRequestService.getMine();
      setLatestRequest(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Không tải được trạng thái hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'ADMIN') {
      navigate('/admin');
      return;
    }
    if (user.role === 'HOST') {
      navigate('/host');
      return;
    }
    loadLatest();
  }, [user]);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await uploadService.uploadFile(file);
        uploaded.push(toFullUrl(res.data));
      }
      setDocumentImages((prev) => [...prev, ...uploaded.filter(Boolean)]);
      setMessage({ type: 'success', text: `Đã tải ${uploaded.length} ảnh` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Tải ảnh thất bại' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setDocumentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!idCardNumber.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số CCCD' });
      return;
    }
    if (documentImages.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng tải ít nhất 1 ảnh giấy tờ' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await hostRequestService.submit({
        idCardNumber: idCardNumber.trim(),
        documentImageUrls: documentImages
      });
      setLatestRequest(res.data);
      setDocumentImages([]);
      setIdCardNumber('');
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu. Vui lòng chờ Admin duyệt.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Gửi yêu cầu thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'USER') {
    return null;
  }

  if (loading) {
    return <div className="container" style={{ padding: '40px 0' }}>Đang tải...</div>;
  }

  const hasPending = latestRequest?.status === 'PENDING';
  const isApproved = latestRequest?.status === 'APPROVED';
  const canSubmit = !hasPending && !isApproved;
  const submittedImages = latestRequest?.documentImageUrls?.length
    ? latestRequest.documentImageUrls
    : (latestRequest?.licenseImageUrl ? [latestRequest.licenseImageUrl] : []);

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '720px' }}>
      <h1>Đăng ký trở thành Chủ Homestay</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
        Gửi CCCD và nhiều ảnh giấy tờ để Admin xem xét kỹ hơn trước khi duyệt lên <strong>HOST</strong>.
      </p>

      {latestRequest && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-background-alt)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>
            Trạng thái hồ sơ: {statusLabel[latestRequest.status] || latestRequest.status}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            CCCD: {latestRequest.idCardNumber}
          </div>
          {submittedImages.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {submittedImages.map((url, i) => (
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt={`Giấy tờ ${i + 1}`}
                  style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
              ))}
            </div>
          )}
          {latestRequest.status === 'REJECTED' && latestRequest.adminNote && (
            <div style={{ marginTop: '8px', color: '#B91C1C' }}>
              Lý do từ chối: {latestRequest.adminNote}
            </div>
          )}
          {latestRequest.status === 'APPROVED' && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ marginBottom: '12px' }}>
                Bạn đã được duyệt. Hãy đăng xuất rồi đăng nhập lại để JWT cập nhật role HOST và vào trang quản lý phòng.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Đăng xuất để đăng nhập lại
              </button>
            </div>
          )}
          {latestRequest.status === 'PENDING' && (
            <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>
              Hồ sơ đang chờ duyệt — bạn không thể gửi thêm yêu cầu mới.
            </p>
          )}
        </div>
      )}

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

      {canSubmit ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số CCCD *</label>
            <input
              type="text"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              placeholder="Nhập số căn cước công dân"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Ảnh giấy tờ * <span style={{ fontWeight: 400, color: 'var(--color-text-light)' }}>(có thể chọn nhiều ảnh)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
            />
            {uploading && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginTop: '8px' }}>Đang tải ảnh...</p>}
            {documentImages.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                {documentImages.map((url, index) => (
                  <div key={`${url}-${index}`} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Ảnh ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      title="Xóa ảnh"
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 28, height: 28, borderRadius: 6,
                        background: '#FEE2E2', color: '#B91C1C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu trở thành Host'}
          </button>
        </form>
      ) : !isApproved && (
        <p style={{ color: 'var(--color-text-light)' }}>
          {hasPending
            ? 'Vui lòng chờ Admin xử lý hồ sơ hiện tại.'
            : <Link to="/" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Quay lại trang chủ</Link>}
        </p>
      )}
    </div>
  );
};

export default BecomeHost;
