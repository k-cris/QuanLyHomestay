import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { statsService } from '../services/api';
import RevenueStatsPanel from '../components/RevenueStatsPanel';

const HostStats = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'HOST') {
      navigate(user.role === 'ADMIN' ? '/admin/stats' : '/');
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'HOST') return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { year };
        if (month != null) params.month = month;
        const res = await statsService.host(params);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data || 'Không tải được thống kê');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, year, month]);

  if (!user || user.role !== 'HOST') return null;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/host" className="btn btn-outline" style={{ padding: '8px 14px' }}>Homestay</Link>
        <Link to="/host/bookings" className="btn btn-outline" style={{ padding: '8px 14px' }}>Đơn đặt phòng</Link>
        <Link to="/host/stats" className="btn btn-primary" style={{ padding: '8px 14px' }}>Thống kê</Link>
      </div>

      <RevenueStatsPanel
        title="Thống kê doanh thu (Host)"
        subtitle="Doanh thu từng Homestay của bạn và tổng doanh thu. Chọn tháng để xem lại các tháng trước."
        data={data}
        loading={loading}
        error={error}
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
        showHostColumn={false}
      />
    </div>
  );
};

export default HostStats;
