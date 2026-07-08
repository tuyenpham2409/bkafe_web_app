import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password field with a show/hide eye toggle.
export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
  required = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
        style={{ paddingRight: '44px' }}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="btn-icon"
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } as React.CSSProperties}
        title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        tabIndex={-1}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
