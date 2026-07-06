import React, { useState, useRef } from 'react';
import {
  Users2,
  Trash2,
  Edit,
  UserPlus,
  ShieldAlert,
  School,
  PlusSquare,
  BookMarked,
  Layers,
  ArrowUpRight,
  ClipboardList,
  PenTool,
  BookmarkCheck,
  Undo2,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Database,
  Globe,
  LogIn,
  History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Account, Class, Assignment, Exam, Homework, LoginLog } from '../types';
import { showToast } from './Toast';
import { fullSubjects } from '../data';
import { fetchTableData, syncTableToSupabase } from '../lib/supabase';

interface AdminSectionsProps {
  currentUser: Account | null;
  currentSection: 'accounts' | 'classes' | 'subjects' | 'exams' | 'homework';
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  accountsHistory?: Account[][];
  setAccountsHistory?: React.Dispatch<React.SetStateAction<Account[][]>>;
  loginLogs?: LoginLog[];
  setLoginLogs?: React.Dispatch<React.SetStateAction<LoginLog[]>>;
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  homework: Homework[];
  setHomework: React.Dispatch<React.SetStateAction<Homework[]>>;
  
  // Triggers for main app modal callbacks
  onOpenAddAccount: (acc?: Account) => void;
  onOpenAddClass: (cls?: Class) => void;
  onDeleteClass: (id: string) => void;
  onUndoClass: () => void;
  classHistory: Class[][];
  onOpenAddAssignment: (assignment?: Assignment) => void;
  onOpenAddExam: () => void;
  onOpenAddHomework: (hw?: Homework) => void;
  onOpenPermissionModal: () => void;
  onSyncAccountsWithAssignments: () => void;
}

export default function AdminSections({
  currentUser,
  currentSection,
  accounts,
  setAccounts,
  accountsHistory = [],
  setAccountsHistory,
  loginLogs = [],
  setLoginLogs,
  classes,
  setClasses,
  assignments,
  setAssignments,
  exams,
  setExams,
  homework,
  setHomework,
  onOpenAddAccount,
  onOpenAddClass,
  onDeleteClass,
  onUndoClass,
  classHistory,
  onOpenAddAssignment,
  onOpenAddExam,
  onOpenAddHomework,
  onOpenPermissionModal,
  onSyncAccountsWithAssignments,
}: AdminSectionsProps) {
  
  const isReadOnly = currentUser && (currentUser.role === 'Học sinh' || currentUser.role === 'Phụ huynh' || currentUser.role === 'Khách');
  const hasAddPermission = currentUser?.role === 'Admin' || currentUser?.canAdd === true;
  const hasEditPermission = currentUser?.role === 'Admin' || currentUser?.canEdit === true;
  const hasDeletePermission = currentUser?.role === 'Admin' || currentUser?.canDelete === true;
  const hasUndoPermission = currentUser?.role === 'Admin' || currentUser?.canUndo === true;

  // Assignments history for undo
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[][]>([]);

  // Homework history for undo
  const [homeworkHistory, setHomeworkHistory] = useState<Homework[][]>([]);

  const saveAccountsStateForUndo = () => {
    if (setAccountsHistory) {
      setAccountsHistory(prev => [...prev, [...accounts]]);
    }
  };

  const handleUndoAccounts = () => {
    if (!hasUndoPermission) {
      showToast("Tài khoản của bạn không có quyền hoàn tác tài khoản! Vui lòng liên hệ Admin.", "error");
      return;
    }
    if (!accountsHistory || accountsHistory.length === 0) {
      showToast("Không có lịch sử thao tác tài khoản để hoàn tác!", "info");
      return;
    }
    const previous = accountsHistory[accountsHistory.length - 1];
    setAccounts(previous);
    if (setAccountsHistory) {
      setAccountsHistory(prev => prev.slice(0, -1));
    }
    localStorage.setItem('thcs_accounts', JSON.stringify(previous));
    showToast("Đã hoàn tác thao tác quản lý tài khoản thành công!", "success");
  };

  // Bulk import accounts
  const [showBulk, setShowBulk] = useState(false);
  const [showStudentBulk, setShowStudentBulk] = useState(false);
  const [accountsGroup, setAccountsGroup] = useState<'internal' | 'public' | 'history'>('internal');
  const [accountsTabFilter, setAccountsTabFilter] = useState<'all' | 'teachers' | 'staff' | 'others'>('all');
  const [publicAccountsTabFilter, setPublicAccountsTabFilter] = useState<'all_public' | 'students' | 'parents' | 'guests'>('all_public');
  const [importedAccounts, setImportedAccounts] = useState<any[]>([]);
  const [importedStudents, setImportedStudents] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const saveHomeworkStateForUndo = () => {
    setHomeworkHistory(prev => [...prev, [...homework]]);
  };

  const handleUndoHomework = () => {
    if (!hasUndoPermission) {
      showToast("Tài khoản của bạn không có quyền hoàn tác bài tập! Vui lòng liên hệ Admin.", "error");
      return;
    }
    if (homeworkHistory.length === 0) return;
    const prev = homeworkHistory[homeworkHistory.length - 1];
    setHomework(prev);
    setHomeworkHistory(h => h.slice(0, -1));
    showToast("Đã hoàn tác thao tác trên danh sách bài tập!", "success");
  };

  // 1. ACCOUNTS VIEW
  const renderAccounts = () => {
    const handleDeleteAcc = (id: number, role: string, username: string) => {
      if (!hasDeletePermission) {
        showToast("Tài khoản của bạn không có quyền xóa tài khoản! Vui lòng liên hệ Admin để phân quyền.", "error");
        return;
      }
      if (role === 'Admin' && username === 'admin') {
        showToast("Không thể xóa tài quản trị mặc định hệ thống!", "info");
        return;
      }
      saveAccountsStateForUndo();
      setAccounts(prev => prev.filter(a => a.id !== id));
      showToast(`Đã xóa tài khoản: ${username}`, "success");
    };

    const handleTogglePermission = async (accId: number, field: 'canAdd' | 'canEdit' | 'canDelete' | 'canUndo') => {
      if (currentUser?.role !== 'Admin') {
        showToast("Chỉ Quản trị viên (Admin) mới có quyền cấp phát phân quyền thao tác!", "error");
        return;
      }
      saveAccountsStateForUndo();
      const updated = accounts.map(acc => {
        if (acc.id === accId) {
          const nextVal = !acc[field];
          const labels = {
            canAdd: 'Thêm mới',
            canEdit: 'Chỉnh sửa',
            canDelete: 'Xóa bỏ',
            canUndo: 'Hoàn tác'
          };
          showToast(`Đã ${nextVal ? 'cấp' : 'gỡ'} quyền [${labels[field]}] cho tài khoản ${acc.name}!`, "success");
          return { ...acc, [field]: nextVal };
        }
        return acc;
      });
      setAccounts(updated);
      localStorage.setItem('thcs_accounts', JSON.stringify(updated));
      await syncTableToSupabase('thcs_accounts', updated, accounts);
    };

    const handleExportAccounts = () => {
      try {
        const dataToExport = accounts.map((a, idx) => ({
          "STT": idx + 1,
          "Họ và Tên Nhân Sự": a.name,
          "Tài khoản đăng nhập": a.username,
          "Mật khẩu ban hành": a.password,
          "Vai trò chức vụ": a.role,
          "Thông tin đính danh": a.extra || "",
          "Quyền đăng bài": a.canPostNews ? "Cho phép đăng tin" : "Mặc định",
          "Trạng thái đăng nhập": a.isFirstLogin === false ? "Đã hoạt động" : "Có hiệu lực"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws['!cols'] = [
          { wch: 6 },
          { wch: 25 },
          { wch: 20 },
          { wch: 18 },
          { wch: 15 },
          { wch: 30 },
          { wch: 18 },
          { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachTaiKhoanHeThong");
        XLSX.writeFile(wb, "Danh_sach_tai_khoan_Thcs_Hoa_Phu_Hien_Tai.xlsx");
        showToast("Tải danh sách đăng ký tài khoản hiện tại về máy tính thành công!", "success");
      } catch (err: any) {
        showToast(`Không thể tạo file danh sách xuất khẩu: ${err.message}`, "error");
      }
    };

    const handleSyncAccounts = async () => {
      if (isSyncing) return;
      if (!hasEditPermission) {
        showToast("Tài khoản của bạn không có quyền đồng bộ dữ liệu đám mây! Vui lòng liên hệ Admin.", "error");
        return;
      }
      setIsSyncing(true);
      try {
        showToast("Đang kết nối Cloud để đồng bộ hóa tài khoản...", "info");
        const dbAccs = await fetchTableData<Account>('thcs_accounts', []);
        
        if (!dbAccs || dbAccs.length === 0) {
          const success = await syncTableToSupabase('thcs_accounts', accounts, []);
          if (success) {
            showToast("Hệ thống database trống. Đã đồng bộ đẩy toàn bộ danh sách tài khoản hiện tại lên Cloud!", "success");
          } else {
            showToast("Đồng bộ đẩy thất bại, vui lòng kiểm tra kết nối!", "error");
          }
          setIsSyncing(false);
          return;
        }

        const localAccounts = [...accounts];
        const mergedMap = new Map<string, Account>();

        localAccounts.forEach(acc => {
          mergedMap.set(acc.username.toLowerCase(), acc);
        });

        let newFromCloud = 0;
        dbAccs.forEach(dbAcc => {
          const uLower = dbAcc.username.toLowerCase();
          if (!mergedMap.has(uLower)) {
            mergedMap.set(uLower, dbAcc);
            newFromCloud++;
          }
        });

        const finalMergedList = Array.from(mergedMap.values());

        saveAccountsStateForUndo();
        setAccounts(finalMergedList);
        localStorage.setItem('thcs_accounts', JSON.stringify(finalMergedList));

        const syncSuccess = await syncTableToSupabase('thcs_accounts', finalMergedList, dbAccs);
        
        if (syncSuccess) {
          if (newFromCloud > 0) {
            showToast(`Đồng bộ dữ liệu thành công! Đã tích hợp thêm ${newFromCloud} tài khoản mới từ Máy chủ đám mây.`, "success");
          } else {
            showToast("Hệ thống tài khoản đã hoàn toàn đồng nhất với Đám mây Supabase!", "success");
          }
        } else {
          showToast("Đồng bộ lên đám mây thất bại, vui lòng thử lại sau!", "error");
        }
      } catch (err: any) {
        showToast(`Lỗi đồng bộ: ${err.message}`, "error");
      } finally {
        setIsSyncing(false);
      }
    };

    const handleDownloadTemplate = () => {
      try {
        const templateData = [
          {
            "Họ và Tên Nhân Sự": "Nguyễn Văn Hùng",
            "Tài khoản đăng nhập": "hunghv_gv",
            "Mật khẩu ban hành": "123456",
            "Vai trò chức vụ": "Giáo viên",
            "Thông tin đính kèm": "Tổ Toán Tin - Lớp 9A"
          },
          {
            "Họ và Tên Nhân Sự": "Phạm Minh Đức",
            "Tài khoản đăng nhập": "ducm_hs",
            "Mật khẩu ban hành": "123",
            "Vai trò chức vụ": "Học sinh",
            "Thông tin đính kèm": "Lớp 9B"
          },
          {
            "Họ và Tên Nhân Sự": "Phạm Văn Thành",
            "Tài khoản đăng nhập": "thanhpv_ph",
            "Mật khẩu ban hành": "123",
            "Vai trò chức vụ": "Phụ huynh",
            "Thông tin đính kèm": "Phụ huynh em Phạm Minh Đức"
          }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [
          { wch: 25 },
          { wch: 20 },
          { wch: 18 },
          { wch: 15 },
          { wch: 30 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachCapTaiKhoan");
        XLSX.writeFile(wb, "Bieu_mau_cap_tai_khoan_Thcs_Hoa_Phu.xlsx");
        showToast("Tải biểu mẫu Excel cấp tài khoản thành công!", "success");
      } catch (err: any) {
        showToast(`Không thể tạo file biểu mẫu: ${err.message}`, "error");
      }
    };

    const handleDownloadStudentTemplate = () => {
      try {
        const templateData = [
          {
            "STT": 1,
            "Mã định danh": "030095123456",
            "CCCD": "030095012345",
            "Họ tên": "Trần Đức Nam",
            "Năm sinh": "2012",
            "Lớp": "8A",
            "Nơi ở": "Ấp 1, Xã Hòa Phú, Củ Chi, TP.HCM",
            "Cha mẹ": "Trần Văn Hùng",
            "Số điện thoại": "0987654321",
            "Mật khẩu (Tùy chọn)": "123456"
          },
          {
            "STT": 2,
            "Mã định danh": "030095123457",
            "CCCD": "",
            "Họ tên": "Nguyễn Thị Mai",
            "Năm sinh": "2012",
            "Lớp": "8A",
            "Nơi ở": "Ấp 3, Xã Hòa Phú, Củ Chi, TP.HCM",
            "Cha mẹ": "Nguyễn Thị Hoa",
            "Số điện thoại": "0912345678",
            "Mật khẩu (Tùy chọn)": "123"
          }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [
          { wch: 6 },
          { wch: 18 },
          { wch: 18 },
          { wch: 22 },
          { wch: 12 },
          { wch: 10 },
          { wch: 35 },
          { wch: 22 },
          { wch: 15 },
          { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
        XLSX.writeFile(wb, "Bieu_mau_cap_tai_khoan_Hoc_Sinh_Thcs_Hoa_Phu.xlsx");
        showToast("Tải biểu mẫu Excel cấp tài khoản Học sinh thành công!", "success");
      } catch (err: any) {
        showToast(`Không thể tạo file biểu mẫu học sinh: ${err.message}`, "error");
      }
    };

    const handleImportStudentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const binaryStr = evt.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (!rawRows || rawRows.length === 0) {
            showToast("Tệp tin trống hoặc không có thông tin hợp lệ!", "info");
            return;
          }

          const parsedList: any[] = [];
          
          rawRows.forEach((row: any) => {
            const name = (row["Họ tên"] || row["Họ tên học sinh"] || row["Họ và tên"] || "").toString().trim();
            const studentId = (row["Mã định danh"] || "").toString().trim();
            const cccd = (row["CCCD"] || "").toString().trim();
            const dob = (row["Năm sinh"] || "").toString().trim();
            const classVal = (row["Lớp"] || "").toString().trim();
            const address = (row["Nơi ở"] || "").toString().trim();
            const parents = (row["Cha mẹ"] || "").toString().trim();
            const phone = (row["Số điện thoại"] || row["SĐT"] || "").toString().trim();
            
            if (!name) return;

            let username = "";
            if (studentId) {
              username = studentId.toLowerCase().replace(/[^a-z0-9]/g, '');
            } else {
              const cleanName = name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/đ/g, "d")
                .replace(/[^a-z0-9 ]/g, "")
                .trim()
                .split(/\s+/)
                .map((word, i, arr) => (i === arr.length - 1 ? word : word[0]))
                .join("");
              username = cleanName + "_" + Math.floor(100 + Math.random() * 900);
            }

            const password = (row["Mật khẩu (Tùy chọn)"] || row["Mật khẩu"] || "123").toString().trim();

            parsedList.push({
              name,
              username,
              password,
              role: "Học sinh",
              extra: `Lớp: ${classVal} | PH: ${parents}`,
              studentId,
              cccd,
              dob,
              class: classVal,
              address,
              parents,
              phone,
              isFirstLogin: false,
              canPostNews: false
            });
          });

          if (parsedList.length === 0) {
            showToast("Không tìm thấy hàng tài khoản học sinh hợp lệ nào trong tệp tin!", "error");
          } else {
            setImportedStudents(parsedList);
            showToast(`Đã đọc sơ bộ dữ liệu học sinh thành công: ${parsedList.length} tài khoản!`, "success");
          }
        } catch (error: any) {
          showToast(`Lỗi giải mã file biểu mẫu: ${error.message || 'Sai định dạng'}`, "error");
        }
      };
      reader.readAsBinaryString(file);
    };

    const handleSaveImportedStudents = async () => {
      if (!hasAddPermission) {
        showToast("Tài khoản của bạn không có quyền thêm học sinh! Vui lòng liên hệ Admin để phân quyền.", "error");
        return;
      }
      if (importedStudents.length === 0) {
        showToast("Vui lòng tải tệp biểu mẫu học sinh lên trước khi lưu!", "info");
        return;
      }

      const existingUsernames = new Set(accounts.map(a => a.username.toLowerCase()));
      const finalToImport: Account[] = [];
      let duplicateCount = 0;

      importedStudents.forEach((imp, index) => {
        let uniqueUsername = imp.username;
        if (existingUsernames.has(uniqueUsername)) {
          duplicateCount++;
          uniqueUsername = `${uniqueUsername}_${Math.floor(100 + Math.random() * 900)}`;
        }
        
        finalToImport.push({
          id: Date.now() + index,
          name: imp.name,
          username: uniqueUsername,
          password: imp.password,
          role: imp.role,
          extra: imp.extra,
          isFirstLogin: false,
          canPostNews: imp.canPostNews,
          studentId: imp.studentId,
          cccd: imp.cccd,
          dob: imp.dob,
          class: imp.class,
          address: imp.address,
          parents: imp.parents,
          phone: imp.phone
        });
        existingUsernames.add(uniqueUsername);
      });

      const updatedAccounts = [...finalToImport, ...accounts];
      saveAccountsStateForUndo();
      setAccounts(updatedAccounts);
      localStorage.setItem('thcs_accounts', JSON.stringify(updatedAccounts));
      
      let warnMsg = duplicateCount > 0 
        ? ` (Đã bổ sung mã số để tránh trùng lặp cho ${duplicateCount} tài khoản)`
        : "";
      
      try {
        const syncSuccess = await syncTableToSupabase('thcs_accounts', updatedAccounts, accounts);
        if (syncSuccess) {
          showToast(`Chúc mừng! Cấp mới đồng loạt thành công ${finalToImport.length} tài khoản Học sinh và đã đồng bộ lên Cloud!${warnMsg}`, "success");
        } else {
          showToast(`Chúc mừng! Cấp mới đồng loạt thành công ${finalToImport.length} tài khoản Học sinh (Lưu ngoại tuyến, đồng bộ lên đám mây thất bại)!${warnMsg}`, "info");
        }
      } catch (err) {
        showToast(`Cấp thành công ngoại tuyến. Lỗi đồng bộ đám mây!`, "info");
      }

      setImportedStudents([]);
      setShowStudentBulk(false);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const binaryStr = evt.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (!rawRows || rawRows.length === 0) {
            showToast("Tệp tin trống hoặc không có thông tin hợp lệ!", "info");
            return;
          }

          const parsedList: any[] = [];
          
          rawRows.forEach((row: any) => {
            const keys = Object.keys(row);
            const isStudentTemplate = keys.includes("Mã định danh") || keys.includes("Họ tên") || keys.includes("Lớp") || keys.includes("Cha mẹ");

            if (isStudentTemplate) {
              const name = (row["Họ tên"] || row["Họ và tên"] || "").toString().trim();
              const studentId = (row["Mã định danh"] || "").toString().trim();
              const cccd = (row["CCCD"] || row["cccd"] || "").toString().trim();
              const dob = (row["Năm sinh"] || "").toString().trim();
              const classVal = (row["Lớp"] || "").toString().trim();
              const address = (row["Nơi ở"] || "").toString().trim();
              const parents = (row["Cha mẹ"] || "").toString().trim();
              const phone = (row["Số điện thoại"] || row["SĐT"] || "").toString().trim();
              
              if (!name) return;

              let username = "";
              if (studentId) {
                username = studentId.toLowerCase().replace(/[^a-z0-9]/g, '');
              } else {
                const cleanName = name
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/đ/g, "d")
                  .replace(/[^a-z0-9 ]/g, "")
                  .trim()
                  .split(/\s+/)
                  .map((word, i, arr) => (i === arr.length - 1 ? word : word[0]))
                  .join("");
                username = cleanName + "_" + Math.floor(100 + Math.random() * 900);
              }

              const password = (row["Mật khẩu (Tùy chọn)"] || row["Mật khẩu"] || "123").toString().trim();

              parsedList.push({
                name,
                username,
                password,
                role: "Học sinh",
                extra: `Lớp: ${classVal} | PH: ${parents}`,
                studentId,
                cccd,
                dob,
                class: classVal,
                address,
                parents,
                phone,
                isFirstLogin: false,
                canPostNews: false
              });
            } else {
              const name = (row["Họ và Tên Nhân Sự"] || row["Họ tên"] || row["name"] || Object.values(row)[0] || "").toString().trim();
              const username = (row["Tài khoản đăng nhập"] || row["Tài khoản"] || row["username"] || Object.values(row)[1] || "").toString().trim().toLowerCase();
              const password = (row["Mật khẩu ban hành"] || row["Mật khẩu"] || row["password"] || Object.values(row)[2] || "123").toString().trim();
              const roleRaw = (row["Vai trò chức vụ"] || row["Phân vai"] || row["role"] || Object.values(row)[3] || "Học sinh").toString().trim();
              const extra = (row["Thông tin đính kèm"] || row["Thông tin đính danh"] || row["extra"] || Object.values(row)[4] || "").toString().trim();

              if (!name || !username) {
                return;
              }

              let role: 'Admin' | 'Giáo viên' | 'Nhân viên' | 'Học sinh' | 'Phụ huynh' = 'Học sinh';
              const rLower = roleRaw.toLowerCase();
              if (rLower.includes("quản trị") || rLower.includes("admin")) {
                role = "Admin";
              } else if (rLower.includes("giáo viên") || rLower.includes("giaovien") || rLower.includes("teacher") || rLower === "gv") {
                role = "Giáo viên";
              } else if (rLower.includes("nhân viên") || rLower.includes("nhanvien") || rLower.includes("staff")) {
                role = "Nhân viên";
              } else if (rLower.includes("phụ huynh") || rLower.includes("phuhuynh") || rLower.includes("parent") || rLower === "ph") {
                role = "Phụ huynh";
              } else {
                role = "Học sinh";
              }

              parsedList.push({
                name,
                username,
                password,
                role,
                extra,
                isFirstLogin: false,
                canPostNews: role === "Admin" || role === "Giáo viên"
              });
            }
          });

          if (parsedList.length === 0) {
            showToast("Không tìm thấy hàng tài khoản hợp lệ nào trong tệp tin nhập!", "error");
          } else {
            setImportedAccounts(parsedList);
            showToast(`Đã đọc sơ bộ dữ liệu từ biểu mẫu thành công: ${parsedList.length} tài khoản!`, "success");
          }
        } catch (error: any) {
          showToast(`Lỗi giải mã file biểu mẫu: ${error.message || 'Sai định dạng'}`, "error");
        }
      };
      reader.readAsBinaryString(file);
    };

    const handleSaveImportedAccounts = () => {
      if (!hasAddPermission) {
        showToast("Tài khoản của bạn không có quyền thêm tài khoản mới! Vui lòng liên hệ Admin để phân quyền.", "error");
        return;
      }
      if (importedAccounts.length === 0) {
        showToast("Vui lòng tải tệp biểu mẫu lên trước khi lưu!", "info");
        return;
      }

      const existingUsernames = new Set(accounts.map(a => a.username.toLowerCase()));
      const finalToImport: Account[] = [];
      let duplicateCount = 0;

      importedAccounts.forEach((imp, index) => {
        let uniqueUsername = imp.username;
        if (existingUsernames.has(uniqueUsername)) {
          duplicateCount++;
          uniqueUsername = `${uniqueUsername}_${Math.floor(100 + Math.random() * 900)}`;
        }
        
        finalToImport.push({
          id: Date.now() + index,
          name: imp.name,
          username: uniqueUsername,
          password: imp.password,
          role: imp.role,
          extra: imp.extra,
          isFirstLogin: false,
          canPostNews: imp.canPostNews,
          studentId: imp.studentId,
          cccd: imp.cccd,
          dob: imp.dob,
          class: imp.class,
          address: imp.address,
          parents: imp.parents,
          phone: imp.phone
        });
        existingUsernames.add(uniqueUsername);
      });

      saveAccountsStateForUndo();
      setAccounts(prev => [...finalToImport, ...prev]);
      
      let warnMsg = duplicateCount > 0 
        ? ` (Đã bổ sung mã số để tránh trùng lặp cho ${duplicateCount} tài khoản)`
        : "";
      showToast(`Chúc mừng! Cấp mới đồng loạt thành công ${finalToImport.length} tài khoản học vụ!${warnMsg}`, "success");
      
      setImportedAccounts([]);
      setShowBulk(false);
    };

    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in space-y-4 text-left">
        {currentUser?.role !== 'Admin' && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-[13px] text-indigo-900">Bảng Phân Quyền Thao Tác Hành Chính</p>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Tài khoản: <strong className="text-indigo-700 font-extrabold">{currentUser?.name || 'Khách vãng lai'}</strong> ({currentUser?.role || 'Khách'}). 
                  Các quyền hành chính của bạn được phê duyệt và quản lý bởi Quản trị viên (Admin):
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasAddPermission ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasAddPermission ? '✓ Quyền Thêm' : '✗ Cấm Thêm'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasEditPermission ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasEditPermission ? '✓ Quyền Sửa' : '✗ Cấm Sửa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasDeletePermission ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasDeletePermission ? '✓ Quyền Xóa' : '✗ Cấm Xóa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasUndoPermission ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasUndoPermission ? '✓ Quyền Hoàn tác' : '✗ Cấm Hoàn tác'}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-brand-blue" />
            Quản lý Tài Khoản Độc Quyền Hệ Thống
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                if (currentUser?.role !== 'Admin') {
                  showToast("Chỉ Quản trị viên (Admin) mới có quyền truy cập bảng phân quyền đăng tin!", "error");
                  return;
                }
                onOpenPermissionModal();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" /> Bản tin & Phân quyền Đăng bài
            </button>
            <button
              onClick={() => {
                if (!hasAddPermission) {
                  showToast("Tài khoản của bạn không có quyền thêm tài khoản mới! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                setShowBulk(prev => !prev);
                setShowStudentBulk(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Cấp Đồng Loạt (Excel/CSV)
            </button>
            <button
              id="btn-student-bulk-import"
              onClick={() => {
                if (!hasAddPermission) {
                  showToast("Tài khoản của bạn không có quyền cấp học sinh đồng loạt! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                setShowStudentBulk(prev => !prev);
                setShowBulk(false);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cấp tài khoản học sinh đồng loạt và xuất biểu mẫu thông tin chi tiết học sinh"
            >
              <FileSpreadsheet className="w-4 h-4" /> Cấp Học Sinh Đồng Loạt (Excel)
            </button>
            <button
              onClick={handleExportAccounts}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Xuất toàn bộ danh sách tài khoản hiện tại ra file Excel để lưu trữ"
            >
              <Download className="w-4 h-4" /> Tải Danh Sách (Excel)
            </button>
            <button
              onClick={handleSyncAccounts}
              disabled={isSyncing}
              className={`${isSyncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'} text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer`}
              title="Đò đồng bộ 2 chiều: Kéo tài khoản mới từ Cloud và Đẩy dữ liệu đồng nhất lên Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
              {isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Đám Mây'}
            </button>
            <button
              onClick={() => {
                if (!hasEditPermission) {
                  showToast("Tài khoản của bạn không có quyền đồng bộ tài khoản! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                onSyncAccountsWithAssignments();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Đồng bộ thông tin bộ môn giảng dạy từ phân công vào thông tin đính danh của tài khoản giáo viên"
            >
              <RefreshCw className="w-4 h-4 animate-pulse" /> Đồng bộ với Phân công
            </button>
            <button
              onClick={() => {
                if (!hasAddPermission) {
                  showToast("Tài khoản của bạn không có quyền cấp tài khoản mới! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                onOpenAddAccount();
              }}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] px-3.5 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Cấp Tài Khoản Mới
            </button>
          </div>
        </div>

        {/* Collapsible Bulk Import Zone */}
        {showBulk && (
          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/40 p-5 rounded-2xl border border-indigo-100 shadow-inner space-y-4 animate-fade-in text-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <b className="text-xs md:text-sm text-indigo-900 block font-extrabold">Cung Cấp Tài Khoản Độc Quyền Đồng Loạt Học Kỳ II</b>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Tải tệp Excel (.xlsx)/CSV theo đúng trường biểu mẫu được chỉ định để tự động hóa cấp hàng loạt tài khoản học sinh, giáo viên và phụ huynh.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulk(false);
                  setImportedAccounts([]);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-white p-1 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left action panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10.5px] font-extrabold text-indigo-900 block uppercase tracking-wider">CÁC BƯỚC THỰC HIỆN</span>
                  
                  <div className="flex items-start gap-2.5 text-[11px]">
                    <div className="bg-indigo-100 text-indigo-805 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">1</div>
                    <div>
                      <p className="font-bold text-slate-800">Tải xuống tệp mẫu chuẩn quốc gia</p>
                      <button
                        onClick={handleDownloadTemplate}
                        className="text-[10.5px] text-brand-blue hover:underline font-black mt-1.5 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 animate-bounce" /> Click để tải biểu mẫu chuẩn (.xlsx)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-[11px]">
                    <div className="bg-indigo-100 text-indigo-805 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">2</div>
                    <div className="flex-1 space-y-2">
                      <p className="font-bold text-slate-800">Bổ sung danh sách nhân sự của trường, sau đó up lên</p>
                      <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-55/35 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition">
                        <Upload className="w-6 h-6 text-indigo-600" />
                        <span className="font-bold text-[10px] text-slate-600 text-center">Nhấn để Browse hoặc kéo thả file Excel vào đây</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleImportFile}
                          className="hidden"
                          ref={fileInputRef}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {importedAccounts.length > 0 && (
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-700">
                      Đã nạp thành công <b>{importedAccounts.length}</b> hàng tài khoản
                    </span>
                    <button
                      onClick={handleSaveImportedAccounts}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3.5 py-2 rounded-xl shadow transition"
                    >
                      Đồng bộ vào hệ thống
                    </button>
                  </div>
                )}
              </div>

              {/* Right preview panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between min-h-[180px]">
                <div>
                  <span className="text-[10.5px] font-extrabold text-indigo-900 block uppercase tracking-wider mb-2">Bản Xem Trước Dữ Liệu Tải Lên</span>
                  {importedAccounts.length === 0 ? (
                    <div className="h-28 border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic text-[10.5px] font-bold">
                      <AlertCircle className="w-5 h-5 text-indigo-400 mb-1" />
                      Yêu cầu: chưa có tệp tin biểu mẫu nào được nạp lên
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-lg text-[10.5px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b font-extrabold text-slate-600 select-none">
                            <th className="p-1.5">Họ & Tên</th>
                            <th className="p-1.5">Username</th>
                            <th className="p-1.5">Vai trò</th>
                            <th className="p-1.5">Thông tin thêm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold font-sans">
                          {importedAccounts.slice(0, 10).map((imp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-1.5 font-bold text-slate-800 truncate max-w-[100px]">{imp.name}</td>
                              <td className="p-1.5 font-mono text-indigo-705 truncate max-w-[80px]">{imp.username}</td>
                              <td className="p-1.5">
                                <span className={`px-1 rounded text-[9px] font-bold ${
                                  imp.role === 'Giáo viên' ? 'bg-blue-50 text-brand-blue' :
                                  imp.role === 'Phụ huynh' ? 'bg-orange-50 text-brand-orange' :
                                  imp.role === 'Khách' ? 'bg-indigo-50 text-indigo-700' :
                                  'bg-emerald-50 text-emerald-800'
                                }`}>
                                  {imp.role}
                                </span>
                              </td>
                              <td className="p-1.5 text-slate-500 truncate max-w-[85px]">{imp.extra || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importedAccounts.length > 10 && (
                        <div className="p-1 bg-slate-50 border-t text-center text-slate-400 text-[9px] font-bold font-mono">
                          ...và {importedAccounts.length - 10} hàng tài khoản bổ sung khác
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {importedAccounts.length > 0 && (
                  <button
                    onClick={() => setImportedAccounts([])}
                    className="text-rose-500 hover:text-rose-700 font-bold text-[10px] mt-2 self-start ml-auto text-right hover:underline"
                  >
                    Hủy bỏ danh sách xem trước
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Student Bulk Import Zone */}
        {showStudentBulk && (
          <div id="student-bulk-import-zone" className="bg-gradient-to-br from-rose-50/50 to-orange-50/40 p-5 rounded-2xl border border-rose-100 shadow-inner space-y-4 animate-fade-in text-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <b className="text-xs md:text-sm text-rose-950 block font-extrabold">Cấp Tài Khoản Học Sinh Đồng Loạt & Xuất Biểu Mẫu</b>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Tải biểu mẫu Excel mẫu học sinh theo đầy đủ các trường thông tin chuẩn (STT, Mã định danh, CCCD, Họ tên, Năm sinh, Lớp, Nơi ở, Cha mẹ, Số điện thoại) để tự động hóa cấp hàng loạt.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStudentBulk(false);
                  setImportedStudents([]);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-white p-1 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left action panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10.5px] font-extrabold text-rose-900 block uppercase tracking-wider">CÁC BƯỚC THỰC HIỆN</span>
                  
                  <div className="flex items-start gap-2.5 text-[11px]">
                    <div className="bg-rose-100 text-rose-850 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">1</div>
                    <div>
                      <p className="font-bold text-slate-800">Tải xuống tệp mẫu thông tin học sinh</p>
                      <button
                        onClick={handleDownloadStudentTemplate}
                        className="text-[10.5px] text-brand-blue hover:underline font-black mt-1.5 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 animate-bounce" /> Click để tải biểu mẫu học sinh (.xlsx)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-[11px]">
                    <div className="bg-rose-100 text-rose-850 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">2</div>
                    <div className="flex-1 space-y-2">
                      <p className="font-bold text-slate-800">Điền đầy đủ thông tin học sinh, sau đó tải lên</p>
                      <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/30 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition">
                        <Upload className="w-6 h-6 text-rose-600" />
                        <span className="font-bold text-[10px] text-slate-600 text-center">Nhấn để Browse hoặc kéo thả file Excel học sinh vào đây</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleImportStudentFile}
                          className="hidden"
                          ref={studentFileInputRef}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {importedStudents.length > 0 && (
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-700">
                      Đã đọc thành công <b>{importedStudents.length}</b> dòng học sinh
                    </span>
                    <button
                      onClick={handleSaveImportedStudents}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3.5 py-2 rounded-xl shadow transition"
                    >
                      Xác nhận cấp đồng loạt
                    </button>
                  </div>
                )}
              </div>

              {/* Right preview panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between min-h-[180px]">
                <div>
                  <span className="text-[10.5px] font-extrabold text-rose-900 block uppercase tracking-wider mb-2">Bản Xem Trước Dữ Liệu Học Sinh</span>
                  {importedStudents.length === 0 ? (
                    <div className="h-28 border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic text-[10.5px] font-bold">
                      <AlertCircle className="w-5 h-5 text-rose-400 mb-1" />
                      Yêu cầu: chưa có tệp tin biểu mẫu nào được nạp lên
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-lg text-[10.5px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b font-extrabold text-slate-600 select-none">
                            <th className="p-1.5">Họ tên học sinh</th>
                            <th className="p-1.5">Mã ĐD</th>
                            <th className="p-1.5">Lớp</th>
                            <th className="p-1.5">Số điện thoại</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold font-sans">
                          {importedStudents.slice(0, 10).map((imp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-1.5 font-bold text-slate-800 truncate max-w-[100px]">{imp.name}</td>
                              <td className="p-1.5 font-mono text-indigo-705 truncate max-w-[80px]">{imp.studentId || '-'}</td>
                              <td className="p-1.5 font-bold">{imp.class || '-'}</td>
                              <td className="p-1.5 font-mono text-slate-500 truncate max-w-[85px]">{imp.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importedStudents.length > 10 && (
                        <div className="p-1 bg-slate-50 border-t text-center text-slate-400 text-[9px] font-bold font-mono">
                          ...và {importedStudents.length - 10} học sinh bổ sung khác
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {importedStudents.length > 0 && (
                  <button
                    onClick={() => setImportedStudents([])}
                    className="text-rose-500 hover:text-rose-700 font-bold text-[10px] mt-2 self-start ml-auto text-right hover:underline"
                  >
                    Hủy bỏ danh sách xem trước
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HỆ THỐNG PHÂN LOẠI TÀI KHOẢN CHÍNH */}
        <div className={`grid grid-cols-1 ${currentUser?.role === 'Admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 p-1.5 bg-slate-100 rounded-2xl`}>
          <button
            onClick={() => setAccountsGroup('internal')}
            className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-extrabold text-xs md:text-sm transition-all cursor-pointer ${
              accountsGroup === 'internal'
                ? 'bg-white text-brand-blue shadow-md border border-slate-200/50 scale-[1.01]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <School className="w-5 h-5 text-brand-blue" />
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider font-bold opacity-75">Hệ thống</span>
              <span className="block font-black text-xs md:text-sm">Tài khoản Nội bộ Trường ({accounts.filter(a => a.role === 'Admin' || a.role === 'Giáo viên' || a.role === 'Nhân viên').length})</span>
            </div>
          </button>
          <button
            onClick={() => setAccountsGroup('public')}
            className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-extrabold text-xs md:text-sm transition-all cursor-pointer ${
              accountsGroup === 'public'
                ? 'bg-white text-emerald-700 shadow-md border border-slate-200/50 scale-[1.01]'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Globe className="w-5 h-5 text-emerald-650 animate-pulse" />
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider font-bold opacity-75">Tự do / Đăng ký trực tuyến</span>
              <span className="block font-black text-xs md:text-sm">Tài khoản HS / Phụ huynh / Khách ({accounts.filter(a => a.role === 'Học sinh' || a.role === 'Phụ huynh' || a.role === 'Khách').length})</span>
            </div>
          </button>

          {currentUser?.role === 'Admin' && (
            <button
              onClick={() => setAccountsGroup('history')}
              className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-extrabold text-xs md:text-sm transition-all cursor-pointer ${
                accountsGroup === 'history'
                  ? 'bg-white text-purple-700 shadow-md border border-slate-200/50 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <History className="w-5 h-5 text-purple-600 animate-spin-slow" />
              <div className="text-left">
                <span className="block text-[11px] uppercase tracking-wider font-bold opacity-75">Giám sát Bảo mật</span>
                <span className="block font-black text-xs md:text-sm">Lịch sử Đăng nhập ({loginLogs.length})</span>
              </div>
            </button>
          )}
        </div>

        {/* Bộ lọc vai trò tài khoản theo phân loại con */}
        {accountsGroup === 'internal' ? (
          <div className="flex flex-wrap border-b border-slate-200 gap-1.5 p-1 bg-slate-50 rounded-xl max-w-fit">
            <button
              onClick={() => setAccountsTabFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                accountsTabFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Tất cả Nội bộ ({accounts.filter(a => a.role === 'Admin' || a.role === 'Giáo viên' || a.role === 'Nhân viên').length})
            </button>
            <button
              onClick={() => setAccountsTabFilter('teachers')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                accountsTabFilter === 'teachers'
                  ? 'bg-white text-teal-700 shadow-sm border border-teal-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Danh sách Giáo viên ({accounts.filter(a => a.role === 'Giáo viên').length})
            </button>
            <button
              onClick={() => setAccountsTabFilter('staff')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                accountsTabFilter === 'staff'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Tài khoản của Cán bộ / Nhân viên / Quản trị viên"
            >
              Cán bộ & Nhân viên ({accounts.filter(a => a.role === 'Admin' || a.role === 'Nhân viên').length})
            </button>
          </div>
        ) : accountsGroup === 'public' ? (
          <div className="flex flex-wrap border-b border-slate-200 gap-1.5 p-1 bg-slate-50 rounded-xl max-w-fit">
            <button
              onClick={() => setPublicAccountsTabFilter('all_public')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                publicAccountsTabFilter === 'all_public'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Tất cả Tự do ({accounts.filter(a => a.role === 'Học sinh' || a.role === 'Phụ huynh' || a.role === 'Khách').length})
            </button>
            <button
              onClick={() => setPublicAccountsTabFilter('students')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                publicAccountsTabFilter === 'students'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Danh sách Học sinh ({accounts.filter(a => a.role === 'Học sinh').length})
            </button>
            <button
              onClick={() => setPublicAccountsTabFilter('parents')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                publicAccountsTabFilter === 'parents'
                  ? 'bg-white text-orange-700 shadow-sm border border-orange-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Tài khoản Phụ huynh ({accounts.filter(a => a.role === 'Phụ huynh').length})
            </button>
            <button
              onClick={() => setPublicAccountsTabFilter('guests')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                publicAccountsTabFilter === 'guests'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Tài khoản Khách ({accounts.filter(a => a.role === 'Khách').length})
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-purple-50 border border-purple-150 rounded-xl">
            <div className="text-xs font-bold text-purple-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse inline-block"></span>
              <span>Hệ thống bảo mật ghi nhận tổng cộng <strong className="text-purple-950 font-black">{loginLogs.length}</strong> phiên kết nối thành công.</span>
            </div>
            {loginLogs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử đăng nhập để giải phóng bộ nhớ?")) {
                    if (setLoginLogs) setLoginLogs([]);
                    localStorage.removeItem('thcs_login_logs');
                    showToast("Đã dọn dẹp sạch toàn bộ lịch sử đăng nhập!", "success");
                  }
                }}
                className="bg-white hover:bg-purple-100 text-purple-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm transition cursor-pointer"
              >
                Xóa sạch lịch sử
              </button>
            )}
          </div>
        )}

        {accountsGroup === 'history' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                  <th className="p-3">Mã phiên (ID)</th>
                  <th className="p-3">Họ và Tên thành viên</th>
                  <th className="p-3">Tên đăng nhập (Username)</th>
                  <th className="p-3">Vai trò chức vụ</th>
                  <th className="p-3">Thời gian đăng nhập</th>
                  <th className="p-3">Thiết bị & Trình duyệt</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loginLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic font-bold">
                      Hệ thống chưa ghi nhận bất kỳ lịch sử đăng nhập nào.
                    </td>
                  </tr>
                ) : (
                  loginLogs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-slate-50 transition duration-155">
                      <td className="p-3 font-mono text-slate-400 font-bold">{log.id}</td>
                      <td className="p-3">
                        <strong className="text-slate-850 text-xs block">{log.name}</strong>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{log.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.role === 'Admin' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          log.role === 'Nhân viên' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          log.role === 'Giáo viên' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                          log.role === 'Phụ huynh' ? 'bg-orange-50 text-brand-orange border-orange-200' :
                          log.role === 'Khách' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-550">{log.timestamp}</td>
                      <td className="p-3 font-semibold text-slate-500">{log.deviceInfo}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold inline-block">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                  <th className="p-3">
                    {accountsGroup === 'internal'
                      ? (accountsTabFilter === 'teachers' ? 'Họ và Tên Giáo Viên' : 'Họ và Tên Nhân Sự / Vai Trò')
                      : 'Họ và Tên Học Sinh / PH / Khách (Tự do)'
                    }
                  </th>
                  <th className="p-3">Tên đăng nhập (Username)</th>
                  <th className="p-3">Vai trò chức vụ</th>
                  <th className="p-3">Thông tin đính danh (Phân Công Giảng Dạy / Lớp / Ghi chú)</th>
                  <th className="p-3 text-right">Lựa chọn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.filter(acc => {
                  if (accountsGroup === 'internal') {
                    const isInternal = acc.role === 'Admin' || acc.role === 'Giáo viên' || acc.role === 'Nhân viên';
                    if (!isInternal) return false;
                    if (accountsTabFilter === 'teachers') return acc.role === 'Giáo viên';
                    if (accountsTabFilter === 'staff') return acc.role === 'Admin' || acc.role === 'Nhân viên';
                    return true;
                  } else {
                    const isPublic = acc.role === 'Học sinh' || acc.role === 'Phụ huynh' || acc.role === 'Khách';
                    if (!isPublic) return false;
                    if (publicAccountsTabFilter === 'students') return acc.role === 'Học sinh';
                    if (publicAccountsTabFilter === 'parents') return acc.role === 'Phụ huynh';
                    if (publicAccountsTabFilter === 'guests') return acc.role === 'Khách';
                    return true;
                  }
                }).map(acc => (
                  <tr key={acc.id} className="border-b hover:bg-slate-50 transition duration-155">
                    <td className="p-3">
                      <b className="text-slate-800 block text-xs">{acc.name}</b>
                      {acc.canPostNews && (
                        <span className="bg-amber-50 text-amber-700 text-[8.5px] border border-amber-200 px-1 py-0.2 rounded-md font-bold inline-block mt-0.5">
                          Quyền đăng tin hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-650">{acc.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        acc.role === 'Admin' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        acc.role === 'Nhân viên' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        acc.role === 'Giáo viên' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                        acc.role === 'Phụ huynh' ? 'bg-orange-50 text-brand-orange border-orange-200' :
                        acc.role === 'Khách' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-550 font-bold text-[11px]">{acc.extra || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {/* RED BOX: Hoàn tác (Undo) action button */}
                        <button
                          onClick={() => {
                            if (!hasUndoPermission) {
                              showToast("Tài khoản của bạn không có quyền hoàn tác! Vui lòng liên hệ Admin.", "error");
                              return;
                            }
                            handleUndoAccounts();
                          }}
                          disabled={!accountsHistory || accountsHistory.length === 0}
                          className={`font-bold text-xs p-1.5 rounded-lg border transition ${
                            accountsHistory && accountsHistory.length > 0
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white cursor-pointer animate-pulse'
                              : 'bg-slate-50 text-slate-350 border-slate-200 cursor-not-allowed'
                          }`}
                          title="Hoàn tác thao tác thay đổi tài khoản vừa thực hiện"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (!hasEditPermission) {
                              showToast("Tài khoản của bạn không có quyền chỉnh sửa thông tin tài khoản! Vui lòng liên hệ Admin.", "error");
                              return;
                            }
                            onOpenAddAccount(acc);
                          }}
                          className="bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white font-bold text-xs p-1.5 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAcc(acc.id, acc.role, acc.username)}
                          className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs p-1.5 rounded-lg transition cursor-pointer"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // 2. CLASSES STRUCTURE VIEW
  const renderClasses = () => {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-left space-y-4">
        {currentUser?.role !== 'Admin' && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-[13px] text-indigo-900">Bảng Phân Quyền Thao Tác Cơ Cấu Lớp Học</p>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Tài khoản: <strong className="text-indigo-700 font-extrabold">{currentUser?.name || 'Khách vãng lai'}</strong> ({currentUser?.role || 'Khách'}). 
                  Quyền quản lý cơ cấu lớp hành chính được phê duyệt bởi Quản trị viên (Admin):
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasAddPermission ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasAddPermission ? '✓ Quyền Thêm' : '✗ Cấm Thêm'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasEditPermission ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasEditPermission ? '✓ Quyền Sửa' : '✗ Cấm Sửa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasDeletePermission ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasDeletePermission ? '✓ Quyền Xóa' : '✗ Cấm Xóa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasUndoPermission ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasUndoPermission ? '✓ Quyền Hoàn tác' : '✗ Cấm Hoàn tác'}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between border-b pb-3 mb-4 items-center flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-805 flex items-center gap-1.5">
            <School className="w-5 h-5 text-brand-blue" />
            Cơ cấu Khối & Danh sách các Lớp học hành chính
          </h3>
          <div className="flex gap-2 items-center">
            {classHistory.length > 0 && (
              <button
                onClick={() => {
                  if (!hasUndoPermission) {
                    showToast("Tài khoản của bạn không có quyền hoàn tác lớp học! Vui lòng liên hệ Admin.", "error");
                    return;
                  }
                  onUndoClass();
                }}
                className="bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                title="Hoàn tác thao tác vừa thực hiện"
              >
                <Undo2 className="w-3.5 h-3.5 text-brand-blue" />
                Hoàn tác ({classHistory.length})
              </button>
            )}
            <button
              onClick={() => {
                if (!hasAddPermission) {
                  showToast("Tài khoản của bạn không có quyền thêm lớp học mới! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                onOpenAddClass();
              }}
              className="bg-brand-orange text-white text-xs px-3.5 py-1.5 rounded-xl font-bold hover:bg-brand-orange-dark transition cursor-pointer"
            >
              Thêm chi đội lớp học mới
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {classes.map(cls => (
            <div key={cls.id} className="bg-slate-50 hover:bg-white p-4 border border-slate-200 hover:border-slate-350 rounded-2xl relative shadow-sm transition-all duration-150 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <b className="text-brand-blue block text-[13px]">Chi đội {cls.lop}</b>
                  <span className="text-[9px] bg-slate-200 text-slate-650 px-1.5 py-0.5 rounded font-black font-mono">
                    {cls.id}
                  </span>
                </div>
                
                <div className="space-y-1 text-[11px] text-left">
                  <p className="text-slate-600 font-medium">
                    Tutor GVCN: <b className="text-slate-900">{cls.gvcn}</b>
                  </p>
                  <p className="text-slate-600 font-medium">
                    GVBM chính: <b className="text-emerald-700">{cls.gvbm || 'Chưa phân công'}</b>
                  </p>
                  <p className="text-slate-400 font-bold font-mono text-[9px] mt-2">
                    Sĩ số học sinh: {cls.total} học sinh
                  </p>
                </div>
              </div>

              {/* Action buttons with elegant styles */}
              <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-155">
                <button
                  onClick={() => {
                    if (!hasEditPermission) {
                      showToast("Tài khoản của bạn không có quyền chỉnh sửa thông tin lớp học! Vui lòng liên hệ Admin.", "error");
                      return;
                    }
                    onOpenAddClass(cls);
                  }}
                  className="bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white p-1.5 rounded-lg transition duration-150 cursor-pointer"
                  title={`Sửa thông tin lớp ${cls.lop}`}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (!hasDeletePermission) {
                      showToast("Tài khoản của bạn không có quyền xóa lớp học! Vui lòng liên hệ Admin.", "error");
                      return;
                    }
                    if (confirm(`Bạn có chắc chắn muốn xóa lớp ${cls.lop} khỏi hệ thống?`)) {
                      onDeleteClass(cls.id);
                    }
                  }}
                  className="bg-rose-55 hover:bg-rose-600 text-rose-600 hover:text-white p-1.5 rounded-lg transition duration-150 cursor-pointer"
                  title={`Xóa lớp ${cls.lop}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. SUBJECTS AND ASSIGNMENTS
  const renderSubjects = () => {
    const handleUndo = () => {
      if (!hasUndoPermission) {
        showToast("Tài khoản của bạn không có quyền hoàn tác phân công! Vui lòng liên hệ Admin.", "error");
        return;
      }
      if (assignmentHistory.length === 0) return;
      const prev = assignmentHistory[assignmentHistory.length - 1];
      setAssignments(prev);
      setAssignmentHistory(prevHistory => prevHistory.slice(0, prevHistory.length - 1));
      showToast("Hoàn tác thao tác phân công giảng dạy!", "success");
    };

    const handleDeleteAssignment = (id: number) => {
      if (!hasDeletePermission) {
        showToast("Tài khoản của bạn không có quyền xóa phân công giảng dạy! Vui lòng liên hệ Admin.", "error");
        return;
      }
      // Record history
      setAssignmentHistory(prev => [...prev, [...assignments]]);
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast("Đã xóa phân công giảng dạy thành công!", "success");
    };

    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-left space-y-4">
        {currentUser?.role !== 'Admin' && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-[13px] text-indigo-900">Bảng Phân Quyền Phân Công Giảng Dạy</p>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Tài khoản: <strong className="text-indigo-700 font-extrabold">{currentUser?.name || 'Khách vãng lai'}</strong> ({currentUser?.role || 'Khách'}). 
                  Quyền thay đổi phân công môn học/lớp học được phê duyệt bởi Quản trị viên (Admin):
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasAddPermission ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasAddPermission ? '✓ Quyền Thêm' : '✗ Cấm Thêm'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasEditPermission ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasEditPermission ? '✓ Quyền Sửa' : '✗ Cấm Sửa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasDeletePermission ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasDeletePermission ? '✓ Quyền Xóa' : '✗ Cấm Xóa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasUndoPermission ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasUndoPermission ? '✓ Quyền Hoàn tác' : '✗ Cấm Hoàn tác'}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between border-b pb-3 mb-4 items-center flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-brand-blue" />
            Nhập phân công & Phân bổ Bộ môn Giảng dạy học kỳ II
          </h3>
          <div className="flex gap-2">
            {assignmentHistory.length > 0 && (
              <button
                onClick={handleUndo}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm border cursor-pointer flex items-center gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" /> Hoàn tác
              </button>
            )}
            <button
              onClick={() => {
                if (!hasEditPermission) {
                  showToast("Tài khoản của bạn không có quyền đồng bộ tài khoản! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                onSyncAccountsWithAssignments();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow cursor-pointer flex items-center gap-1"
              title="Đồng bộ thông tin bộ môn giảng dạy từ phân công vào thông tin đính danh của tài khoản giáo viên"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-pulse" /> Đồng bộ Tài Khoản
            </button>
            <button
              onClick={() => {
                if (!hasAddPermission) {
                  showToast("Tài khoản của bạn không có quyền thêm phân công mới! Vui lòng liên hệ Admin.", "error");
                  return;
                }
                onOpenAddAssignment();
              }}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow cursor-pointer flex items-center gap-1"
            >
              <PlusSquare className="w-4 h-4" /> Báo Phân công mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                <th className="p-3">Thầy cô Giáo viên phụ trách</th>
                <th className="p-3">Môn học đảm nhiệm</th>
                <th className="p-3">Khối Lớp quản lý học vụ</th>
                <th className="p-3 text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assignments.map(asg => (
                <tr key={asg.id} className="border-b hover:bg-slate-50 transition duration-155">
                  <td className="p-3">
                    <b className="text-slate-805 block text-xs">{asg.teacherName}</b>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {asg.subjectClassPairs && asg.subjectClassPairs.length > 0 ? (
                        asg.subjectClassPairs.map(pair => (
                          <span
                            key={pair}
                            className="bg-blue-50 border border-blue-105 text-brand-blue px-2 py-0.5 rounded text-[10.5px] font-black"
                          >
                            {pair}
                          </span>
                        ))
                      ) : (
                        asg.subjects.map(sub => (
                          <span
                            key={sub}
                            className="bg-blue-55 border border-blue-100 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            {sub}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {asg.classes.map(cl => (
                        <span
                          key={cl}
                          className="bg-orange-50 border border-orange-100 text-brand-orange px-1.5 py-0.5 rounded text-[10px] font-black font-mono"
                        >
                          Lớp {cl}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => {
                          if (!hasEditPermission) {
                            showToast("Tài khoản của bạn không có quyền chỉnh sửa phân công! Vui lòng liên hệ Admin.", "error");
                            return;
                          }
                          onOpenAddAssignment(asg);
                        }}
                        className="bg-blue-50 hover:bg-blue-600 text-brand-blue hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 4. EXAMS BANK VIEW
  const renderExams = () => {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-left space-y-4">
        {currentUser?.role !== 'Admin' && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-[13px] text-indigo-900">Bảng Phân Quyền Ngân Hàng Đề Kiểm Tra</p>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Tài khoản: <strong className="text-indigo-700 font-extrabold">{currentUser?.name || 'Khách vãng lai'}</strong> ({currentUser?.role || 'Khách'}). 
                  Quyền đăng tải và điều phối đề thi được phê duyệt bởi Quản trị viên (Admin):
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasAddPermission ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasAddPermission ? '✓ Quyền Thêm' : '✗ Cấm Thêm'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasEditPermission ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasEditPermission ? '✓ Quyền Sửa' : '✗ Cấm Sửa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasDeletePermission ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasDeletePermission ? '✓ Quyền Xóa' : '✗ Cấm Xóa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasUndoPermission ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasUndoPermission ? '✓ Quyền Hoàn tác' : '✗ Cấm Hoàn tác'}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between border-b pb-3 mb-4 items-center flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-805 flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5 text-brand-blue" />
            Ngân hàng Đề Kiểm Tra & Khảo Sát Đánh Giá
          </h3>
          <button
            onClick={() => {
              if (!hasAddPermission) {
                showToast("Tài khoản của bạn không có quyền đăng đề kiểm tra mới! Vui lòng liên hệ Admin.", "error");
                return;
              }
              onOpenAddExam();
            }}
            className="bg-brand-blue text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow-md hover:bg-brand-blue-dark transition cursor-pointer flex items-center gap-1"
          >
            <PlusSquare className="w-4 h-4" /> Đăng tệp đề bài mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {exams.map(ex => (
            <div key={ex.id} className="p-4 bg-slate-50 border rounded-xl flex justify-between items-start">
              <div>
                <b className="text-slate-800 text-xs md:text-sm block">Môn {ex.subject}: Đề {ex.type}</b>
                <span className="text-[10px] text-slate-450 block font-bold mt-1">
                  Người đăng: {ex.teacher} | Thời lượng: {ex.duration}
                </span>
                <span className="text-[9.5px] bg-blue-50 text-brand-blue border border-blue-200 inline-block px-2 py-0.5 rounded font-black font-mono mt-3">
                  Cấp tài liệu: Lớp {ex.targetValue}
                </span>
              </div>
              {ex.examFile && (
                <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-2.5 py-1 rounded">
                  Đính đèm: {ex.examFile.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 5. HOMEWORK MANAGER
  const renderHomework = () => {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-left space-y-4">
        {currentUser?.role !== 'Admin' && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-[13px] text-indigo-900">Bảng Phân Quyền Bài Tập Tự Rèn Luyện</p>
                <p className="font-medium text-slate-500 leading-relaxed">
                  Tài khoản: <strong className="text-indigo-700 font-extrabold">{currentUser?.name || 'Khách vãng lai'}</strong> ({currentUser?.role || 'Khách'}). 
                  Quyền đăng tải và sửa đổi danh sách bài tập tự rèn luyện được phê duyệt bởi Quản trị viên (Admin):
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasAddPermission ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasAddPermission ? '✓ Quyền Thêm' : '✗ Cấm Thêm'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasEditPermission ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasEditPermission ? '✓ Quyền Sửa' : '✗ Cấm Sửa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasDeletePermission ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasDeletePermission ? '✓ Quyền Xóa' : '✗ Cấm Xóa'}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${hasUndoPermission ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {hasUndoPermission ? '✓ Quyền Hoàn tác' : '✗ Cấm Hoàn tác'}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between border-b pb-3 mb-4 items-center flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-slate-805 flex items-center gap-1.5">
            <PenTool className="w-5 h-5 text-purple-650 animate-pulse" />
            Quản lý Bài Tập về nhà cho con tự rèn luyện
          </h3>
          <button
            onClick={() => {
              if (!hasAddPermission) {
                showToast("Tài khoản của bạn không có quyền giao bài tập mới! Vui lòng liên hệ Admin.", "error");
                return;
              }
              onOpenAddHomework();
            }}
            className="bg-brand-orange text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow-md hover:bg-brand-orange-dark transition cursor-pointer flex items-center gap-1"
          >
            <PlusSquare className="w-4 h-4" /> Giao Đơn Bài Tập
          </button>
        </div>

        {/* PERSISTENT UNDO CONTROLS BANNER */}
        {homeworkHistory.length > 0 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3 flex justify-between items-center text-xs text-slate-850 animate-fade-in shadow-sm">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <Undo2 className="w-4 h-4 text-purple-600 animate-spin" />
              Sự thay đổi bản ghi bài tập đã lưu. Bạn có muốn hoàn tác hành động này?
            </span>
            <button
              onClick={handleUndoHomework}
              className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-[10.5px] shadow transition-transform hover:scale-105 cursor-pointer"
            >
              Hoàn tác hành động ({homeworkHistory.length})
            </button>
          </div>
        )}

        <div className="space-y-3.5">
          {homework.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bài tập nào được giao.</p>
          ) : (
            homework.map(hw => (
              <div key={hw.id} className="p-4 border rounded-xl bg-white hover:shadow transition duration-200 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <b className="text-slate-800 text-xs md:text-sm block">Môn {hw.subject}: {hw.title}</b>
                  <p className="text-[11px] text-slate-550 italic mt-0.5 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{hw.content}"
                  </p>
                  
                  {/* Attached file presentation */}
                  {hw.homeworkFile && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between text-[11px] text-slate-650 max-w-sm">
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        {hw.homeworkFile.name.endsWith('.pdf') ? (
                          <span className="p-1 bg-red-100 text-red-650 rounded font-black text-[9px]">PDF</span>
                        ) : hw.homeworkFile.name.endsWith('.doc') || hw.homeworkFile.name.endsWith('.docx') ? (
                          <span className="p-1 bg-blue-100 text-blue-650 rounded font-black text-[9px]">WORD</span>
                        ) : (
                          <span className="p-1 bg-amber-150 text-amber-650 rounded font-light text-[9px]">ẢNH</span>
                        )}
                        <span className="truncate max-w-[150px]">{hw.homeworkFile.name}</span>
                        {hw.homeworkFile.size && (
                          <span className="text-slate-400 text-[10px] shrink-0">({hw.homeworkFile.size})</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          showToast(`Đang tải tệp tin bài tập: ${hw.homeworkFile.name}`, "success");
                          const element = document.createElement("a");
                          const fileText = `Tài liệu bài tập THCS Hòa Phú \nĐề bài: ${hw.title}\nMôn học: ${hw.subject}\nNội dung: ${hw.content}`;
                          const file = new Blob([fileText], {type: 'text/plain'});
                          element.href = URL.createObjectURL(file);
                          element.download = hw.homeworkFile.name;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="text-xs text-brand-orange hover:underline font-extrabold cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                      >
                        Tải xuống 📥
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 flex-wrap whitespace-nowrap text-[9px] font-black font-mono pt-1">
                    <span className="bg-orange-50 text-brand-orange border border-orange-100 px-2 py-0.5 rounded">
                      Phạm vi: {hw.targetType === 'all' ? 'Toàn trường' : hw.targetType === 'class' ? `Lớp ${hw.targetValue}` : `Học sinh: ${hw.targetValue}`}
                    </span>
                    <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded">
                      Hạn nộp: {hw.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 items-center justify-center shrink-0 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-slate-150 self-stretch">
                  <button
                    onClick={() => {
                      if (!hasEditPermission) {
                        showToast("Tài khoản của bạn không có quyền chỉnh sửa bài tập! Vui lòng liên hệ Admin.", "error");
                        return;
                      }
                      saveHomeworkStateForUndo();
                      onOpenAddHomework(hw);
                    }}
                    className="flex-1 md:flex-none text-[10px] bg-slate-100 hover:bg-slate-200 text-indigo-700 font-extrabold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer w-full md:w-20"
                    title="Chỉnh sửa bài tập"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (!hasDeletePermission) {
                        showToast("Tài khoản của bạn không có quyền gỡ bài tập! Vui lòng liên hệ Admin.", "error");
                        return;
                      }
                      saveHomeworkStateForUndo();
                      setHomework(prev => prev.filter(item => item.id !== hw.id));
                      showToast(`Đã gỡ bài tập: ${hw.title}`, "success");
                    }}
                    className="flex-1 md:flex-none text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-705 font-extrabold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer w-full md:w-20"
                    title="Xóa bài tập này"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Return specific render according to section parameter
  switch (currentSection) {
    case 'accounts':
      return renderAccounts();
    case 'classes':
      return renderClasses();
    case 'subjects':
      return renderSubjects();
    case 'exams':
      return renderExams();
    case 'homework':
      return renderHomework();
    default:
      return null;
  }
}
