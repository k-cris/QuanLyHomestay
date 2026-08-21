import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { bookingService, paymentService, reviewService } from '../services/api';
import { Calendar, MapPin, CreditCard, X, Star } from 'lucide-react';
import { formatHoursAsDaysLabel } from '../utils/refundPolicy';
import { usePagination } from '../hooks/usePagination';
import { useResponsivePageSize } from '../hooks/useResponsivePageSize';
import ListPagination from '../components/ListPagination';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const MyBookings = () => {
  const pageSize = useResponsivePageSize();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handlePayment = async (bookingId) => {
    try {
      setPayingId(bookingId);
      
      await paymentService.create({
        bookingId: bookingId,
        paymentMethod: 'BANK_TRANSFER'
      });
      toast.success('Xác nhận thanh toán thành công!');
      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data || 'Xác nhận thanh toán thất bại');
    } finally {
      setPayingId(null);
    }
  };

  const {
    page,
    setPage,
    totalPages,
    pageItems,
    canPrevious,
    canNext
  } = usePagination({
    items: bookings,
    pageSize,
    resetKey: 'my-bookings'
  });

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử đơn hàng', err);
      toast.error(err.response?.data || 'Không tải được lịch sử đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF3C7', color: '#92400E', text: 'Chờ duyệt' };
      case 'CONFIRM': return { bg: '#DCFCE7', color: '#166534', text: 'Đã xác nhận' };
      case 'REJECTED': return { bg: '#FEE2E2', color: '#B91C1C', text: 'Bị từ chối' };
      case 'CANCELLED': return { bg: '#E5E7EB', color: '#374151', text: 'Đã hủy' };
      case 'COMPLETED': return { bg: '#DBEAFE', color: '#1E40AF', text: 'Đã hoàn thành' };
      default: return { bg: '#E5E7EB', color: '#374151', text: status };
    }
  };

  const paymentText = (b) => {
    if (!b.paymentStatus) return 'Chưa thanh toán';
    if (b.paymentStatus === 'REFUNDED') {
      const pct = b.refundPercent != null ? ` ${b.refundPercent}%` : '';
      const amt = b.refundAmount != null ? ` · ${formatVnd(b.refundAmount)}` : '';
      return `Chờ hoàn tiền thủ công${pct}${amt}${b.refundBankAccount ? ` → ${b.refundBankAccount}` : ''}`;
    }
    if (b.paymentStatus === 'PAID') return 'Đã thanh toán';
    return b.paymentStatus;
  };

  const parseLocalDate = (value) => {
    if (!value) return null;
    const raw = String(value).slice(0, 10);
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const getCancelState = (b) => {
    if (b.status !== 'PENDING' && b.status !== 'CONFIRM') {
      return { show: false, enabled: false, reason: '' };
    }
    const checkin = parseLocalDate(b.checkinDate);
    if (!checkin) {
      return { show: true, enabled: false, reason: 'Thiếu ngày nhận phòng' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkin < today) {
      return { show: true, enabled: false, reason: 'Đã qua ngày nhận phòng' };
    }
    return { show: true, enabled: true, reason: '' };
  };

  const openCancelPreview = async (bookingId) => {
    try {
      setPreviewLoading(true);
      
      const res = await bookingService.cancelPreview(bookingId);
      setPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data || 'Không lấy được thông tin hủy đơn');
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!preview?.bookingId) return;
    try {
      setCancelling(true);
      const res = await bookingService.cancel(preview.bookingId);
      setPreview(null);
      const refunded = res.data?.paymentStatus === 'REFUNDED';
      setMessage({
        type: 'success',
        text: refunded
          ? `Đã hủy đơn ${res.data.bookingCode}. Chờ xử lý hoàn ${res.data.refundPercent ?? ''}% (${formatVnd(res.data.refundAmount)}) về STK ${res.data.refundBankAccount || ''}.`
          : `Đã hủy đơn ${res.data.bookingCode}.`
      });
      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data || 'Hủy đơn thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    try {
      setSubmittingReview(true);
      await reviewService.create({
        bookingId: reviewBooking.id,
        rating,
        comment
      });
      toast.success('Đánh giá thành công!');
      setReviewBooking(null);
      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data || 'Đánh giá thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="container page">Đang tải lịch sử đặt phòng...</div>;

  return (
    <div className="container page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Chuyến đi của tôi</h1>
      </div>

      

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>Bạn chưa có chuyến đi nào.</p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pageItems.map((b) => {
              const statusStyle = getStatusStyle(b.status);
              const cancelState = getCancelState(b);
              return (
                <div key={b.id} className="list-card">
                  <div className="list-card-body">
                    <div className="list-card-title-row">
                      <h3>{b.homestayTitle || b.homestay?.title || 'Homestay'}</h3>
                      <span className="status-pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.text}
                      </span>
                    </div>

                    <div className="list-card-meta" style={{ marginBottom: 10 }}>
                      Mã đơn: {b.bookingCode}
                      {b.createdAt && ` · Đặt lúc ${new Date(b.createdAt).toLocaleString('vi-VN')}`}
                    </div>

                    <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <MapPin size={16} style={{ flexShrink: 0 }} />
                      <span>{b.homestayCity || b.homestay?.city || 'Không rõ'}</span>
                    </div>

                    <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Calendar size={16} style={{ flexShrink: 0 }} />
                      <span>{b.checkinDate} — {b.checkoutDate} ({b.totalGuests} khách)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--color-text-dark)', flexWrap: 'wrap' }}>
                      <CreditCard size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span>
                          Tổng tiền: {formatVnd(b.totalPrice)}
                          <span style={{ fontWeight: 500, color: 'var(--color-text-light)', marginLeft: 8 }}>
                            ({paymentText(b)})
                          </span>
                        </span>
                        {b.status === 'PENDING' && b.paymentStatus !== 'PAID' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                            disabled={payingId === b.id}
                            onClick={() => handlePayment(b.id)}
                          >
                            {payingId === b.id ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="list-card-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {cancelState.show && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={!cancelState.enabled || previewLoading}
                          title={cancelState.reason || 'Hủy đặt phòng'}
                          onClick={() => cancelState.enabled && openCancelPreview(b.id)}
                          style={{
                            borderColor: '#B91C1C',
                            color: '#B91C1C',
                            opacity: cancelState.enabled ? 1 : 0.45,
                            cursor: cancelState.enabled ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Hủy đặt phòng
                        </button>
                        {!cancelState.enabled && cancelState.reason && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right' }}>
                            {cancelState.reason}
                          </span>
                        )}
                      </>
                    )}
                    {b.status === 'COMPLETED' && !b.isReviewed && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openReviewModal(b)}
                        style={{ padding: '6px 12px' }}
                      >
                        Đánh giá Homestay
                      </button>
                    )}
                    {b.status === 'COMPLETED' && b.isReviewed && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={16} fill="currentColor" /> Đã đánh giá
                      </span>
                    )}
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

      {preview && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
          }}
          onClick={() => !cancelling && setPreview(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: 'clamp(18px, 4vw, 28px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="list-card-title-row" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Xác nhận hủy phòng</h2>
              <button type="button" onClick={() => setPreview(null)} disabled={cancelling} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            {!preview.canCancel ? (
              <p style={{ marginBottom: 20 }}>{preview.reason || preview.message || 'Không thể hủy đơn này.'}</p>
            ) : (
              <>
                <div className="note-box" style={{ flexDirection: 'column', marginBottom: 16, lineHeight: 1.7 }}>
                  <div><strong>Mã đơn:</strong> {preview.bookingCode}</div>
                  <div><strong>Trạng thái:</strong> {preview.bookingStatus}</div>
                  <div><strong>Còn:</strong> khoảng {preview.daysBeforeCheckin} ngày trước nhận phòng</div>
                  <div><strong>Hoàn tiền:</strong> {preview.willRefund
                    ? `${preview.refundPercent}% · ${formatVnd(preview.refundAmount)} / ${formatVnd(preview.originalAmount)}`
                    : 'Không hoàn (chưa thanh toán)'}
                  </div>
                  {preview.refundRules?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <strong>Chính sách Homestay:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {preview.refundRules.map((r, idx) => (
                          <li key={idx}>
                            Trước từ {formatHoursAsDaysLabel(r.minHoursBefore)} → hoàn {r.refundPercent}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: preview.refundPercent < 100 && preview.willRefund ? '#FEF3C7' : '#EFF6FF',
                    color: preview.refundPercent < 100 && preview.willRefund ? '#92400E' : '#1E3A8A',
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                  }}
                >
                  {preview.message}
                </div>
              </>
            )}

            <div className="list-card-actions is-end">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={cancelling}
                onClick={() => setPreview(null)}
              >
                Giữ đơn
              </button>
              {preview.canCancel && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={cancelling}
                  onClick={confirmCancel}
                  style={{ background: '#B91C1C' }}
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reviewBooking && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
          }}
          onClick={() => !submittingReview && setReviewBooking(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: 'clamp(18px, 4vw, 28px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="list-card-title-row" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Đánh giá Homestay</h2>
              <button type="button" onClick={() => setReviewBooking(null)} disabled={submittingReview} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px' }}>Chuyến đi của bạn tại <strong>{reviewBooking.homestayTitle}</strong> thế nào?</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <Star size={32} fill={rating >= star ? '#FBBF24' : 'transparent'} color={rating >= star ? '#FBBF24' : '#D1D5DB'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Bình luận của bạn</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div className="list-card-actions is-end">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={submittingReview}
                onClick={() => setReviewBooking(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={submittingReview}
                onClick={submitReview}
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
