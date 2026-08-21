import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Calendar, User, CreditCard, StickyNote } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { bookingService } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import { useResponsivePageSize } from '../hooks/useResponsivePageSize';
import ListPagination from '../components/ListPagination';

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
  REFUNDED: 'Đang xử lý hoàn tiền'
};

const HostBookings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const pageSize = useResponsivePageSize();

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: '', id: null, title: '', message: '' });

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
    resetKey: filter
  });

  const fetchBookings = async (status = filter) => {
    try {
      setLoading(true);
      const params = status && status !== 'ALL' ? { status } : undefined;
      const res = await bookingService.getHostBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      toast.error(err.response?.data || 'Không tải được danh sách đơn');
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

  const handleConfirm = (id) => {
    setConfirmModal({
      show: true,
      action: 'confirm',
      id,
      title: 'Duyệt đơn',
      message: 'Xác nhận duyệt đơn này?'
    });
  };

  const handleReject = (id) => {
    setConfirmModal({
      show: true,
      action: 'reject',
      id,
      title: 'Từ chối đơn',
      message: 'Từ chối đơn này? Nếu khách đã thanh toán, hệ thống sẽ tạo yêu cầu Hoàn tiền (Refund) để bạn xử lý thủ công sau.'
    });
  };

  const executeConfirmAction = async () => {
    const { action, id } = confirmModal;
    setConfirmModal({ show: false, action: '', id: null, title: '', message: '' });
    
    if (action === 'confirm') {
      try {
        setBusyId(id);
        await bookingService.confirm(id);
        toast.success(`Đã duyệt đơn #${id}`);
        await fetchBookings(filter);
      } catch (err) {
        toast.error(err.response?.data || 'Duyệt thất bại');
      } finally {
        setBusyId(null);
      }
    } else if (action === 'reject') {
      try {
        setBusyId(id);
        const res = await bookingService.reject(id);
        const refunded = res.data?.paymentStatus === 'REFUNDED';
        toast.success(
          refunded
            ? `Đã từ chối đơn #${id} và chuyển sang Hoàn tiền chờ xử lý`
            : `Đã từ chối đơn #${id}`
        );
        await fetchBookings(filter);
      } catch (err) {
        toast.error(err.response?.data || 'Từ chối thất bại');
      } finally {
        setBusyId(null);
      }
    }
  };

  if (!user || (user.role !== 'HOST' && user.role !== 'ADMIN')) return null;

  return (
    <div className="container page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Xử lý đơn đặt phòng</h1>
        <Link to="/host" className="btn btn-outline btn-sm">
          Quản lý Homestay
        </Link>
      </div>

      

      <div className="filter-bar">
        {['PENDING', 'CONFIRM', 'REJECTED', 'CANCELLED', 'ALL'].map((s) => (
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
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>Không có đơn nào.</p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pageItems.map((b) => {
              const st = statusStyle[b.status] || statusStyle.PENDING;
              return (
                <div key={b.id} className="list-card is-column">
                  <div className="list-card-title-row">
                    <div>
                      <h3 style={{ marginBottom: 6 }}>
                        {b.bookingCode} · {b.homestayTitle || 'Homestay'}
                      </h3>
                      <div className="list-card-meta">
                        {b.homestayCity || '—'}
                        {b.createdAt && ` · Đặt lúc ${new Date(b.createdAt).toLocaleString('vi-VN')}`}
                      </div>
                    </div>
                    <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', fontSize: '0.9rem', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '200px' }}>
                      <User size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div><strong>{b.guestFullName || 'Khách'}</strong></div>
                        <div className="list-card-meta">{b.guestEmail}</div>
                        <div className="list-card-meta">{b.guestPhone || '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '240px' }}>
                      <Calendar size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{b.checkinDate} → {b.checkoutDate} <br/> {b.totalGuests} khách</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '160px' }}>
                      <CreditCard size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div><strong>{Number(b.totalPrice || 0).toLocaleString('vi-VN')} ₫</strong></div>
                        <div className="list-card-meta">
                          {b.paymentStatus ? paymentLabel[b.paymentStatus] || b.paymentStatus : 'Chưa thanh toán'}
                        </div>
                        {b.paymentStatus === 'REFUNDED' && (
                          <div style={{ color: '#92400E', fontSize: '0.8rem', marginTop: 4 }}>
                            Cần hoàn về: {b.refundBankAccount || 'Chưa có STK'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {b.note && (
                    <div className="note-box">
                      <StickyNote size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ghi chú khách</div>
                        <div style={{ fontSize: '0.875rem' }}>{b.note}</div>
                      </div>
                    </div>
                  )}

                  {b.status === 'PENDING' && (
                    <div className="list-card-actions is-end">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === b.id}
                        onClick={() => handleConfirm(b.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Duyệt
                      </button>
                      <button
                        type="button"
                        className="btn-danger-soft"
                        disabled={busyId === b.id}
                        onClick={() => handleReject(b.id)}
                      >
                        <X size={16} /> Từ chối + Refund
                      </button>
                    </div>
                  )}
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

      {confirmModal.show && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{confirmModal.title}</h3>
            <p style={{ lineHeight: 1.6, marginBottom: 24 }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setConfirmModal({ show: false, action: '', id: null, title: '', message: '' })}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className={`btn ${confirmModal.action === 'reject' ? 'btn-danger-soft' : 'btn-primary'}`} 
                onClick={executeConfirmAction}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostBookings;
