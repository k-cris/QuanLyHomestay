import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Calendar, User, CreditCard, StickyNote } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { bookingService } from '../services/api';

const statusStyle = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', label: 'Chờ duyệt' },
  CONFIRM: { bg: '#DCFCE7', color: '#166534', label: 'Đã xác nhận' },
  REJECTED: { bg: '#FEE2E2', color: '#B91C1C', label: 'Đã từ chối' },
  CANCELLED: { bg: '#E5E7EB', color: '#374151', label: 'Đã hủy' },
  COMPLETED: { bg: '#DBEAFE', color: '#1E40AF', label: 'Hoàn thành' }
};

const paymentLabel = {
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  REFUNDED: 'Đã hoàn tiền'
};

const HostBookings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busyId, setBusyId] = useState(null);

  const fetchBookings = async (status = filter) => {
    try {
      setLoading(true);
      const params = status && status !== 'ALL' ? { status } : undefined;
      const res = await bookingService.getHostBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Không tải được danh sách đơn' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchBookings(filter);
  }, [user, filter]);

  const handleConfirm = async (id) => {
    if (!window.confirm('Xác nhận duyệt đơn này?')) return;
    try {
      setBusyId(id);
      await bookingService.confirm(id);
      setMessage({ type: 'success', text: `Đã duyệt đơn #${id}` });
      await fetchBookings(filter);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Duyệt thất bại' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối đơn này? Nếu khách đã thanh toán, hệ thống sẽ Auto Refund (BR-6).')) return;
    try {
      setBusyId(id);
      const res = await bookingService.reject(id);
      const refunded = res.data?.paymentStatus === 'REFUNDED';
      setMessage({
        type: 'success',
        text: refunded
          ? `Đã từ chối đơn #${id} và hoàn tiền về STK ${res.data.refundBankAccount || '(chưa cập nhật)'}`
          : `Đã từ chối đơn #${id}`
      });
      await fetchBookings(filter);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Từ chối thất bại' });
    } finally {
      setBusyId(null);
    }
  };

  if (!user || (user.role !== 'HOST' && user.role !== 'ADMIN')) return null;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Xử lý đơn đặt phòng</h1>
        <Link to="/host" className="btn btn-outline" style={{ padding: '10px 16px' }}>
          Quản lý Homestay
        </Link>
      </div>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 24 }}>
        Host chỉ duyệt/từ chối đơn thuộc Homestay của mình. Từ chối sẽ tự động hoàn tiền nếu đã PAID (UC-06).
      </p>

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['PENDING', 'CONFIRM', 'REJECTED', 'CANCELLED', 'ALL'].map((s) => (
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
      ) : bookings.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--color-text-light)' }}>Không có đơn nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map((b) => {
            const st = statusStyle[b.status] || statusStyle.PENDING;
            return (
              <div
                key={b.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>
                      {b.bookingCode} · {b.homestayTitle || 'Homestay'}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                      {b.homestayCity || '—'}
                    </div>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: st.bg,
                    color: st.color
                  }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <User size={16} style={{ marginTop: 2 }} />
                    <div>
                      <div><strong>{b.guestFullName || 'Khách'}</strong></div>
                      <div style={{ color: 'var(--color-text-light)' }}>{b.guestEmail}</div>
                      <div style={{ color: 'var(--color-text-light)' }}>{b.guestPhone || '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Calendar size={16} />
                    <span>{b.checkinDate} → {b.checkoutDate} · {b.totalGuests} khách</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <CreditCard size={16} style={{ marginTop: 2 }} />
                    <div>
                      <div><strong>{Number(b.totalPrice || 0).toLocaleString('vi-VN')} ₫</strong></div>
                      <div style={{ color: 'var(--color-text-light)' }}>
                        {b.paymentStatus ? paymentLabel[b.paymentStatus] || b.paymentStatus : 'Chưa thanh toán'}
                      </div>
                      {b.paymentStatus === 'REFUNDED' && (
                        <div style={{ color: '#166534', fontSize: '0.8rem' }}>
                          Hoàn về: {b.refundBankAccount || 'Chưa có STK'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {b.note && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--color-background-alt)', padding: '10px 12px', borderRadius: 8 }}>
                    <StickyNote size={16} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ghi chú khách</div>
                      <div style={{ fontSize: '0.875rem' }}>{b.note}</div>
                    </div>
                  </div>
                )}

                {b.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId === b.id}
                      onClick={() => handleConfirm(b.id)}
                      style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={16} /> Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => handleReject(b.id)}
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
                      <X size={16} /> Từ chối + Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HostBookings;
