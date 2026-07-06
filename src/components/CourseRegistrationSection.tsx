import React, { useState } from 'react';
import { Download, UploadCloud, FileSpreadsheet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CourseRegistration, Account } from '../types';
import { showToast } from './Toast';
import { exportToWord } from '../utils';

interface CourseRegistrationSectionProps {
  currentUser: Account | null;
  registrations: CourseRegistration[];
  setRegistrations: React.Dispatch<React.SetStateAction<CourseRegistration[]>>;
}

export default function CourseRegistrationSection({
  currentUser,
  registrations,
  setRegistrations,
}: CourseRegistrationSectionProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  
  const [formStudentName, setFormStudentName] = useState(() => {
    if (currentUser) {
      if (currentUser.role === 'Học sinh') return currentUser.name;
      if (currentUser.role === 'Phụ huynh') return currentUser.extra.replace("Phụ huynh em ", "").replace("Phụ huynh ", "").trim();
    }
    return '';
  });

  const [formClassInfo, setFormClassInfo] = useState(() => {
    if (currentUser) {
      if (currentUser.role === 'Học sinh') return currentUser.extra;
    }
    return '9A';
  });

  const coursesList = [
    { value: 'Toán', label: 'Lớp Toán nâng cao' },
    { value: 'Văn', label: 'Lớp Ngữ Văn kỹ năng tư duy' },
    { value: 'Tiếng Anh', label: 'Lớp IELTS Foundation sáng tạo' },
    { value: 'Khoa học TN', label: 'Lớp STEM và robot sáng tạo' }
  ];

  const handleCourseToggle = (courseValue: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseValue)
        ? prev.filter(c => c !== courseValue)
        : [...prev, courseValue]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
      showToast(`Đã đính kèm đơn tuyển sinh: ${file.name}`, "success");
    }
  };

  const downloadCourseTemplateDoc = () => {
    const docHtml = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 45%;">
          TRƯỜNG THCS HÒA PHÚ<br>
          BỘ PHẬN GIÁO VỤ ĐỒNG BỘ SU<br>
          ---
        </div>
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 50%;">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          Độc lập - Tự do - Hạnh phúc<br>
          <span style="text-decoration: underline;">------------------------</span>
        </div>
      </div>
      
      <h2 style="text-align: center; font-weight: bold; font-size: 16px; margin-top: 25px; text-transform: uppercase;">ĐƠN ĐĂNG KÝ HỌC LỚP CHUYÊN ĐỀ BỒI DƯỠNG & NĂNG KHIẾU</h2>
      <p style="text-align: center; font-style: italic; font-size: 11px;">Học kỳ II - Năm học 2025 - 2026</p>
      
      <p style="margin-top: 30px;">Kính gửi: Ban Giám Hiệu Trường THCS Hòa Phú</p>
      <p>Tôi tên là: ................................................................................................................................................................</p>
      <p>Là phụ huynh của em học sinh: .................................................................. Lớp học đính danh: .............................</p>
      <p>Số điện thoại liên lạc: ......................................................................................................................................................</p>
      
      <p>Nguyện vọng đăng ký bồi dưỡng chuyên đề nâng cao phát triển tư duy thực tiễn:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="border: 1px solid #000000; padding: 10px; width: 15%; text-align: center;">STT</th>
            <th style="border: 1px solid #000000; padding: 10px; width: 60%;">Tên chuyên ngành bồi dưỡng</th>
            <th style="border: 1px solid #000000; padding: 10px; width: 25%; text-align: center;">Tích chọn (X)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #000000; text-align: center; padding: 10px;">1</td><td style="border: 1px solid #000000; padding: 10px;">Chuyên đề Toán học nâng cao & tư duy logic học</td><td style="border: 1px solid #000000; text-align: center;"></td></tr>
          <tr><td style="border: 1px solid #000000; text-align: center; padding: 10px;">2</td><td style="border: 1px solid #000000; padding: 10px;">Chuyên đề Ngữ Văn nâng cao & nghệ thuật nghị luận xã hội</td><td style="border: 1px solid #000000; text-align: center;"></td></tr>
          <tr><td style="border: 1px solid #000000; text-align: center; padding: 10px;">3</td><td style="border: 1px solid #000000; padding: 10px;">Chuyên đề Ngoại ngữ Tiếng Anh IELTS nền tảng sáng tạo</td><td style="border: 1px solid #000000; text-align: center;"></td></tr>
          <tr><td style="border: 1px solid #000000; text-align: center; padding: 10px;">4</td><td style="border: 1px solid #000000; padding: 10px;">Chuyên đề Khoa học Tự nhiên thí nghiệm & cơ điện tư STEM</td><td style="border: 1px solid #000000; text-align: center;"></td></tr>
        </tbody>
      </table>
      
      <p style="font-style: italic; font-size: 11px;">Gia đình cam kết đôn đốc con học tập nghiêm túc, chuẩn bị giáo cụ và rèn luyện đạo đức theo quy định giáo vụ.</p>
      
      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px;">
        <div style="width: 45%;"></div>
        <div style="text-align: center; width: 45%;">
          <i>Hòa Phú, ngày ..... tháng ..... năm 2026</i><br>
          <b>XÁC NHẬN CỦA PHỤ HUYNH</b><br>
          <i>(Ký và ghi rõ họ tên)</i>
        </div>
      </div>
    `;
    exportToWord('Don_Dang_Ky_Chuyen_De_Boi_Duong.doc', 'Đăng ký học bồi dưỡng', docHtml);
    showToast("Tải đơn đăng ký Word thành công!", "success");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim()) {
      showToast("Vui lòng nhập họ và tên học sinh!", "info");
      return;
    }
    if (!formClassInfo.trim()) {
      showToast("Vui lòng nhập lớp học học sinh!", "info");
      return;
    }
    if (selectedCourses.length === 0) {
      showToast("Vui lòng tích chọn môn học chuyên đề học sinh muốn đăng ký!", "info");
      return;
    }

    const fileToUpload = uploadedFile || { name: 'DK_Nang_Khieu_Dinh_Kem.pdf', size: '1.4 MB' };
    if (!uploadedFile) {
      showToast("Giao diện đã chuẩn bị tệp đơn đăng ký mẫu cho bạn!", "info");
    }

    const newReg: CourseRegistration = {
      id: Date.now(),
      studentName: formStudentName.trim(),
      classInfo: formClassInfo.trim(),
      courses: selectedCourses,
      file: fileToUpload,
      status: 'Chờ duyệt',
      date: new Date().toLocaleDateString('vi-VN'),
    };

    setRegistrations(prev => [newReg, ...prev]);
    setSelectedCourses([]);
    setUploadedFile(null);
    showToast(`Gửi đơn đăng ký của học sinh ${formStudentName.trim()} thành công! Chờ xét duyệt.`, "success");
  };

  const handleAdminDecision = (id: number, decision: 'Đã duyệt' | 'Từ chối') => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: decision } : r)
    );
    showToast(`Đã cập nhật trạng thái đăng ký thành: ${decision}`, "success");
  };

  const downloadSignedDecision = (r: CourseRegistration) => {
    const decisionHtml = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 45%;">
          SỞ GD&ĐT THÀNH PHỐ HÀ NỘI<br>
          <b>TRƯỜNG THCS HÒA PHÚ</b><br>
          ---
        </div>
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 50%;">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <b>Độc lập - Tự do - Hạnh phúc</b><br>
          <span style="text-decoration: underline;">------------------------</span>
        </div>
      </div>
      
      <h2 style="text-align: center; font-weight: bold; font-size: 15px; margin-top: 30px; text-transform: uppercase; color: #1e3a8a;">QUYẾT ĐỊNH PHỆ DUYỆT THU NHẬN HỌC VIÊN CHUYÊN ĐỀ CHUẨN</h2>
      <p style="text-align: center; font-style: italic; font-size: 11px;">(Mã quyết định: HP-REG-OK-${r.id})</p>
      
      <p style="margin-top: 30px;">Căn cứ nhu cầu năng lực học tập phát triển tài năng học đường và đơn tự nguyện đề xuất của gia đình,</p>
      <p><b>XÁC NHẬN CHẤP THUẬN TUYỂN SINH HỌC VIÊN:</b></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold; width: 35%;">Họ và tên học viên</td>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>${r.studentName}</b></td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">Lớp học hành chính</td>
          <td style="border: 1px solid #ccc; padding: 10px;">Lớp ${r.classInfo}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">Chuyên môn học nâng khiếu</td>
          <td style="border: 1px solid #ccc; padding: 10px; color: #059669; font-weight: bold;">${r.courses.join(', ')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">Thời gian tiếp nhận đơn</td>
          <td style="border: 1px solid #ccc; padding: 10px;">${r.date}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">File đính kèm lưu trữ</td>
          <td style="border: 1px solid #ccc; padding: 10px; font-family: monospace;">${r.file ? r.file.name: 'DK_Con_Hoc.pdf'}</td>
        </tr>
      </table>
      
      <div style="margin-top: 45px; display: flex; justify-content: space-between; font-size: 13px;">
        <div style="width: 45%;"></div>
        <div style="text-align: center; width: 50%;">
          <i>Hòa Phú, ngày ${r.date}</i><br>
          <b>HIỆU TRƯỞNG TRƯỜNG THCS HÒA PHÚ</b><br>
          <i>(Ký duyệt đóng ấn số hóa)</i><br><br><br>
          <span style="color: #dc2626; font-weight: bold; border: 2px solid #dc2626; padding: 5px; text-transform: uppercase;">[ĐÃ CHỨNG THỰC ADMIN]</span><br>
          <b>Thầy hiệu trưởng Trần Hữu Phúc</b>
        </div>
      </div>
    `;
    exportToWord(`Quyết_Định_Đồng_Ý_Học_Bồi_Dưỡng_${r.studentName.replace(/\s+/g, '_')}.doc`, "Quyết định phê duyệt", decisionHtml);
    showToast(`Đã xuất hồ sơ tuyển sinh của học sinh ${r.studentName}!`, "success");
  };

  const isParentOrStudent = currentUser && (currentUser.role === 'Học sinh' || currentUser.role === 'Phụ huynh');
  const isAdminOrTeacher = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Giáo viên');

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
      <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        Đăng ký học bồi dưỡng văn hóa, năng khiếu và câu lạc bộ hè
      </h3>

      {/* Sửa đổi: Luôn cho phép toàn quyền đăng ký ở mọi phân quyền giáo vụ để dễ dàng kiểm thử và kết nối */}
      <form onSubmit={handleFormSubmit} className="space-y-5 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-bold text-emerald-850 text-xs mb-1">
              Bước 1: Tải về Biểu mẫu đăng ký trắng
            </h4>
            <p className="text-[10px] text-emerald-600 leading-relaxed font-semibold">
              Tải biểu mẫu, điền các thông tin cơ bản về con và gia đình, sau đó ký xác thực.
            </p>
          </div>
          
          <button
            type="button"
            onClick={downloadCourseTemplateDoc}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Tải Biểu Mẫu (Word)
          </button>
        </div>

        <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
          <h4 className="font-bold text-slate-800 text-xs border-b pb-2 flex items-center gap-1.5">
            <span className="w-1 h-3.5 bg-brand-blue rounded-full"></span>
            Bước 2: Chọn câu lạc bộ & Đính kèm đơn
          </h4>

          {/* Form nhập thông tin học sinh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Họ và tên học sinh đăng ký *
              </label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên học sinh..."
                value={formStudentName}
                onChange={(e) => setFormStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-blue transition bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Lớp học hành chính *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 9A, 6B..."
                value={formClassInfo}
                onChange={(e) => setFormClassInfo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-blue transition bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-2">
              Danh mục lớp chuyên đề bồi dưỡng
            </span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {coursesList.map(course => (
                <label
                  key={course.value}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 transition ${
                    selectedCourses.includes(course.value)
                      ? 'border-brand-blue bg-blue-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.value)}
                    onChange={() => handleCourseToggle(course.value)}
                    className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">{course.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-2">
              Tải lên đơn ký tươi của phụ huynh (Ảnh, PDF, Word)
            </label>
            
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-5 text-center relative hover:bg-slate-100 transition duration-200">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf, .doc, .docx, image/*"
              />
              <UploadCloud className="w-8 h-8 text-brand-blue mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {uploadedFile ? (
                  <span className="text-emerald-600 block">
                    Đã đính kèm đơn: <u>{uploadedFile.name}</u> ({uploadedFile.size})
                  </span>
                ) : (
                  <span>Kéo thả tệp đơn đã ký vào đây hoặc bấm để chọn tệp (Hệ thống tự tạo tệp mẫu phù hợp nếu bạn để trống)</span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Gửi Đơn Tuyển Sinh
            </button>
          </div>
        </div>
      </form>

      {/* Reg history log */}
      <div>
        <h4 className="font-bold text-slate-800 text-xs border-b pb-2 mb-4 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500 animate-spin" />
          Lọc đăng ký & Lịch sử xét duyệt học bạ tuyển sinh
        </h4>
        
        <div className="overflow-x-auto rounded-xl border border-slate-205">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-150">
                <th className="p-3">Học sinh nộp</th>
                <th className="p-3">Môn học đăng ký</th>
                <th className="p-3 text-center">Biểu mẫu ký nộp</th>
                <th className="p-3 text-center">Gửi ngày</th>
                <th className="p-3 text-right">Trạng thái tuyển sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {registrations.length ? (
                registrations.map(r => (
                  <tr key={r.id} className="border-b hover:bg-slate-50/50 transition">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-850 block">{r.studentName}</span>
                      <span className="text-[10px] text-slate-450 block font-bold">Lớp: {r.classInfo}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {r.courses.map(c => (
                          <span
                            key={c}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs text-brand-blue font-bold block truncate max-w-[150px] mx-auto">
                        {r.file ? r.file.name : 'DK_Năng_Khiếu.pdf'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block font-mono font-bold">
                        {r.file ? r.file.size : '1.2 MB'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-500 font-mono font-bold">{r.date}</td>
                    <td className="p-3 text-right">
                      {isAdminOrTeacher && r.status === 'Chờ duyệt' ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleAdminDecision(r.id, 'Đã duyệt')}
                            className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3 inline mr-0.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleAdminDecision(r.id, 'Từ chối')}
                            className="bg-rose-50 hover:bg-rose-650 text-rose-600 hover:text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            <XCircle className="w-3 h-3 inline mr-0.5" /> Không duyệt
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                            r.status === 'Đã duyệt' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            r.status === 'Từ chối' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                          
                          {r.status === 'Đã duyệt' && (
                            <button
                              onClick={() => downloadSignedDecision(r)}
                              className="mt-1 text-[9.5px] text-emerald-700 hover:text-white font-bold bg-emerald-50 hover:bg-emerald-600 px-2 py-0.5 rounded border border-emerald-250 transition cursor-pointer"
                            >
                              Tải Quyết Định (.doc)
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 font-bold italic">
                    Chưa có đơn ký đăng ký tuyển sinh nào được gửi lên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
