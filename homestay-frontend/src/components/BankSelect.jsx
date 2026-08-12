import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { VIETNAM_BANKS } from '../constants/banks';

/**
 * Dropdown ngân hàng: mở xuống dưới, đẩy form (không đè lên ô Số tài khoản).
 */
const BankSelect = ({ value, onChange, options = VIETNAM_BANKS, placeholder = 'Chọn ngân hàng' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const bankOptions = useMemo(() => {
    const list = [...options];
    if (value && !list.includes(value)) list.unshift(value);
    return list;
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bankOptions;
    return bankOptions.filter((b) => b.toLowerCase().includes(q));
  }, [bankOptions, query]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const selectBank = (bank) => {
    onChange(bank);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={`bank-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="bank-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? 'bank-select-value' : 'bank-select-placeholder'}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className="bank-select-chevron" />
      </button>

      <input
        type="text"
        value={value || ''}
        required
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="bank-select-hidden"
      />

      {open && (
        <div className="bank-select-panel" role="listbox">
          <div className="bank-select-search">
            <Search size={16} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm ngân hàng..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul className="bank-select-list">
            {filtered.length === 0 ? (
              <li className="bank-select-empty">Không tìm thấy ngân hàng</li>
            ) : (
              filtered.map((bank) => {
                const selected = bank === value;
                return (
                  <li key={bank}>
                    <button
                      type="button"
                      className={`bank-select-option ${selected ? 'is-selected' : ''}`}
                      onClick={() => selectBank(bank)}
                      role="option"
                      aria-selected={selected}
                    >
                      <span>{bank}</span>
                      {selected && <Check size={16} />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BankSelect;
