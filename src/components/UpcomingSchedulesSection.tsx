import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, Check, X, Info } from 'lucide-react';
import { UpcomingSchedule, Account } from '../types';
import { showToast } from './Toast';

interface UpcomingSchedulesSectionProps {
  currentUser: Account | null;
  schedules: UpcomingSchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<UpcomingSchedule[]>>;
}

export default function UpcomingSchedulesSection({
  currentUser,
  schedules,
  setSchedules,
}: UpcomingSchedulesSectionProps) {
  const [isEditingId, setIsEditingId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [colorType, setColorType] = useState<'orange' | 'rose' | 'purple' | 'blue'>('orange');

  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editColorType, setEditColorType] = useState<'orange' | 'rose' | 'purple' | 'blue'>('orange');

  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Giáo viên');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) {
      showToast("Vui lòng điền đủ Tiêu đề và Ngày lễ/sự kiện!", "info");
      return;
    }

    const newSched: UpcomingSchedule = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      colorType,
    };

    setSchedules(prev => [newSched, ...prev]);
    showToast(`Đã thêm lịch sắp tới mới: "${newSched.title}"`, "success");

    // Reset Form
    setTitle('');
    setDescription('');
    setDate('');
    setColorType('orange');
    setIsOpenAdd(false);
  };

  const handleStartEdit = (sched: UpcomingSchedule) => {
    setIsEditingId(sched.id);
    setEditTitle(sched.title);
    setEditDescription(sched.description);
    setEditDate(sched.date);
    setEditColorType(sched.colorType);
  };

  const handleSaveEdit = (id: number) => {
    if (!editTitle.trim() || !editDate.trim()) {
      showToast("Vui lòng điền đủ Tiêu đề và Ngày lễ/sự kiện!", "info");
      return;
    }

    setSchedules(prev => prev.map(s => s.id === id ? {
      ...s,
      title: editTitle.trim(),
      description: editDescription.trim(),
      date: editDate.trim(),
      colorType: editColorType
    } : s));

    setIsEditingId(null);
    showToast("Đã cập nhật thay đổi lịch sắp tới thành công!", "success");
  };

  const handleDelete = (id: number, activeTitle: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Lịch sắp tới "${activeTitle}"?`)) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      showToast(`Đã xóa thành công lịch: "${activeTitle}"`, "success");
    }
  };

  const getColorClasses = (type: 'orange' | 'rose' | 'purple' | 'blue') => {
    switch (type) {
      case 'rose':
        return {
          wrapper: 'bg-rose-50/50 border-rose-200/50 hover:bg-rose-100/50',
          badge: 'bg-rose-100 text-rose-600 border-rose-200'
        };
      case 'purple':
        return {
          wrapper: 'bg-purple-50/50 border-purple-200/50 hover:bg-purple-100/50',
          badge: 'bg-purple-100 text-purple-700 border-purple-200'
        };
      case 'blue':
        return {
          wrapper: 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-100/50',
          badge: 'bg-blue-10 border-blue-200 text-brand-blue'
        };
      case 'orange':
      default:
        return {
          wrapper: 'bg-orange-50/50 border-orange-200/50 hover:bg-orange-100/50',
          badge: 'bg-orange-100 text-brand-orange border-orange-200'
        };
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
        <Info className="w-12 h-12 text-slate-350 mx-auto mb-2" />
        <p className="font-extrabold text-slate-600">Bạn không có quyền quản lý lịch sự kiện này.</p>
        <p className="text-xs text-slate-400 mt-1">Tính năng chỉ dành riêng cho Admin hoặc Giáo viên.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-xs font-bold space-y-5">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          Kế hoạch & Quản lý Lịch sắp tới của trường
        </h3>
        
        {!isOpenAdd && (
          <button
            onClick={() => setIsOpenAdd(true)}
            className="bg-brand-orange hover:bg-brand-orange-dark text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" /> Thêm lịch sắp tới
          </button>
        )}
      </div>

      {isOpenAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-xl border border-slate-200 gap-3 grid grid-cols-1 md:grid-cols-4 items-end animate-fade-in">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] text-slate-500 uppercase block">Tiêu đề lịch sự kiện</label>
            <input
              type="text"
              placeholder="e.g. Lịch thi cuối học kỳ II"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase block">Hạn ngày (e.g. 26/06)</label>
            <input
              type="text"
              placeholder="Hạn ngày, e.g. 30/06"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase block">Nhãn màu sắc card</label>
            <select
              value={colorType}
              onChange={e => setColorType(e.target.value as any)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="orange">Màu cam (Cảnh báo/Kế hoạch)</option>
              <option value="rose">Màu hồng (Kỳ thi/Trọng tâm)</option>
              <option value="purple">Màu tím (Đồng bộ/Hội họp)</option>
              <option value="blue">Màu xanh (Hoạt động/Tự học)</option>
            </select>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] text-slate-500 uppercase block">Mô tả / Ghi chú nhanh</label>
            <input
              type="text"
              placeholder="e.g. Thi học vụ, học bạ số hóa tất cả các khối học sinh"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-4 rounded-lg flex-1 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Thêm
            </button>
            <button
              type="button"
              onClick={() => setIsOpenAdd(false)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 px-3 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Schedules List Grid */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="text-center italic text-slate-400 py-6">Chưa có lịch sắp tới nào được lưu trữ.</p>
        ) : (
          schedules.map(sched => {
            const isEditing = isEditingId === sched.id;
            const style = getColorClasses(sched.colorType);

            if (isEditing) {
              return (
                <div key={sched.id} className="bg-yellow-50/60 p-4 rounded-xl border border-yellow-200/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-end animate-fade-in">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase block">Tiêu đề lịch sự kiện</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase block">Hạn ngày (e.g. 26/06)</label>
                    <input
                      type="text"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase block">Nhãn màu sắc card</label>
                    <select
                      value={editColorType}
                      onChange={e => setEditColorType(e.target.value as any)}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="orange">Màu cam (Cảnh báo/Kế hoạch)</option>
                      <option value="rose">Màu hồng (Kỳ thi/Trọng tâm)</option>
                      <option value="purple">Màu tím (Đồng bộ/Hội họp)</option>
                      <option value="blue">Màu xanh (Hoạt động/Tự học)</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase block">Mô tả / Ghi chú nhanh</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(sched.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-3 rounded-lg flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingId(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 px-3 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sched.id}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 rounded-xl border transition-all ${style.wrapper}`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-blue/10 text-brand-blue text-[9px] px-1 rounded">ID: {sched.id}</span>
                    <h5 className="font-extrabold text-[#111] text-xs">{sched.title}</h5>
                  </div>
                  {sched.description && (
                    <p className="text-[10px] text-slate-500 font-bold leading-normal">{sched.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-3.5 mt-2.5 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-2.5 md:pt-0">
                  <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-black border tracking-wide uppercase ${style.badge}`}>
                    {sched.date}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(sched)}
                      className="p-1 px-2.5 text-slate-500 hover:bg-slate-150 rounded transition-all cursor-pointer text-[10px] flex items-center gap-1 border hover:border-slate-300"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(sched.id, sched.title)}
                      className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer text-[10px] flex items-center gap-1 border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
