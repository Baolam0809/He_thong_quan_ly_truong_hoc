import React from 'react';
import { FileSpreadsheet, FileText, Printer, CheckSquare, Settings } from 'lucide-react';
import { Submission, Account } from '../types';
import { exportToWord, exportToExcel, triggerPrintWindow } from '../utils';
import { showToast } from './Toast';

interface ExportCenterSectionProps {
  currentUser: Account | null;
  submissions: Submission[];
  accounts: Account[];
}

export default function ExportCenterSection({
  currentUser,
  submissions,
  accounts,
}: ExportCenterSectionProps) {

  const getSubmissionsFiltered = () => {
    let list = submissions;
    if (currentUser?.role === 'Học sinh') {
      list = list.filter(s => s.student === currentUser.name);
    } else if (currentUser?.role === 'Phụ huynh') {
      const studentName = currentUser.extra.replace("Phụ huynh ", "").trim();
      list = list.filter(s => s.student === studentName);
    }
    return list;
  };

  const handleExportWord = () => {
    const data = getSubmissionsFiltered();
    
    let tableRows = '';
    data.forEach(s => {
      tableRows += `
        <tr style="border-bottom: 1px solid #cccccc;">
          <td style="padding: 10px; font-size: 12px;"><b>${s.student}</b><br><span style="font-size: 10px; color: #555555;">Lớp: ${s.class}</span></td>
          <td style="padding: 10px; font-size: 12px;">${s.subject}</td>
          <td style="padding: 10px; font-size: 12px;">${s.type}</td>
          <td style="padding: 10px; font-size: 12px; text-align: center;">${s.mcqScore}/${s.mcqMaxScore}</td>
          <td style="padding: 10px; font-size: 12px; text-align: center;">${s.essayScore !== null ? s.essayScore : '-'}/${s.essayMaxScore}</td>
          <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e3a8a;">${s.grade !== null ? s.grade : '-'}</td>
          <td style="padding: 10px; font-size: 12px;">${s.remark || ''}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px;">
        <h2>TRƯỜNG THCS HÒA PHÚ – XÃ HÒA XÁ</h2>
        <h4 style="margin: 0; color: #ea580c; text-transform: uppercase;">CỔNG THÔNG TIN ĐIỆN TỬ & CHUYỂN ĐỔI SỐ</h4>
      </div>
      <h3 style="text-align: center; color: #1e3a8a;">BÁO CÁO BẢNG ĐIỂM TỔNG HỢP HỌC SINH</h3>
      <p><b>Ngày lập báo cáo:</b> ${new Date().toLocaleDateString('vi-VN')}</p>
      <p><b>Người thực hiện kết xuất:</b> ${currentUser ? currentUser.name : 'Nghiêm Hồng Quân'}</p>
      <table>
        <thead>
          <tr>
            <th>Học sinh / Lớp</th>
            <th>Môn học</th>
            <th>Bài kiểm tra</th>
            <th>Trắc nghiệm</th>
            <th>Tự luận</th>
            <th>Tổng điểm</th>
            <th>Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.length ? tableRows : '<tr><td colspan="7" style="text-align: center; padding: 20px;">Không có dữ liệu kết quả học tập.</td></tr>'}
        </tbody>
      </table>
    `;

    exportToWord('Bao_Cao_Ban_Diem_Hoc_Ba.doc', 'Bảng Điểm Học Bạ', bodyHtml);
    showToast("Đã tải tệp Word báo cáo tổng hợp điểm số học sinh thành công!", "success");
  };

  const handleExportExcel = () => {
    const data = getSubmissionsFiltered();
    
    const transRows = data.map(s => ({
      "Học sinh": s.student,
      "Lớp": s.class,
      "Môn học": s.subject,
      "Hình thức": s.type,
      "Điểm trắc nghiệm": s.mcqScore,
      "Điểm tự luận": s.essayScore !== null ? s.essayScore : '-',
      "Tổng kết": s.grade !== null ? s.grade : '-',
      "Lời phê giáo viên": s.remark || '',
      "Ngày phát hành": s.date
    }));

    const sheets: { name: string; data: any[] }[] = [
      { name: "Bao_Cao_Ban_Diem", data: transRows }
    ];

    if (currentUser?.role === 'Admin') {
      const accRows = accounts.map(a => ({
        "Họ và tên": a.name,
        "Tên đăng nhập": a.username,
        "Vai trò": a.role,
        "Thông tin thêm": a.extra || ""
      }));
      sheets.push({ name: "Tai_Khoan_He_Thong", data: accRows });
    }

    exportToExcel('Bao_Cao_Hoc_Ba_So_Hoa_Phu.xlsx', sheets);
    showToast("Kết xuất đa bảng Excel (.xlsx) thông qua phông nền SheetJS thành công!", "success");
  };

  const handleExportPDF = () => {
    const data = getSubmissionsFiltered();

    let tableRows = '';
    data.forEach(s => {
      tableRows += `
        <tr class="border-b border-gray-250">
          <td class="p-3 text-xs"><b>${s.student}</b><br><span class="text-[10px] text-gray-500">Lớp ${s.class}</span></td>
          <td class="p-3 text-xs">${s.subject}</td>
          <td class="p-3 text-xs">${s.type}</td>
          <td class="p-3 text-center text-xs font-mono">${s.mcqScore}/${s.mcqMaxScore}</td>
          <td class="p-3 text-center text-xs font-mono">${s.essayScore !== null ? s.essayScore : '-'}/${s.essayMaxScore}</td>
          <td class="p-3 text-center text-xs font-mono font-bold text-indigo-750">${s.grade !== null ? s.grade : '-'}</td>
          <td class="p-3 text-[11px] text-slate-700 italic">"${s.remark || 'Đã đồng bộ.'}"</td>
        </tr>
      `;
    });

    const printableHtml = `
      <div class="border-b-4 border-double border-indigo-900 pb-3 flex justify-between items-end mb-6">
        <div>
          <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest">SỞ GIÁO DỤC & ĐÀO TẠO HÀ NỘI</h2>
          <h1 class="text-xl font-black text-indigo-950 uppercase tracking-tight">TRƯỜNG THCS HÒA PHÚ</h1>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-black text-amber-600 uppercase tracking-wider">CỔNG KIỂM TRA ĐIỆN TỬ</p>
          <p class="text-[9px] font-bold text-gray-400">Ứng Hòa, Thành phố Hà Nội</p>
        </div>
      </div>
      
      <h2 class="text-center text-indigo-950 font-black text-base uppercase tracking-wider mb-6">
        BẢNG ĐIỂM HỌC BẠ ĐỊNH DANH ĐIỆN TỬ
      </h2>
      <p class="text-[11px] font-bold text-slate-450 italic mb-4">Ngày thiết lập kết xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
      
      <table class="w-full text-left border border-slate-350">
        <thead>
          <tr class="bg-slate-105 border-b border-slate-350">
            <th class="p-3 text-[10.5px] font-extrabold uppercase text-slate-700">Học sinh / Lớp</th>
            <th class="p-3 text-[10.5px] font-extrabold uppercase text-slate-700">Bộ môn</th>
            <th class="p-3 text-[10.5px] font-extrabold uppercase text-slate-700">Bài khảo sát</th>
            <th class="p-3 text-center text-[10.5px] font-extrabold uppercase text-slate-700">Trắc nghiệm</th>
            <th class="p-3 text-center text-[10.5px] font-extrabold uppercase text-slate-700">Tự luận</th>
            <th class="p-3 text-center text-[10.5px] font-extrabold uppercase text-slate-700">Tổng điểm</th>
            <th class="p-3 text-[10.5px] font-extrabold uppercase text-slate-700">Giáo Phê</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-750">
          ${tableRows.length ? tableRows : '<tr><td colspan="7" class="p-8 text-center text-slate-400 italic font-bold">Không ghi nhận kết quả điểm học bạ số hóa.</td></tr>'}
        </tbody>
      </table>
      
      <div class="mt-12 flex justify-between">
        <div class="text-center w-2/5">
          <p class="text-xs font-bold">Người kiểm tra lưu trữ</p>
          <p class="text-[9.5px] text-gray-400 italic">(Ký và ghi rõ chức danh)</p>
          <div class="h-16"></div>
          <p class="text-xs font-bold">Tổ chuyên môn trưởng</p>
        </div>
        <div class="text-center w-2/5">
          <p class="text-xs italic text-gray-500">Hòa Phú, ngày ${new Date().toLocaleDateString('vi-VN')}</p>
          <p class="text-xs font-bold uppercase mt-1">TM. BAN GIÁM HIỆU NHÀ TRƯỜNG</p>
          <p class="text-[9.5px] text-gray-400 italic">(Đã áp dấu và ký nhận điện tử chứng thực)</p>
          <div class="h-12"></div>
          <p class="text-sm font-black text-rose-600 border-2 border-double border-rose-600 inline-block px-4 py-1.5 rounded uppercase transform rotate-[-2deg]">
            THCS HÒA PHÚ - ĐÃ PHÁT HÀNH
          </p>
        </div>
      </div>
    `;

    triggerPrintWindow("Kết xuất bảng điểm điện tử", printableHtml);
    showToast("Mở màn hình in ấn / xuất PDF thành công!", "success");
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
      <h3 className="font-extrabold text-sm text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-brand-orange animate-spin" />
        Trung tâm Kết xuất Số liệu hồ sơ, Học bạ và In ấn Điện tử
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleExportWord}
          className="p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-8 h-8 text-blue-600 animate-bounce" />
          <span className="text-xs font-extrabold text-blue-800">Word (.doc Báo Cáo)</span>
          <span className="text-[10px] text-slate-400 font-bold block">Thẩm định học vụ ban hành</span>
        </button>
        
        <button
          onClick={handleExportExcel}
          className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-8 h-8 text-emerald-600 animate-pulse" />
          <span className="text-xs font-extrabold text-emerald-800">Excel (Đa Sheet)</span>
          <span className="text-[10px] text-slate-400 font-bold block">Biểu đồ cơ sở dữ liệu số</span>
        </button>
        
        <button
          onClick={handleExportPDF}
          className="p-5 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-8 h-8 text-rose-600" />
          <span className="text-xs font-extrabold text-rose-800">PDF / In Bảng biểu</span>
          <span className="text-[10px] text-slate-400 font-bold block">Ấn phẩm đóng dấu đỏ số</span>
        </button>
      </div>
    </div>
  );
}
