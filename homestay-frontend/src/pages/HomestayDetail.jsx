import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Star, Wifi, Car, Coffee, Tv, Wind, Waves, UtensilsCrossed,
  WashingMachine, Home, Flame, Ban, CheckCircle2, X
} from 'lucide-react';
import { homestayService, bookingService, paymentService, reviewService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatHoursAsDaysLabel } from '../utils/refundPolicy';

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
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [res, reviewRes] = await Promise.all([
          homestayService.getById(id),
          reviewService.getByHomestay(id).catch(() => ({ data: [] }))
        ]);
        setHomestay(res.data);
        setReviews(reviewRes.data || []);
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

    if (!user) {
      toast.error('Bạn cần đăng nhập để đặt phòng!');
      return;
    }
    if (!user.hasBankAccount) {
      toast.error('Bạn cần cập nhật tài khoản ngân hàng (tại Hồ sơ) để hệ thống hoàn tiền khi đơn không hoàn thành.');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Vui lòng chọn ngày nhận và trả phòng');
      return;
    }
    if (checkIn < todayStr) {
      toast.error('Ngày nhận phòng phải lớn hơn hoặc bằng ngày hôm nay');
      return;
    }

    const timeIn = new Date(checkIn).getTime();
    const timeOut = new Date(checkOut).getTime();
    if (timeOut <= timeIn) {
      toast.error('Ngày trả phòng phải sau ngày nhận phòng');
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
        toast.error('Chủ Homestay chưa cập nhật tài khoản nhận tiền. Không thể thanh toán.');
        return;
      }

      setPendingBooking(createdBooking);
    } catch (error) {
      toast.error(error.response?.data || 'Không thể tạo đơn đặt phòng');
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
      toast.success(`Thanh toán thành công! Mã đơn ${pendingBooking.bookingCode}. Đã chuyển tới STK chủ nhà ${res.data.receiverBankAccount}. Đơn đang chờ Host duyệt.`, { duration: 5000 });
      navigate('/my-bookings');
    } catch (error) {
      toast.error(error.response?.data || 'Thanh toán thất bại');
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
      <div className="detail-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '8px', color: '#222' }}>
          {homestay.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#222', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={16} fill="#222" color="#222" />
            <span>{homestay.averageRating ?? 'Chưa có đánh giá'}</span>
          </div>
          <span style={{ margin: '0 4px', color: '#717171' }}>·</span>
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{homestay.city}</span>
        </div>
      </div>

      <div className={`detail-gallery gallery-${Math.min(homestay.images?.length || 0, 5)}`}>
        {homestay.images && homestay.images.length > 0 ? (
          homestay.images.slice(0, 5).map((img, index) => (
            <div key={index} className={`gallery-img-wrapper img-${index}`}>
              <img src={typeof img === 'string' ? img : img.imageUrl} alt={`Hình ${index + 1}`} className="gallery-img" />
            </div>
          ))
        ) : (
          <div className="gallery-img-wrapper img-0" style={{ background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#6b7280' }}>Chưa có hình ảnh</span>
          </div>
        )}
      </div>

      <div className="detail-content">
        <div className="detail-info">
          <div className="detail-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>Toàn bộ căn nhà - Chủ nhà {homestay.host?.fullName || 'Chưa rõ'}</h2>
              <p style={{ color: '#717171', fontSize: '1rem', margin: 0 }}>
                Tối đa {maxGuests} khách
                {' · '}{homestay.bedrooms ?? 0} phòng ngủ
                {' · '}{homestay.beds ?? 0} giường
                {' · '}{homestay.bathrooms ?? 0} phòng tắm
              </p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {homestay.host?.avatar ? <img src={homestay.host.avatar} alt="Host Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#9ca3af' }}>{homestay.host?.fullName ? homestay.host.fullName.charAt(0).toUpperCase() : 'H'}</span>}
            </div>
          </div>

          <div className="detail-section">
            <h3 style={{ marginBottom: '16px' }}>Giới thiệu</h3>
            <p>{homestay.description}</p>
          </div>

          <div className="detail-section">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Tiện nghi cung cấp</h3>
            {amenities.length === 0 ? (
              <p style={{ color: '#717171' }}>Chủ nhà chưa cập nhật tiện nghi.</p>
            ) : (
              <div className="form-grid-2" style={{ gap: '16px 24px' }}>
                {amenities.map((a) => {
                  const Icon = amenityIconMap[a.icon] || CheckCircle2;
                  return (
                    <div key={a.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '1rem', color: '#222' }}>
                      <Icon size={24} strokeWidth={1.5} color="#222" /> <span style={{ fontWeight: 400 }}>{a.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Chính sách hoàn tiền khi hủy</h3>
            {(!homestay.refundRules || homestay.refundRules.length === 0) ? (
              <p style={{ color: '#717171' }}>Áp dụng chính sách mặc định của hệ thống.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: '#222' }}>
                {[...homestay.refundRules]
                  .sort((a, b) => (b.minHoursBefore || 0) - (a.minHoursBefore || 0))
                  .map((r, idx) => (
                    <li key={r.id || idx}>
                      Hủy trước từ <strong>{formatHoursAsDaysLabel(r.minHoursBefore)}</strong>
                      {' '}→ hoàn <strong style={{ color: '#e11d48' }}>{r.refundPercent}%</strong>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="detail-section" style={{ borderBottom: 'none' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={20} fill="#222" color="#222" />
              Đánh giá từ khách hàng ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p style={{ color: '#717171' }}>Chưa có đánh giá nào cho Homestay này.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 'bold' }}>
                        {review.guestName ? review.guestName.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{review.guestName}</div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? '#222' : 'transparent'} color={i < review.rating ? '#222' : '#D1D5DB'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="booking-card shadow-airbnb">
            <div className="booking-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '600' }}>{Number(homestay.pricePerNight).toLocaleString('vi-VN')} ₫</span>
              <span style={{ fontWeight: 400, fontSize: '1rem', color: '#717171' }}>/ đêm</span>
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

            <form onSubmit={handleBooking}>
              <div className="booking-form">
                <div className="booking-dates">
                  <div className="booking-input-wrapper">
                    <label className="booking-input-label">Nhận phòng</label>
                    <input
                      type="date"
                      className="booking-input-raw"
                      value={checkIn}
                      min={todayStr}
                      onChange={(e) => {
                        const nextCheckIn = e.target.value;
                        setCheckIn(nextCheckIn);
                        if (checkOut && checkOut <= nextCheckIn) setCheckOut('');
                      }}
                      required
                    />
                  </div>
                  <div className="booking-input-wrapper">
                    <label className="booking-input-label">Trả phòng</label>
                    <input
                      type="date"
                      className="booking-input-raw"
                      value={checkOut}
                      min={checkIn || todayStr}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
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
