import React, { useState } from 'react';
import { Youtube, Search, PlusCircle, Trash2, Edit3, ExternalLink, Play, ListFilter, HelpCircle, X } from 'lucide-react';
import { YoutubeLesson, Account } from '../types';
import { showToast } from './Toast';

interface YoutubeLearningSectionProps {
  currentUser: Account | null;
  lessons: YoutubeLesson[];
  setLessons: React.Dispatch<React.SetStateAction<YoutubeLesson[]>>;
}

export default function YoutubeLearningSection({
  currentUser,
  lessons,
  setLessons,
}: YoutubeLearningSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<YoutubeLesson | null>(null);

  // Form states for creating/editing lesson
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<YoutubeLesson | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formGrade, setFormGrade] = useState('Lớp 9');
  const [formDesc, setFormDesc] = useState('');

  const isAdminOrTeacher = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Giáo viên');

  // Helper to extract Youtube Video ID (Highly robust for shorts, live, standard watch, share, and plain IDs)
  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    
    // If it's already an 11-character alphanumeric string, return it directly
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      // 1. Handle YouTube Shorts
      if (trimmed.includes('/shorts/')) {
        const parts = trimmed.split('/shorts/');
        if (parts[1]) {
          const id = parts[1].split(/[?&#]/)[0];
          if (id.length === 11) return id;
        }
      }

      // 2. Handle YouTube Live
      if (trimmed.includes('/live/')) {
        const parts = trimmed.split('/live/');
        if (parts[1]) {
          const id = parts[1].split(/[?&#]/)[0];
          if (id.length === 11) return id;
        }
      }

      // 3. Handle standard video links & shared/embed links
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = trimmed.match(regExp);
      if (match && match[2] && match[2].length === 11) {
        return match[2];
      }

      // 4. Handle URL parameters fallback
      if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const vParam = urlObj.searchParams.get('v');
        if (vParam && vParam.length === 11) {
          return vParam;
        }
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
    
    return null;
  };

  const handleOpenModal = (lesson: YoutubeLesson | null = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormTitle(lesson.title);
      setFormUrl(lesson.youtubeUrl);
      setFormSubject(lesson.subject);
      setFormGrade(lesson.grade);
      setFormDesc(lesson.description);
    } else {
      setEditingLesson(null);
      setFormTitle('');
      setFormUrl('');
      setFormSubject('Toán học');
      setFormGrade('Lớp 9');
      setFormDesc('');
    }
    setIsModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      showToast("Vui lòng điền đầy đủ tiêu đề và link học liệu YouTube!", "error");
      return;
    }

    const videoId = getYoutubeId(formUrl);
    if (!videoId) {
      showToast("Định dạng liên kết YouTube không hợp lệ! Vui lòng thử lại.", "error");
      return;
    }

    if (editingLesson) {
      setLessons(prev => prev.map(l => {
        if (l.id === editingLesson.id) {
          return {
            ...l,
            title: formTitle.trim(),
            youtubeUrl: formUrl.trim(),
            subject: formSubject,
            grade: formGrade,
            description: formDesc.trim(),
          };
        }
        return l;
      }));
      showToast("Đã sửa đổi tài liệu học tập YouTube thành công!", "success");
    } else {
      const newLesson: YoutubeLesson = {
        id: Date.now(),
        title: formTitle.trim(),
        youtubeUrl: formUrl.trim(),
        subject: formSubject,
        grade: formGrade,
        description: formDesc.trim(),
        createdAt: new Date().toLocaleDateString('vi-VN')
      };
      setLessons(prev => [newLesson, ...prev]);
      showToast("Đã thêm thành công học liệu bài giảng YouTube mới!", "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteLesson = (id: number) => {
    setLessons(prev => prev.filter(l => l.id !== id));
    showToast("Đã xóa học liệu bài giảng khỏi danh sách!", "success");
    if (activeLesson?.id === id) {
      setActiveVideoId(null);
      setActiveLesson(null);
    }
  };

  const startPlaying = (lesson: YoutubeLesson) => {
    const vId = getYoutubeId(lesson.youtubeUrl);
    if (vId) {
      setActiveVideoId(vId);
      setActiveLesson(lesson);
      showToast(`Đang trình chiếu bài giảng: ${lesson.title}`, "info");
    } else {
      showToast("Không tìm thấy ID video hợp lệ của bài học này!", "error");
    }
  };

  // Filter lessons
  const lessonsList = Array.isArray(lessons) ? lessons : [];

  const filteredLessons = lessonsList.filter(l => {
    const matchesSearch = (l.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || l.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || l.grade === selectedGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = ['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'Tin học', 'STEM'];
  const grades = ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-5">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <span className="p-1.5 bg-red-100 rounded-lg text-red-600">
            <Youtube className="w-5 h-5 fill-red-600" />
          </span>
          Kho Học Liệu Số & Bài Giảng Trực Tuyến YouTube
        </h3>
        {isAdminOrTeacher && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Đăng bài giảng mới
          </button>
        )}
      </div>

      {/* Embedded Player Dashboard */}
      {activeVideoId && activeLesson && (
        <div className="bg-slate-900 rounded-3xl p-4 mb-6 border border-slate-850 text-white animate-fade-in">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="bg-red-600 text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                {activeLesson.subject} | {activeLesson.grade}
              </span>
              <h4 className="font-extrabold text-xs sm:text-sm mt-1 text-slate-100">
                {activeLesson.title}
              </h4>
            </div>
            <button
              onClick={() => {
                setActiveVideoId(null);
                setActiveLesson(null);
              }}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
              title={activeLesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-850 p-3 rounded-xl border border-slate-800">
            <p className="font-semibold text-slate-200 uppercase text-[10px] tracking-wide mb-1">Nội dung bài học:</p>
            {activeLesson.description || 'Không có mô tả bổ sung cho bài giảng này.'}
          </div>
        </div>
      )}

      {/* Filters and Search utilities */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề bài giảng, từ khóa học tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="all">📚 Tất cả bộ môn</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="all">🎓 Tất cả khối lớp</option>
            {grades.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of video lessons */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map(lesson => {
            const vId = getYoutubeId(lesson.youtubeUrl);
            const thumbUrl = vId 
              ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={lesson.id}
                className="group border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 flex flex-col h-full"
              >
                {/* Thumbnail Layer */}
                <div className="h-36 w-full bg-slate-100 relative overflow-hidden shrink-0">
                  <img
                    src={thumbUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition">
                    <button
                      onClick={() => startPlaying(lesson)}
                      className="p-3 bg-red-600 group-hover:bg-red-700 text-white rounded-full transition shadow-lg shrink-0 transform group-hover:scale-110 duration-200"
                    >
                      <Play className="w-5 h-5 fill-white" />
                    </button>
                  </div>
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[8px] font-extrabold tracking-widest px-2 py-0.5 rounded-full uppercase">
                    {lesson.grade}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 bg-red-650/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                    {lesson.subject}
                  </span>
                </div>

                {/* Info Block */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[11px] md:text-xs text-slate-850 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                      {lesson.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1 px-0.5 leading-relaxed">
                      {lesson.description || 'Không có mô tả chi tiết từ giáo viên.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-[9.5px] font-bold text-slate-400">
                    <span>Đăng ngày: {lesson.createdAt}</span>
                    <div className="flex gap-1.5">
                      {isAdminOrTeacher && (
                        <>
                          <button
                            onClick={() => handleOpenModal(lesson)}
                            className="p-1 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-lg transition"
                            title="Chỉnh sửa học liệu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg transition"
                            title="Xóa học liệu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <a
                        href={lesson.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg transition"
                        title="Xem trên YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <Youtube className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Chưa tìm thấy bài giảng YouTube nào phù hợp.</p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto font-medium">Hãy sử dụng bộ lọc hoặc nhập nội dung để tìm kiếm, hoặc đăng tải bồi dưỡng học liệu mới!</p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 font-extrabold text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Youtube className="w-4 h-4 fill-white" />
                {editingLesson ? 'Cập Nhật Bài Giảng YouTube' : 'Đăng Bài Giảng YouTube Mới'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tiêu đề bài học / bài giảng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ôn tập Hệ thức lượng trong Tam giác vuông..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Đường dẫn liên kết YouTube *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ hoặc dQw4w9WgXcQ"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 transition"
                />
                {formUrl.trim() && (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    {getYoutubeId(formUrl) ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://img.youtube.com/vi/${getYoutubeId(formUrl)}/hqdefault.jpg`}
                          alt="Video Preview"
                          className="w-20 h-12 object-cover rounded-lg border border-slate-200 bg-black shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                          Liên kết hợp lệ! Nhận dạng thành công.
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                        ⚠️ Chưa nhận dạng được đường dẫn YouTube hợp lệ (Shorts, Live, Watch...).
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bộ môn học
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                  >
                    {subjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Khối lớp học
                  </label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                  >
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mô tả vắn tắt / Giao nhiệm vụ tự học
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung mô tả hoặc dặn dò học sinh tự học ở nhà..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow cursor-pointer"
                >
                  {editingLesson ? 'Cập nhật' : 'Đăng bài giảng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
