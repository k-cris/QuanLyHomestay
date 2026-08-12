import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hostService, uploadService, amenityService } from '../services/api';
import { Edit, Trash2, Plus, X } from 'lucide-react';

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
  amenityIds: []
};

const HostDashboard = () => {
  const [homestays, setHomestays] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentHomestay, setCurrentHomestay] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
        amenityIds: (homestay.amenities || []).map((a) => a.id)
      });
    } else {
      setCurrentHomestay(null);
      setFormData({ ...emptyForm, images: [{ imageUrl: '' }], amenityIds: [] });
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
        amenities: formData.amenityIds.map((id) => ({ id }))
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

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa homestay này? Không thể khôi phục! (Chỉ được xóa nếu không có đơn đặt phòng nào đang PENDING/CONFIRM)')) {
      try {
        await hostService.deleteHomestay(id);
        alert('Xóa thành công');
        fetchHomestays();
      } catch (err) {
        alert(err.response?.data || 'Không thể xóa homestay này');
      }
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 0' }}>Đang tải...</div>;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Quản lý phòng (Host)</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/host/bookings" className="btn btn-outline" style={{ padding: '10px 16px' }}>
            Đơn đặt phòng
          </Link>
          <Link to="/host/stats" className="btn btn-outline" style={{ padding: '10px 16px' }}>
            Thống kê
          </Link>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Thêm Homestay
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {homestays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--color-text-light)' }}>Bạn chưa đăng Homestay nào.</p>
          </div>
        ) : (
          homestays.map((h) => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <img src={h.images?.[0]?.imageUrl || 'https://placehold.co/100x100?text=No+Image'} alt="Thumbnail" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <h3 style={{ marginBottom: '8px' }}>{h.title}</h3>
                  <div style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                    {h.city} · Tối đa {h.maxGuests} khách · {h.bedrooms ?? 0} PN · {h.beds ?? 0} giường · {h.bathrooms ?? 0} PT
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: '8px' }}>{Number(h.pricePerNight).toLocaleString('vi-VN')} ₫ / đêm</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleOpenModal(h)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit size={16} /> Sửa
                </button>
                <button onClick={() => handleDelete(h.id)} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#FEE2E2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
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

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Giá mỗi đêm (VNĐ) *</label>
                  <input type="number" min="0" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số khách tối đa *</label>
                  <input type="number" min="1" value={formData.maxGuests} onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 10 }}>Tick các tiện nghi để hiển thị cho khách trên trang chi tiết</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
    </div>
  );
};

export default HostDashboard;
