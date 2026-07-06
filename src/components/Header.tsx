import React, { useEffect, useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  UserPlus, 
  KeyRound, 
  GraduationCap, 
  Clock, 
  MapPin,
  LayoutDashboard,
  FolderOpen,
  Users2,
  FileCheck2,
  Scale,
  Award,
  BookOpenCheck,
  FileSpreadsheet,
  Notebook,
  Gamepad,
  Settings
} from 'lucide-react';
import { Account, BannerSlide } from '../types';

interface HeaderProps {
  currentUser: Account | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  bannerUrl?: string;
  logoUrl?: string;
  marqueeText?: string;
  bannerSlides?: BannerSlide[];
  currentSection?: string;
  onSelectSection?: (section: string) => void;
  currentSemester?: string;
  academicYear?: string;
  onUpdateSemester?: (semester: string) => void;
  onUpdateAcademicYear?: (year: string) => void;
}

export default function Header({
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onOpenChangePassword,
  onLogout,
  bannerUrl,
  logoUrl,
  marqueeText,
  bannerSlides,
  currentSection = 'overview',
  onSelectSection,
  currentSemester = 'Học kỳ II',
  academicYear = '2025 - 2026',
  onUpdateSemester,
  onUpdateAcademicYear,
}: HeaderProps) {
  const [clockText, setClockText] = useState('Đang đồng bộ thời gian...');
  const [slideIndex, setSlideIndex] = useState(0);
  const [logoError, setLogoError] = useState(false);

  // Helper utility to extract image and video properties from different URL sources (drive, youtube, upload, base64)
  const getSlideMediaUrl = (url: string) => {
    if (!url) {
      return { type: "image" as const, url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800" };
    }

    if (url.startsWith('data:')) {
      return { type: "image" as const, url };
    }

    if (url.includes('drive.google.com')) {
      let driveId = '';
      const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchD && matchD[1]) {
        driveId = matchD[1];
      } else if (matchId && matchId[1]) {
        driveId = matchId[1];
      }
      if (driveId) {
        return { type: "image" as const, url: `https://drive.google.com/uc?export=view&id=${driveId}` };
      }
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      const videoId = match[2];
      return {
        type: "youtube" as const,
        url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1&controls=0&modestbranding=1&iv_load_policy=3&rel=0`
      };
    }

    return { type: "image" as const, url };
  };

  const slidesToUse = bannerSlides && bannerSlides.length > 0 ? bannerSlides : [
    {
      id: "default-1",
      type: "url" as const,
      source: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=90&w=1600",
      title: "Tiết học hứng thú và sôi nổi của các em học sinh",
      createdAt: new Date().toISOString()
    },
    {
      id: "default-2",
      type: "url" as const,
      source: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=90&w=1600",
      title: "Khai phá kiến thức khoa học và nỗ lực rèn luyện",
      createdAt: new Date().toISOString()
    },
    {
      id: "default-3",
      type: "url" as const,
      source: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=90&w=1600",
      title: "Ứng dụng chuyển đổi số giáo dục toàn diện THCS Hòa Phú",
      createdAt: new Date().toISOString()
    }
  ];

  // Rotate images based on seconds interval
  useEffect(() => {
    if (slidesToUse.length <= 1) return;
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slidesToUse.length);
    }, 1500); // 1.5 seconds rotation for optimal reading of caption and dynamic visual feeling
    return () => clearInterval(interval);
  }, [slidesToUse.length]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const dayName = dayNames[now.getDay()];
      const dateStr = String(now.getDate()).padStart(2, '0');
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const yearStr = now.getFullYear();
      const hourStr = String(now.getHours()).padStart(2, '0');
      const minStr = String(now.getMinutes()).padStart(2, '0');
      const secStr = String(now.getSeconds()).padStart(2, '0');
      setClockText(`${dayName}, ${dateStr}/${monthStr}/${yearStr} - ${hourStr}:${minStr}:${secStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = currentUser ? currentUser.role : null;
  const menuItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      roles: ['all'],
      color: 'text-brand-blue'
    }
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.roles.includes('all')) return true;
    if (!role) return false;
    if (item.id === 'ui-news-management') {
      return role === 'Admin' || currentUser?.canPostNews === true;
    }
    return item.roles.includes(role);
  });

  return (
    <>
      <header 
        className="text-white shadow-xl relative overflow-hidden border-b-4 border-brand-orange bg-cover bg-center transition-all duration-500"
        style={bannerUrl ? { 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.82), rgba(30, 58, 138, 0.9)), url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      >
        {/* If no custom banner, render the gradient background */}
        {!bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-dark via-brand-blue to-brand-blue-dark" />
        )}

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="header-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#header-grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 w-full text-left">
          {/* LEFT HALF: Logo and typography branding display */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-lg p-1.5 flex items-center justify-center border-2 border-brand-orange/50 transform hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0">
              {logoUrl && !logoError ? (
                <img 
                  src={logoUrl} 
                  alt="Logo Trường" 
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <svg className="w-full h-full text-brand-blue" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5L15 25V55C15 72.5 50 90 50 90C50 90 85 72.5 85 55V25L50 5Z" fill="#1e3a8a" stroke="#ea580c" strokeWidth="4" />
                  <path d="M30 45L50 30L70 45V65C70 70 50 80 50 80C50 80 30 70 30 65V45Z" fill="#ea580c" />
                  <path d="M42 42V55H47V42H42ZM53 42V55H58V42H53Z" fill="white" />
                  <path d="M50 15L25 28L50 41L75 28L50 15Z" fill="#f59e0b" />
                  <circle cx="50" cy="55" r="5" fill="white" />
                </svg>
              )}
            </div>
            
            <div className="space-y-0.5">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-white leading-tight">
                Trường THCS Hòa Phú
              </h1>
              <p className="text-[11px] md:text-xs text-orange-300 font-bold tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1">
                <GraduationCap className="w-4.5 h-4.5 inline shrink-0" /> CỔNG THÔNG TIN ĐIỆN TỬ & CHUYỂN ĐỔI SỐ
              </p>
              <p className="text-[10px] md:text-xs text-slate-300 font-medium tracking-wide flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-orange-light mr-0.5 inline shrink-0" aria-hidden="true" />
                Địa chỉ: Xã Hòa Xá, Thành phố Hà Nội.
              </p>
            </div>
          </div>

          {/* RIGHT HALF: Dynamic Activity Slideshow changing every second */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-1.5 border border-white/20 shadow-2xl overflow-hidden relative group h-[180px] sm:h-[220px] md:h-[260px] lg:h-[230px] xl:h-[260px] flex flex-col justify-between">
              {/* Slideshow window */}
              <div className="relative w-full h-full flex-1 rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                {slidesToUse.map((slide, idx) => {
                  const isActive = idx === slideIndex;
                  const media = getSlideMediaUrl(slide.source);
                  
                  return (
                    <div
                      key={slide.id || idx}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-700 flex flex-col justify-end ${
                        isActive ? 'opacity-100 z-10 animate-fade-in' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {media.type === 'youtube' && isActive ? (
                        <div className="absolute inset-0 w-full h-full">
                          <iframe
                            src={media.embedUrl}
                            title={slide.title || "Youtube Live Slide"}
                            className="w-full h-[180%] -translate-y-[20%] scale-110 border-0 pointer-events-none"
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            referrerPolicy="no-referrer"
                          />
                          {/* Secure layer avoiding action blocks */}
                          <div className="absolute inset-0 bg-transparent" />
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
                          {/* Ambient Blur Backdrop to fill container beautifully with the same photo */}
                          <img
                            src={media.url}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-45 select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=90&w=1600";
                            }}
                          />
                          {/* Main Image shown fully without any cropping, optimized for extreme sharpness */}
                          <img
                            src={media.url}
                            alt={slide.title || "Hoạt động trường"}
                            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain select-none transition-all duration-300 contrast-[1.03] saturate-[1.03] brightness-[1.01]"
                            style={{ 
                              imageRendering: '-webkit-optimize-contrast',
                              maxHeight: '100%',
                              maxWidth: '100%'
                            }}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=90&w=1600";
                            }}
                          />
                        </div>
                      )}

                      {/* Text overlays are removed per request for a fully clean slide preview */}
                    </div>
                  );
                })}
              </div>

              {/* Position dot indicators */}
              <div className="absolute top-3.5 right-3.5 z-30 flex gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                {slidesToUse.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === slideIndex ? 'bg-orange-500 scale-125 w-3.5' : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION STICKY BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between">
          <div className="flex flex-nowrap md:flex-wrap items-center gap-0.5 py-1 overflow-x-auto max-w-full lg:max-w-[72%] scrollbar-none" id="main-navbar-tabs">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = currentSection === item.id || 
                               (item.id === 'overview' && (currentSection === 'class-detail' || currentSection === 'student-detail'));
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection?.(item.id)}
                  className={`px-3 py-3 font-extrabold text-[11px] md:text-xs border-b-4 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-brand-blue text-brand-blue bg-blue-50/40'
                      : 'border-transparent text-slate-600 hover:text-brand-blue hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-blue animate-pulse' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* SEMESTER / ACADEMIC YEAR SELECTOR (RED BOX IN SCREENSHOT) - Visible to all logged-in accounts & styled with warm apricot yellow */}
          {currentUser && (
            <div className="flex items-center gap-1.5 md:gap-2 bg-amber-50 border border-amber-250 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs shadow-sm shrink-0 animate-fade-in" id="semester-academic-year-widget">
              <span className="flex items-center gap-1 md:gap-1.5 font-black text-[9px] md:text-[11px] text-amber-800 uppercase select-none shrink-0">
                <GraduationCap className="w-3.5 h-3.5 text-brand-orange animate-bounce" />
                <span className="hidden sm:inline">Học Vụ:</span>
              </span>
              
              {/* Semester Select */}
              <select
                value={currentSemester}
                onChange={(e) => onUpdateSemester?.(e.target.value)}
                className="bg-white border border-amber-200 text-amber-900 font-extrabold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange cursor-pointer shadow-sm hover:border-amber-350 transition-colors"
                title="Chọn Học kỳ"
              >
                <option value="Học kỳ I">Học kỳ I</option>
                <option value="Học kỳ II">Học kỳ II</option>
                <option value="Học kỳ Phụ">Học kỳ Phụ</option>
              </select>

              {/* Year Select */}
              <select
                value={academicYear}
                onChange={(e) => onUpdateAcademicYear?.(e.target.value)}
                className="bg-white border border-amber-200 text-amber-900 font-extrabold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange cursor-pointer shadow-sm hover:border-amber-350 transition-colors"
                title="Chọn Năm học"
              >
                <option value="2024 - 2025">Năm học 2024 - 2025</option>
                <option value="2025 - 2026">Năm học 2025 - 2026</option>
                <option value="2026 - 2027">Năm học 2026 - 2027</option>
              </select>
            </div>
          )}

          <div className="py-2.5 flex flex-wrap items-center gap-2 text-xs" id="auth-panel">
            {currentUser ? (
              <>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-full text-[11px] flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentUser.role}: {currentUser.name}
                </span>

                <button
                  onClick={onOpenChangePassword}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm border border-slate-200 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Đổi mật khẩu
                </button>

                <button
                  onClick={onLogout}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full text-[11px] flex items-center gap-1.5 shadow-sm border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Khách
                </span>

                <button
                  onClick={onOpenLogin}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> Đăng nhập
                </button>

                <button
                  onClick={onOpenRegister}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* FLASH MESSAGE SCROLL BAR */}
      <div className="bg-brand-orange text-white py-2 px-4 shadow-inner text-xs font-bold border-b border-orange-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="whitespace-nowrap flex items-center gap-1.5 shrink-0 bg-orange-950/40 px-3.5 py-1 rounded-full shadow-sm border border-orange-400/30">
            <Clock className="w-3.5 h-3.5 text-orange-200 animate-pulse" />
            <span className="font-mono text-[11px]">{clockText}</span>
          </div>
          <div className="marquee-container flex-1 overflow-hidden">
            <div className="marquee-content whitespace-nowrap">
              {marqueeText || "🚀 Chào mừng quý thầy cô, các bậc phụ huynh và các em học sinh đến với Cổng thông tin điện tử Trường THCS Hòa Phú! Chuyển đổi số học vụ nâng cao hiệu suất dạy và học!"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
