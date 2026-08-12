import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BankSelect from '../components/BankSelect';
import PasswordInput from '../components/PasswordInput';
import { toBankAccountHolderName } from '../utils/bankHolder';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    bankName: '',
    bankHolder: '',
    bankAccount: '',
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [holderAutoFilled, setHolderAutoFilled] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const holderTouchedRef = useRef(false);
  const lookupTimerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      bankName: user.bankName || '',
      bankHolder: user.bankHolder || '',
      bankAccount: user.bankAccount || '',
      currentPassword: '',
      password: '',
      confirmPassword: ''
    });
    holderTouchedRef.current = Boolean(user.bankHolder);
    setHolderAutoFilled(false);
  }, [user]);

  useEffect(() => {
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
    }

    const account = form.bankAccount.replace(/\s+/g, '');
    const canLookup = Boolean(form.bankName) && account.length >= 6 && form.fullName.trim();

    if (!canLookup) {
      setLookingUp(false);
      return undefined;
    }

    if (holderTouchedRef.current && !holderAutoFilled) {
      return undefined;
    }

    setLookingUp(true);
    lookupTimerRef.current = setTimeout(() => {
      const holder = toBankAccountHolderName(form.fullName);
      if (holder) {
        setForm((prev) => ({ ...prev, bankHolder: holder }));
        setHolderAutoFilled(true);
        holderTouchedRef.current = false;
      }
      setLookingUp(false);
    }, 450);

    return () => {
      if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };
  }, [form.bankName, form.bankAccount, form.fullName, holderAutoFilled]);

  if (!user) return null;

  const bankHint = user.role === 'HOST'
    ? 'Tài khoản này dùng để nhận tiền khi khách thanh toán đặt phòng.'
    : 'Tài khoản này dùng để nhận hoàn tiền khi đơn bị từ chối / hủy.';

  const wantsPasswordChange = Boolean(
    form.currentPassword.trim() || form.password.trim() || form.confirmPassword.trim()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.fullName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập họ tên' });
      return;
    }
    if (!form.bankName.trim() || !form.bankHolder.trim() || !form.bankAccount.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng chọn ngân hàng và nhập đủ chủ TK + số tài khoản' });
      return;
    }

    if (wantsPasswordChange) {
      if (!form.currentPassword.trim()) {
        setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại để xác thực' });
        return;
      }
      if (!form.password.trim()) {
        setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
        return;
      }
      if (form.password.trim().length < 6) {
        setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setMessage({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp' });
        return;
      }
      if (form.password === form.currentPassword) {
        setMessage({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        bankName: form.bankName.trim(),
        bankHolder: form.bankHolder.trim(),
        bankAccount: form.bankAccount.replace(/\s+/g, '').trim()
      };
      if (wantsPasswordChange) {
        payload.currentPassword = form.currentPassword.trim();
        payload.password = form.password.trim();
        payload.confirmPassword = form.confirmPassword.trim();
      }
      await updateProfile(payload);
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        password: '',
        confirmPassword: ''
      }));
      setMessage({
        type: 'success',
        text: wantsPasswordChange ? 'Cập nhật hồ sơ và mật khẩu thành công' : 'Cập nhật hồ sơ thành công'
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data || 'Cập nhật thất bại' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: 720 }}>
      <h1>Thông tin cá nhân</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 24 }}>
        Role: <strong>{user.role}</strong> · {bankHint}
      </p>

      {message.text && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: message.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: message.type === 'error' ? '#B91C1C' : '#166534'
        }}>
          {message.text}
        </div>
      )}

      {!user.hasBankAccount && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: '#FEF3C7',
          color: '#92400E'
        }}>
          Bạn chưa cập nhật đủ thông tin ngân hàng. Hãy điền bên dưới trước khi đặt phòng / nhận thanh toán.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Email</label>
          <input value={user.email} disabled style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: '#f5f5f5' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Họ tên *</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Số điện thoại</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
        </div>

        <h2 style={{ marginTop: 8, marginBottom: 0 }}>Tài khoản ngân hàng</h2>
        <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>{bankHint}</p>

        <div style={{ marginBottom: 4 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Ngân hàng *</label>
          <BankSelect
            value={form.bankName}
            onChange={(bank) => {
              if (!holderTouchedRef.current) {
                setHolderAutoFilled(true);
              }
              setForm((prev) => ({ ...prev, bankName: bank }));
            }}
            placeholder="-- Chọn ngân hàng --"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Số tài khoản *</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.bankAccount}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d\s]/g, '');
              if (!holderTouchedRef.current) {
                setHolderAutoFilled(true);
              }
              setForm((prev) => ({ ...prev, bankAccount: next }));
            }}
            placeholder="Nhập số tài khoản ngân hàng"
            required
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Chủ tài khoản *
            {lookingUp && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                Đang lấy tên...
              </span>
            )}
          </label>
          <input
            value={form.bankHolder}
            onChange={(e) => {
              holderTouchedRef.current = true;
              setHolderAutoFilled(false);
              setForm({ ...form, bankHolder: e.target.value.toUpperCase() });
            }}
            placeholder="Tự điền sau khi chọn ngân hàng + số TK"
            required
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
          <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
            Tự điền từ họ tên (viết hoa, bỏ dấu). Bạn có thể sửa lại nếu khác tên trên sao kê.
          </p>
        </div>

        <h2 style={{ marginTop: 8, marginBottom: 0 }}>Đổi mật khẩu</h2>
        <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>
          Để trống nếu không đổi. Khi đổi cần nhập mật khẩu hiện tại và xác nhận mật khẩu mới.
        </p>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mật khẩu hiện tại</label>
          <PasswordInput
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            placeholder="Nhập mật khẩu hiện tại để xác thực"
            autoComplete="current-password"
            name="currentPassword"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mật khẩu mới</label>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Ít nhất 6 ký tự"
            autoComplete="new-password"
            name="newPassword"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
          <PasswordInput
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            name="confirmPassword"
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p style={{ marginTop: 6, fontSize: '0.8rem', color: '#B91C1C' }}>
              Mật khẩu xác nhận chưa khớp
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
