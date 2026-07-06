import React from 'react';
import { Calendar, Heart, MessageSquare, PlusCircle, Bookmark, Star, ArrowRight, UserCheck, School } from 'lucide-react';
import { Activity, StudentDetail, ClassDetail, Account, Class, Submission } from '../types';

interface OverviewSectionProps {
  currentUser: Account | null;
  activities: Activity[];
  outstandingClasses: ClassDetail[];
  outstandingStudents: StudentDetail[];
  classes: Class[];
  accounts: Account[];
  submissions: Submission[];
  onOpenCreateActivity: () => void;
  onViewClassDetail: (id: string) => void;
  onViewStudentDetail: (id: number) => void;
  onOpenActivityDetail: (id: number) => void;
  onLikeActivity: (id: number) => void;
}

export default function OverviewSection({
  currentUser,
  activities,
  outstandingClasses,
  outstandingStudents,
  classes = [],
  accounts = [],
  submissions = [],
  onOpenCreateActivity,
  onViewClassDetail,
  onViewStudentDetail,
  onOpenActivityDetail,
  onLikeActivity,
}: OverviewSectionProps) {
  const canPublish = currentUser && (currentUser.role === 'Admin' || (currentUser.role === 'Giáo viên' && currentUser.canPostNews));

  // Dynamically calculate system stats
  const totalStudents = classes.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalStaff = accounts.filter(a => a.role === 'Admin' || a.role === 'Giáo viên' || a.role === 'Nhân viên').length;
  const totalClassesCount = classes.length;
  
  // Calculate digital profile / synchronized report ratio
  const totalSub = submissions.length;
  const syncedCount = submissions.filter(s => s.isSynced || s.grade !== null).length;
  const syncPercentage = totalSub > 0 ? Math.round((syncedCount / totalSub) * 100) : 100;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-br from-brand-blue to-blue-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
          <School className="w-48 h-48" />
        </div>
        <span className="bg-brand-orange text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm">
          Premium V12.15
        </span>
        <h2 className="text-xl md:text-2xl font-black mt-2 mb-1">
          Cổng thông tin giáo dục THCS Hòa Phú
        </h2>
        <p className="text-xs text-blue-105 max-w-md">
          Chào mừng quý thầy cô, các bậc phụ huynh và các em học sinh bước vào học kỳ mới thi đua sôi nổi lập nhiều thành tích vẻ vang!
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider block">Học sinh toàn trường</span>
          <span className="text-xl font-black text-brand-blue mt-1 block">{totalStudents.toLocaleString()} em</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider block">Hội đồng Sư phạm</span>
          <span className="text-xl font-black text-brand-orange mt-1 block">{totalStaff} thầy cô</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider block">Lớp học chuẩn quốc gia</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{totalClassesCount} lớp</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider block">Hồ sơ Học bạ số</span>
          <span className="text-xl font-black text-indigo-650 mt-1 block">{syncPercentage}% tỷ lệ</span>
        </div>
      </div>

      {/* OUTSTANDING ACTIVITIES & NEWS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h3 className="font-extrabold text-xs md:text-sm text-slate-805 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-4 bg-brand-orange rounded-full"></span>Hoạt động học tập tiêu biểu
          </h3>
          {canPublish && (
            <button
              onClick={onOpenCreateActivity}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[10.5px] px-3 py-1.5 rounded-lg shadow-sm font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Đăng bài mới
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="activities-grid">
          {activities.map(act => (
            <div
              key={act.id}
              className="group bg-white border border-slate-200 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300 flex flex-col h-full relative"
            >
              <div onClick={() => onOpenActivityDetail(act.id)} className="h-28 w-full relative overflow-hidden">
                <img
                  src={act.img}
                  alt={act.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 bg-brand-blue text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow">
                  {act.category}
                </span>
              </div>
              
              <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                <h4
                  onClick={() => onOpenActivityDetail(act.id)}
                  className="font-extrabold text-[11px] md:text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-blue transition-colors duration-200"
                >
                  {act.title}
                </h4>
                
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {act.date}
                  </span>
                  
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikeActivity(act.id);
                      }}
                      className={`flex items-center gap-1 hover:text-rose-500 transition-colors ${
                        act.likedByUser ? 'text-rose-500 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${act.likedByUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{act.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => onOpenActivityDetail(act.id)}
                      className="flex items-center gap-1 hover:text-brand-blue transition-colors text-slate-400"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{act.comments ? act.comments.length : 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OUTSTANDING CLASSES BANNER GRID */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h3 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>Chi đội lớp học xuất sắc tiêu biểu
          </h3>
          <span className="text-[10px] text-slate-450 font-semibold italic flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-emerald-500" /> Nhấn để kiểm tra học bạ chi tiết
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="outstanding-classes-grid">
          {outstandingClasses.map(cls => (
            <div
              key={cls.id}
              onClick={() => onViewClassDetail(cls.id)}
              className="group border border-slate-200 p-4 rounded-2xl bg-white relative cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300"
            >
              <div className="absolute top-3.5 right-3.5 text-lg text-emerald-600 bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-4 h-4" />
              </div>
              <h4 className="font-black text-brand-blue text-xs md:text-sm group-hover:text-brand-orange transition-colors">
                {cls.lop}
              </h4>
              <span className="text-xs font-bold text-slate-700 block mt-2">Slogan: {cls.slogan}</span>
              <span className="text-[10px] text-slate-400 block mt-4 font-semibold">
                GVCN: <b>{cls.gvcn}</b> | Sĩ số: <b>{cls.total} em</b>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OUTSTANDING STUDENTS SPOTLIGHTS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-250 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h3 className="font-extrabold text-xs md:text-sm text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-4 bg-brand-blue rounded-full"></span>Gương sáng học sinh vàng danh dự
          </h3>
          <span className="text-[10px] text-slate-450 font-semibold italic flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-brand-blue animate-pulse" /> Nhấn xem học vị GPA
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="outstanding-students-grid">
          {outstandingStudents.map(student => (
            <div
              key={student.id}
              onClick={() => onViewStudentDetail(student.id)}
              className="group border border-slate-200 p-3.5 rounded-2xl bg-white relative cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full border-2 border-brand-blue/30 overflow-hidden shrink-0 group-hover:scale-105 transition-transform bg-slate-100">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-850 text-xs truncate group-hover:text-brand-blue transition-colors">
                  {student.name}
                </h4>
                <p className="text-[10px] font-bold text-brand-orange block mt-0.5 truncate">
                  {student.badge}
                </p>
                
                <div className="flex justify-between items-center mt-2.5 text-[9.5px] text-slate-400 font-bold font-mono">
                  <span>Lớp: {student.class}</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[8.5px]">
                    GPA: {student.gpa}
                  </span>
                </div>
              </div>
              
              <ArrowRight className="w-3.5 h-3.5 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
