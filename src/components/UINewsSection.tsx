import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Sliders, 
  UserCheck, 
  Newspaper, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  RefreshCw, 
  Check, 
  HelpCircle, 
  X, 
  Eye,
  AlertTriangle,
  FileImage,
  Sparkles
} from 'lucide-react';
import { Account, Activity, BannerSlide, StudentDetail } from '../types';
import { showToast } from './Toast';
import { syncTableToSupabase } from '../lib/supabase';

interface UINewsSectionProps {
  currentUser: Account | null;
  bannerUrl: string;
  setBannerUrl: (url: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  marqueeText: string;
  setMarqueeText: (text: string) => void;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  bannerSlides: BannerSlide[];
  setBannerSlides: React.Dispatch<React.SetStateAction<BannerSlide[]>>;
  outstandingStudents: StudentDetail[];
  setOutstandingStudents: React.Dispatch<React.SetStateAction<StudentDetail[]>>;
}

export default function UINewsSection({
  currentUser,
  bannerUrl,
  setBannerUrl,
  logoUrl,
  setLogoUrl,
  marqueeText,
  setMarqueeText,
  accounts,
  setAccounts,
  activities,
  setActivities,
  bannerSlides,
  setBannerSlides,
  outstandingStudents,
  setOutstandingStudents,
}: UINewsSectionProps) {
  const [activeTab, setActiveTab] = useState<'branding' | 'publishers' | 'articles' | 'students'>('branding');
  
  // Articles CRUD Modal state
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Activity | null>(null);
  
  // Article form state
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('TIN TỨC');
  const [artDesc, setArtDesc] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artImg, setArtImg] = useState('');
  const [artDate, setArtDate] = useState('');

  // Slideshow States
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSource, setNewSlideSource] = useState('');
  const [newSlideType, setNewSlideType] = useState<'upload' | 'url'>('url');
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  // Local helper states for instant file updates
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const articleImgInputRef = useRef<HTMLInputElement>(null);

  const isUserAdmin = currentUser?.role === 'Admin';
  const canUserPost = isUserAdmin || currentUser?.canPostNews === true;
  const isReadOnly = currentUser?.role === 'Học sinh' || currentUser?.role === 'Phụ huynh' || currentUser?.role === 'Khách';

  // Outstanding Students states
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studName, setStudName] = useState('');
  const [studClass, setStudClass] = useState('');
  const [studGPA, setStudGPA] = useState('9.8');
  const [studConduct, setStudConduct] = useState('Tốt');
  const [studBadge, setStudBadge] = useState('Học sinh Xuất sắc');
  const [studAvatar, setStudAvatar] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200');
  const [studAchievements, setStudAchievements] = useState('');
  const studFileInputRef = useRef<HTMLInputElement>(null);

  const handleResetStudentForm = () => {
    setSelectedStudentId(null);
    setStudName('');
    setStudClass('');
    setStudGPA('9.8');
    setStudConduct('Tốt');
    setStudBadge('Học sinh Xuất sắc');
    setStudAvatar('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200');
    setStudAchievements('');
    if (studFileInputRef.current) {
      studFileInputRef.current.value = '';
    }
  };

  const handleSelectStudentForEdit = (s: StudentDetail) => {
    setSelectedStudentId(s.id);
    setStudName(s.name);
    setStudClass(s.class);
    setStudGPA(s.gpa);
    setStudConduct(s.conduct || 'Tốt');
    setStudBadge(s.badge);
    setStudAvatar(s.avatar);
    setStudAchievements(s.achievements.join('\n'));
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (!studName.trim() || !studClass.trim()) {
      showToast("Vui lòng điền họ tên học sinh và lớp hành chính!", "error");
      return;
    }

    const achievementsArray = studAchievements
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (selectedStudentId !== null) {
      // Edit student
      setOutstandingStudents(prev => prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            name: studName.trim(),
            class: studClass.trim(),
            gpa: studGPA,
            conduct: studConduct,
            badge: studBadge.trim(),
            avatar: studAvatar,
            achievements: achievementsArray,
          };
        }
        return s;
      }));
      showToast(`Đã cập nhật hồ sơ học sinh ${studName} thành công!`, "success");
    } else {
      // Create student
      const nextId = outstandingStudents.length > 0 ? Math.max(...outstandingStudents.map(s => s.id)) + 1 : 1;
      const newStudent: StudentDetail = {
        id: nextId,
        name: studName.trim(),
        class: studClass.trim(),
        gpa: studGPA,
        conduct: studConduct,
        badge: studBadge.trim() || 'Học sinh Tiêu biểu',
        avatar: studAvatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
        achievements: achievementsArray,
        subjects: { 'Toán': 9.8, 'Văn': 9.5, 'Anh': 10.0, 'Khoa học': 9.6 },
        guestbook: []
      };
      setOutstandingStudents(prev => [...prev, newStudent]);
      showToast(`Đã vinh danh gương sáng học sinh vàng ${studName}!`, "success");
    }

    // Reset Form
    handleResetStudentForm();
  };

  const handleDeleteStudent = (id: number) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    setOutstandingStudents(prev => prev.filter(s => s.id !== id));
    showToast("Đã gỡ gương sáng học sinh vàng khỏi danh sách!", "success");
    if (selectedStudentId === id) {
      handleResetStudentForm();
    }
  };

  const handleStudentAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Kích thước hình chân dung quá lớn! Vui lòng chọn tệp dưới 3MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setStudAvatar(reader.result as string);
      showToast("Đã đọc ảnh chân dung học sinh!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleSlideFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước hình ảnh quá lớn! Vui lòng chọn tệp dưới 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewSlideSource(reader.result as string);
      showToast("Đã đọc tệp ảnh! Viết chú thích hoạt động rồi bấm Thêm Mới.", "success");
    };
    reader.onerror = () => {
      showToast("Lỗi đọc tệp ảnh!", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewSlide = () => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (!newSlideSource.trim()) {
      showToast("Vui lòng nhập nguồn liên kết hoặc chọn tải ảnh lên từ thiết bị!", "error");
      return;
    }

    const nextId = "slide-" + Date.now();
    const newSlide: BannerSlide = {
      id: nextId,
      type: newSlideType,
      source: newSlideSource.trim(),
      title: newSlideTitle.trim() || "Hoạt động & học tập tại THCS Hòa Phú",
      createdAt: new Date().toISOString()
    };

    setBannerSlides(prev => [...prev, newSlide]);
    setNewSlideTitle('');
    setNewSlideSource('');
    if (slideFileInputRef.current) {
      slideFileInputRef.current.value = '';
    }
    showToast("Đã lưu và đưa ảnh hoạt động mới hoạt động lên Banner góc phải!", "success");
  };

  const handleDeleteSlide = (id: string) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    setBannerSlides(prev => prev.filter(slide => slide.id !== id));
    showToast("Đã gỡ slide hoạt động khỏi danh sách trình chiếu!", "success");
  };

  // Handle local image file upload & convert to Base64 (Data URL)
  const handleFileChange = (useFor: 'banner' | 'logo' | 'article') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước tệp quá lớn! Vui lòng chọn tệp dưới 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      if (useFor === 'banner') {
        setBannerUrl(resultStr);
        showToast("Đã cập nhật Ảnh Banner hệ thống thành công!", "success");
      } else if (useFor === 'logo') {
        setLogoUrl(resultStr);
        showToast("Đã cập nhật Ảnh Logo trường thành công!", "success");
      } else if (useFor === 'article') {
        setArtImg(resultStr);
        showToast("Đã tải lên ảnh đại diện cho bài viết!", "success");
      }
    };
    reader.onerror = () => {
      showToast("Lỗi khi đọc tệp ảnh!", "error");
    };
    reader.readAsDataURL(file);
  };

  // Reset Branding Defaults
  const handleResetBranding = () => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    setBannerUrl('');
    setLogoUrl('');
    setMarqueeText('🚀 Chào mừng quý thầy cô, các bậc phụ huynh và các em học sinh đến với Cổng thông tin điện tử Trường THCS Hòa Phú! Chuyển đổi số học vụ nâng cao hiệu suất dạy và học!');
    showToast("Đã khôi phục cài đặt giao diện mặc định thành công!", "success");
  };

  // Toggle user news posting permission
  const handleTogglePostNews = (accId: number) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (!isUserAdmin) {
      showToast("Chỉ Quản trị viên (Admin) mới có quyền phân bổ tác vụ này!", "error");
      return;
    }
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accId) {
        const nextState = !acc.canPostNews;
        showToast(`Đã ${nextState ? 'giao quyền' : 'gỡ quyền'} đăng tin cho nhà phát hành: ${acc.name}`, "success");
        return { ...acc, canPostNews: nextState };
      }
      return acc;
    }));
  };

  // Open Article Modal for Create or Edit
  const handleOpenArticleModal = (article: Activity | null = null) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (article) {
      setEditingArticle(article);
      setArtTitle(article.title);
      setArtCategory(article.category);
      setArtDesc(article.desc);
      setArtContent(article.content);
      setArtImg(article.img);
      setArtDate(article.date);
    } else {
      setEditingArticle(null);
      setArtTitle('');
      setArtCategory('TIN TỨC');
      setArtDesc('');
      setArtContent('');
      setArtImg('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400');
      
      // Auto format today's date
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formattedDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      setArtDate(formattedDate);
    }
    setIsArticleModalOpen(true);
  };

  // Submit Article Create / Edit Form
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (!artTitle.trim() || !artDesc.trim() || !artContent.trim()) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc!", "error");
      return;
    }

    if (editingArticle) {
      // Edit mode
      setActivities(prev => prev.map(item => {
        if (item.id === editingArticle.id) {
          return {
            ...item,
            title: artTitle,
            category: artCategory,
            desc: artDesc,
            content: artContent,
            img: artImg,
            date: artDate || item.date
          };
        }
        return item;
      }));
      showToast("Cập nhật tin bài thành công!", "success");
    } else {
      const nextId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1;
      const newArt: Activity = {
        id: nextId,
        title: artTitle,
        category: artCategory,
        desc: artDesc,
        content: artContent,
        img: artImg || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
        date: artDate,
        likes: 0,
        likedByUser: false,
        comments: []
      };
      setActivities(prev => [newArt, ...prev]);
      showToast("Đăng bài viết mới thành công lên trang thông tin!", "success");
    }
    setIsArticleModalOpen(false);
  };

  // Delete Article
  const handleDeleteArticle = (id: number) => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    setActivities(prev => prev.filter(item => item.id !== id));
    showToast("Đã gỡ bỏ bài viết khỏi Cổng thông tin!", "success");
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in text-left">
      {/* SECTION BANNER HEAD */}
      <div className="p-6 bg-gradient-to-r from-brand-blue-dark to-indigo-800 text-white relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-12 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
            <Sliders className="w-8 h-8 text-orange-300" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
              Bảng Quản Trị Hệ Thống Giao Diện & Đăng Tin
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </h2>
            <p className="text-xs md:text-sm text-indigo-200 font-medium">
              Thiết lập giao diện trực quan (Banner, Logo, Marquee) và quản quản lý quyền tác giả đăng tin, biên tập bài viết của trường.
            </p>
          </div>
        </div>
      </div>

      {/* HORIZONTAL TAB BAR */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 p-1">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'branding'
              ? 'border-brand-blue text-brand-blue bg-white shadow-sm rounded-t-xl font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/55'
          }`}
        >
          <ImageIcon className="w-4.5 h-4.5" /> Core Branding & Ảnh
        </button>
        <button
          onClick={() => setActiveTab('publishers')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'publishers'
              ? 'border-brand-blue text-brand-blue bg-white shadow-sm rounded-t-xl font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/55'
          }`}
        >
          <UserCheck className="w-4.5 h-4.5" /> Phân Quyền Đăng Tin
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'articles'
              ? 'border-brand-blue text-brand-blue bg-white shadow-sm rounded-t-xl font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/55'
          }`}
        >
          <Newspaper className="w-4.5 h-4.5" /> Quản Lý Tin Bài ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 sm:flex-initial py-3.5 px-6 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'students'
              ? 'border-brand-blue text-brand-blue bg-white shadow-sm rounded-t-xl font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/55'
          }`}
        >
          <ImageIcon className="w-4.5 h-4.5 text-brand-orange" /> Quản Lý Ảnh Học Sinh Vàng ({outstandingStudents.length})
        </button>
      </div>

      {/* CORE WRAP DETAILS */}
      <div className="p-6">
        {isReadOnly && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-808 flex items-start gap-3 shadow-sm text-left">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-[13px]">Chế Độ Xem Giao Diện Chỉ Đọc (Read-only)</p>
              <p className="font-medium text-slate-600 leading-relaxed">
                Tài khoản của bạn có vai trò là <strong className="text-amber-750">{currentUser?.role}</strong>. 
                Bạn được phép tham quan và tìm kiếm toàn bộ nội dung cổng tin tức, bài viết, và danh sách vinh danh học sinh xuất sắc. Tuy nhiên, bạn <strong>không có quyền chỉnh sửa cấu hình nhận diện thương hiệu, thay đổi ảnh trình chiếu, hoặc biên soạn bài viết</strong>.
              </p>
            </div>
          </div>
        )}
        
        {/* TAB 1: COBRADING & QUẢN LÝ ẢNH */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Banner & Logo Uploaders */}
              <div className="space-y-6 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">Quản Lý Tập Tin Ảnh Thương Hiệu</span>
                
                {/* BANNER FILE UPLOADER */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Ảnh Banner Cổng thông tin (Header background)</label>
                  <p className="text-[11px] text-slate-500 font-medium">Bảo đảm tệp là JPG, PNG, GIF dưới 5MB. Định dạng ngang sẽ cho hiển thị tốt nhất.</p>
                  
                  <div className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
                    {bannerUrl ? (
                      <div className="w-24 h-16 bg-slate-100 rounded-xl overflow-hidden border relative group shrink-0">
                        <img 
                          src={bannerUrl} 
                          alt="Banner nháp" 
                          className="w-full h-full object-cover object-center" 
                          style={{ objectFit: 'cover', objectPosition: 'center' }} 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-16 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center border shrink-0 text-[10px] font-bold">
                        Mặc định xanh
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-[200px]">
                      <input 
                        type="file" 
                        ref={bannerInputRef}
                        accept="image/*"
                        onChange={handleFileChange('banner')}
                        className="hidden" 
                      />
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" /> Tải lên ảnh Banner từ máy
                      </button>
                    </div>
                  </div>
                </div>

                {/* LOGO FILE UPLOADER */}
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">Ảnh Huy hiệu / Logo đại diện trường</label>
                  <p className="text-[11px] text-slate-500 font-medium">Hiển thị trong khung tròn đại diện phía đầu trang, thay thế logo hình khiên mặc định.</p>
                  
                  <div className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
                    {logoUrl ? (
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border p-1 flex items-center justify-center shrink-0 shadow-inner">
                        <img src={logoUrl} alt="Logo nháp" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center border shrink-0 text-xs font-bold font-mono">
                        Khiên SVG
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-[200px]">
                      <input 
                        type="file" 
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleFileChange('logo')}
                        className="hidden" 
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" /> Tải lên logo trường mới
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Scrolling text and settings */}
              <div className="space-y-6 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">Nội dung Chữ Chạy Phát Ngoài</span>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Nội dung dòng chữ chạy (Marquee Flash message)</label>
                  <p className="text-[11px] text-slate-500 font-medium">Tin nhanh, khẩu hiệu thi đua hoặc thông báo quan trọng sẽ trôi đều ở thanh cam phụ đầu trang.</p>
                  
                  <textarea
                    value={marqueeText}
                    onChange={(e) => setMarqueeText(e.target.value)}
                    rows={4}
                    maxLength={350}
                    placeholder="Nhập nội dung thông báo trôi tại đây..."
                    className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-300 rounded-2xl p-4 focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-bold font-mono">
                    {marqueeText.length}/350 ký tự
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-250 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs text-indigo-700 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 shrink-0 text-indigo-500 animate-pulse" />
                    <span className="font-medium">Chỉnh sửa hoàn tất? Click Lưu & Công khai để cập nhật toàn trang và lưu đám mây.</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleResetBranding}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Khôi phục mặc định
                    </button>
                     <button
                      onClick={async () => {
                        localStorage.setItem('thcs_banner_url', bannerUrl || '');
                        localStorage.setItem('thcs_logo_url', logoUrl || '');
                        localStorage.setItem('thcs_marquee_text', marqueeText || '');
                        localStorage.setItem('thcs_banner_slides', JSON.stringify(bannerSlides));
                        
                        showToast("Đang đồng bộ thiết lập giao diện lên đám mây Supabase...", "info");
                        try {
                          const currentSettings = [{
                            id: 1,
                            bannerUrl,
                            bannerurl: bannerUrl,
                            logoUrl,
                            logourl: logoUrl,
                            marqueeText,
                            marqueetext: marqueeText,
                            bannerSlides,
                            bannerslides: bannerSlides
                          }];
                          const success = await syncTableToSupabase('thcs_settings', currentSettings, []);
                          if (success) {
                            showToast("Đã đồng bộ thiết lập và công khai lên đám mây Supabase thành công!", "success");
                          } else {
                            showToast("Đã lưu thiết lập cục bộ! Tuy nhiên không thể đồng bộ lên Supabase (kiểm tra kết nối hoặc cấu trúc bảng).", "error");
                          }
                        } catch (err: any) {
                          showToast(`Đã lưu cục bộ! Lỗi kết nối đám mây: ${err.message}`, "error");
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Lưu & Công khai (Public)
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* LIVE PREVIEW WRAP */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3 shadow-inner">
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider text-left flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-500 animate-pulse" /> Xem Trước Giao Diện Banner & Logo Sau Khi Tải Lên (Bản thu nhỏ)
              </span>
              
              <div 
                className="rounded-2xl p-6 bg-cover bg-center shadow-lg border border-slate-150 transition-all duration-300 relative overflow-hidden flex items-center text-white"
                style={bannerUrl ? { 
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(30, 58, 138, 0.85)), url(${bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                {!bannerUrl && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-dark via-brand-blue to-teal-900" />
                )}
                
                <div className="flex items-center gap-4 relative z-10 w-full justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl shadow p-1 flex items-center justify-center border-2 border-brand-orange overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo mẫu" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-slate-450 font-bold text-xs text-brand-blue">THCS</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-extrabold uppercase">Trường THCS Hòa Phú</h2>
                      <p className="text-[9px] text-orange-300 font-bold tracking-wider">CỔNG THÔNG TIN ĐIỆN TỬ & CHUYỂN ĐỔI SỐ</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2 text-[9px] border border-white/15 rounded-lg max-w-[170px] backdrop-blur-sm">
                    ⚡ <span className="font-extrabold text-orange-300">Ảnh hoạt động động</span> sẽ trượt trình chiếu nhảy ở đây trên thanh Header chính.
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH END BANNER DYNAMIC SLIDESHOW MANAGER SECTION */}
            <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50/40 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="p-2.5 bg-brand-orange text-white rounded-xl shadow-md">
                  <ImageIcon className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Quản Lý Chuỗi Trình Chiếu Hoạt Động (Banner Góc Phải)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Đăng tải ảnh hoạt động hoặc kết xuất liên kết từ Google Drive/Youtube. Ảnh sẽ tự động thay đổi theo từng giây liên tục ở góc bên phải Header chính.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* FORM PANEL: ADD SLIDE */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm self-start">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">Thêm ảnh / video mới</h4>
                  
                  {/* Title / Caption */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-bold text-slate-600">Chú thích hoạt động (Caption)</label>
                    <input 
                      type="text" 
                      value={newSlideTitle}
                      onChange={(e) => setNewSlideTitle(e.target.value)}
                      maxLength={120}
                      placeholder="VD: Khai mạc Hội khỏe Phù Đổng trường..."
                      className="w-full text-xs bg-slate-50 border border-slate-350 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-brand-blue"
                    />
                    <div className="text-right text-[9px] text-slate-400 font-bold">
                      {newSlideTitle.length}/120 ký tự
                    </div>
                  </div>

                  {/* Toggle Upload vs URL */}
                  <div className="space-y-2 text-left">
                    <label className="block text-[11px] font-bold text-slate-600">Nguồn hình ảnh - tập tin</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewSlideType('url');
                          setNewSlideSource('');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase text-center transition cursor-pointer ${
                          newSlideType === 'url' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Liên kết ngoài (Drive/YouTube/Ảnh)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSlideType('upload');
                          setNewSlideSource('');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase text-center transition cursor-pointer ${
                          newSlideType === 'upload' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Tải từ máy tính
                      </button>
                    </div>
                  </div>

                  {/* Input Source Context */}
                  {newSlideType === 'url' ? (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[10px] font-extrabold text-slate-500">Đường dẫn chi tiết (URL)</label>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                        Hỗ trợ link <span className="text-red-700">Youtube</span> (tự động lấy ảnh bìa hoặc phát video nhúng), link chia sẻ công khai <span className="text-emerald-700">Google Drive</span>, hoặc bất kỳ liên kết ảnh (.jpg, .png, .gif) nào.
                      </p>
                      <textarea
                        rows={3}
                        value={newSlideSource}
                        onChange={(e) => setNewSlideSource(e.target.value)}
                        placeholder="Hãy dán liên kết Youtube, Google Drive hoặc địa chỉ ảnh ở đây..."
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-350 rounded-xl p-3 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <label className="block text-[10px] font-extrabold text-slate-500">Tệp hình ảnh hoạt động</label>
                      <input 
                        type="file"
                        ref={slideFileInputRef}
                        accept="image/*"
                        onChange={handleSlideFileUpload}
                        className="hidden"
                      />
                      {newSlideSource ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                          <img 
                            src={newSlideSource} 
                            alt="Preview" 
                            className="w-full h-full object-cover object-center" 
                            style={{ objectFit: 'cover', objectPosition: 'center' }} 
                          />
                          <button
                            type="button"
                            onClick={() => setNewSlideSource('')}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => slideFileInputRef.current?.click()}
                          className="w-full py-6 bg-slate-100 hover:bg-slate-150 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-500 transition cursor-pointer"
                        >
                          <UploadCloud className="w-8 h-8 text-indigo-500" />
                          <span className="text-xs font-bold font-sans">Chọn tệp hình ảnh dưới 5MB</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add action button */}
                  <button
                    type="button"
                    onClick={handleAddNewSlide}
                    className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm hoạt động vào trình chiếu
                  </button>

                </div>

                {/* SLIDE LIST PANEL: PREVIEW & REMOVE */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">Danh sách ảnh trình chiếu đang phát ({bannerSlides.length})</h4>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Chuyển động liên tiếp s
                    </span>
                  </div>

                  {bannerSlides.length === 0 ? (
                    <div className="bg-white border rounded-2xl p-8 text-center space-y-3 shadow-inner">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <p className="text-xs font-extrabold text-slate-700">Chưa có ảnh trình chiếu tự chọn</p>
                        <p className="text-[11px] text-slate-500 mt-1">Hệ thống đang phát 3 ảnh hoạt động mặc định của trường. Bạn hãy tải lên tệp ảnh hoặc điền liên kết Youtube/Drive ở form bên trái để ghi đè danh sách phát tùy biến của nhà trường!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {bannerSlides.map((slide, idx) => {
                        let displayThumb = slide.source;
                        let mediaTypeText = "Tập tin";

                        if (slide.type === 'url') {
                          if (slide.source.includes('drive.google.com')) {
                            mediaTypeText = "Google Drive";
                            const matchD = slide.source.match(/\/d\/([a-zA-Z0-9_-]+)/);
                            const matchId = slide.source.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                            const driveId = (matchD && matchD[1]) || (matchId && matchId[1]);
                            if (driveId) {
                              displayThumb = `https://drive.google.com/uc?export=view&id=${driveId}`;
                            }
                          } else {
                            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                            const match = slide.source.match(regExp);
                            if (match && match[2] && match[2].length === 11) {
                              mediaTypeText = "YouTube Video";
                              displayThumb = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
                            } else {
                              mediaTypeText = "Liên kết ảnh";
                            }
                          }
                        }

                        return (
                          <div 
                            key={slide.id || idx}
                            className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3 h-[76px] items-center justify-between hover:border-slate-350 hover:shadow-sm transition-all text-left"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group">
                                <img 
                                  src={displayThumb} 
                                  alt="Slide Thumb" 
                                  className="w-full h-full object-cover object-center"
                                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                                  onError={(e) => {
                                    // if image fails to load (e.g. drive cors protection, give a nice thumbnail)
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150';
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                                {mediaTypeText === "YouTube Video" && (
                                  <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center">
                                    <span className="bg-red-650 text-white text-[7px] font-black px-1 rounded">YT</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5 overflow-hidden">
                                <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8px] font-black uppercase px-2 rounded-md">
                                  {mediaTypeText}
                                </span>
                                <p className="text-xs font-extrabold text-slate-800 truncate pr-2">
                                  {slide.title}
                                </p>
                                <p className="text-[9px] text-slate-450 font-mono font-medium">
                                  Đã đăng: {new Date(slide.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2.5 rounded-xl transition shrink-0 cursor-pointer"
                              title="Xóa slide hoạt động"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHÂN QUYỀN ĐĂNG TIN */}
        {activeTab === 'publishers' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border p-4.5 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-indigo-900 block">Khu Vực Quản Trị Phân Quyền Người Phát Hành</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {isUserAdmin 
                    ? 'Quản trị viên có toàn quyền bật/tắt vai trò cho phép soạn thảo hoặc gỡ bài viết đối với từng tài khoản trong trường. Hãy chọn tích hoặc bỏ tích vào cột "Quyền Đăng Tin".'
                    : 'Lưu ý: Chỉ tài khoản Admin mới có thẩm quyền trao đổi phân quyền cho giáo viên hay đoàn học vụ.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-2xl">
              <table className="w-full text-xs text-slate-600">
                <thead className="bg-slate-100 text-left uppercase text-[9.5px] font-black tracking-widest text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-3.5">Họ & Tên</th>
                    <th className="px-6 py-3.5">Tên đăng nhập</th>
                    <th className="px-6 py-3.5">Vai trò</th>
                    <th className="px-6 py-3.5">Mô tả thêm</th>
                    <th className="px-6 py-3.5 text-center">Quyền Đăng Tin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-semibold text-slate-800">{acc.name}</td>
                      <td className="px-6 py-3 font-mono font-medium text-[11px]">{acc.username}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm ${
                          acc.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                          acc.role === 'Nhân viên' ? 'bg-purple-100 text-purple-700' :
                          acc.role === 'Giáo viên' ? 'bg-sky-100 text-sky-700' :
                          acc.role === 'Học sinh' ? 'bg-emerald-100 text-emerald-700' :
                          acc.role === 'Phụ huynh' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {acc.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{acc.extra || 'Không có mô tả'}</td>
                      <td className="px-6 py-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer select-none justify-center">
                          <input 
                            type="checkbox"
                            checked={acc.role === 'Admin' || !!acc.canPostNews}
                            disabled={!isUserAdmin || acc.role === 'Admin'}
                            onChange={() => handleTogglePostNews(acc.id)}
                            className="sr-only peer"
                          />
                          <div className={`w-9 h-5 bg-slate-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-blue/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height after:h-4 after:w-4 after:transition-all ${
                            acc.role === 'Admin' ? 'bg-indigo-600 cursor-not-allowed opacity-60' : 'peer-checked:bg-emerald-500'
                          }`}></div>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ BÀI VIẾT & TIN TỨC */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border p-4 rounded-xl">
              <div>
                <span className="font-bold text-xs text-slate-700 block">Danh Sách Tin Bài Hoạt Động</span>
                <span className="text-[11px] text-slate-500">Các Giáo viên, Admin được cấp quyền biên tập và xuất bản lên cổng tin tức công cộng.</span>
              </div>
              
              {canUserPost ? (
                <button
                  onClick={() => handleOpenArticleModal(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Đăng bài viết mới
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg text-[10.5px] font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Bạn chưa có quyền đăng tin. Hãy liên hệ Admin!
                </div>
              )}
            </div>

            {/* List and Table Grid */}
            {activities.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-3xl bg-slate-50">
                <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-600">Không tìm thấy bài viết nào!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Chưa có bài viết hay hoạt động nào được tạo lập hoặc đồng bộ trong bản ghi hiện tại.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-100 uppercase text-[9px] font-black tracking-widest text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3.5 w-[50px]">Ảnh</th>
                      <th className="px-6 py-3.5">Tiêu đề bài viết</th>
                      <th className="px-6 py-3.5">Chuyên mục</th>
                      <th className="px-6 py-3.5">Ngày đăng</th>
                      <th className="px-6 py-3.5">Mô tả tóm tắt</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.map(act => (
                      <tr key={act.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3">
                          <div className="w-10 h-10 bg-slate-100 border rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                            {act.img ? (
                              <img src={act.img} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <FileImage className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800 break-words max-w-[200px]">{act.title}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                            act.category === 'TIN TỨC' ? 'bg-sky-100 text-sky-700' :
                            act.category === 'SỰ KIỆN' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {act.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono font-medium text-slate-500">{act.date}</td>
                        <td className="px-6 py-3 text-slate-500 line-clamp-2 max-w-[220px] pt-4.5">{act.desc}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {canUserPost ? (
                              <>
                                <button
                                  onClick={() => handleOpenArticleModal(act)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-650 transition cursor-pointer"
                                  title="Chỉnh sửa chi tiết"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(act.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-600 hover:text-rose-650 transition cursor-pointer"
                                  title="Xóa vĩnh viễn"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold italic">Không thể sửa</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: QUẢN LÝ ẢNH HỌC SINH VÀNG */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form panel on left */}
              <div className="lg:col-span-5 bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <span className="block text-[11px] font-black text-slate-405 uppercase tracking-wider mb-2">
                  {selectedStudentId !== null ? '✏️ Cập Nhật Gương Học Sinh Vàng' : '✨ Thêm Mới Gương Học Sinh Vàng'}
                </span>

                <form onSubmit={handleSaveStudent} className="space-y-3.5">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 relative shrink-0 group bg-slate-205 shadow-sm">
                      <img src={studAvatar} alt="Chân dung" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition">
                        Thay đổi
                      </div>
                      <input 
                        type="file" 
                        ref={studFileInputRef}
                        accept="image/*"
                        onChange={handleStudentAvatarUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ảnh Chân Dung Học Sinh</label>
                      <button 
                        type="button" 
                        onClick={() => studFileInputRef.current?.click()}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-150 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Chọn tệp ảnh từ máy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Họ và tên học sinh *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Gia Huy"
                      value={studName}
                      onChange={(e) => setStudName(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Lớp hành chính *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 9A"
                        value={studClass}
                        onChange={(e) => setStudClass(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Điểm trung bình GPA *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 9.8"
                        value={studGPA}
                        onChange={(e) => setStudGPA(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Hạnh kiểm</label>
                      <select
                        value={studConduct}
                        onChange={(e) => setStudConduct(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800 font-semibold"
                      >
                        <option value="Tốt">Tốt</option>
                        <option value="Khá">Khá</option>
                        <option value="Trung Bình">Trung bình</option>
                        <option value="Yếu">Yếu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Danh hiệu / Huân chương *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Thủ khoa học kỳ"
                        value={studBadge}
                        onChange={(e) => setStudBadge(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Các thành tích đạt được (Mỗi dòng một thành tích) *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Ví dụ:&#13;Giải Nhất Học sinh Giỏi môn Toán Cấp Thành Phố&#13;Huy chương Vàng Tiếng Anh kỳ thi Olympic học đường"
                      value={studAchievements}
                      onChange={(e) => setStudAchievements(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-205 rounded-xl p-2.5 text-slate-800"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {selectedStudentId !== null && (
                      <button
                        type="button"
                        onClick={handleResetStudentForm}
                        className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> {selectedStudentId !== null ? 'Cập nhật' : 'Lưu học sinh'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List panel on right */}
              <div className="lg:col-span-7 space-y-4">
                <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  📋 Danh Sách Gương Học Sinh Vàng Hiện Tại ({outstandingStudents.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {outstandingStudents.length > 0 ? (
                    outstandingStudents.map(student => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudentForEdit(student)}
                        className={`p-3.5 border rounded-2xl flex gap-3 cursor-pointer hover:border-brand-orange transition duration-205 group relative ${
                          selectedStudentId === student.id ? 'border-brand-orange bg-orange-50/10' : 'border-slate-205 bg-white'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                          <img src={student.avatar} alt={student.name} className="w-full h-full object-cover animate-fade-in" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-extrabold text-xs text-slate-800 truncate">{student.name}</h5>
                          <p className="text-[10px] text-slate-550 font-bold">Lớp: {student.class} | GPA: <span className="text-brand-orange font-bold font-mono">{student.gpa}</span></p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-[9px] text-amber-800 border border-amber-100 rounded-md font-extrabold">
                            🏆 {student.badge}
                          </span>
                        </div>

                        {/* Hover Tools */}
                        <div className="absolute top-2.5 right-2 rounded-lg bg-white/95 border border-slate-200 opacity-0 group-hover:opacity-100 flex items-center shadow-md transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectStudentForEdit(student);
                            }}
                            className="p-1.5 hover:text-indigo-650 transition text-slate-550 cursor-pointer"
                            title="Sửa học sinh"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(student.id);
                            }}
                            className="p-1.5 hover:text-rose-650 transition text-slate-550 cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-10 bg-slate-50 border border-dashed rounded-2xl border-slate-200">
                      <div className="text-slate-400 font-bold italic text-xs">Chưa có gương sáng học sinh vinh danh nào.</div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-semibold leading-relaxed">
                  💡 <b>Hướng dẫn liên kết hình ảnh:</b> Chân dung ảnh của các học sinh vinh danh được tải trực tiếp lên đây làm hình đại diện lấp lánh tại danh mục <b>"GƯƠNG SÁNG VÀNG DANH DỰ"</b> ở trang Tổng quan cho toàn trường theo dõi học tập.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ARTICLE CREATE / EDIT FORM DIALOG MODAL */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up text-left">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-orange-200" />
                <h3 className="font-extrabold text-white text-base">
                  {editingArticle ? 'Sửa Biên Tập Tin Bài' : 'Đăng Hoạt Động & Tin Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveArticle} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Chuyên mục bài viết *</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    <option value="TIN TỨC">TIN TỨC (Nhà trường/Xã)</option>
                    <option value="SỰ KIỆN">SỰ KIỆN (Khai mạc/Phong trào)</option>
                    <option value="VĂN THỂ">VĂN THỂ MỸ (Hội thi/Robot STEM)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Ngày đăng (DD/MM/YYYY) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21/06/2026"
                    value={artDate}
                    onChange={(e) => setArtDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Tiêu đề hoạt động/Tin tức *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề tin bài mới..."
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              {/* Banner Image selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Hình ảnh đại diện tin bài *</label>
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => articleImgInputRef.current?.click()}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" /> Tải lên ảnh tin bài từ máy
                  </button>
                  <input
                    type="file"
                    ref={articleImgInputRef}
                    accept="image/*"
                    onChange={handleFileChange('article')}
                    className="hidden"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">Hoặc dán trực tiếp link URL ảnh ở dưới</span>
                </div>
                <input
                  type="text"
                  placeholder="Https://images.unsplash.com/..."
                  value={artImg}
                  onChange={(e) => setArtImg(e.target.value)}
                  className="w-full text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                />
                
                {artImg && (
                  <div className="w-full h-24 mt-2 bg-slate-100 border rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                    <img src={artImg} alt="Preview bài viết" className="h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Brief description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Mô tả vắn tắt (Tóm lược hiển thị nhanh trên trang chủ) *</label>
                <textarea
                  required
                  rows={2}
                  maxLength={160}
                  placeholder="Tóm tắt vắn tắt thông điệp hoạt động dưới 160 từ..."
                  value={artDesc}
                  onChange={(e) => setArtDesc(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              {/* Content body detail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nội dung bài viết chi tiết *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Soạn thảo thông tin đầy đủ, chi tiết của sự kiện tin tức trường học..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              {/* Action */}
              <div className="pt-3 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 animate-pulse" /> Đăng bài công khai (Public)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
