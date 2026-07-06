import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FolderOpen,
  Users2,
  CalendarDays,
  FileCheck2,
  Scale,
  Award,
  BookOpenCheck,
  FileSpreadsheet,
  Notebook,
  Gamepad,
  BrainCircuit,
  Settings,
  Youtube,
  Eye,
  Sparkles,
  Presentation
} from 'lucide-react';
import { Account } from '../types';

interface SidebarProps {
  currentUser: Account | null;
  currentSection: string;
  onSelectSection: (section: string) => void;
}

export default function Sidebar({
  currentUser,
  currentSection,
  onSelectSection,
}: SidebarProps) {
  const role = currentUser ? currentUser.role : null;

  // Navigation map reflecting matching roles
  const menuItems = [
    {
      id: 'overview',
      label: 'Trang chủ tổng quan',
      icon: LayoutDashboard,
      roles: ['all'],
      color: 'text-brand-blue'
    },
    {
      id: 'course-registration',
      label: 'Khóa học của con',
      icon: GraduationCap,
      roles: ['Admin', 'Học sinh', 'Phụ huynh'],
      color: 'text-emerald-600'
    },
    {
      id: 'documents',
      label: 'Văn bản chỉ đạo',
      icon: FolderOpen,
      roles: ['Admin', 'Giáo viên', 'Khách', 'Học sinh', 'Phụ huynh'],
      color: 'text-brand-orange'
    },
    {
      id: 'community-room',
      label: 'Phòng học cộng đồng',
      icon: Presentation,
      roles: ['all'],
      color: 'text-blue-600 font-bold animate-pulse-slow'
    },
    {
      id: 'youtube-learning',
      label: 'Góc tự học (Video)',
      icon: Youtube,
      roles: ['all'],
      color: 'text-red-500 font-semibold'
    },
    {
      id: 'ai-assistant',
      label: 'Trợ lý học thuật AI',
      icon: Sparkles,
      roles: ['all'],
      color: 'text-purple-600 font-black animate-pulse-slow'
    },
    {
      id: 'accounts',
      label: 'Quản lý tài khoản',
      icon: Users2,
      roles: ['Admin'],
      color: 'text-indigo-500'
    },
    {
      id: 'classes',
      label: 'Khối & Lớp học',
      icon: Settings,
      roles: ['Admin'],
      color: 'text-slate-500'
    },
    {
      id: 'subjects',
      label: 'Bộ môn & Phân công',
      icon: Scale,
      roles: ['Admin'],
      color: 'text-slate-500'
    },
    {
      id: 'exams',
      label: 'Ngân hàng đề thi',
      icon: FileCheck2,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-slate-500'
    },
    {
      id: 'homework',
      label: 'Quản lý bài tập',
      icon: Notebook,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-purple-600'
    },
    {
      id: 'upcoming-schedules',
      label: 'Quản lý Lịch sắp tới',
      icon: CalendarDays,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-amber-600 font-bold'
    },
    {
      id: 'student-test',
      label: 'Phòng thi (Làm bài)',
      icon: Award,
      roles: ['Học sinh'],
      color: 'text-emerald-500'
    },
    {
      id: 'grading',
      label: 'Chấm bài & Nhập điểm',
      icon: BookOpenCheck,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-sky-600'
    },
    {
      id: 'reports',
      label: 'Bảng điểm tổng hợp',
      icon: FileSpreadsheet,
      roles: ['Admin', 'Giáo viên', 'Học sinh', 'Phụ huynh'],
      color: 'text-brand-blue'
    },
    {
      id: 'contact-book',
      label: 'Sổ liên lạc gia đình',
      icon: Notebook,
      roles: ['Admin', 'Giáo viên', 'Học sinh', 'Phụ huynh'],
      color: 'text-pink-500'
    },
    {
      id: 'export-center',
      label: 'Trung tâm kết xuất',
      icon: FileSpreadsheet,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-brand-orange'
    },
    {
      id: 'game-center',
      label: 'Trò chơi trí tuệ',
      icon: Gamepad,
      roles: ['all'],
      color: 'text-purple-500'
    },
    {
      id: 'teacher-workspace',
      label: 'Nhiệm vụ GV (CN/BM)',
      icon: BrainCircuit,
      roles: ['Giáo viên'],
      color: 'text-indigo-600 font-bold'
    },
    {
      id: 'ui-news-management',
      label: 'Giao diện & Đăng tin',
      icon: Settings,
      roles: ['Admin', 'Giáo viên'],
      color: 'text-rose-600 font-bold'
    }
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.roles.includes('all')) return true;
    if (!role) return false;
    // Student, Parent, and Guest can see all menu items to view the entire website structure
    if (role === 'Học sinh' || role === 'Phụ huynh' || role === 'Khách') {
      return true;
    }
    if (item.id === 'ui-news-management') {
      return role === 'Admin' || currentUser?.canPostNews === true;
    }
    return item.roles.includes(role);
  });

  return (
    <aside className="no-print flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white p-3.5 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
          <BrainCircuit className="w-4.5 h-4.5 text-brand-orange-light animate-pulse" />
          <span>Hệ Thống Giáo Vụ Số</span>
        </div>
        
        <nav className="flex flex-col text-xs divide-y divide-slate-100" id="sidebar-navigation-menu">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentSection === item.id || 
                             (item.id === 'overview' && (currentSection === 'class-detail' || currentSection === 'student-detail'));
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`sidebar-btn text-left px-4 py-3 flex items-center gap-3 font-semibold transition cursor-pointer ${
                  isActive
                    ? 'active text-brand-blue bg-blue-50/50 border-l-4 border-brand-blue'
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 text-center ${isActive ? 'text-brand-blue' : item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-4 rounded-2xl text-xs space-y-2 shadow-sm">
        <h5 className="font-extrabold text-indigo-900 uppercase flex items-center gap-1.5 text-[11px]">
          <Award className="w-4 h-4 text-brand-orange animate-pulse" />
          Trợ lý Giáo vụ V12.15
        </h5>
        <p className="text-[11px] text-indigo-700 leading-relaxed">
          <b>Mẹo click thông minh:</b> Di chuột nhấn trực tiếp vào các chi đội tiêu biểu hay gương sáng học sinh trên Trang Chủ để xem tức thì học bạ vàng chi tiết và gửi lưu bút chúc mừng!
        </p>
      </div>
    </aside>
  );
}
