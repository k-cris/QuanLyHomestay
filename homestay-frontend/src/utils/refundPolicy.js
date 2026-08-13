/** Giờ (DB) → ngày (hiển thị cho khách) */
export const hoursToDisplayDays = (hours) => {
  const h = Number(hours) || 0;
  return Math.round((h / 24) * 10) / 10;
};

export const formatHoursAsDaysLabel = (hours) => {
  const days = hoursToDisplayDays(hours);
  if (days === 0) return 'dưới 1 ngày';
  if (Number.isInteger(days)) return `${days} ngày`;
  return `${days} ngày`;
};

export const DEFAULT_REFUND_RULES = [
  { minHoursBefore: 72, refundPercent: 95 },
  { minHoursBefore: 48, refundPercent: 90 },
  { minHoursBefore: 24, refundPercent: 85 },
  { minHoursBefore: 0, refundPercent: 80 }
];
