import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  BookOpen, 
  Notebook, 
  Calendar, 
  Award, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  Sparkles,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  MessageSquare,
  BookOpenCheck,
  UserCheck,
  Building,
  ArrowRight,
  TrendingDown,
  Activity,
  ThumbsUp,
  ChevronDown
} from 'lucide-react';
import { Account, Class, Assignment, Submission, Exam, Homework, StudentConduct, HomeroomNotice } from '../types';
import { showToast } from './Toast';

interface TeacherWorkspaceSectionProps {
  currentUser: Account | null;
  classes: Class[];
  assignments: Assignment[];
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  exams: Exam[];
  homework: Homework[];
  conducts: StudentConduct[];
  setConducts: React.Dispatch<React.SetStateAction<StudentConduct[]>>;
  notices: HomeroomNotice[];
  setNotices: React.Dispatch<React.SetStateAction<HomeroomNotice[]>>;
}

export default function TeacherWorkspaceSection({
  currentUser,
  classes,
  assignments,
  submissions,
  setSubmissions,
  exams,
  homework,
  conducts,
  setConducts,
  notices,
  setNotices,
}: TeacherWorkspaceSectionProps) {
  const [activeTab, setActiveTab] = useState<'homeroom' | 'subject'>('homeroom');
  
  // Find which class(es) this teacher is in charge of (GVCN)
  const homeroomClasses = classes.filter(cls => cls.gvcn === currentUser?.name);
  const [selectedHomeroomClass, setSelectedHomeroomClass] = useState<string>('');

  // Selected parameters
  useEffect(() => {
    if (homeroomClasses.length > 0 && !selectedHomeroomClass) {
      setSelectedHomeroomClass(homeroomClasses[0].id);
    }
  }, [homeroomClasses, selectedHomeroomClass]);

  // Form states for adding notice
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  // Form states for behavioral log
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editConduct, setEditConduct] = useState<'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu'>('Tốt');
  const [editAttendance, setEditAttendance] = useState<'Đầy đủ' | 'Nghỉ phép' | 'Nghỉ không phép'>('Đầy đủ');
  const [editScore, setEditScore] = useState(90);
  const [editNote, setEditNote] = useState('');

  if (!currentUser || currentUser.role !== 'Giáo viên') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-extrabold text-base text-rose-800">Quyền truy cập hạn chế</h3>
        <p className="text-xs text-rose-600 mt-1 font-semibold">
          Khu vực nghiệp vụ này chỉ dành riêng cho các Thầy Cô Giáo viên của Trường THCS Hòa Phú.
        </p>
      </div>
    );
  }

  // Find students in the selected homeroom class
  // We can look up in accounts or submissions matching the class
  const mockRoster = [
    { name: 'Nguyễn Kim Ngân', status: 'Học tập Tốt', id: 1001 },
    { name: 'Vũ Hoàng Nam', status: 'Học tập Tốt', id: 1002 },
    { name: 'Trần Minh Đức', status: 'Năng nổ, cần cải thiện tập trung', id: 1003 },
    { name: 'Phạm Thảo Vy', status: 'Chăm ngoan, học đều', id: 1004 },
    { name: 'Lê Hoàng Phong', status: 'Sáng tạo môn Toán', id: 1005 },
    { name: 'Đỗ Hà Linh', status: 'Học sinh tích cực, giữ gìn vệ sinh lớp', id: 1006 }
  ];

  // Map students of that class which might have different status
  const currentStudentsList = mockRoster.map(std => {
    const customRecord = conducts.find(c => c.studentName === std.name && c.className === selectedHomeroomClass);
    return {
      ...std,
      conduct: customRecord?.conduct || 'Tốt',
      attendance: customRecord?.attendance || 'Đầy đủ',
      scoreBehavior: customRecord?.scoreBehavior ?? 95,
      teacherNote: customRecord?.teacherNote || std.status,
      lastUpdate: customRecord?.updateDate || 'Mặc định đầu kỳ'
    };
  });

  const handleSaveConduct = (studentName: string) => {
    const updated: StudentConduct = {
      studentName,
      className: selectedHomeroomClass,
      conduct: editConduct,
      attendance: editAttendance,
      scoreBehavior: editScore,
      teacherNote: editNote.trim() || 'Học lực ổn định, chuyên cần chăm ngoan.',
      updateDate: new Date().toLocaleDateString('vi-VN')
    };

    setConducts(prev => {
      const filtered = prev.filter(c => !(c.studentName === studentName && c.className === selectedHomeroomClass));
      return [updated, ...filtered];
    });

    setEditingStudent(null);
    showToast(`Đã lưu cập nhật hạnh kiểm chuyên cần của học sinh ${studentName}!`, "success");
  };

  const handleStartEdit = (student: any) => {
    setEditingStudent(student.name);
    setEditConduct(student.conduct);
    setEditAttendance(student.attendance);
    setEditScore(student.scoreBehavior);
    setEditNote(student.teacherNote);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeContent) {
      showToast("Vui lòng điền tiêu đề và nội dung thông báo!", "info");
      return;
    }

    const n: HomeroomNotice = {
      id: Date.now(),
      className: selectedHomeroomClass,
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      date: new Date().toLocaleDateString('vi-VN'),
      pin: false
    };

    setNotices(prev => [n, ...prev]);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    showToast(`Đã gửi thông báo đến các bậc Phụ huynh lớp ${selectedHomeroomClass}!`, "success");
  };

  const handleDeleteNotice = (id: number) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    showToast("Đã xóa bản tin thông báo chủ nhiệm!", "info");
  };

  // --- SUBJECT TEACHER LOGIC ---
  // Subject Teacher works on classes & subjects assigned in `assignments`
  const myAssignments = assignments.filter(asg => asg.teacherName === currentUser.name);

  // Filter submissions that this teacher is responsible for grading
  const mySubmissionsToGrade = submissions.filter(sub => {
    // If teacher has assigned subjects and classes, filter only those
    if (myAssignments.length > 0) {
      return myAssignments.some(asg => 
        asg.subjects.includes(sub.subject) && asg.classes.includes(sub.class)
      );
    }
    // Fallback: If no assignment has been set, show all waitlisted submissions 
    return true;
  });

  const pendingGradingCount = mySubmissionsToGrade.filter(s => s.grade === null).length;
  const completedGradingCount = mySubmissionsToGrade.filter(s => s.grade !== null).length;

  // Grade stats
  const totalMySubs = mySubmissionsToGrade.length;
  const averageGradeOfMyStudents = totalMySubs > 0 
    ? (mySubmissionsToGrade.reduce((acc, curr) => acc + (curr.grade || 0), 0) / totalMySubs)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-exclusive-desk">
      {/* Teacher Profile Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 p-6 rounded-3xl border border-indigo-700/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-5 pointer-events-none">
          <Building className="w-80 h-80" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="bg-yellow-400 text-slate-900 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest block w-fit shadow-sm">
              Góc Sư Phạm Chuẩn Quốc Gia
            </span>
            <h2 className="text-xl md:text-2xl font-black font-sans leading-tight">
              Bàn làm việc Thầy Cô: {currentUser.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-150">
              <span className="font-bold flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                🏢 Tổ chuyên môn: {currentUser.extra || "Chưa thiết lập"}
              </span>
              {homeroomClasses.length > 0 ? (
                <span className="font-black text-yellow-300 flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                  🏡 GVCN Lớp: {homeroomClasses.map(c => c.lop).join(', ')}
                </span>
              ) : (
                <span className="font-semibold text-slate-300 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                  📖 Chỉ chuyên trách Bộ môn
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {/* Custom Mode Select Dropdown */}
            <div className="relative">
              <select
                id="workspace-mode-selector"
                value={activeTab}
                onChange={(e) => {
                  const val = e.target.value as 'homeroom' | 'subject';
                  setActiveTab(val);
                  showToast(val === 'homeroom' ? "Chuyển sang Chế độ Giáo viên Chủ nhiệm (GVCN)" : "Chuyển sang Chế độ Giáo viên Bộ môn (GVBM)", "info");
                }}
                className="appearance-none bg-indigo-950/90 border border-indigo-700/60 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 pr-10 rounded-xl transition cursor-pointer outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                <option value="homeroom" className="bg-indigo-950 text-white font-bold">🏡 Chế độ GVCN (Chủ nhiệm)</option>
                <option value="subject" className="bg-indigo-950 text-white font-bold">📚 Chế độ GVBM (Bộ môn)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-white">
                <ChevronDown className="w-3.5 h-3.5 text-violet-300" />
              </div>
            </div>

            {/* Quick-pill buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-workspace-gvcn"
                onClick={() => {
                  setActiveTab('homeroom');
                  showToast("Chuyển sang Chế độ Giáo viên Chủ nhiệm (GVCN)", "info");
                }}
                className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition shadow-md cursor-pointer ${
                  activeTab === 'homeroom'
                    ? 'bg-yellow-400 text-slate-900 font-black scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Chủ nhiệm (GVCN)
              </button>
              <button
                id="btn-workspace-gvbm"
                onClick={() => {
                  setActiveTab('subject');
                  showToast("Chuyển sang Chế độ Giáo viên Bộ môn (GVBM)", "info");
                }}
                className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition shadow-md cursor-pointer ${
                  activeTab === 'subject'
                    ? 'bg-sky-500 text-white font-black scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Bộ môn (GVBM)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER TAB 1: HOMEROOM (GVCN) */}
      {activeTab === 'homeroom' && (
        <div className="space-y-6">
          {homeroomClasses.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
              <b className="text-slate-800 text-sm md:text-base block font-extrabold">Không phát hiện lớp chủ nhiệm được gán</b>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Hệ thống nhận diện Thầy Cô <span className="font-bold text-slate-800">"{currentUser.name}"</span> đang được phân công dạy 
                các chuyên mục bộ môn độc lập và hiện chưa được phân công làm giáo viên chủ nhiệm lớp nào trong học bạ số.
              </p>
              <div className="mt-5 text-center">
                <button
                  onClick={() => setActiveTab('subject')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Truy cập Chuyên môn Bộ môn
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Homeroom students and conduct */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base text-slate-850 flex items-center gap-2">
                      <Users2 className="w-5 h-5 text-indigo-600" />
                      Sổ Chủ Nhiệm Lớp: 
                      <select 
                        value={selectedHomeroomClass} 
                        onChange={(e) => setSelectedHomeroomClass(e.target.value)}
                        className="bg-slate-100 font-extrabold text-brand-blue border-none rounded-lg p-1 text-xs cursor-pointer focus:ring-1 focus:ring-brand-blue"
                      >
                        {homeroomClasses.map(c => (
                          <option key={c.id} value={c.id}>Lớp {c.lop}</option>
                        ))}
                      </select>
                    </h3>
                    <p className="text-[10px] text-slate-450 font-bold tracking-wide mt-0.5">
                      Đánh giá rèn luyện hạnh kiểm và cập nhật chuyên cần trực tiếp lên học bạ điện tử của học sinh Hòa Phú.
                    </p>
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-full">
                    Sĩ số chủ nhiệm: {currentStudentsList.length} học viên
                  </span>
                </div>

                {/* Main students list in homeroom */}
                <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                  {currentStudentsList.map(item => {
                    const isEditing = editingStudent === item.name;
                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 border rounded-2xl transition-all duration-200 ${
                          isEditing 
                            ? 'border-indigo-400 bg-indigo-50/10 shadow-md' 
                            : 'border-slate-150 bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <b className="text-slate-800 text-xs md:text-sm font-bold">{item.name}</b>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                item.conduct === 'Tốt' ? 'bg-emerald-100 text-emerald-800' :
                                item.conduct === 'Khá' ? 'bg-blue-100 text-blue-800' :
                                item.conduct === 'Trung Bình' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800 font-bold'
                              }`}>
                                Hạnh kiểm: {item.conduct}
                              </span>
                              <span className="text-[9.5px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Điểm rèn luyện: {item.scoreBehavior}đ
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-600">
                              Chuyên cần hôm nay: <span className="font-bold">{item.attendance}</span>
                            </p>
                            
                            <p className="text-[11px] text-slate-500 font-semibold italic bg-slate-50 p-2 rounded-lg border border-dotted">
                              Nhận xét nhận định: <span className="text-slate-800 font-bold">"{item.teacherNote}"</span>
                            </p>
                            
                            <p className="text-[9px] text-indigo-600 font-extrabold font-mono pt-1">
                              Cập nhật cuối: {item.lastUpdate}
                            </p>
                          </div>

                          {!isEditing ? (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition cursor-pointer"
                            >
                              Đánh giá rèn luyện
                            </button>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-black uppercase animate-pulse">
                              Đang nhập điểm...
                            </span>
                          )}
                        </div>

                        {/* Inline edit panel within selected row */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3.5 text-xs">
                            <span className="text-[10.5px] font-extrabold text-indigo-900 block uppercase tracking-wider">
                              Biểu mẫu đánh giá rèn luyện học bạ số của {item.name}
                            </span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Conduct */}
                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 uppercase font-extrabold">Hạnh kiểm đề đạt</label>
                                <select 
                                  value={editConduct} 
                                  onChange={(e: any) => setEditConduct(e.target.value)}
                                  className="w-full text-xs p-2.5 border rounded-lg bg-white"
                                >
                                  <option value="Tốt">Xếp loại Tốt</option>
                                  <option value="Khá">Xếp loại Khá</option>
                                  <option value="Trung Bình">Xếp loại Trung Bình</option>
                                  <option value="Yếu">Xếp loại Yếu</option>
                                </select>
                              </div>

                              {/* Attendance */}
                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 uppercase font-extrabold">Chuyên cần hôm nay</label>
                                <select 
                                  value={editAttendance} 
                                  onChange={(e: any) => setEditAttendance(e.target.value)}
                                  className="w-full text-xs p-2.5 border rounded-lg bg-white"
                                >
                                  <option value="Đầy đủ">Đi học đầy đủ</option>
                                  <option value="Nghỉ phép">Nghỉ học có phép</option>
                                  <option value="Nghỉ không phép">Vắng mặt không phép</option>
                                </select>
                              </div>

                              {/* Conduct Score */}
                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 uppercase font-extrabold">Cột điểm Rèn luyện (Thang 100)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="100"
                                  value={editScore}
                                  onChange={(e) => setEditScore(Number(e.target.value))}
                                  className="w-full text-xs p-2.5 border rounded-lg bg-white font-mono font-bold"
                                />
                              </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-extrabold">Lời nhận xét học bạ (Đóng góp thúc đẩy sự tiến bộ)</label>
                              <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                rows={2}
                                className="w-full p-2.5 border rounded-lg bg-white"
                                placeholder={`Ví dụ: Lớp trưởng năng bổ, học giỏi môn tự nhiên...`}
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button 
                                onClick={() => setEditingStudent(null)} 
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button 
                                onClick={() => handleSaveConduct(item.name)} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4.5 py-2 rounded-xl font-extrabold shadow cursor-pointer"
                              >
                                Lưu học bạ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Homeroom Parent Notice broadcasts */}
              <div className="space-y-6">
                {/* Notice Creator Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <Send className="w-4.5 h-4.5 text-brand-orange animate-pulse" />
                      Phát loa thông báo Chủ nhiệm
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Phát đi chỉ đạo, nội quy lớp và kế hoạch họp phụ huynh gửi trực tiếp tới Sổ liên lạc gia đình lớp {selectedHomeroomClass}.
                    </p>
                  </div>

                  <form onSubmit={handleCreateNotice} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-505 font-bold uppercase">Tiêu đề thông báo tóm gọn</label>
                      <input 
                        type="text" 
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="Ví dụ: Đóng quỹ Đội TNTP và chuẩn bị khảo sát..."
                        className="w-full p-2.5 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-505 font-bold uppercase">Nội dung thông điệp chi tiết</label>
                      <textarea
                        value={newNoticeContent}
                        onChange={(e) => setNewNoticeContent(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 border rounded-xl font-semibold"
                        placeholder="Nhập yêu cầu rèn luyện, nhắc nhở đồng phục của học sinh ngày mai..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white p-2.5 rounded-xl font-black shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Gửi tới Sổ liên lạc
                    </button>
                  </form>
                </div>

                {/* Notices Stream preview */}
                <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-[10.5px] font-extrabold text-indigo-900 block uppercase tracking-wider">
                      Dòng tin báo đã phát đi - Lớp {selectedHomeroomClass}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {notices.filter(n => n.className === selectedHomeroomClass).length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-6 font-bold">
                        Chưa có thông báo chủ nhiệm nào được phát đi học kỳ này.
                      </p>
                    ) : (
                      notices.filter(n => n.className === selectedHomeroomClass).map(n => (
                        <div key={n.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl relative space-y-1">
                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-rose-500 font-extrabold"
                            title="Xóa thông báo này"
                          >
                            Xóa
                          </button>
                          <b className="text-[11px] text-slate-800 font-bold block pr-8 leading-tight">{n.title}</b>
                          <p className="text-[10px] text-slate-500 leading-normal">{n.content}</p>
                          <span className="text-[8.5px] text-slate-400 font-bold block text-right pt-1 font-mono">
                            Ngày phát: {n.date}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 2: SUBJECT (GVBM) */}
      {activeTab === 'subject' && (
        <div className="space-y-6">
          {/* Section Summary Counters for subject tasks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-indigo-950 text-[10px] font-extrabold uppercase tracking-wide block">Trung tâm chờ chấm điểm</span>
                <span className="text-2xl font-black text-indigo-900 mt-1 block font-mono">{pendingGradingCount} bài chờ</span>
              </div>
              <BookOpenCheck className="w-8 h-8 text-indigo-700 opacity-20" />
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-teal-50 p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-teal-950 text-[10px] font-extrabold uppercase tracking-wide block">Đã hoàn thành hồ sơ</span>
                <span className="text-2xl font-black text-teal-800 mt-1 block font-mono">{completedGradingCount} bài thi</span>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-700 opacity-20" />
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-orange-50 p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-orange-950 text-[10px] font-extrabold uppercase tracking-wide block">Điểm TB môn bộ môn dạy</span>
                <span className="text-2xl font-black text-orange-900 mt-1 block font-mono">{averageGradeOfMyStudents.toFixed(1)} / 10đ</span>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-700 opacity-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Box: Classes assigned list & quick actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-4 lg:col-span-1">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <CheckSquare className="w-4.5 h-4.5 text-sky-600" />
                  Phân công giảng dạy BM học kỳ II
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Các lớp học và khối lớp bộ môn mà Thầy Cô đang cầm đầu sổ điểm học kì này.
                </p>
              </div>

              {myAssignments.length === 0 ? (
                <div className="p-4 border border-dashed rounded-xl bg-slate-50 text-center text-xs text-slate-500 font-semibold">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  Chưa khai báo phân công môn dạy cụ thể trong Admin. Thầy cô được quyền coi tất cả.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myAssignments.map(asg => (
                    <div key={asg.id} className="p-3 bg-sky-50/20 border border-sky-100/70 rounded-xl space-y-1.5">
                      <span className="bg-brand-blue text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                        Khai báo phân công ID {asg.id}
                      </span>
                      
                      <div className="text-xs space-y-1 font-semibold text-slate-700">
                        <p>🔹 Khối bộ môn dạy: <span className="font-black text-slate-850">{asg.subjects.join(', ')}</span></p>
                        <p>🏫 Lớp phụ trách điểm: <span className="font-black text-brand-blue">{asg.classes.join(', ')}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subject specific visual widgets */}
              <div className="bg-slate-50 rounded-2xl p-4 border space-y-3.5">
                <span className="text-[10.5px] font-extrabold text-slate-600 uppercase tracking-widest block border-b pb-1">
                  Chỉ số sức học bộ môn rèn luyện
                </span>
                
                {/* Metric bars representing dummy grade divisions */}
                <div className="space-y-2.5 text-xs font-bold text-slate-750">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Loại Giỏi (8.0 - 10.0đ)</span>
                      <span className="text-emerald-700 font-bold">54% học viên</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Loại Khá (6.5 - 7.9đ)</span>
                      <span className="text-brand-blue font-bold">32% học viên</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-blue h-full rounded-full" style={{ width: '32%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Trung bình (5.0 - 6.4đ)</span>
                      <span className="text-amber-600 font-bold">12% học viên</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Yếu kém (&lt; 5.0đ)</span>
                      <span className="text-rose-600 font-bold">2% học viên</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-600 h-full rounded-full" style={{ width: '2%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Filtered lists & grading shortcut */}
            <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-805 flex items-center gap-1.5">
                    <ClipboardList className="w-5 h-5 text-indigo-650" />
                    Hồ sơ chấm thi học bạ phân loại theo Bộ môn
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Danh sách các bài làm của học sinh thuộc các Lớp / Môn học Thầy Cô đang giảng dạy chuyên môn.
                  </p>
                </div>
              </div>

              {/* List of submissions */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {mySubmissionsToGrade.length === 0 ? (
                  <p className="text-slate-400 italic font-bold text-center py-10">
                    Không tìm thấy bài làm nào thuộc phạm vi bộ môn được phân công giảng dạy.
                  </p>
                ) : (
                  mySubmissionsToGrade.map(sub => (
                    <div key={sub.id} className="p-3 border rounded-xl hover:shadow-sm bg-slate-50/20 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <b className="text-slate-800 text-[13px]">{sub.student} (Lớp {sub.class})</b>
                          <p className="text-slate-500 font-bold text-[10.5px] mt-0.5">
                            Môn: <span className="text-brand-blue font-black">{sub.subject}</span> | Vũ môn: {sub.type}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          sub.grade !== null 
                            ? 'bg-emerald-100 text-emerald-800 border' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                        }`}>
                          {sub.grade !== null ? `Đã chấm: ${sub.grade.toFixed(1)}đ` : 'Chờ chấm tự luận'}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 border border-slate-100 rounded leading-relaxed italic">
                        Bài tự luận nộp: "{sub.text}"
                      </div>

                      {sub.grade !== null && (
                        <p className="text-[10px] text-slate-450 mt-1.5 font-bold">
                          Lời phê: <span className="text-slate-700 italic">"{sub.remark || 'Không có.'}"</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
