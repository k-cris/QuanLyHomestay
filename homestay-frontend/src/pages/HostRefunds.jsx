import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock, CheckCircle2, User, CreditCard } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { refundService } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import { useResponsivePageSize } from '../hooks/useResponsivePageSize';
import ListPagination from '../components/ListPagination';

const statusStyle = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', label: 'Chờ chuyển khoản' },
  SENT: { bg: '#DBEAFE', color: '#1E40AF', label: 'Đã chuyển khoản' },
  CONFIRMED: { bg: '#DCFCE7', color: '#166534', label: 'Khách đã nhận' }
};

const HostRefunds = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const pageSize = useResponsivePageSize();

  const [refunds, setRefunds] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

  const {
    page, setPage, totalPages, pageItems, canPrevious, canNext
  } = usePagination({ items: refunds, pageSize, resetKey: filter });

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await refundService.getHostRefunds();
      let data = res.data || [];
      if (filter !== 'ALL') {
        data = data.filter(r => r.status === filter);
      }
      setRefunds(data);
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Không tải được danh sách hoàn tiền');
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
    fetchRefunds();
  }, [user, filter]);

  const handleConfirmSent = (id) => {
    setConfirmModal({ show: true, id });
  };

  const executeConfirmAction = async () => {
    const { id } = confirmModal;
    setConfirmModal({ show: false, id: null });
    if (!id) return;

    try {
      setBusyId(id);
      await refundService.confirmSent(id);
      toast.success('Đã xác nhận chuyển tiền thành công!');
      await fetchRefunds();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Xác nhận thất bại');
    } finally {
      setBusyId(null);
    }
  };

  if (!user || (user.role !== 'HOST' && user.role !== 'ADMIN')) return null;

  return (
    <div className="container page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Quản lý Hoàn tiền (Refund)</h1>
      </div>

      <div className="filter-bar">
        {['PENDING', 'SENT', 'CONFIRMED', 'ALL'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
          >
            {s === 'PENDING' ? 'Cần chuyển khoản' : s === 'SENT' ? 'Chờ khách xác nhận' : s === 'CONFIRMED' ? 'Hoàn tất' : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : refunds.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>Không có yêu cầu hoàn tiền nào.</p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pageItems.map((r) => {
              const st = statusStyle[r.status] || statusStyle.PENDING;
              return (
                <div key={r.id} className="list-card is-column">
                  <div className="list-card-title-row">
                    <div>
                      <h3 style={{ marginBottom: 6 }}>
                        Mã đơn đặt: {r.bookingCode}
                      </h3>
                      <div className="list-card-meta">
                        Lý do: {r.reason === 'REJECTED' ? 'Host từ chối đơn' : 'Khách hủy đơn'}
                        {' · '}Yêu cầu lúc: {new Date(r.requestedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', fontSize: '0.9rem', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '240px' }}>
                      <CreditCard size={16} style={{ marginTop: 2, flexShrink: 0, color: '#059669' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#059669', fontSize: '1rem' }}>
                          Số tiền cần hoàn: {Number(r.amount || 0).toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="list-card-meta" style={{ marginTop: 4 }}>
                          Ngân hàng: {r.receiverBankName || '—'}<br/>
                          Số TK: {r.receiverBankAccount || '—'}<br/>
                          Chủ TK: {r.receiverBankHolder || '—'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '200px' }}>
                      <User size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div><strong>{r.guestFullName || 'Khách'}</strong></div>
                        <div className="list-card-meta">{r.guestEmail}</div>
                      </div>
                    </div>
                  </div>

                  {r.status === 'PENDING' && (
                    <div className="list-card-actions is-end">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => handleConfirmSent(r.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Xác nhận Đã chuyển khoản
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
            <h3 style={{ margin: '0 0 16px 0' }}>Xác nhận chuyển tiền</h3>
            <p style={{ lineHeight: 1.6, marginBottom: 24 }}>
              Bạn xác nhận đã chuyển khoản số tiền hoàn lại cho khách hàng vào đúng số tài khoản được hiển thị?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setConfirmModal({ show: false, id: null })}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
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

export default HostRefunds;
