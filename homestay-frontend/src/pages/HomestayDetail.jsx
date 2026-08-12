import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Wifi, Car, Coffee, Tv, Wind, Waves, UtensilsCrossed,
  WashingMachine, Home, Flame, Ban, CheckCircle2
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
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState({ type: '', message: '' });

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
    setBookingStatus({ type: '', message: '' });

    if (!user) {
      setBookingStatus({ type: 'error', message: 'Bạn cần đăng nhập để đặt phòng!' });
      return;
    }
    if (!checkIn || !checkOut) {
      setBookingStatus({ type: 'error', message: 'Vui lòng chọn ngày nhận và trả phòng' });
      return;
    }

    if (checkIn < todayStr) {
      setBookingStatus({ type: 'error', message: 'Ngày nhận phòng phải lớn hơn hoặc bằng ngày hôm nay' });
      return;
    }

    const timeIn = new Date(checkIn).getTime();
    const timeOut = new Date(checkOut).getTime();

    if (timeOut <= timeIn) {
      setBookingStatus({ type: 'error', message: 'Ngày trả phòng phải sau ngày nhận phòng' });
      return;
    }

    try {
      const bookingRes = await bookingService.create({
        homestayId: homestay.id,
        checkinDate: checkIn,
        checkoutDate: checkOut,
        totalGuests: guests
      });

      const createdBooking = bookingRes.data;

      await paymentService.create({
        bookingId: createdBooking.id,
        paymentMethod: 'BANK_TRANSFER'
      });

      setBookingStatus({
        type: 'success',
        message: `Tuyệt vời! Đặt phòng & Thanh toán thành công! Mã đơn: ${createdBooking.bookingCode}`
      });

      setCheckIn('');
      setCheckOut('');
    } catch (error) {
      setBookingStatus({
        type: 'error',
        message: 'Lỗi: ' + (error.response?.data || 'Phòng đã có người đặt trong thời gian này. Vui lòng chọn ngày khác!')
      });
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

            {bookingStatus.message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: bookingStatus.type === 'error' ? '#FFF1F2' : '#F0FDF4',
                color: bookingStatus.type === 'error' ? '#E11D48' : '#16A34A',
                border: `1px solid ${bookingStatus.type === 'error' ? '#FECDD3' : '#BBF7D0'}`,
                fontSize: '0.875rem'
              }}>
                {bookingStatus.message}
                {bookingStatus.type === 'success' && (
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => navigate('/my-bookings')} style={{ textDecoration: 'underline', color: '#15803D', fontWeight: 600 }}>Xem lịch sử chuyến đi</button>
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
                      if (checkOut && checkOut <= nextCheckIn) {
                        setCheckOut('');
                      }
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {user ? 'Đặt phòng' : 'Đăng nhập để đặt phòng'}
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
    </div>
  );
};

export default HomestayDetail;
