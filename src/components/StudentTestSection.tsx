import React, { useState, useEffect } from 'react';
import { Award, Timer, Download, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { Exam, Submission, Account } from '../types';
import { showToast } from './Toast';
import { triggerDownload } from '../utils';

interface StudentTestSectionProps {
  currentUser: Account | null;
  exams: Exam[];
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

export default function StudentTestSection({
  currentUser,
  exams,
  submissions,
  setSubmissions,
}: StudentTestSectionProps) {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes default
  const [mcqAnswers, setMcqAnswers] = useState('');
  const [essayText, setEssayText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string } | null>(null);

  // Countdown clock tick
  useEffect(() => {
    if (!activeExam) return;
    
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, timeLeft]);

  // Handle targeting filter
  const isStudent = currentUser && currentUser.role === 'Học sinh';
  const classTarget = isStudent ? currentUser.extra : '';
  const nameTarget = isStudent ? currentUser.name : '';

  const matchedExams = exams.filter(ex => {
    if (ex.targetType === 'all') return true;
    if (ex.targetType === 'class' && ex.targetValue === classTarget) return true;
    if (ex.targetType === 'student' && ex.targetValue === nameTarget) return true;
    return false;
  });

  const handleStartTest = (ex: Exam) => {
    // Check if already submitted
    const isCompleted = submissions.some(sub => sub.student === nameTarget && sub.subject === ex.subject && sub.type === ex.type);
    if (isCompleted) {
      showToast("Bạn đã nộp bài kiểm tra này này rồi. Không thể làm tiếp!", "info");
      return;
    }

    setActiveExam(ex);
    setTimeLeft(45 * 60);
    setMcqAnswers('');
    setEssayText('');
    setUploadedFile(null);
    showToast(`Đã vào phòng thi môn ${ex.subject}!`, "success");
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name });
      showToast(`Đã nộp kèm sơ đồ/file tự luận: ${file.name}`, "success");
    }
  };

  const handleAutoCheckAnswers = () => {
    if (!activeExamForTest) return 0;
    // ...
  };

  const activeExamForTest = activeExamFallback(activeExamForTest => activeExamForTest);

  const calculateMCQScore = (userAnswersStr: string, correctAnswersStr: string, maxScore: number): number => {
    if (!userAnswersStr.trim() || !correctAnswersStr.trim()) return 0;
    
    const userAnswers = userAnswersStr.toUpperCase().split(',').map(s => s.trim());
    const correctAnswers = correctAnswersStr.toUpperCase().split(',').map(s => s.trim());
    
    let correctCount = 0;
    userAnswers.forEach((ans, index) => {
      if (ans && ans === cAnswersLookup(correctAnswers, index)) {
        correctCount++;
      }
    });

    const totalQuestions = correctAnswers.length;
    const score = (correctCount / totalQuestions) * maxScore;
    return Math.round(score * 10) / 10;
  };

  const cAnswersLookup = (arr: string[], index: number) => {
    return arr[index] || '';
  };

  const handleAutoSubmit = () => {
    if (!activeExam) return;

    // Automated checking
    const mcqScore = calculateMCQScore(mcqAnswers, activeExam.correctAnswers, activeExam.mcqMaxScore);

    const submission: Submission = {
      id: Date.now(),
      student: nameTarget || 'Học sinh ẩn danh',
      class: classTarget || '9A',
      subject: activeExam.subject,
      type: activeExam.type,
      date: new Date().toLocaleDateString('vi-VN'),
      submissionType: uploadedFile ? 'file' : 'text',
      text: essayText,
      fileData: uploadedFile,
      answers: mcqAnswers,
      mcqScore,
      mcqMaxScore: activeExam.mcqMaxScore,
      essayScore: null, // manual grading needed
      essayMaxScore: activeExam.essayMaxScore,
      grade: null, // manual grading syncs later
      remark: '',
      isSynced: false,
    };

    setSubmissions(prev => [submission, ...prev]);
    setActiveExam(null);
    showToast("Phòng thi: Điểm trắc nghiệm được tự động chấm và bài nộp đã ghi nhận thành công!", "success");
  };

  const handleDownloadTeacherFile = (ex: Exam) => {
    triggerDownload(ex.examFile?.name || 'DeBai_KhaoSat.pdf', `Nội dung đề thi: Môn ${ex.subject} - Đề ${ex.type}.\nPhần trắc nghiệm: ${ex.correctAnswers.length / 3} câu.\nTận dụng hệ thức học bạ chuyển đổi số.`);
    showToast("Đã tải tệp tài liệu đề thi!", "success");
  };

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  if (!isStudent) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in space-y-4 text-left">
        <h3 className="font-extrabold text-sm text-slate-800 border-b pb-3 mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-blue" />
          Hệ Học Vụ Số: Phòng Thi Trực Tuyến Học Sinh
        </h3>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-[13px]">Chế độ Xem thử phòng thi (Read-only)</p>
            <p className="font-medium text-slate-600 leading-relaxed">
              Bạn đang truy cập hệ thống với tư cách là <strong className="text-amber-700">{currentUser?.role || 'Khách vãng lai'}</strong>. 
              Chức năng làm bài thi trực tuyến và nộp bài chỉ dành riêng cho tài khoản <strong>Học sinh</strong> của trường.
            </p>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
            Danh sách tất cả đề thi đang mở trên hệ thống (Chỉ Xem)
          </div>
          <div className="p-4 divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {exams.length > 0 ? (
              exams.map(ex => (
                <div key={ex.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Môn {ex.subject} - Đề {ex.type}</span>
                    <span className="text-[10px] text-slate-450 block">Thời gian: {ex.duration} | Người tạo: {ex.teacher}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded">Chỉ đọc</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-450 italic py-4">Chưa có đề thi nào trong hệ thống.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-sm animate-fade-in">
      <h3 className="font-extrabold text-sm text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-brand-blue" />
        Hệ Học Vụ Số: Phòng Thi Trực Tuyến Học Sinh
      </h3>

      {!activeExam ? (
        <div id="test-room-lobby" className="space-y-3">
          <p className="text-xs text-slate-450 italic font-semibold mb-2">
            Ý kiến chúc quý em tập trung làm bài thi đạt kết quả tốt nhất. Điểm trắc nghiệm tự luận tích hợp hoàn chỉnh.
          </p>
          
          <div id="student-assigned-exams-container" className="grid grid-cols-1 gap-3.5">
            {matchedExams.length ? (
              matchedExams.map(ex => {
                const isCompleted = submissions.some(sub => sub.student === nameTarget && sub.subject === ex.subject && sub.type === ex.type);
                return (
                  <div key={ex.id} className="p-4 border border-slate-200 hover:border-brand-blue/30 rounded-xl bg-slate-50/50 hover:bg-white transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <b className="text-slate-800 text-xs md:text-sm block">Môn {ex.subject}: Đề {ex.type}</b>
                      <span className="text-[10px] text-slate-450 font-bold block mt-1">
                        Phân bổ riêng bởi giáo viên: {ex.teacher} | Thời hạn: {ex.duration}
                      </span>
                    </div>
                    
                    {isCompleted ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-black px-3.5 py-1.5 rounded-full inline-block shrink-0">
                        Đã nộp bài
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartTest(ex)}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow cursor-pointer transition flex items-center gap-1 shrink-0"
                      >
                        <Timer className="w-3.5 h-3.5 animate-pulse" /> Làm Bài Thi
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 italic font-bold">
                Hiện tại không có đề kiểm tra / khảo sát nào được phân bổ cho riêng bạn.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="active-test-container" className="animate-fade-in border border-amber-200 rounded-2xl p-5 bg-amber-50/10">
          <div className="flex justify-between bg-orange-50 border border-orange-200/50 p-3.5 rounded-xl mb-4 text-xs font-bold items-center">
            <span className="text-brand-orange animate-pulse flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> THI ĐANG DIỄN RA
            </span>
            <span id="test-timer" className="bg-slate-800 text-white px-3 py-1.5 rounded font-mono text-[13px] tracking-widest font-black flex items-center gap-1.5">
              <Timer className="w-4 h-4 animate-spin" /> {formatTime(timeLeft)}
            </span>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mb-4">
            <h4 id="active-exam-title" className="font-extrabold text-xs md:text-sm text-slate-800">
              Môn {activeExam.subject} - Đề {activeExam.type}
            </h4>
            <p id="active-exam-file-info" className="text-[10px] text-slate-500 font-bold mt-1">
              Định dạng bài làm tích hợp liên kết học bạ số hóa THCS Hòa Phú.
            </p>
            {activeExam.examFile && (
              <button
                onClick={() => handleDownloadTeacherFile(activeExam)}
                className="mt-3 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Tải Xuống File Đề Bài Gốc
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <label className="block text-xs font-black text-brand-blue uppercase tracking-wider mb-2">
              1. Khai báo đáp án Trắc Nghiệm:
            </label>
            <input
              type="text"
              id="test-answers-input"
              value={mcqAnswers}
              onChange={e => setMcqAnswers(e.target.value)}
              className="w-full text-xs p-3 border rounded-xl font-bold font-mono tracking-wider focus:bg-white text-slate-850"
              placeholder="Ví dụ: 1A, 2B, 3C, 4D (Ngăn cách bởi dấu phẩy)"
            />
            <p className="text-[9.5px] text-slate-400 italic block mt-1.5 font-bold">
              * Điểm trắc nghiệm được chấm trọn vẹn và tự động đối chiếu ngay lập tức sau khi nhấn nộp bài.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-205 mb-4 space-y-3">
            <label className="block text-xs font-black text-brand-orange uppercase tracking-wider">
              2. Phần Tự Luận & tệp tin bài tập (Đính kèm):
            </label>
            
            {activeExam.essayQuestion && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 italic border-l-4 border-brand-orange">
                <b>Câu hỏi đề bài tự luận:</b> "{activeExam.essayQuestion}"
              </div>
            )}

            <textarea
              id="test-submission-text"
              rows={3}
              value={essayText}
              onChange={e => setEssayText(e.target.value)}
              placeholder="Nhập lời giải trực tiếp của phần thi tự luận tại đây..."
              className="w-full text-xs p-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />

            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-2">
                Hoặc các em chụp ảnh lời làm bài viết tay đính kèm tệp tin
              </span>
              
              <div className="relative border-2 border-dashed bg-white border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition">
                <input
                  type="file"
                  onChange={handleManualFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*, .pdf, .doc, .docx"
                />
                <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Upload className="w-4 h-4 text-brand-orange" />
                  <span>
                    {uploadedFile ? `Đã chọn tệp: ${uploadedFile.name}` : "Tải ảnh viết tay tự luận lên"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                if (confirm("Hủy làm bài thi? Toàn bộ đáp án của bạn sẽ bị mất.")) {
                  setActiveExam(null);
                }
              }}
              className="bg-slate-200 text-slate-750 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-slate-300 transition"
            >
              Hủy làm bài
            </button>
            <button
              onClick={handleAutoSubmit}
              className="bg-emerald-600 font-extrabold text-white px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-emerald-700 shadow-md transition"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" /> Nộp Bài Khảo Sát
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function activeExamFallback(arg0: (activeExamForTest: any) => any) {
  return null;
}
