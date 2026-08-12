import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, Wifi, Car, Coffee, Tv, Wind, Waves, UtensilsCrossed,
  WashingMachine, Home, Flame, Ban, CheckCircle2, X
} from 'lucide-react';
import { homestayService, bookingService, paymentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const amenityIconMap = {
  wifi: Wifi,
  car: Car,
  coffee: Coffee,
  tv: Tv,
  wind: Wind,
  waves: Waves,
  utensils: UtensilsCrossed,
  'washing-machine': WashingMachine,
  home: Home,
  flame: Flame,
  ban: Ban
};

const HomestayDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [homestay, setHomestay] = useState(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState({ type: '', text: '' });
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await homestayService.getById(id);
        setHomestay(res.data);
      } catch (error) {
        console.error('Error fetching homestay detail', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const todayStr = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingStatus({ type: '', text: '' });

    if (!user) {
      setBookingStatus({ type: 'error', text: 'Bạn cần đăng nhập để đặt phòng!' });
      return;
    }
    if (!user.hasBankAccount) {
      setBookingStatus({
        type: 'error',
        text: 'Bạn cần cập nhật tài khoản ngân hàng để hệ thống hoàn tiền khi đơn không hoàn thành.'
      });
      return;
    }
    if (!checkIn || !checkOut) {
      setBookingStatus({ type: 'error', text: 'Vui lòng chọn ngày nhận và trả phòng' });
      return;
    }
    if (checkIn < todayStr) {
      setBookingStatus({ type: 'error', text: 'Ngày nhận phòng phải lớn hơn hoặc bằng ngày hôm nay' });
      return;
    }

    const timeIn = new Date(checkIn).getTime();
    const timeOut = new Date(checkOut).getTime();
    if (timeOut <= timeIn) {
      setBookingStatus({ type: 'error', text: 'Ngày trả phòng phải sau ngày nhận phòng' });
      return;
    }

    try {
      setCreating(true);
      const bookingRes = await bookingService.create({
        homestayId: homestay.id,
        checkinDate: checkIn,
        checkoutDate: checkOut,
        totalGuests: guests,
        note: note.trim() || null
      });

      const createdBooking = bookingRes.data;
      if (!createdBooking.hostBankAccount) {
        setBookingStatus({
          type: 'error',
          text: 'Chủ Homestay chưa cập nhật tài khoản nhận tiền. Không thể thanh toán.'
        });
        return;
      }

      setPendingBooking(createdBooking);
      setBookingStatus({ type: '', text: '' });
    } catch (error) {
      setBookingStatus({
        type: 'error',
        text: error.response?.data || 'Không thể tạo đơn đặt phòng'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;
    try {
      setPaying(true);
      const res = await paymentService.create({
        bookingId: pendingBooking.id,
        paymentMethod: 'BANK_TRANSFER'
      });
      setPendingBooking(null);
      setCheckIn('');
      setCheckOut('');
      setNote('');
      setBookingStatus({
        type: 'success',
        text: `Thanh toán thành công! Mã đơn ${pendingBooking.bookingCode}. Đã chuyển tới STK chủ nhà ${res.data.receiverBankAccount}. Đơn đang chờ Host duyệt.`
      });
    } catch (error) {
      setBookingStatus({
        type: 'error',
        text: error.response?.data || 'Thanh toán thất bại'
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading || !homestay) return <div className="container detail-page">Đang tải...</div>;

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const timeIn = new Date(checkIn).getTime();
    const timeOut = new Date(checkOut).getTime();
    if (timeOut <= timeIn) return 0;
    const diffDays = Math.ceil((timeOut - timeIn) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays * homestay.pricePerNight : 0;
  };

  const maxGuests = homestay.maxGuests || 1;
  const amenities = homestay.amenities || [];

  return (
    <div className="container detail-page">
      <div className="detail-header">
        <h1>{homestay.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, textDecoration: 'underline' }}>
          <Star size={16} fill="var(--color-text-dark)" color="var(--color-text-dark)" />
          <span>{homestay.averageRating ?? '—'}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span>{homestay.city}</span>
        </div>
      </div>

      <div className="detail-gallery">
        {homestay.images && homestay.images.slice(0, 5).map((img, index) => (
          <img key={index} src={typeof img === 'string' ? img : img.imageUrl} alt={`Hình ${index + 1}`} />
        ))}
      </div>

      <div className="detail-content">
        <div className="detail-info">
          <div className="detail-section">
            <h2>Toàn bộ căn nhà - Chủ nhà {homestay.host?.fullName || 'Chưa rõ'}</h2>
            <p style={{ color: 'var(--color-text-light)' }}>
              Tối đa {maxGuests} khách
              {' · '}{homestay.bedrooms ?? 0} phòng ngủ
              {' · '}{homestay.beds ?? 0} giường
              {' · '}{homestay.bathrooms ?? 0} phòng tắm
            </p>
          </div>

          <div className="detail-section">
            <h3 style={{ marginBottom: '16px' }}>Giới thiệu</h3>
            <p>{homestay.description}</p>
          </div>

          <div className="detail-section">
            <h3 style={{ marginBottom: '16px' }}>Tiện nghi cung cấp</h3>
            {amenities.length === 0 ? (
              <p style={{ color: 'var(--color-text-light)' }}>Chủ nhà chưa cập nhật tiện nghi.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {amenities.map((a) => {
                  const Icon = amenityIconMap[a.icon] || CheckCircle2;
                  return (
                    <div key={a.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Icon size={20} /> {a.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="booking-card">
            <div className="booking-card-price">
              {Number(homestay.pricePerNight).toLocaleString('vi-VN')} ₫ <span style={{ fontWeight: 400, fontSize: '1rem' }}>/ đêm</span>
            </div>

            {user && !user.hasBankAccount && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 16,
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.875rem'
              }}>
                Cần cập nhật STK nhận hoàn tiền trước khi đặt phòng.{' '}
                <Link to="/profile" style={{ fontWeight: 700, textDecoration: 'underline' }}>Cập nhật ngay</Link>
              </div>
            )}

            {bookingStatus.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: bookingStatus.type === 'error' ? '#FFF1F2' : '#F0FDF4',
                color: bookingStatus.type === 'error' ? '#E11D48' : '#16A34A',
                border: `1px solid ${bookingStatus.type === 'error' ? '#FECDD3' : '#BBF7D0'}`,
                fontSize: '0.875rem'
              }}>
                {bookingStatus.text}
                {bookingStatus.type === 'error' && String(bookingStatus.text).includes('tài khoản ngân hàng') && (
                  <div style={{ marginTop: 8 }}>
                    <Link to="/profile" style={{ textDecoration: 'underline', fontWeight: 600 }}>Đi tới hồ sơ</Link>
                  </div>
                )}
                {bookingStatus.type === 'success' && (
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => navigate('/my-bookings')} style={{ textDecoration: 'underline', color: '#15803D', fontWeight: 600 }}>
                      Xem lịch sử chuyến đi
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleBooking}>
              <div className="booking-form">
                <div className="booking-dates">
                  <input
                    type="date"
                    className="booking-input"
                    value={checkIn}
                    min={todayStr}
                    onChange={(e) => {
                      const nextCheckIn = e.target.value;
                      setCheckIn(nextCheckIn);
                      if (checkOut && checkOut <= nextCheckIn) setCheckOut('');
                    }}
                    required
                  />
                  <input
                    type="date"
                    className="booking-input"
                    value={checkOut}
                    min={checkIn || todayStr}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                  />
                </div>
                <select
                  className="booking-guest"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                >
                  {[...Array(maxGuests)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} khách</option>
                  ))}
                </select>
              </div>

              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho chủ nhà (tuỳ chọn)"
                style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid var(--color-border)' }}
              />

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
                {!user ? 'Đăng nhập để đặt phòng' : creating ? 'Đang tạo đơn...' : 'Đặt phòng & Thanh toán'}
              </button>
            </form>

            {calculateTotal() > 0 && (
              <div className="booking-total">
                <span>Tổng trước thuế</span>
                <span>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Thanh toán chuyển khoản</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setPendingBooking(null)} />
            </div>

            <p style={{ color: 'var(--color-text-light)', marginBottom: 16, fontSize: '0.9rem' }}>
              Chuyển khoản đúng số tiền tới tài khoản chủ nhà. Nội dung: <strong>{pendingBooking.bookingCode}</strong>
            </p>

            <div style={{
              background: 'var(--color-background-alt)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
              lineHeight: 1.8
            }}>
              <div><strong>Ngân hàng:</strong> {pendingBooking.hostBankName}</div>
              <div><strong>Chủ TK:</strong> {pendingBooking.hostBankHolder}</div>
              <div><strong>Số TK:</strong> {pendingBooking.hostBankAccount}</div>
              <div><strong>Số tiền:</strong> {Number(pendingBooking.totalPrice || 0).toLocaleString('vi-VN')} ₫</div>
              <div><strong>Nội dung CK:</strong> {pendingBooking.bookingCode}</div>
            </div>

            <div style={{
              background: '#EFF6FF',
              color: '#1E40AF',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.85rem',
              marginBottom: 16
            }}>
              Nếu Host từ chối đơn, hệ thống sẽ hoàn tiền về STK của bạn:
              {' '}{user?.bankName} · {user?.bankHolder} · {user?.bankAccount}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={paying}
              onClick={handleConfirmPayment}
            >
              {paying ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomestayDetail;
