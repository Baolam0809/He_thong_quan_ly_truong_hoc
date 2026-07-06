import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  LogIn,
  UserPlus,
  ShieldAlert,
  Save,
  CheckCircle,
  FileCheck2,
  Trash2,
  Users2,
  Undo2,
  Camera,
  ThumbsUp,
  Smile,
  Send,
  Eye,
  KeyRound,
  FileDown,
  ClipboardList,
  Paperclip,
  FileSpreadsheet
} from 'lucide-react';
import { Account, Class, Assignment, Exam, Homework, Submission, Activity, CommentItem } from '../types';
import { showToast } from './Toast';
import { fullSubjects } from '../data';

// ==========================================
// 1. LOGIN MODAL
// ==========================================
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteLogin: (u: string, p: string) => void;
  onSwitchToRegister: () => void;
  onOpenForgot: () => void;
}
export function LoginModal({ isOpen, onClose, onExecuteLogin, onSwitchToRegister, onOpenForgot }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'admin'>('general');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteLogin(username.trim(), password);
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fade-in border border-slate-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h4 className="font-black text-sm text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
            <LogIn className="w-4 h-4 text-brand-orange animate-pulse" /> Đăng nhập hệ thống
          </h4>
          <button onClick={onClose} className="text-slate-450 hover:text-slate-650 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex mb-4 border-b bg-slate-50 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('general'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'general' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-450'
            }`}
          >
            HỌC VIÊN / PHỤ HUYNH
          </button>
          <button
            onClick={() => { setActiveTab('admin'); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'admin' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-450'
            }`}
          >
            GIÁO VIÊN / ADMIN
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue bg-slate-50 focus:bg-white font-bold"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue bg-slate-50 focus:bg-white font-bold"
              required
            />
          </div>

          <p className="text-[10px] text-slate-450 italic font-semibold leading-relaxed">
            * Mẹo trải nghiệm: Học viên dùng tài khoản <b className="text-brand-blue">hs1 / 123</b>. Giáo viên dùng tài khoản <b className="text-brand-blue">gv1 / 123</b>. Phụ huynh dùng <b className="text-brand-blue">ph1 / 123</b>.
          </p>

          <div className="text-right">
            <button type="button" onClick={onOpenForgot} className="text-[10px] text-brand-blue hover:underline font-bold cursor-pointer">
              Quên mật khẩu đăng nhập?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            Đăng nhập hệ thống
          </button>
        </form>

        <div className="mt-4 pt-3 border-t text-center">
          <p className="text-[10.5px] text-slate-500 font-bold">
            Chưa có tài khoản?{' '}
            <button onClick={onSwitchToRegister} className="text-emerald-700 hover:underline font-black cursor-pointer">
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. REGISTER MODAL
// ==========================================
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteRegister: (name: string, user: string, pass: string, role: string, extra: string) => void;
}
export function RegisterModal({ isOpen, onClose, onExecuteRegister }: RegisterModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Học sinh' | 'Phụ huynh' | 'Khách'>('Học sinh');
  const [extra, setExtra] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      showToast("Vui lòng điền đầy đủ các thông tin!", "info");
      return;
    }
    // Check complexity
    const hasU = /[A-Z]/.test(password);
    const hasN = /\d/.test(password);
    const hasS = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValid = password.length >= 6 && hasU && hasN && hasS;
    if (!isValid) {
      showToast("Password yếu! Vui lòng tuân thủ đúng yêu cầu bảo mật.", "info");
      return;
    }

    const finalExtra = role === 'Khách' ? "Khách tự do" : (extra.trim() || (role === 'Học sinh' ? "9A" : "Phụ huynh em Nguyễn Kim Ngân"));
    onExecuteRegister(name.trim(), username.trim(), password, role, finalExtra);
    setName('');
    setUsername('');
    setPassword('');
  };

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasLen = password.length >= 6;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fade-in border border-slate-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h4 className="font-black text-sm text-emerald-650 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-500" /> Tạo tài khoản học vụ
          </h4>
          <button onClick={onClose} className="text-slate-450 hover:text-slate-655 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder={role === 'Khách' ? "Họ và tên của bạn" : "Họ và tên thí sinh / phụ huynh"}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Tên đăng nhập (Username)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Mật khẩu bảo mật an toàn"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              required
            />
            {/* Live Indicator */}
            <div className="p-2 border rounded-xl bg-slate-50/50 mt-1.5 text-[9.5px] space-y-1 font-bold">
              <span className="block text-[8.5px] text-slate-500 uppercase tracking-wide">Yêu cầu tiêu chuẩn an toàn:</span>
              <div className={hasLen ? "text-emerald-600" : "text-rose-500"}>
                {hasLen ? "✔" : "✘"} Dài từ 6 ký tự trở lên
              </div>
              <div className={hasUpper ? "text-emerald-600" : "text-rose-500"}>
                {hasUpper ? "✔" : "✘"} Chứa tối thiểu 1 chữ hoa
              </div>
              <div className={hasNumber ? "text-emerald-600" : "text-rose-500"}>
                {hasNumber ? "✔" : "✘"} Chứa tối thiểu 1 số
              </div>
              <div className={hasSpec ? "text-emerald-600" : "text-rose-500"}>
                {hasSpec ? "✔" : "✘"} Chứa ký tự đặc biệt (!@#%...)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Đại diện vai trò</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full text-xs p-2.5 border rounded-xl bg-white font-bold cursor-pointer"
            >
              <option value="Học sinh">Học sinh tự kết nối</option>
              <option value="Phụ huynh">Phụ huynh học sinh</option>
              <option value="Khách">Khách vãng lai (Truy cập tự do)</option>
            </select>
          </div>

          {role !== 'Khách' && (
            <div>
              <input
                type="text"
                placeholder={role === 'Học sinh' ? "Điền lớp học (Ví dụ: 9A, 9B)" : "Phụ huynh em... (Ví dụ: Phụ huynh em Nguyễn Kim Ngân)"}
                value={extra}
                onChange={e => setExtra(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition cursor-pointer"
          >
            Đăng ký tài khoản mới
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. FORGOT PASSWORD MODAL
// ==========================================
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteReset: (username: string) => void;
}
export function ForgotPasswordModal({ isOpen, onClose, onExecuteReset }: ForgotPasswordModalProps) {
  const [username, setUsername] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onExecuteReset(username.trim());
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fade-in border border-slate-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h4 className="font-black text-sm text-brand-orange uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-brand-orange" /> Cấp lại mật khẩu
          </h4>
          <button onClick={onClose} className="text-slate-455 hover:text-slate-655 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tài khoản cần khôi phục</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập trùng khớp..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-xs p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:outline-none"
              required
            />
          </div>

          {isSuccess && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl leading-relaxed font-bold animate-fade-in">
              ✔ Yêu cầu khôi phục thành công! Mật khẩu cho tài khoản <b>{username}</b> đã được hoàn trả mặc định về: <b className="text-brand-orange text-sm font-mono block text-center mt-1">123</b>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-black py-3 rounded-xl text-xs transition cursor-pointer"
          >
            Khôi phục mật khẩu mặc định
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. FORCED PASSWORD CHANGE MODAL
// ==========================================
interface ChangePasswordModalProps {
  isOpen: boolean;
  isForced: boolean;
  onClose: () => void;
  onExecuteUpdate: (oldP: string, newP: string) => boolean;
}
export function ChangePasswordModal({ isOpen, isForced, onClose, onExecuteUpdate }: ChangePasswordModalProps) {
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');
  const [confirmP, setConfirmP] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldP || !newP || !confirmP) {
      showToast("Vui lòng nhập đầy đủ các trường!", "info");
      return;
    }
    if (newP !== confirmP) {
      showToast("Mật khẩu mới không khớp!", "info");
      return;
    }
    if (newP === '123' || newP === 'admin') {
      showToast("Không sử dụng các mật khẩu mặc định phổ thông!", "info");
      return;
    }
    // Check complexity
    const hasU = /[A-Z]/.test(newP);
    const hasN = /\d/.test(newP);
    const hasS = /[!@#$%^&*(),.?":{}|<>]/.test(newP);
    const isValid = newP.length >= 6 && hasU && hasN && hasS;
    if (!isValid) {
      showToast("Mật khẩu chưa đạt tiêu chuẩn độ mạnh tối ưu!", "info");
      return;
    }

    const success = onExecuteUpdate(oldP, newP);
    if (success) {
      setOldP('');
      setNewP('');
      setConfirmP('');
    }
  };

  const hasUpper = /[A-Z]/.test(newP);
  const hasNumber = /\d/.test(newP);
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(newP);
  const hasLen = newP.length >= 6;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className={`bg-white rounded-3xl max-w-sm w-full p-6 animate-fade-in border border-slate-100 ${isForced ? 'animate-shake' : ''}`}>
        <div className="flex justify-between border-b pb-3 mb-4 items-center">
          <h4 className="font-extrabold text-sm text-brand-blue uppercase flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-brand-orange animate-spin" /> Đổi mật mã bảo mật
          </h4>
          {!isForced && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isForced && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-[10.5px] font-extrabold mb-4 leading-relaxed flex gap-1.5">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <span>
              Để bảo vệ tuyệt đối an toàn thông tin cá nhân học vụ, hệ thống yêu cầu quý vụ cập nhật mật mã mới thay thế cho mật khẩu mặc định ban đầu!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mật khẩu cũ của bạn</label>
            <input
              type="password"
              value={oldP}
              onChange={e => setOldP(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mật mã bảo mật mới</label>
            <input
              type="password"
              value={newP}
              onChange={e => setNewP(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Xác nhận mật mã mới</label>
            <input
              type="password"
              value={confirmP}
              onChange={e => setConfirmP(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl font-bold bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="p-2.5 border rounded-xl bg-slate-50 text-[9.5px] space-y-1 font-bold">
            <span className="block text-[8.5px] text-slate-450 uppercase">Điều khoản mật mã mạnh:</span>
            <div className={hasLen ? "text-emerald-600" : "text-rose-500"}>{hasLen ? "✔" : "✘"} Dài từ 6 ký tự</div>
            <div className={hasUpper ? "text-emerald-600" : "text-rose-500"}>{hasUpper ? "✔" : "✘"} Chữ HOA dũng mãnh</div>
            <div className={hasNumber ? "text-emerald-600" : "text-rose-500"}>{hasNumber ? "✔" : "✘"} Con số số học</div>
            <div className={hasSpec ? "text-emerald-600" : "text-rose-500"}>{hasSpec ? "✔" : "✘"} Ký tự đặc biệt (!@#...)</div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-black py-3 rounded-xl text-xs transition cursor-pointer"
          >
            Định cấu hình mật mã mới
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. CREATE ACTIVITY / POST BULLETIN MODAL
// ==========================================
interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: string, desc: string, content: string, img: string) => void;
}
export function CreateActivityModal({ isOpen, onClose, onSubmit }: CreateActivityModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TIN TỨC');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [imgBase64, setImgBase64] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadE) => {
        if (loadE.target?.result) {
          setImgBase64(loadE.target.result as string);
          showToast(`Đã nhận ảnh đại diện bảng báo cáo!`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || !content.trim()) {
      showToast("Vui lòng điền đầy đủ các thông tin bài viết!", "info");
      return;
    }

    const defaultImg = "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400";
    onSubmit(title.trim(), category, desc.trim(), content.trim(), imgBase64 || defaultImg);
    
    // Clear
    setTitle('');
    setDesc('');
    setContent('');
    setImgBase64('');
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-black text-sm text-brand-blue uppercase flex items-center gap-1.5">
            <Camera className="w-5 h-5 text-brand-orange animate-pulse" /> Đăng tệp tin hoạt động trường
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tiêu đề chính thức</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Hội khóa thể thao đua xe đạp hè 2026..."
              className="w-full text-xs p-2.5 border rounded-xl font-bold bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Chuyên mục chính</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ví dụ: TIN TỨC, SỰ KIỆN"
                className="w-full text-xs p-2.5 border rounded-xl font-extrabold bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Đăng kèm ảnh</label>
              <div className="relative border-2 border-dashed bg-slate-50 p-2.5 rounded-xl text-center hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                />
                <span className="font-bold text-[10.5px] text-brand-blue truncate block">
                  {imgBase64 ? "✔ Đã nhận ảnh nộp" : "Tải ảnh thiết bị"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Mô tả tóm tắt văn tắt</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Tóm tắt ngắn gọn sự kiện chi tiết..."
              className="w-full p-2.5 border rounded-xl focus:bg-white font-bold bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nội dung chi tiết bài viết</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung đầy đủ..."
              className="w-full p-2.5 border rounded-xl focus:bg-white font-medium bg-slate-50"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 py-2 rounded-xl">
              Hủy bỏ
            </button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white font-black px-5 py-2 rounded-xl shadow transition-all">
              Đăng công khai Hoạt động (Public)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 6. ADD / EDIT USER CREDENTIALS ACCOUNT
// ==========================================
interface AddAccountModalProps {
  isOpen: boolean;
  editingAccount: Account | null;
  onClose: () => void;
  onSave: (
    id: number | null,
    name: string,
    user: string,
    pass: string,
    role: any,
    extra: string,
    studentId?: string,
    cccd?: string,
    dob?: string,
    classVal?: string,
    address?: string,
    parents?: string,
    phone?: string
  ) => void;
}
export function AddAccountModal({ isOpen, editingAccount, onClose, onSave }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<'Admin' | 'Giáo viên' | 'Nhân viên' | 'Học sinh' | 'Phụ huynh'>('Học sinh');
  const [extra, setExtra] = useState('');

  // Student specific states
  const [studentId, setStudentId] = useState('');
  const [cccd, setCccd] = useState('');
  const [dob, setDob] = useState('');
  const [classVal, setClassVal] = useState('');
  const [address, setAddress] = useState('');
  const [parents, setParents] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setUsername(editingAccount.username);
      setPassword(editingAccount.password);
      setRole(editingAccount.role);
      setExtra(editingAccount.extra || '');
      setStudentId(editingAccount.studentId || '');
      setCccd(editingAccount.cccd || '');
      setDob(editingAccount.dob || '');
      setClassVal(editingAccount.class || '');
      setAddress(editingAccount.address || '');
      setParents(editingAccount.parents || '');
      setPhone(editingAccount.phone || '');
    } else {
      setName('');
      setUsername('');
      setPassword('123');
      setRole('Học sinh');
      setExtra('');
      setStudentId('');
      setCccd('');
      setDob('');
      setClassVal('');
      setAddress('');
      setParents('');
      setPhone('');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleExportIndividualExcel = () => {
    try {
      const data = [{
        "Họ và tên": name,
        "Tài khoản": username,
        "Mật khẩu": password,
        "Vai trò": role,
        "Mã định danh học sinh": studentId,
        "CCCD": cccd,
        "Năm sinh": dob,
        "Lớp": classVal,
        "Họ tên cha mẹ": parents,
        "Số điện thoại": phone,
        "Địa chỉ nơi ở": address,
        "Thông tin thêm": extra
      }];
      
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 22 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
        { wch: 10 },
        { wch: 22 },
        { wch: 15 },
        { wch: 35 },
        { wch: 25 }
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ThongTinHoSo");
      const filename = `Ho_So_${name.trim().replace(/\s+/g, '_') || 'Tai_Khoan'}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast("Xuất thông tin hồ sơ tài khoản ra Excel thành công!", "success");
    } catch (err: any) {
      showToast(`Không thể xuất Excel: ${err.message}`, "error");
    }
  };

  const handleImportIndividualExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows || rawRows.length === 0) {
          showToast("Tệp tin trống hoặc sai định dạng!", "error");
          return;
        }

        const firstRow = rawRows[0];
        
        const importedName = firstRow["Họ và tên"] || firstRow["Họ tên"] || firstRow["Họ và Tên Nhân Sự"] || firstRow["Họ tên học sinh"] || "";
        const importedUser = firstRow["Tài khoản"] || firstRow["Tài khoản đăng nhập"] || firstRow["username"] || "";
        const importedPass = firstRow["Mật khẩu"] || firstRow["Mật khẩu ban hành"] || firstRow["password"] || "";
        const importedRole = firstRow["Vai trò"] || firstRow["Vai trò chức vụ"] || firstRow["role"] || "";
        const importedId = firstRow["Mã định danh học sinh"] || firstRow["Mã định danh"] || "";
        const importedCccd = firstRow["CCCD"] || firstRow["cccd"] || "";
        const importedDob = firstRow["Năm sinh"] || "";
        const importedClass = firstRow["Lớp"] || firstRow["Chi đội lớp học"] || "";
        const importedParents = firstRow["Họ tên cha mẹ"] || firstRow["Cha mẹ"] || "";
        const importedPhone = firstRow["Số điện thoại"] || firstRow["SĐT"] || firstRow["Số điện thoại liên hệ"] || "";
        const importedAddress = firstRow["Địa chỉ nơi ở"] || firstRow["Nơi ở"] || firstRow["Nơi ở hiện nay"] || "";
        const importedExtra = firstRow["Thông tin thêm"] || firstRow["Thông tin đính kèm"] || firstRow["extra"] || "";

        if (importedName) setName(String(importedName).trim());
        if (importedUser && !editingAccount) setUsername(String(importedUser).trim().toLowerCase());
        if (importedPass) setPassword(String(importedPass).trim());
        if (importedId) setStudentId(String(importedId).trim());
        if (importedCccd) setCccd(String(importedCccd).trim());
        if (importedDob) setDob(String(importedDob).trim());
        if (importedClass) setClassVal(String(importedClass).trim());
        if (importedParents) setParents(String(importedParents).trim());
        if (importedPhone) setPhone(String(importedPhone).trim());
        if (importedAddress) setAddress(String(importedAddress).trim());
        if (importedExtra) setExtra(String(importedExtra).trim());

        if (importedRole) {
          const roleStr = String(importedRole).trim().toLowerCase();
          if (roleStr.includes("quản trị") || roleStr.includes("admin")) {
            setRole("Admin");
          } else if (roleStr.includes("giáo viên") || roleStr.includes("teacher") || roleStr === "gv") {
            setRole("Giáo viên");
          } else if (roleStr.includes("nhân viên") || roleStr.includes("nhanvien") || roleStr === "staff") {
            setRole("Nhân viên");
          } else if (roleStr.includes("phụ huynh") || roleStr === "ph") {
            setRole("Phụ huynh");
          } else {
            setRole("Học sinh");
          }
        }

        showToast("Đã tải dữ liệu từ tệp Excel vào biểu mẫu thành công!", "success");
      } catch (err: any) {
        showToast(`Không thể đọc file Excel: ${err.message}`, "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      showToast("Vui lòng nhập họ tên và tài khoản đăng nhập!", "info");
      return;
    }
    const finalExtra = role === 'Học sinh' && classVal ? `Lớp: ${classVal} | PH: ${parents}` : extra;
    onSave(
      editingAccount ? editingAccount.id : null,
      name.trim(),
      username.trim(),
      password,
      role,
      finalExtra.trim(),
      studentId.trim(),
      cccd.trim(),
      dob.trim(),
      classVal.trim(),
      address.trim(),
      parents.trim(),
      phone.trim()
    );
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300 overflow-y-auto">
      <div className={`bg-white rounded-3xl shadow-xl w-full p-6 animate-fade-in my-8 transition-all ${role === 'Học sinh' ? 'max-w-xl' : 'max-w-sm'}`}>
        <div className="flex justify-between items-center border-b pb-3 mb-4 flex-wrap gap-2">
          <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 shrink-0">
            <Users2 className="w-5 h-5 text-brand-blue" />
            {editingAccount ? "Chỉnh sửa Hồ Sơ Tài Khoản" : "Cấp Mới Tài Khoản Độc Quyền"}
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportIndividualExcel}
              className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
              title="Xuất dữ liệu hồ sơ này ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Xuất Excel</span>
            </button>
            <label
              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
              title="Tải lên tệp Excel mẫu để điền nhanh hồ sơ này"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportIndividualExcel}
                className="hidden"
              />
            </label>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-655 p-1 hover:bg-slate-50 rounded-xl cursor-pointer transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Họ và Tên Học Sinh / Nhân Sự *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-extrabold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Tài khoản đăng nhập *</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-extrabold"
                disabled={!!editingAccount}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Mật khẩu ban hành *</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Phân phai vai trò</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full text-xs p-2.5 border rounded-xl bg-white cursor-pointer font-extrabold"
              >
                <option value="Học sinh">Học sinh tự kết nối</option>
                <option value="Giáo viên">Giáo viên trực lớp bộ môn</option>
                <option value="Nhân viên">Nhân viên Văn phòng / Khác</option>
                <option value="Khách">Khách vãng lai / Độc giả</option>
                <option value="Phụ huynh">Phụ huynh học sinh</option>
                <option value="Admin">Hội đồng Quản trị Admin</option>
              </select>
            </div>
          </div>

          {/* Conditional Student-Specific Fields */}
          {role === 'Học sinh' ? (
            <div className="border-t border-dashed border-slate-200 pt-3 mt-3 space-y-3.5">
              <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider">Thông Tin Định Danh Học Sinh Chuẩn Quốc Gia</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Mã định danh học sinh</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="Ví dụ: 030095123456"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">CCCD (Nếu có)</label>
                  <input
                    type="text"
                    value={cccd}
                    onChange={e => setCccd(e.target.value)}
                    placeholder="CCCD học sinh"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Năm sinh</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    placeholder="Ví dụ: 2012"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Chi đội Lớp học</label>
                  <input
                    type="text"
                    value={classVal}
                    onChange={e => setClassVal(e.target.value)}
                    placeholder="Ví dụ: 8A"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Họ tên Cha/Mẹ (Người giám hộ)</label>
                  <input
                    type="text"
                    value={parents}
                    onChange={e => setParents(e.target.value)}
                    placeholder="Họ tên phụ huynh"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Số điện thoại di động"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Nơi ở hiện nay / Hộ khẩu thường trú</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Địa chỉ chi tiết cư trú"
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Thông tin thêm (Lớp / SĐT / Tổ Bộ Môn)</label>
              <input
                type="text"
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder="Ví dụ: Tổ Toán, Lớp 9A"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">
              Hủy bỏ
            </button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Lưu Tài Khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 7. PERMISSION MANAGEMENT DIALOG (POSTS BULLETIN)
// ==========================================
interface PermissionModalProps {
  isOpen: boolean;
  accounts: Account[];
  onClose: () => void;
  onSave: (updatedAccs: Account[]) => void;
}
export function PermissionModal({ isOpen, accounts, onClose, onSave }: PermissionModalProps) {
  const [tempAccounts, setTempAccounts] = useState<Account[]>([]);

  useEffect(() => {
    setTempAccounts(JSON.parse(JSON.stringify(accounts)));
  }, [accounts, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    setTempAccounts(prev =>
      prev.map(a => a.id === id ? { ...a, canPostNews: !a.canPostNews } : a)
    );
  };

  const handleSave = () => {
    onSave(tempAccounts);
  };

  const teachers = tempAccounts.filter(a => a.role === 'Giáo viên');

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-extrabold text-sm text-amber-600 flex items-center gap-2 uppercase tracking-wide">
            <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" /> Phân quyền đăng tin, hoạt động
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[11px] text-slate-450 mb-4 italic leading-relaxed font-semibold">
          * Phân quyền cho phép các nhà sư học, giáo viên trực tiếp soạn thảo và đăng tải các hoạt động, sự kiện và tin tức nổi bật lên Trang chủ học vụ THCS Hòa Phú.
        </p>

        <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
          {teachers.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-150 hover:border-amber-205 transition-colors">
              <div>
                <span className="font-black text-xs text-slate-800 block">{t.name}</span>
                <span className="text-[10px] text-slate-450 font-mono block mt-0.5">{t.username} ({t.extra})</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!t.canPostNews}
                  onChange={() => handleToggle(t.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-205 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-3 border-t">
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-705 px-4 py-2 rounded-xl text-xs font-bold transition">
            Hủy bỏ
          </button>
          <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition">
            Lưu Quyền Hạn
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. ASSIGNMENT MODAL (SUBJECT MAPPINGS)
// ==========================================
interface AssignmentModalProps {
  isOpen: boolean;
  accounts: Account[];
  classes: Class[];
  editingAssignment: Assignment | null;
  onClose: () => void;
  onSave: (id: number | null, teacherId: number, teacherName: string, subjects: string[], classesStr: string[], subjectClassPairs?: string[]) => void;
}
export function AssignmentModal({ isOpen, accounts, classes, editingAssignment, onClose, onSave }: AssignmentModalProps) {
  const [teacherId, setTeacherId] = useState<number>(0);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [selectedCls, setSelectedCls] = useState<string[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);

  // Potential combinations based on currently selected subjects and classes
  const potentialPairs = useMemo(() => {
    const arr: string[] = [];
    selectedSubs.forEach(sub => {
      selectedCls.forEach(cl => {
        arr.push(`${sub} ${cl}`);
      });
    });
    return arr;
  }, [selectedSubs, selectedCls]);

  const prevPotentialPairsRef = useRef<string[]>([]);

  useEffect(() => {
    const teachersList = accounts.filter(a => a.role === 'Giáo viên');
    if (editingAssignment) {
      setTeacherId(editingAssignment.teacherId);
      setSelectedSubs(editingAssignment.subjects);
      setSelectedCls(editingAssignment.classes);
      setSelectedPairs(editingAssignment.subjectClassPairs || []);
    } else {
      setTeacherId(teachersList[0]?.id || 0);
      setSelectedSubs([]);
      setSelectedCls([]);
      setSelectedPairs([]);
    }
    prevPotentialPairsRef.current = [];
  }, [editingAssignment, isOpen, accounts]);

  useEffect(() => {
    // Find newly added potential pairs
    const added = potentialPairs.filter(p => !prevPotentialPairsRef.current.includes(p));
    // Find potential pairs that are still valid
    setSelectedPairs(prev => {
      // Keep only those still within potentialPairs
      const keep = prev.filter(p => potentialPairs.includes(p));
      // Append newly added ones by default!
      const final = Array.from(new Set([...keep, ...added]));
      return final;
    });
    prevPotentialPairsRef.current = potentialPairs;
  }, [potentialPairs]);

  if (!isOpen) return null;

  const teachersList = accounts.filter(a => a.role === 'Giáo viên');

  const handleSubToggle = (s: string) => {
    setSelectedSubs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleClsToggle = (c: string) => {
    setSelectedCls(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handlePairToggle = (p: string) => {
    setSelectedPairs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || selectedSubs.length === 0 || selectedCls.length === 0) {
      showToast("Vui lòng chọn đầy đủ Giáo viên, ít nhất 1 Môn dạy và 1 Lớp phụ trách!", "info");
      return;
    }
    if (selectedPairs.length === 0) {
      showToast("Vui lòng tích chọn chi tiết phân công môn+lớp (Ví dụ: Toán 7A)!", "info");
      return;
    }
    const teacher = teachersList.find(x => x.id === teacherId);
    if (!teacher) return;

    onSave(editingAssignment ? editingAssignment.id : null, teacherId, teacher.name, selectedSubs, selectedCls, selectedPairs);
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-extrabold text-sm text-brand-blue flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-orange animate-pulse" /> Interconnect và Phân Công Giảng Dạy
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">1. Chọn Giáo viên giảng dạy</label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(parseInt(e.target.value))}
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 font-extrabold cursor-pointer"
            >
              {teachersList.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.extra})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">2. Môn dạy phụ trách (Đồng bộ đa môn)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 text-[10.5px] gap-2 p-3 bg-blue-50/20 border border-blue-105 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
              {fullSubjects.map(sub => (
                <label key={sub} className="flex items-center gap-1.5 p-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubs.includes(sub)}
                    onChange={() => handleSubToggle(sub)}
                    className="w-3.5 h-3.5 text-brand-blue rounded border-slate-350 focus:ring-brand-blue"
                  />
                  <span className="text-slate-700">{sub}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">3. Lớp / Khối phụ quản (Phê ghép đa lớp)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 text-[10.5px] gap-2 p-3 bg-orange-50/20 border border-orange-105 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
              {classes.map(cls => (
                <label key={cls.id} className="flex items-center gap-1.5 p-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCls.includes(cls.lop)}
                    onChange={() => handleClsToggle(cls.lop)}
                    className="w-3.5 h-3.5 text-brand-orange rounded border-slate-350 focus:ring-brand-orange"
                  />
                  <span className="text-slate-800 font-extrabold font-mono">Lớp {cls.lop}</span>
                </label>
              ))}
            </div>
          </div>

          {potentialPairs.length > 0 && (
            <div>
              <label className="block text-[10px] font-extrabold text-indigo-700 mb-0.5 uppercase tracking-wider">
                4. Cấu hình tổ chức giảng dạy chi tiết
              </label>
              <span className="block text-[9.5px] text-slate-400 mb-2 font-semibold">
                Tích chọn chi tiết môn học cho từng lớp cụ thể (Ví dụ: Toán 7A, Tin học 6B):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-indigo-50/25 border border-indigo-105 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
                {potentialPairs.map(pair => (
                  <label key={pair} className="flex items-center gap-2 p-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200/60 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={selectedPairs.includes(pair)}
                      onChange={() => handlePairToggle(pair)}
                      className="w-3.5 h-3.5 text-brand-blue rounded border-slate-350 focus:ring-brand-blue"
                    />
                    <span className="text-slate-800 font-bold text-xs">{pair}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-205 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition">
              Hủy bỏ
            </button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition">
              Đồng Ý Lưu Phân Bộ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 9. CREATE DIRECTIVE EXAM MODAL
// ==========================================
interface CreateExamModalProps {
  isOpen: boolean;
  accounts: Account[];
  classes: Class[];
  onClose: () => void;
  onSave: (subject: string, type: string, correct: string, mcqMax: number, essayMax: number, essayQ: string, targetType: 'all' | 'class' | 'student', targetVal: string, file: any) => void;
}
export function CreateExamModal({ isOpen, accounts, classes, onClose, onSave }: CreateExamModalProps) {
  const [subject, setSubject] = useState('Toán');
  const [type, setType] = useState('Giữa kỳ II');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [mcqMax, setMcqMax] = useState(5.0);
  const [essayMax, setEssayMax] = useState(5.0);
  const [essayQ, setEssayQ] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'student'>('all');
  const [targetVal, setTargetVal] = useState('Toàn trường');
  const [tempFile, setTempFile] = useState<{ name: string } | null>(null);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile({ name: file.name });
      showToast(`Đã nhận file đề kiểm tra: ${file.name}`, "success");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTargetVal = targetType === 'all' ? 'Toàn trường' : targetVal;
    onSave(subject, type, correctAnswers.trim(), mcqMax, essayMax, essayQ.trim(), targetType, finalTargetVal, tempFile);
    
    // Clear
    setCorrectAnswers('');
    setEssayQ('');
    setTempFile(null);
  };

  const studentAccounts = accounts.filter(a => a.role === 'Học sinh');

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-extrabold text-sm text-brand-blue flex items-center gap-1.5">
            <FileCheck2 className="w-5 h-5 text-brand-orange animate-pulse" /> Đăng tệp đề bài mới
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Môn học khảo sát</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-white font-bold cursor-pointer"
            >
              {fullSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hình thức thi</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white font-bold cursor-pointer"
              >
                <option value="Thường xuyên">Kiểm tra Thường xuyên</option>
                <option value="Giữa kỳ II">Thi Giữa kỳ II</option>
                <option value="Cuối kỳ II">Thi Cuối kỳ II</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Upload File Đề bài</label>
              <div className="relative border-2 border-dashed bg-slate-50 p-1.5 rounded-lg text-center hover:bg-slate-100 transition cursor-pointer">
                <input type="file" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf, .doc, .docx" />
                <span className="text-[10px] text-brand-blue truncate block">
                  {tempFile ? "✔ Đã nộp đề" : "Chọn PDF/Word"}
                </span>
              </div>
            </div>
          </div>

          <div className="border p-3.5 rounded-xl space-y-2">
            <span className="block text-[9.2px] text-brand-orange uppercase leading-none font-black mb-1">Định mục tiêu nhận đề:</span>
            <div className="flex gap-4 mb-2">
              <label className="cursor-pointer">
                <input type="radio" checked={targetType === 'all'} onChange={() => { setTargetType('all'); setTargetVal('Toàn trường'); }} className="mr-1 inline" /> Toàn trường
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={targetType === 'class'} onChange={() => { setTargetType('class'); setTargetVal(classes[0]?.lop || '9A'); }} className="mr-1 inline" /> Khốii Lớp
              </label>
              <label className="cursor-pointer">
                <input type="radio" checked={targetType === 'student'} onChange={() => { setTargetType('student'); setTargetVal(studentAccounts[0]?.name || ''); }} className="mr-1 inline" /> Cá nhân
              </label>
            </div>

            {targetType !== 'all' && (
              <select
                value={targetVal}
                onChange={e => setTargetVal(e.target.value)}
                className="w-full p-2 border rounded bg-white font-bold"
              >
                {targetType === 'class' ? (
                  classes.map(c => <option key={c.id} value={c.lop}>Lớp {c.lop}</option>)
                ) : (
                  studentAccounts.map(s => <option key={s.id} value={s.name}>{s.name} ({s.extra})</option>)
                )}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Max Điểm Trắc Nghiệm</label>
              <input type="number" step="0.5" value={mcqMax} onChange={e => setMcqMax(parseFloat(e.target.value) || 5.0)} className="w-full p-2.5 border rounded bg-slate-50" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Max Điểm Tự Luận</label>
              <input type="number" step="0.5" value={essayMax} onChange={e => setEssayMax(parseFloat(e.target.value) || 5.0)} className="w-full p-2.5 border rounded bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Đáp án trắc nghiệm chuẩn khách (1A,2B...)</label>
            <input
              type="text"
              value={correctAnswers}
              onChange={e => setCorrectAnswers(e.target.value)}
              placeholder="Ví dụ: 1A,2B,3C,4D,5A"
              className="w-full p-2.5 border rounded font-mono uppercase bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Câu hỏi tự luận vận dụng thực hành</label>
            <textarea
              value={essayQ}
              onChange={e => setEssayQ(e.target.value)}
              rows={2}
              placeholder="Nhập đề bài câu hỏi tự luận mở rộng..."
              className="w-full p-2.5 border rounded bg-slate-55/10 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2 rounded-xl">Hủy</button>
            <button type="submit" className="bg-brand-blue text-white px-5 py-2.5 rounded-xl shadow font-extrabold">
              Lưu & Phát hành đề
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 10. CREATE HOMEWORK DIALOG
// ==========================================
interface CreateHomeworkModalProps {
  isOpen: boolean;
  accounts: Account[];
  classes: Class[];
  onClose: () => void;
  onSave: (subject: string, title: string, content: string, deadline: string, targetType: 'all' | 'class' | 'student', targetVal: string, file: any) => void;
  editingHomework?: Homework | null;
}
export function CreateHomeworkModal({ isOpen, accounts, classes, onClose, onSave, editingHomework }: CreateHomeworkModalProps) {
  const [subject, setSubject] = useState('Toán');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('25/06/2026');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'student'>('all');
  const [targetVal, setTargetVal] = useState('Toàn trường');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingHomework) {
        setSubject(editingHomework.subject);
        setTitle(editingHomework.title);
        setContent(editingHomework.content);
        setDeadline(editingHomework.deadline);
        setTargetType(editingHomework.targetType);
        setTargetVal(editingHomework.targetValue);
        setUploadedFile(editingHomework.homeworkFile);
      } else {
        setSubject('Toán');
        setTitle('');
        setContent('');
        setDeadline('25/06/2026');
        setTargetType('all');
        setTargetVal('Toàn trường');
        setUploadedFile(null);
      }
    }
  }, [isOpen, editingHomework]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
      showToast(`Đã đính kèm tệp tin: ${file.name}`, "success");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const finalTargetVal = targetType === 'all' ? 'Toàn trường' : targetVal;
    onSave(subject, title.trim(), content.trim(), deadline, targetType, finalTargetVal, uploadedFile);
    
    // Clear
    setTitle('');
    setContent('');
    setUploadedFile(null);
  };

  const studentAccounts = accounts.filter(a => a.role === 'Học sinh');

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-extrabold text-sm text-brand-orange flex items-center gap-1.5">
            {editingHomework ? 'Cập Nhật Bài Tập Đã Giao' : 'Giao bài tập mới'}
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Môn học</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white font-bold cursor-pointer">
              {fullSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tiêu đề bài giao</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="BT về nhà ngày thứ sáu..." className="w-full p-2.5 border rounded bg-slate-50" required />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nội dung bài làm mẫu</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Làm bài tập số 1,2,3 SGK..." className="w-full p-2.5 border rounded bg-slate-50" required />
          </div>

          {/* DRAG AND DROP / FILE INPUT ZONE */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-550 uppercase mb-1 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-brand-orange" />
              Đính kèm bài tập từ máy tính (Word/PDF/Ảnh)
            </label>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 text-center relative hover:bg-slate-100/70 transition duration-150 cursor-pointer">
              <input
                type="file"
                accept=".doc,.docx,.pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-[10.5px] text-slate-600 block font-black leading-tight">
                  {uploadedFile ? uploadedFile.name : "Kéo thả hoặc nhấn vào đây để đính kèm"}
                </span>
                <span className="text-[9px] text-slate-400 block font-normal">
                  {uploadedFile ? `Kích thước: ${uploadedFile.size || 'N/A'}` : "Hỗ trợ tệp định dạng .doc, .docx, .pdf hoặc Hình ảnh"}
                </span>
              </div>
            </div>
            {uploadedFile && (
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="text-[9px] text-rose-600 font-extrabold hover:underline mt-1.5 block"
              >
                Gỡ tệp đính kèm ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hạn chót học sinh nộp</label>
              <input type="text" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2.5 border rounded bg-slate-100 font-mono" />
            </div>
            
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Chỉ định nhóm đối tượng</label>
              <select value={targetType} onChange={e => setTargetType(e.target.value as any)} className="w-full p-2 border rounded font-black cursor-pointer bg-white">
                <option value="all">Toàn trường</option>
                <option value="class">Chi đội Lớp</option>
                <option value="student">Học sinh cá nhân</option>
              </select>
            </div>
          </div>

          {targetType !== 'all' && (
            <select
              value={targetVal}
              onChange={e => setTargetVal(e.target.value)}
              className="w-full p-2 border rounded bg-white font-black cursor-pointer text-slate-800"
            >
              {targetType === 'class' ? (
                classes.map(c => <option key={c.id} value={c.lop}>Lớp {c.lop}</option>)
              ) : (
                studentAccounts.map(s => <option key={s.id} value={s.name}>{s.name} ({s.extra})</option>)
              )}
            </select>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2 rounded-xl">Hủy</button>
            <button type="submit" className="bg-brand-orange text-white px-5 py-2.5 rounded-xl shadow font-extrabold">
              {editingHomework ? 'Lưu chỉnh sửa' : 'Giao bài tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 11. MANUAL GRADING DIALOG (TEACHER EVALUATION)
// ==========================================
interface GradingModalProps {
  isOpen: boolean;
  gradingId: number | null;
  submissions: Submission[];
  onClose: () => void;
  onGradeSubmit: (essayScore: number, remark: string) => void;
  onDeleteSubmission?: (id: number) => void;
}
export function GradingModal({ isOpen, gradingId, submissions, onClose, onGradeSubmit, onDeleteSubmission }: GradingModalProps) {
  const [essayVal, setEssayVal] = useState('0.0');
  const [remarkText, setRemarkText] = useState('');

  const targetSub = submissions.find(x => x.id === gradingId);

  useEffect(() => {
    if (targetSub) {
      setEssayVal(targetSub.essayScore !== null ? String(targetSub.essayScore) : '0.0');
      setRemarkText(targetSub.remark || '');
    } else {
      setEssayVal('0.0');
      setRemarkText('');
    }
  }, [gradingId, isOpen, targetSub]);

  if (!isOpen || !targetSub) return null;

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = parseFloat(essayVal) || 0.0;
    if (score < 0 || score > targetSub.essayMaxScore) {
      showToast(`Điểm tự luận nằm ngoài tầm quy chế 0.0 đến ${targetSub.essayMaxScore}!`, "info");
      return;
    }
    onGradeSubmit(score, remarkText.trim() || 'Giáo viên phê duyệt đồng bộ.');
  };

  const handleLocalDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài làm học bạ của học sinh "${targetSub.student}"? Hành động này không thể hoàn tác.`)) {
      if (onDeleteSubmission) {
        onDeleteSubmission(targetSub.id);
      }
    }
  };

  const currentEssayNum = parseFloat(essayVal) || 0.0;
  const currentTotal = Math.min(10.0, targetSub.mcqScore + currentEssayNum);

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full animate-fade-in border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-6 pb-3">
          <h4 className="font-extrabold text-sm text-brand-blue flex items-center gap-1.5">
            <CheckCircle className="w-5 h-5 text-brand-orange animate-bounce" /> Chấm điểm chi tiết học bạ số
          </h4>
          <button onClick={onClose} className="text-slate-405 hover:text-slate-655 cursor-pointer p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-3 flex-1 space-y-4">
          <form onSubmit={handleLocalSubmit} className="space-y-4 text-xs font-bold">
            <div>
              <span className="text-[10px] text-slate-450 block uppercase tracking-wide">Học viên thực hiện</span>
              <div className="text-sm font-black text-slate-800 mt-1">{targetSub.student} (Lớp {targetSub.class})</div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
              <span className="text-brand-blue block text-[9.5px] uppercase tracking-wider font-extrabold mb-1">1. Điểm trắc nghiệm (Điểm số hóa tự động)</span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                Đáp án học sinh: <span className="font-mono text-emerald-800 font-extrabold">{targetSub.answers || '[Trống]'}</span><br />
                Đạt cột: <b className="text-brand-blue text-sm">{targetSub.mcqScore.toFixed(1)} / {targetSub.mcqMaxScore.toFixed(1)} điểm</b>
              </p>
            </div>

            <div>
              <label className="block text-brand-orange text-[9.5px] uppercase tracking-wider font-extrabold mb-1">
                2. Đánh giá tự luận trực quan
              </label>
              <p className="text-[11px] border p-2.5 rounded-lg bg-orange-50/15 border-orange-200/50 italic leading-relaxed text-slate-605 mb-2 font-normal">
                Lớp tự luận nộp: "{targetSub.text}"
              </p>
              <label className="block text-[10px] text-slate-450 uppercase mb-1">Nhập điểm phần tự luận (Tối đa {targetSub.essayMaxScore}đ):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={targetSub.essayMaxScore}
                value={essayVal}
                onChange={e => setEssayVal(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-bold bg-slate-50 focus:bg-white text-slate-850 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="0.0"
                required
              />
            </div>

            <div className="bg-slate-50 border p-3 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-black text-slate-700 block">TỔNG ĐIỂM HOÀN THÀNH:</span>
                <span className="text-[9px] text-slate-455 font-bold italic">(Điểm TN + Tự Luận)</span>
              </div>
              <div className="bg-white border rounded-xl p-2 px-3 text-center shadow">
                <span className="text-base font-black text-brand-blue block font-mono">{currentTotal.toFixed(1)}</span>
                <span className="text-[8px] text-slate-450 font-bold uppercase">Thang 10đ</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nhận xét bài làm học vụ</label>
              <textarea
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                rows={2}
                placeholder="Nhập nhận xét của giáo viên..."
                className="w-full p-2 border rounded-xl bg-slate-50 font-medium"
              />
            </div>

            {/* Modal Footer / Action controls Inside the Form */}
            <div className="flex justify-between items-center gap-2 pt-4 border-t sticky bottom-0 bg-white">
              {onDeleteSubmission && (
                <button
                  type="button"
                  onClick={handleLocalDelete}
                  className="bg-rose-55 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
                  title="Xóa vĩnh viễn bài nộp này"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa bài
                </button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-205 text-slate-700 px-4 py-2 rounded-xl cursor-pointer">Hủy</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-1 cursor-pointer">
                  Đồng bộ học bạ
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 12. SPECIALIZED ACTIVITY DETAIL MODAL WITH DISCUSS COMMENTS
// ==========================================
interface ActivityDetailModalProps {
  isOpen: boolean;
  activityId: number | null;
  activities: Activity[];
  currentUser: Account | null;
  onClose: () => void;
  onLike: (id: number) => void;
  onCommentAdd: (id: number, text: string) => void;
}
export function ActivityDetailModal({ isOpen, activityId, activities, currentUser, onClose, onLike, onCommentAdd }: ActivityDetailModalProps) {
  const [commentInput, setCommentInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const act = activities.find(x => x.id === activityId);

  useEffect(() => {
    setCommentInput('');
  }, [activityId, isOpen]);

  if (!isOpen || !act) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onCommentAdd(act.id, commentInput.trim());
    setCommentInput('');
  };

  const handleMouseLeave = () => {
    if (!isFocused) {
      onClose();
      showToast("Đã đóng nhanh thông tin sự kiện!", "info");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div
        onMouseLeave={handleMouseLeave}
        className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <img src={act.img} alt={act.title} className="w-full h-44 object-cover mt-2 rounded-2xl shadow-inner bg-slate-100" referrerPolicy="no-referrer" />
        
        <h3 className="font-extrabold text-slate-850 text-xs md:text-sm mt-4 leading-snug">{act.title}</h3>
        <p className="text-[10px] text-slate-400 font-bold mt-1">Đăng tải ngày: {act.date}</p>
        
        <div className="mt-4">
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-105 select-none font-medium">
            {act.content}
          </p>
        </div>

        {/* Comment actions section */}
        <div className="mt-5 border-t pt-4">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
            <span className="uppercase tracking-wider flex items-center gap-1.5 text-brand-orange animate-pulse">
              Thảo luận học vụ ({act.comments ? act.comments.length : 0})
            </span>
            <button
              onClick={() => onLike(act.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full select-none shadow-sm transition-all cursor-pointer ${
                act.likedByUser ? 'bg-rose-100 text-rose-500 font-extrabold' : 'bg-rose-50 text-rose-400'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${act.likedByUser ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
              <span>Thích ({act.likes})</span>
            </button>
          </div>

          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange bg-slate-50 focus:bg-white text-slate-800"
              placeholder="Nhập thảo luận hoặc lời khen của quý độc giả..."
              required
            />
            <button type="submit" className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-3.5 rounded-xl transition shadow flex items-center justify-center cursor-pointer">
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
            {act.comments && act.comments.length ? (
              act.comments.map((comment, i) => (
                <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-105 flex flex-col gap-0.5 text-left text-xs animate-fade-in">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-450 font-mono">
                    <span className="text-brand-blue">{comment.username}</span>
                    <span>{comment.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">"{comment.text}"</p>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-3 text-[10px] italic">Chưa có bình luận học vụ. Hãy là người thảo luận đầu tiên!</div>
            )}
          </div>

          <div className="mt-3.5 text-center text-[9px] text-slate-400 italic">
            * Mẹo di chuyển: Rê chuột ra ngoài khung card để ẩn nhanh thông tin sự kiện! (Khóa đóng nhanh khi quý vị đang soạn thảo)
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeacherSyncModalProps {
  isOpen: boolean;
  accounts: Account[];
  assignments: Assignment[];
  onClose: () => void;
  onConfirm: () => void;
}

export function TeacherSyncModal({ isOpen, accounts, assignments, onClose, onConfirm }: TeacherSyncModalProps) {
  if (!isOpen) return null;

  const teachersSyncList = useMemo(() => {
    return accounts
      .filter(acc => acc.role === 'Giáo viên')
      .map(acc => {
        const asg = assignments.find(
          a => a.teacherId === acc.id || a.teacherName.toLowerCase() === acc.name.toLowerCase()
        );
        let newExtra = 'Chưa phân công bộ môn';
        if (asg) {
          if (asg.subjectClassPairs && asg.subjectClassPairs.length > 0) {
            const groups: { [subject: string]: string[] } = {};
            asg.subjectClassPairs.forEach(pair => {
              const lastSpaceIdx = pair.lastIndexOf(' ');
              if (lastSpaceIdx !== -1) {
                const sub = pair.substring(0, lastSpaceIdx).trim();
                const cls = pair.substring(lastSpaceIdx + 1).trim();
                if (!groups[sub]) groups[sub] = [];
                if (!groups[sub].includes(cls)) groups[sub].push(cls);
              } else {
                if (!groups[pair]) groups[pair] = [];
              }
            });
            const formattedList = Object.entries(groups).map(([sub, classesList]) => {
              if (classesList.length > 0) {
                classesList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
                return `${sub} (${classesList.join(', ')})`;
              }
              return sub;
            });
            newExtra = `Dạy: ${formattedList.join('; ')}`;
          } else if (asg.subjects && asg.subjects.length > 0 && asg.classes && asg.classes.length > 0) {
            const sortedClasses = [...asg.classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            newExtra = `Dạy: ${asg.subjects.join(', ')} (${sortedClasses.join(', ')})`;
          } else if (asg.subjects && asg.subjects.length > 0) {
            newExtra = `Dạy: ${asg.subjects.join(', ')}`;
          }
        }
        return {
          id: acc.id,
          name: acc.name,
          username: acc.username,
          currentExtra: acc.extra || 'Chưa thiết lập',
          newExtra,
          hasChanged: (acc.extra || '') !== newExtra
        };
      });
  }, [accounts, assignments]);

  const changedCount = useMemo(() => {
    return teachersSyncList.filter(t => t.hasChanged).length;
  }, [teachersSyncList]);

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="flex justify-between border-b pb-3 mb-4">
          <h4 className="font-extrabold text-sm text-brand-blue flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-605" /> Đồng bộ Tài Khoản Giáo Viên với Phân Công
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mb-4 font-semibold leading-relaxed">
          * Hệ thống sẽ cập nhật thông tin bộ môn và các lớp phụ trách từ phân công giảng dạy vào thông tin đính danh của tài khoản giáo viên. <br />
          <span className="text-teal-600 font-bold">
            (Danh sách chỉ hiển thị tài khoản Giáo viên giảng dạy. Tài khoản của cán bộ, nhân viên văn phòng, admin hay học sinh, phụ huynh sẽ được tự động lọc bỏ và bảo toàn nguyên vẹn)
          </span>
        </p>

        <div className="overflow-y-auto flex-1 custom-scrollbar border rounded-2xl mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-extrabold uppercase text-[10px]">
                <th className="p-3">Giáo viên</th>
                <th className="p-3">Thông tin hiện tại</th>
                <th className="p-3">Thông tin đồng bộ mới</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {teachersSyncList.length > 0 ? (
                teachersSyncList.map(t => (
                  <tr key={t.id} className={`hover:bg-slate-50 transition duration-150 ${t.hasChanged ? 'bg-amber-50/20' : ''}`}>
                    <td className="p-3">
                      <b className="text-slate-800 block text-[11px]">{t.name}</b>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">{t.username}</span>
                    </td>
                    <td className="p-3 text-[10.5px] text-slate-500">{t.currentExtra}</td>
                    <td className="p-3 text-[10.5px] text-teal-700 font-semibold">{t.newExtra}</td>
                    <td className="p-3 text-center">
                      {t.hasChanged ? (
                        <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          Cần cập nhật
                        </span>
                      ) : (
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          Đã khớp
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic text-[11px]">
                    Không tìm thấy tài khoản giáo viên nào để đồng bộ!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-[11.5px] text-slate-500 font-bold">
            {changedCount > 0 ? (
              <span>Có <b className="text-amber-600 font-black">{changedCount}</b> tài khoản giáo viên cần được cập nhật.</span>
            ) : (
              <span className="text-emerald-600 font-black">Tất cả tài khoản giáo viên đã hoàn toàn đồng bộ với phân công!</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              Đóng lại
            </button>
            {changedCount > 0 && (
              <button
                onClick={onConfirm}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1 cursor-pointer"
              >
                Xác nhận Đồng bộ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
