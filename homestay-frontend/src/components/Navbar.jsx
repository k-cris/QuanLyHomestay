import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, UserCircle, Home } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UserSidebar from './UserSidebar';

const DESKTOP_SIDEBAR_MQ = '(min-width: 1024px)';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebar, setIsDesktopSidebar] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_SIDEBAR_MQ).matches
  );

  useEffect(() => {
    if (location.pathname === '/') {
      const searchParams = new URLSearchParams(location.search);
      setCity(searchParams.get('city') || '');
      setMinPrice(searchParams.get('minPrice') || '');
    } else {
      setCity('');
      setMinPrice('');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_SIDEBAR_MQ);
    const onChange = (e) => {
      setIsDesktopSidebar(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
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
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <img src="/logo.png" alt="CastleKey Logo" style={{ height: '40px', width: 'auto' }} />
          </Link>

          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Địa điểm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="search-input-city"
            />
            <span className="navbar-search-divider" aria-hidden="true" />
            <input
              type="number"
              placeholder="Giá tối thiểu"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="search-input-price"
            />
            <button type="submit" className="navbar-search-submit" aria-label="Tìm kiếm">
              <Search size={14} strokeWidth={3} />
            </button>
          </form>

          <div className="navbar-user">
            {user?.role === 'USER' && (
              <Link to="/become-host" className="navbar-guest-link">
                Đăng ký kinh doanh
              </Link>
            )}

            {user && !isDesktopSidebar && (
              <button
                type="button"
                className="user-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Mở menu"
                title="Menu"
              >
                <Menu size={18} />
                <UserCircle size={22} color="var(--color-text-light)" />
              </button>
            )}

            {user ? (
              <button type="button" className="btn btn-outline btn-nav" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary btn-nav">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      <UserSidebar open={sidebarOpen || isDesktopSidebar} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
