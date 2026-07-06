import React, { useState } from 'react';
import { 
  BookOpen, 
  User, 
  CheckCircle2, 
  Clipboard, 
  Plus, 
  Sparkles, 
  History, 
  Search, 
  AlertCircle,
  Clock,
  ThumbsUp,
  Trash2
} from 'lucide-react';
import { Submission, Account } from '../types';
import { showToast } from './Toast';

interface GradingSectionProps {
  currentUser: Account | null;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  onOpenGradingModal: (id: number) => void;
  onDeleteSubmission?: (id: number) => void;
}

const mockStudents = [
  { name: 'Trần Minh Đức', class: '9A' },
  { name: 'Vũ Hoàng Nam', class: '9B' },
  { name: 'Phạm Thảo Vy', class: '9A' },
  { name: 'Lê Hoàng Phong', class: '9C' },
  { name: 'Đỗ Hà Linh', class: '9B' }
];

const mockSubjects = [
  { 
    subject: 'Toán học', 
    type: 'Khảo sát đầu hè', 
    essayQuestion: 'Hãy nêu ứng dụng của hệ thức lượng trong thực tế đời sống.', 
    answers: '1A,2B,3C,4D', 
    mcqMaxScore: 5.0, 
    essayMaxScore: 5.0, 
    text: 'Em xin được tóm gọn: ứng dụng lớn nhất của hệ thức lượng là hỗ trợ các ngành xây dựng, kiến trúc, bản đồ số đo chiều cao cây, tháp hay núi gián tiếp thông qua tia nắng mặt trời và các hệ số góc dốc.' 
  },
  { 
    subject: 'Ngữ văn', 
    type: 'Đọc hiểu chuyên đề', 
    essayQuestion: 'Phân tích tinh thần tự học của thế hệ trẻ trong đại kỷ nguyên AI.', 
    answers: '1C,2A,3D,4B', 
    mcqMaxScore: 4.0, 
    essayMaxScore: 6.0, 
    text: 'Tinh thần tự học không chỉ giúp chúng ta chủ động cập nhật công cụ AI tiên phong mà còn giúp rèn giũa năng lực tư duy chiều sâu độc lập, không bị thao túng bởi các phản hồi tự động của máy móc.' 
  },
  { 
    subject: 'Tiếng Anh', 
    type: 'Kiểm tra kỹ năng', 
    essayQuestion: 'Write a short paragraph about how digital tools improve your school study.', 
    answers: '1D,2D,3B,4A', 
    mcqMaxScore: 6.0, 
    essayMaxScore: 4.0, 
    text: 'Modern school applications like digital report cards promote ultimate transparency. Teachers can evaluate assignments online and sync feedback to our parents in lightning speed, keeping our motivation high.' 
  }
];

export default function GradingSection({
  currentUser,
  submissions,
  setSubmissions,
  onOpenGradingModal,
  onDeleteSubmission,
}: GradingSectionProps) {
  const isReadOnly = currentUser && (currentUser.role === 'Học sinh' || currentUser.role === 'Phụ huynh' || currentUser.role === 'Khách');
  const [activeTab, setActiveTab] = useState<'pending' | 'graded'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingSubmissions = submissions.filter(sub => sub.grade === null);
  const gradedSubmissions = submissions.filter(sub => sub.grade !== null);

  const displayedList = activeTab === 'pending' ? pendingSubmissions : gradedSubmissions;

  // Filter list by students or subjects
  const filteredList = displayedList.filter(sub => 
    sub.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMockSubmission = () => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    // Select random elements
    const student = mockStudents[Math.floor(Math.random() * mockStudents.length)];
    const subjectData = mockSubjects[Math.floor(Math.random() * mockSubjects.length)];
    
    // Auto calculate random MCQ score based on max
    const randomCorrectRatio = 0.5 + Math.random() * 0.5; // 50% to 100%
    const mcqScore = Math.round(subjectData.mcqMaxScore * randomCorrectRatio * 2) / 2;

    const newSub: Submission = {
      id: Date.now(),
      student: student.name,
      class: student.class,
      subject: subjectData.subject,
      type: subjectData.type,
      date: new Date().toLocaleDateString('vi-VN'),
      submissionType: 'text',
      text: subjectData.text,
      fileData: null,
      answers: subjectData.answers,
      mcqScore,
      mcqMaxScore: subjectData.mcqMaxScore,
      essayScore: null,
      essayMaxScore: subjectData.essayMaxScore,
      grade: null,
      remark: '',
      isSynced: false
    };

    setSubmissions(prev => [newSub, ...prev]);
    showToast(`Đã tạo giả lập thành công bài nộp học vụ của học sinh ${student.name}!`, "success");
  };

  const handleClearGradedSubmissions = () => {
    if (isReadOnly) {
      showToast("Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác này!", "info");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa lịch sử bài luận đã chấm điểm? (Bài chờ chấm vẫn được giữ nguyên)")) {
      setSubmissions(prev => prev.filter(s => s.grade === null));
      showToast("Đã dọn dẹp sạch danh sách bài thi đã hoàn tất chấm điểm!", "info");
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in space-y-5 text-left">
      {isReadOnly && (
        <div className="mb-4 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-805 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-[13px]">Chế độ Xem Thử Giao Diện (Chỉ Đọc - Read-only)</p>
            <p className="font-medium text-slate-600 leading-relaxed">
              Bạn đang truy cập trang Chấm thi với vai trò <strong className="text-amber-700">{currentUser?.role}</strong>. 
              Bạn có thể tự do xem toàn bộ kết quả thi và các bài nộp của học sinh tại đây, nhưng <strong>không có quyền thực hiện các thao tác chấm điểm, chỉnh sửa hoặc xóa dữ liệu</strong>.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-blue" />
            Hội Đồng Khảo Thí: Chấm Thi & Nhập Điểm Học Bạ Số
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Duyệt bài làm tự luận trắc nghiệm của học sinh Hòa Phú và đồng bộ kết quả vào Học Bạ Số Hóa Quốc gia.
          </p>
        </div>

        {/* Quick diagnostic button to create material for testing */}
        <button
          onClick={handleCreateMockSubmission}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0 self-start"
        >
          <Sparkles className="w-3.5 h-3.5" /> Tạo Bài Làm Giả Lập
        </button>
      </div>

      {/* Tabs navigation & search header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-2 rounded-xl">
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white shadow text-brand-blue border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Chờ chấm điểm
            {pendingSubmissions.length > 0 && (
              <span className="bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('graded')}
            className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'graded'
                ? 'bg-white shadow text-emerald-700 border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch sử đã chấm
            {gradedSubmissions.length > 0 && (
              <span className="bg-slate-300 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {gradedSubmissions.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo học sinh, môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredList.length ? (
          filteredList.map(sub => (
            <div
              key={sub.id}
              className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow transition duration-200 bg-white ${
                sub.grade === null ? 'border-slate-200' : 'border-emerald-100 bg-emerald-50/5'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <b className="text-slate-850 text-xs md:text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-orange" />
                    {sub.student}
                  </b>
                  <span className="bg-slate-100 font-bold text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono">
                    Lớp {sub.class}
                  </span>

                  {sub.grade !== null ? (
                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Đã nhập học bạ
                    </span>
                  ) : (
                    <span className="bg-blue-50 border border-blue-100 text-brand-blue text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Chờ chấm
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Môn học học vụ: <span className="font-bold text-brand-blue">{sub.subject}</span> | 
                  Vũ môn thi khảo: <span className="font-semibold text-slate-700">{sub.type}</span> | 
                  Ngày giờ nộp bài: <span className="font-mono font-bold">{sub.date}</span>
                </p>

                {/* Show text preview of submission */}
                <div className="p-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/40 text-[11px] text-slate-500 font-semibold italic max-w-2xl">
                  Bản nộp tự luận: "{sub.text}"
                </div>

                {/* Show Score Info for graded */}
                {sub.grade !== null && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 font-semibold">
                    <span className="bg-sky-50 text-brand-blue px-2 py-0.5 rounded">
                      Đại số TN: <b className="font-mono font-extrabold">{sub.mcqScore.toFixed(1)}/{sub.mcqMaxScore}đ</b>
                    </span>
                    <span className="bg-orange-50 text-brand-orange px-2 py-0.5 rounded">
                      Tự luận: <b className="font-mono font-extrabold">{sub.essayScore !== null ? `${sub.essayScore.toFixed(1)}/` : ''}{sub.essayMaxScore}đ</b>
                    </span>
                    <span className="bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded font-bold">
                      Tổng học bạ số: <b className="font-mono font-extrabold text-sm text-teal-900">{sub.grade.toFixed(1)}đ</b>
                    </span>
                    {sub.remark && (
                      <span className="text-slate-500 block w-full mt-1">
                        Lời phê: <span className="italic font-bold text-slate-700 font-sans">"{sub.remark}"</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                {onDeleteSubmission && (
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa bài làm học bạ của học sinh "${sub.student}"? Hành động này không thể hoàn tác.`)) {
                        onDeleteSubmission(sub.id);
                      }
                    }}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer"
                    title="Xóa vĩnh viễn bài nộp này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onOpenGradingModal(sub.id)}
                  className={`text-xs font-extrabold px-4.5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer ${
                    sub.grade === null
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-220 text-slate-700'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  {sub.grade === null ? 'Chấm điểm & Phê bài' : 'Chấm điểm lại'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 font-bold italic border border-dashed rounded-2xl bg-slate-50/40 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <div className="space-y-1">
              <p className="text-slate-600 text-xs md:text-sm font-mono tracking-tight">
                {searchQuery ? 'Không tìm thấy kết quả phù hợp với điều kiện!' : `Không có bài nào trong danh mục "${activeTab === 'pending' ? 'Chờ chấm điểm' : 'Lịch sử đã chấm'}"`}
              </p>
              <p className="text-[10px] text-slate-400 normal-case not-italic font-semibold">
                Bạn có thể bấm nút <b>"Tạo Bài Làm Giả Lập"</b> ở góc phải trên cùng để thử tính năng chấm điểm bất kỳ lúc nào!
              </p>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'graded' && gradedSubmissions.length > 0 && (
        <div className="text-right">
          <button
            onClick={handleClearGradedSubmissions}
            className="text-slate-400 hover:text-rose-600 text-[10px] font-bold border border-slate-200 hover:border-rose-200 p-2 rounded-lg bg-white shadow-sm transition"
          >
            Quét sạch danh sách thi tốt nghiệp đã phê
          </button>
        </div>
      )}
    </div>
  );
}
