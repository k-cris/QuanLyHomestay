import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { hostService, uploadService, amenityService } from '../services/api';
import { Edit, Trash2, Plus, X, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_REFUND_RULES, formatHoursAsDaysLabel } from '../utils/refundPolicy';
import { usePagination } from '../hooks/usePagination';
import { useResponsivePageSize } from '../hooks/useResponsivePageSize';
import ListPagination from '../components/ListPagination';

const emptyForm = {
  title: '',
  description: '',
  address: '',
  city: '',
  pricePerNight: 0,
  maxGuests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  images: [{ imageUrl: '' }],
  amenityIds: [],
  refundRules: DEFAULT_REFUND_RULES.map((r) => ({ ...r }))
};

const HostDashboard = () => {
  const pageSize = useResponsivePageSize();
  const [homestays, setHomestays] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentHomestay, setCurrentHomestay] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, status: null, title: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Calendar Modal State
  const [calendarModal, setCalendarModal] = useState({ show: false, homestayId: null, homestayTitle: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateBookings, setDateBookings] = useState([]);

  const {
    page,
    setPage,
    totalPages,
    pageItems,
    canPrevious,
    canNext
  } = usePagination({
    items: homestays,
    pageSize,
    resetKey: 'host-homestays'
  });

  const fetchHomestays = async () => {
    try {
      setLoading(true);
      const res = await hostService.getMyHomestays();
      setHomestays(res.data);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách homestay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomestays();
    amenityService.getAll()
      .then((res) => setAmenities(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleOpenModal = (homestay = null) => {
    if (homestay) {
      setCurrentHomestay(homestay);
      const rules = (homestay.refundRules || []).length
        ? [...homestay.refundRules]
            .sort((a, b) => (b.minHoursBefore || 0) - (a.minHoursBefore || 0))
            .map((r) => ({
              minHoursBefore: r.minHoursBefore ?? 0,
              refundPercent: r.refundPercent ?? 0
            }))
        : DEFAULT_REFUND_RULES.map((r) => ({ ...r }));
      setFormData({
        title: homestay.title || '',
        description: homestay.description || '',
        address: homestay.address || '',
        city: homestay.city || '',
        pricePerNight: homestay.pricePerNight || 0,
        maxGuests: homestay.maxGuests || 1,
        bedrooms: homestay.bedrooms ?? 1,
        beds: homestay.beds ?? 1,
        bathrooms: homestay.bathrooms ?? 1,
        images: homestay.images?.length > 0 ? homestay.images : [{ imageUrl: '' }],
        amenityIds: (homestay.amenities || []).map((a) => a.id),
        refundRules: rules
      });
    } else {
      setCurrentHomestay(null);
      setFormData({
        ...emptyForm,
        images: [{ imageUrl: '' }],
        amenityIds: [],
        refundRules: DEFAULT_REFUND_RULES.map((r) => ({ ...r }))
      });
    }
    setShowModal(true);
  };

  const handleImageChange = (index, val) => {
    const newImages = [...formData.images];
    newImages[index].imageUrl = val;
    setFormData({ ...formData, images: newImages });
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    try {
      const res = await uploadService.uploadFile(file);
      const url = res.data.startsWith('http') ? res.data : `http://localhost:8080${res.data}`;
      handleImageChange(index, url);
    } catch (err) {
      alert('Lỗi tải ảnh lên');
      console.error(err);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    if (newImages.length === 0) newImages.push({ imageUrl: '' });
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, { imageUrl: '' }] });
  };

  const toggleAmenity = (id) => {
    const exists = formData.amenityIds.includes(id);
    setFormData({
      ...formData,
      amenityIds: exists
        ? formData.amenityIds.filter((x) => x !== id)
        : [...formData.amenityIds, id]
    });
  };

  const updateRefundRule = (index, field, value) => {
    const next = [...formData.refundRules];
    next[index] = { ...next[index], [field]: value };
    setFormData({ ...formData, refundRules: next });
  };

  const addRefundRule = () => {
    setFormData({
      ...formData,
      refundRules: [...formData.refundRules, { minHoursBefore: 0, refundPercent: 80 }]
    });
  };

  const removeRefundRule = (index) => {
    const next = formData.refundRules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      refundRules: next.length ? next : [{ minHoursBefore: 0, refundPercent: 80 }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        pricePerNight: formData.pricePerNight,
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        images: formData.images.filter((i) => i.imageUrl && i.imageUrl.trim() !== ''),
        amenities: formData.amenityIds.map((id) => ({ id })),
        refundRules: formData.refundRules.map((r) => ({
          minHoursBefore: Number(r.minHoursBefore) || 0,
          refundPercent: Number(r.refundPercent) || 0
        }))
      };

      if (currentHomestay) {
        await hostService.updateHomestay(currentHomestay.id, dataToSubmit);
        alert('Cập nhật thành công!');
      } else {
        await hostService.createHomestay(dataToSubmit);
        alert('Thêm mới thành công!');
      }
      setShowModal(false);
      fetchHomestays();
    } catch (err) {
      alert(err.response?.data || 'Có lỗi xảy ra');
    }
  };

  const confirmToggleStatus = async () => {
    const { id, status } = confirmModal;
    const actionName = status === 'INACTIVE' ? 'ẩn' : 'mở bán lại';
    try {
      await hostService.updateStatus(id, status);
      toast.success(`${status === 'INACTIVE' ? 'Ẩn' : 'Mở bán'} homestay thành công!`);
      fetchHomestays();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      toast.error(err.response?.data || `Không thể ${actionName} homestay này`);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setConfirmModal({ show: false, id: null, status: null, title: '' });
    }
  };

  const openCalendar = (homestay) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    setCalendarModal({ show: true, homestayId: homestay.id, homestayTitle: homestay.title });
    setCalendarMonth(currentMonth);
    setCalendarYear(currentYear);
    setSelectedDate(null);
    setDateBookings([]);
    fetchCalendarBookings(homestay.id, currentMonth, currentYear);
  };

  const fetchCalendarBookings = async (id, month, year) => {
    try {
      const res = await hostService.getCalendar(id, month, year);
      setCalendarBookings(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch đặt phòng');
    }
  };

  const handleMonthChange = (offset) => {
    let newMonth = calendarMonth + offset;
    let newYear = calendarYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    else if (newMonth < 1) { newMonth = 12; newYear--; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
    fetchCalendarBookings(calendarModal.homestayId, newMonth, newYear);
    setSelectedDate(null);
    setDateBookings([]);
  };

  const handleDayClick = async (day) => {
    if (!day) return;
    const dStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dStr);
    try {
      const res = await hostService.getBookingsByDate(calendarModal.homestayId, dStr);
      setDateBookings(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Không thể tải thông tin đặt phòng cho ngày này');
    }
  };

  const isDayOccupied = (day) => {
    if (!day) return false;
    const dStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarBookings.some(b => {
      // Booking occupies if checkinDate <= day AND checkoutDate > day
      return dStr >= b.checkinDate && dStr < b.checkoutDate;
    });
  };

  const getDaysInMonth = (month, year) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0(Sun) - 6(Sat)
    let startOffset = firstDayIndex - 1;
    if (startOffset < 0) startOffset = 6; // Mon=0 ... Sun=6
    
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  if (loading) return <div className="container page">Đang tải...</div>;

  return (
    <div className="container page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Quản lý phòng (Host)</h1>
        <div className="page-actions">
          <Link to="/host/bookings" className="btn btn-outline btn-sm">
            Đơn đặt phòng
          </Link>
          <Link to="/host/stats" className="btn btn-outline btn-sm">
            Thống kê
          </Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenModal()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Thêm Homestay
          </button>
        </div>
      </div>

      

      {homestays.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>Bạn chưa đăng Homestay nào.</p>
        </div>
      ) : (
        <>
          <div className="list-stack">
            {pageItems.map((h) => (
              <div key={h.id} className="list-card host-list-item">
                <img
                  className="list-card-thumb"
                  src={h.images?.[0]?.imageUrl || 'https://placehold.co/100x100?text=No+Image'}
                  alt="Thumbnail"
                />
                <div className="list-card-body">
                  <div className="list-card-title-row">
                    <h3>
                      {h.title}
                      <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4, background: h.status === 'INACTIVE' ? '#FEE2E2' : '#DCFCE7', color: h.status === 'INACTIVE' ? '#B91C1C' : '#166534', marginLeft: 8, verticalAlign: 'middle', fontWeight: 500 }}>
                        {h.status === 'INACTIVE' ? 'Đã ẩn' : 'Đang hoạt động'}
                      </span>
                    </h3>
                  </div>
                  <div className="list-card-meta">
                    {h.city} · Tối đa {h.maxGuests} khách · {h.bedrooms ?? 0} PN · {h.beds ?? 0} giường · {h.bathrooms ?? 0} PT
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: 8 }}>
                    {Number(h.pricePerNight).toLocaleString('vi-VN')} ₫ / đêm
                  </div>
                </div>
                <div className="list-card-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleOpenModal(h)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Edit size={16} /> Sửa
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openCalendar(h)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} /> Xem lịch
                  </button>
                  {h.status !== 'INACTIVE' ? (
                    <button type="button" className="btn-danger-soft" onClick={() => setConfirmModal({ show: true, id: h.id, status: 'INACTIVE', title: h.title })}>
                      <Trash2 size={16} /> Ẩn (Ngừng bán)
                    </button>
                  ) : (
                    <button type="button" className="btn-success-soft" onClick={() => setConfirmModal({ show: true, id: h.id, status: 'ACTIVE', title: h.title })}>
                      <RefreshCw size={16} /> Mở bán lại
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 32px)', borderRadius: '12px', width: 'min(92vw, 680px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2>{currentHomestay ? 'Sửa Homestay' : 'Thêm Homestay Mới'}</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tên Homestay *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Thành phố *</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Địa chỉ chi tiết *</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Giá mỗi đêm (VNĐ) *</label>
                  <input type="number" min="0" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số khách tối đa *</label>
                  <input type="number" min="1" value={formData.maxGuests} onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
              </div>

              <div className="form-grid-3">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phòng ngủ *</label>
                  <input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Giường *</label>
                  <input type="number" min="0" value={formData.beds} onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phòng tắm *</label>
                  <input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Mô tả</label>
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tiện nghi cung cấp</label>
                <div className="form-grid-2">
                  {amenities.map((a) => {
                    const checked = formData.amenityIds.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: checked ? '#FFF1F2' : '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAmenity(a.id)}
                        />
                        {a.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Chính sách hoàn tiền *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formData.refundRules.map((rule, index) => (
                    <div key={index} className="form-grid-3" style={{ alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 500 }}>
                          Trước ít nhất (giờ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rule.minHoursBefore}
                          onChange={(e) => updateRefundRule(index, 'minHoursBefore', parseInt(e.target.value, 10) || 0)}
                          required
                          style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: 4 }}>
                          ≈ {formatHoursAsDaysLabel(rule.minHoursBefore)} với khách
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', fontWeight: 500 }}>
                          Hoàn (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rule.refundPercent}
                          onChange={(e) => updateRefundRule(index, 'refundPercent', parseInt(e.target.value, 10) || 0)}
                          required
                          style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRefundRule(index)}
                        style={{
                          padding: '12px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#FEE2E2',
                          color: '#B91C1C',
                          cursor: 'pointer',
                          height: 46
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRefundRule}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 8
                  }}
                >
                  + Thêm mức hoàn tiền
                </button>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Hình ảnh</label>
                {formData.images.map((img, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e.target.files[0])} style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                    {img.imageUrl && <img src={img.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <button type="button" onClick={() => handleRemoveImage(index)} style={{ padding: '8px', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa ảnh này">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addImageField} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>+ Thêm ảnh khác</button>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Lưu thông tin</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for Status Toggle */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: 'min(90vw, 420px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', transform: 'scale(1)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {confirmModal.status === 'INACTIVE' ? (
                <><Trash2 size={24} color="#B91C1C" /> Xác nhận ẩn Homestay</>
              ) : (
                <><RefreshCw size={24} color="#16A34A" /> Xác nhận mở bán lại</>
              )}
            </h2>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
              Bạn đang thao tác với Homestay: <strong>{confirmModal.title}</strong>
              <br /><br />
              {confirmModal.status === 'INACTIVE' 
                ? 'Việc ẩn homestay sẽ khiến nó không xuất hiện trên hệ thống và không thể nhận thêm khách mới. Các đơn đặt phòng hiện tại (PENDING / CONFIRM) vẫn sẽ được giữ nguyên.' 
                : 'Mở bán lại sẽ cho phép homestay xuất hiện trở lại trên hệ thống và có thể tiếp tục nhận đơn đặt phòng mới.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setConfirmModal({ show: false, id: null, status: null, title: '' })}
                style={{ padding: '10px 20px', borderRadius: '8px' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className={confirmModal.status === 'INACTIVE' ? 'btn-danger-soft' : 'btn-success-soft'} 
                onClick={confirmToggleStatus}
                style={{ padding: '10px 20px', borderRadius: '8px', background: confirmModal.status === 'INACTIVE' ? '#EF4444' : '#10B981', color: '#fff' }}
              >
                {confirmModal.status === 'INACTIVE' ? 'Đồng ý Ẩn' : 'Đồng ý Mở bán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {calendarModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: 'min(92vw, 800px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>Lịch đặt phòng</h2>
                <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{calendarModal.homestayTitle}</div>
              </div>
              <X style={{ cursor: 'pointer' }} onClick={() => setCalendarModal({ show: false, homestayId: null, homestayTitle: '' })} />
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {/* Calendar Section */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button type="button" onClick={() => handleMonthChange(-1)} style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#fff' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <div style={{ fontWeight: 600 }}>Tháng {calendarMonth} / {calendarYear}</div>
                  <button type="button" onClick={() => handleMonthChange(1)} style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#fff' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>
                  <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {getDaysInMonth(calendarMonth, calendarYear).map((day, i) => {
                    if (!day) return <div key={i} style={{ padding: '12px', border: '1px solid transparent' }} />;
                    
                    const occupied = isDayOccupied(day);
                    const dStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDate === dStr;
                    
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        style={{
                          padding: '10px 0',
                          border: `2px solid ${isSelected ? 'var(--color-text-dark)' : 'var(--color-border)'}`,
                          borderRadius: '8px',
                          background: occupied ? '#FEE2E2' : '#fff',
                          color: occupied ? '#B91C1C' : 'inherit',
                          fontWeight: occupied || isSelected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#fff', border: '1px solid var(--color-border)' }}></span> Trống</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#FEE2E2' }}></span> Đã đặt</div>
                </div>
              </div>

              {/* Day Details Section */}
              <div style={{ flex: '1 1 300px', background: 'var(--color-background-alt)', padding: '20px', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>
                  {selectedDate ? `Đơn đặt phòng ngày ${selectedDate.split('-').reverse().join('/')}` : 'Chọn một ngày để xem'}
                </h3>
                
                {!selectedDate ? (
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: 0 }}>Vui lòng nhấn vào một ngày trên lịch.</p>
                ) : dateBookings.length === 0 ? (
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: 0 }}>Không có đặt phòng nào (đã duyệt) trong ngày này.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dateBookings.map((b) => (
                      <div key={b.id} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <strong style={{ color: 'var(--color-primary)' }}>Mã: {b.bookingCode}</strong>
                          <span className="status-pill" style={{ background: '#DCFCE7', color: '#166534' }}>{b.status}</span>
                        </div>
                        <div style={{ marginBottom: 4 }}><strong>Khách:</strong> {b.guest?.fullName || 'Khách'} ({b.totalGuests} người)</div>
                        <div style={{ marginBottom: 4 }}><strong>Thời gian:</strong> {b.checkinDate} tới {b.checkoutDate}</div>
                        <div><strong>Tổng tiền:</strong> {b.totalPrice?.toLocaleString('vi-VN')} ₫</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
