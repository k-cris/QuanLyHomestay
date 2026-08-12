import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, UserCircle, Home } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (minPrice) params.append('minPrice', minPrice);
    navigate(`/?${params.toString()}`);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <Home fill="var(--color-primary)" color="var(--color-primary)" size={32} />
          <span>homestay</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch} style={{ gap: '12px', padding: '4px 4px 4px 16px' }}>
          <input
            type="text"
            placeholder="Địa điểm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="search-input-city"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500, fontSize: '0.875rem' }}
          />
          <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }}></div>
          <input
            type="number"
            placeholder="Giá tối thiểu"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="search-input-price"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500, fontSize: '0.875rem' }}
          />
          <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Search size={14} strokeWidth={3} />
          </button>
        </form>

        <div className="navbar-user">
          {user && user.role === 'ADMIN' && (
            <Link to="/admin" className="nav-text-hidden-mobile" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginRight: '16px', color: 'var(--color-primary)' }}>
              Trang Admin
            </Link>
          )}
          {user && user.role === 'HOST' && (
            <Link to="/host" className="nav-text-hidden-mobile" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginRight: '16px', color: 'var(--color-primary)' }}>
              Quản lý phòng
            </Link>
          )}
          {user && (
            <Link to="/my-bookings" className="nav-text-hidden-mobile" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginRight: '16px', color: 'var(--color-primary)' }}>
              Lịch sử đặt phòng
            </Link>
          )}
          <span className="nav-text-hidden-mobile" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Đón tiếp khách
          </span>
          <div className="user-menu-btn">
            <Menu size={18} />
            <UserCircle size={24} color="var(--color-text-light)" />
          </div>
          {user ? (
            <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '8px 16px' }}>
              Đăng xuất ({user.fullName})
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
