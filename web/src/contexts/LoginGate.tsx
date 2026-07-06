import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, X } from 'lucide-react';

// A single shared "please log in" popup used everywhere a guest tries a
// members-only action (comment, rate, reply, create post, ...).
interface Gate {
  requireLogin: (message?: string) => void;
}
const Ctx = createContext<Gate>({ requireLogin: () => {} });
export const useLoginGate = () => useContext(Ctx);

export function LoginGateProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const requireLogin = (msg?: string) => {
    setMessage(msg || 'Bạn cần đăng nhập để sử dụng tính năng này.');
    setOpen(true);
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Ctx.Provider value={{ requireLogin }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-150" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1.5">Yêu cầu đăng nhập</h3>
            <p className="text-sm text-slate-500 text-center font-medium mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={() => go('/login')} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
                Đăng nhập
              </button>
              <button onClick={() => go('/register')} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
