import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { statsService } from '../services/api';
import RevenueStatsPanel from '../components/RevenueStatsPanel';

const AdminStats = () => {
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
    if (user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { year };
        if (month != null) params.month = month;
        const res = await statsService.admin(params);
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

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/admin" className="btn btn-outline" style={{ padding: '8px 14px' }}>Duyệt Host</Link>
        <Link to="/admin/stats" className="btn btn-primary" style={{ padding: '8px 14px' }}>Thống kê doanh thu</Link>
      </div>

      <RevenueStatsPanel
        title="Thống kê doanh thu (Admin)"
        subtitle="Doanh thu từng Homestay toàn hệ thống, kèm tên chủ nhà. Lọc theo năm hoặc từng tháng."
        data={data}
        loading={loading}
        error={error}
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
        showHostColumn
      />
    </div>
  );
};

export default AdminStats;
