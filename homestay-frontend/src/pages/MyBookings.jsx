import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import { Calendar, MapPin, CreditCard } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingService.getMyBookings();
        setBookings(res.data);
      } catch (err) {
        console.error('Lỗi khi tải lịch sử đơn hàng', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFF3CD', color: '#856404', text: 'Chờ duyệt' };
      case 'CONFIRM': return { bg: '#D4EDDA', color: '#155724', text: 'Đã xác nhận' };
      case 'REJECTED': return { bg: '#F8D7DA', color: '#721C24', text: 'Bị từ chối' };
      case 'CANCELLED': return { bg: '#E2E3E5', color: '#383D41', text: 'Đã hủy' };
      case 'COMPLETED': return { bg: '#CCE5FF', color: '#004085', text: 'Đã hoàn thành' };
      default: return { bg: '#E2E3E5', color: '#383D41', text: status };
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 0' }}>Đang tải lịch sử đặt phòng...</div>;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ marginBottom: '24px' }}>Chuyến đi của tôi</h1>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '16px' }}>Bạn chưa có chuyến đi nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((b) => {
            const statusStyle = getStatusStyle(b.status);
            return (
              <div key={b.id} style={{ display: 'flex', gap: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-dark)' }}>{b.homestay?.title || 'Homestay'}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {statusStyle.text}
                    </span>
                  </div>

                  {b.createdAt && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '12px' }}>
                      Được đặt vào lúc: {new Date(b.createdAt).toLocaleString('vi-VN')}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                    <MapPin size={16} />
                    <span>{b.homestay?.city || 'Không rõ'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', marginBottom: '16px' }}>
                    <Calendar size={16} />
                    <span>{b.checkinDate} — {b.checkoutDate} ({b.totalGuests} khách)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--color-text-dark)' }}>
                    <CreditCard size={18} color="var(--color-primary)" />
                    <span>Tổng tiền: {b.totalPrice?.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
