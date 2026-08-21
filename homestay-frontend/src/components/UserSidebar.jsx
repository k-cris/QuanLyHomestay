import React, { useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Home,
  Building2,
  CalendarCheck,
  ClipboardList,
  UserRound,
  Handshake,
  X,
  Banknote,
  Undo2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const linkClass = (active) =>
  `user-sidebar-link${active ? ' is-active' : ''}`;

const UserSidebar = ({ open, onClose }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    const isDrawer = window.matchMedia('(max-width: 1023px)').matches;
    if (open && isDrawer) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  if (!user) return null;

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <div
        className={`user-sidebar-overlay${open ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`user-sidebar${open ? ' is-open' : ''}`}
        aria-label="Menu người dùng"
      >
        <div className="user-sidebar-header">
          <div>
            <div className="user-sidebar-name">{user.fullName || 'Người dùng'}</div>
            <div className="user-sidebar-role">{user.role}</div>
          </div>
          <button type="button" className="user-sidebar-close" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>

        <nav
          className="user-sidebar-nav"
          onClick={() => {
            if (window.matchMedia('(max-width: 1023px)').matches) onClose();
          }}
        >
          <Link to="/" className={linkClass(isActive('/'))}>
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>

          <Link to="/profile" className={linkClass(isActive('/profile'))}>
            <UserRound size={18} />
            <span>Hồ sơ / STK</span>
          </Link>

          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={linkClass(
                location.pathname === '/admin' || location.pathname.startsWith('/admin/host-requests')
              )}
            >
              <LayoutDashboard size={18} />
              <span>Duyệt Host</span>
            </Link>
          )}

          {user.role === 'HOST' && (
            <>
              <Link to="/host" className={linkClass(location.pathname === '/host')}>
                <Building2 size={18} />
                <span>Quản lý phòng</span>
              </Link>
              <Link to="/host/bookings" className={linkClass(isActive('/host/bookings'))}>
                <ClipboardList size={18} />
                <span>Đơn đặt phòng</span>
              </Link>
              <Link to="/host/refunds" className={linkClass(isActive('/host/refunds'))}>
                <Undo2 size={18} />
                <span>Hoàn tiền</span>
              </Link>
            </>
          )}

          {user.role === 'USER' && (
            <Link to="/become-host" className={linkClass(isActive('/become-host'))}>
              <Handshake size={18} />
              <span>Đón tiếp khách</span>
            </Link>
          )}

          <Link to="/my-bookings" className={linkClass(isActive('/my-bookings'))}>
            <CalendarCheck size={18} />
            <span>Lịch sử đặt phòng</span>
          </Link>

          <Link to="/my-refunds" className={linkClass(isActive('/my-refunds'))}>
            <Banknote size={18} />
            <span>Hoàn tiền của tôi</span>
          </Link>

          {user.role === 'ADMIN' && (
            <Link to="/admin/stats" className={linkClass(isActive('/admin/stats'))}>
              <BarChart3 size={18} />
              <span>Thống kê</span>
            </Link>
          )}

          {user.role === 'HOST' && (
            <Link to="/host/stats" className={linkClass(isActive('/host/stats'))}>
              <BarChart3 size={18} />
              <span>Thống kê</span>
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;
