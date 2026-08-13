import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`
}));

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

/**
 * Bộ lọc năm / tháng + biểu đồ + bảng doanh thu từng Homestay.
 * showHostColumn: Admin xem thêm tên chủ.
 */
const RevenueStatsPanel = ({
  title,
  data,
  loading,
  error,
  year,
  month,
  onYearChange,
  onMonthChange,
  showHostColumn = false
}) => {
  const years = data?.availableYears?.length
    ? data.availableYears
    : [new Date().getFullYear()];

  const chartData = useMemo(() => {
    if (!data) return [];
    if (data.mode === 'year') {
      return (data.monthlySeries || []).map((p) => ({
        name: p.label,
        revenue: p.revenue || 0,
        bookings: p.bookingCount || 0
      }));
    }
    return (data.homestays || []).map((h) => ({
      name: h.homestayTitle?.length > 18
        ? `${h.homestayTitle.slice(0, 18)}…`
        : (h.homestayTitle || `HS #${h.homestayId}`),
      revenue: h.revenue || 0,
      bookings: h.bookingCount || 0
    }));
  }, [data]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <h1 style={{ margin: 0 }}>{title}</h1>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>Năm</label>
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', minWidth: 110 }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>Tháng</label>
            <select
              value={month == null ? '' : month}
              onChange={(e) => {
                const v = e.target.value;
                onMonthChange(v === '' ? null : Number(v));
              }}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', minWidth: 140 }}
            >
              <option value="">Cả năm</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', color: '#B91C1C' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ padding: '24px 0' }}>Đang tải thống kê...</p>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 12,
            margin: '20px 0 28px'
          }}>
            <StatCard label="Tổng doanh thu" value={formatVnd(data?.totalRevenue)} />
            <StatCard label="Số đơn đã thanh toán" value={String(data?.totalBookings ?? 0)} />
            <StatCard label="Số Homestay" value={String(data?.totalHomestays ?? 0)} />
            <StatCard
              label="Kỳ xem"
              value={month ? `Tháng ${month}/${year}` : `Năm ${year}`}
            />
          </div>

          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            background: '#fff'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              {data?.mode === 'year' ? 'Doanh thu theo tháng trong năm' : 'Doanh thu từng Homestay trong tháng'}
            </h3>
            <div className="chart-box">
              {chartData.every((d) => !d.revenue) ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-light)'
                }}>
                  Không có doanh thu trong kỳ này (trả về 0).
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={56} />
                    <Tooltip
                      formatter={(value, name) => (
                        name === 'revenue' ? formatVnd(value) : value
                      )}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#FF385C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <h3 style={{ marginBottom: 12 }}>Chi tiết theo từng Homestay</h3>
          <div className="stats-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showHostColumn ? 720 : 560 }}>
              <thead>
                <tr style={{ background: 'var(--color-background-alt)', textAlign: 'left' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Homestay</th>
                  <th style={thStyle}>Thành phố</th>
                  {showHostColumn && <th style={thStyle}>Chủ Homestay</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Số đơn</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {(data?.homestays || []).length === 0 ? (
                  <tr>
                    <td colSpan={showHostColumn ? 6 : 5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-light)' }}>
                      Chưa có Homestay nào.
                    </td>
                  </tr>
                ) : (
                  data.homestays.map((h, idx) => (
                    <tr key={h.homestayId} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{h.homestayTitle || `Homestay #${h.homestayId}`}</div>
                      </td>
                      <td style={tdStyle}>{h.city || '—'}</td>
                      {showHostColumn && (
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 500 }}>{h.hostFullName || '—'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{h.hostEmail || ''}</div>
                        </td>
                      )}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{h.bookingCount || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {formatVnd(h.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {(data?.homestays || []).length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-background-alt)' }}>
                    <td style={tdStyle} colSpan={showHostColumn ? 4 : 3}><strong>Tổng</strong></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}><strong>{data.totalBookings || 0}</strong></td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-primary)' }}>
                      <strong>{formatVnd(data.totalRevenue)}</strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={{
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '16px 18px',
    background: '#fff'
  }}>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
  </div>
);

const thStyle = { padding: '12px 14px', fontSize: '0.85rem', fontWeight: 600 };
const tdStyle = { padding: '12px 14px', fontSize: '0.9rem', verticalAlign: 'top' };

export default RevenueStatsPanel;
