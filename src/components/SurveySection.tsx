import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Paperclip, 
  Send, 
  Download, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  Printer, 
  Trash2, 
  Edit3, 
  Plus, 
  Undo2, 
  Check, 
  X, 
  RotateCcw, 
  Settings, 
  Sparkles,
  Award,
  HelpCircle
} from 'lucide-react';
import { Survey, Account } from '../types';
import { showToast } from './Toast';
import { exportToWord, triggerPrintWindow } from '../utils';

interface SurveySectionProps {
  currentUser: Account | null;
  surveys: Survey[];
  setSurveys: React.Dispatch<React.SetStateAction<Survey[]>>;
}

export default function SurveySection({
  currentUser,
  surveys,
  setSurveys,
}: SurveySectionProps) {
  const [activeTab, setActiveTab] = useState<'online' | 'upload' | 'list'>('online');
  const [currentRating, setCurrentRating] = useState(5);
  
  // Available topics for survey - customizable by Admin/Educators
  const [availableTopics, setAvailableTopics] = useState<string[]>(() => {
    const saved = localStorage.getItem('thcs_survey_topics');
    return saved ? JSON.parse(saved) : [
      "Chất lượng dạy và học của thầy và trò",
      "Chất lượng bán trú & Dinh dưỡng học đường",
      "Đổi mới học vụ chuyên môn & Chuyển đổi số",
      "Cơ sở vật chất & Thiết bị dạy học",
      "Ý kiến đóng góp xây dựng khác"
    ];
  });

  // History stacks for Undo feature
  const [topicsHistory, setTopicsHistory] = useState<string[][]>([]);
  const [surveysHistory, setSurveysHistory] = useState<Survey[][]>([]);

  // Local state for editing/adding survey topics
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [editingTopicValue, setEditingTopicValue] = useState('');

  // Form state for online survey submission
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [classInfo, setClassInfo] = useState('6A');
  const [content, setContent] = useState('');
  
  // Rating states for chosen multiple topics (record of topic -> star rating)
  const [selectedTopics, setSelectedTopics] = useState<Record<string, number>>(() => {
    return {
      "Chất lượng dạy và học của thầy và trò": 5
    };
  });

  // Upload Form State
  const [uploadParent, setUploadParent] = useState('');
  const [uploadStudent, setUploadStudent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  // Survey CRUD modal form states
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [modalParentName, setModalParentName] = useState('');
  const [modalStudentName, setModalStudentName] = useState('');
  const [modalClassInfo, setModalClassInfo] = useState('6A');
  const [modalContent, setModalContent] = useState('');
  const [modalStatus, setModalStatus] = useState<'Mới nhận' | 'Đang xử lý' | 'Đã tiếp thu'>('Mới nhận');
  const [modalSelectedTopics, setModalSelectedTopics] = useState<Record<string, number>>({});

  const isUserEducatorOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Giáo viên';

  // Persistence for user altered survey categories
  useEffect(() => {
    localStorage.setItem('thcs_survey_topics', JSON.stringify(availableTopics));
  }, [availableTopics]);

  // -- UNDO AND HISTORY RECORDERS --
  const saveTopicsStateForUndo = () => {
    setTopicsHistory(prev => [...prev, [...availableTopics]]);
  };

  const saveSurveysStateForUndo = () => {
    setSurveysHistory(prev => [...prev, [...surveys]]);
  };

  // Undo Available Topics state
  const handleUndoTopicAction = () => {
    if (topicsHistory.length === 0) return;
    const previous = topicsHistory[topicsHistory.length - 1];
    setAvailableTopics(previous);
    setTopicsHistory(prev => prev.slice(0, -1));
    showToast("Đã hoàn tác thay đổi danh sách chủ đề!", "success");
  };

  // Undo Submitted Feedback action
  const handleUndoSurveysAction = () => {
    if (surveysHistory.length === 0) return;
    const previous = surveysHistory[surveysHistory.length - 1];
    setSurveys(previous);
    setSurveysHistory(prev => prev.slice(0, -1));
    showToast("Đã hoàn tác thao tác trên dữ liệu phản hồi khảo sát!", "success");
  };

  // -- AVAILABLE TOPICS ADMIN ACTIONS --
  const handleAddTopic = () => {
    const formatted = newTopicInput.trim();
    if (!formatted) return;
    if (availableTopics.includes(formatted)) {
      showToast("Chủ đề khảo sát này đã tồn tại trong danh mục!", "error");
      return;
    }
    saveTopicsStateForUndo();
    setAvailableTopics(prev => [...prev, formatted]);
    setNewTopicInput('');
    showToast(`Đã thêm chủ đề: "${formatted}"`, "success");
  };

  const handleStartEditTopic = (index: number) => {
    setEditingTopicIndex(index);
    setEditingTopicValue(availableTopics[index]);
  };

  const handleSaveEditTopic = (index: number) => {
    const newVal = editingTopicValue.trim();
    if (!newVal) return;
    if (availableTopics.includes(newVal) && availableTopics[index] !== newVal) {
      showToast("Tên chủ đề này trùng lặp với chủ đề khác!", "error");
      return;
    }
    saveTopicsStateForUndo();
    setAvailableTopics(prev => prev.map((t, i) => i === index ? newVal : t));
    setEditingTopicIndex(null);
    showToast("Cập nhật tiêu đề chủ đề thành công!", "success");
  };

  const handleDeleteTopic = (index: number) => {
    saveTopicsStateForUndo();
    const removed = availableTopics[index];
    setAvailableTopics(prev => prev.filter((_, i) => i !== index));
    // Remove from active selections if matched
    setSelectedTopics(prev => {
      const copy = { ...prev };
      delete copy[removed];
      return copy;
    });
    showToast(`Đã gỡ chủ đề: "${removed}"`, "success");
  };

  // -- ONLINE SELECTION MULTI-TOPIC HANDLERS --
  const handleToggleTopicSelection = (topicName: string) => {
    setSelectedTopics(prev => {
      const copy = { ...prev };
      if (topicName in copy) {
        delete copy[topicName];
      } else {
        copy[topicName] = 5; // Default 5 Stars when checked
      }
      return copy;
    });
  };

  const handleRateSelectedTopic = (topicName: string, rating: number) => {
    setSelectedTopics(prev => {
      if (!(topicName in prev)) return prev;
      return {
        ...prev,
        [topicName]: rating
      };
    });
  };

  // Gửi đóng góp ý kiến từ Phụ huynh trực tuyến
  const handleOnlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !studentName.trim() || !content.trim()) {
      showToast("Quý phụ huynh vui lòng điền đầy đủ thông tin để gửi ý kiến!", "info");
      return;
    }

    const selectedEntries = Object.entries(selectedTopics);
    if (selectedEntries.length === 0) {
      showToast("Vui lòng tích chọn và đánh giá ý kiến ít nhất 1 chủ đề!", "error");
      return;
    }

    // Combine multiple selections and ratings: "Theme A (5★) + Theme B (4★)"
    const topicFormattedString = selectedEntries
      .map(([name, rating]) => `${name} (${rating}★)`)
      .join(" + ");

    // Compute the mathematical average rating for overall representation
    const overallRating = Math.round(
      selectedEntries.reduce((sum, [_, r]) => sum + (r as number), 0) / selectedEntries.length
    );

    saveSurveysStateForUndo();

    const newSurvey: Survey = {
      id: Date.now(),
      parentName: parentName.trim(),
      studentName: studentName.trim(),
      classInfo,
      topic: topicFormattedString,
      rating: overallRating,
      content: content.trim(),
      file: null,
      status: 'Mới nhận',
      date: new Date().toLocaleDateString('vi-VN'),
    };

    setSurveys(prev => [newSurvey, ...prev]);
    setParentName('');
    setStudentName('');
    setContent('');
    // Reset selections to default
    if (availableTopics.length > 0) {
      setSelectedTopics({ [availableTopics[0]]: 5 });
    } else {
      setSelectedTopics({});
    }
    setActiveTab('list');
    showToast("Đã gửi trực tuyến ý kiến đóng góp của phụ huynh thành công!", "success");
  };

  // Upload tệp phiếu khảo sát
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
      showToast(`Đã nhận biểu mẫu: ${file.name}`, "success");
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadParent.trim() || !uploadStudent.trim() || !uploadedFile) {
      showToast("Vui lòng điền đủ thông tin đối chiếu và tải tệp tin trước!", "info");
      return;
    }

    saveSurveysStateForUndo();

    const newSurvey: Survey = {
      id: Date.now(),
      parentName: uploadParent.trim(),
      studentName: uploadStudent.trim(),
      classInfo: '6A', 
      topic: "Khảo sát ý kiến (Phiếu bản cứng nộp tệp chụp)",
      rating: 5,
      content: "Gia đình đã gửi bản nộp cứng phiếu khảo sát ý kiến đóng góp thông qua hệ thống tệp lưu trữ số hóa THCS Hòa Phú.",
      file: uploadedFile,
      status: 'Mới nhận',
      date: new Date().toLocaleDateString('vi-VN'),
    };

    setSurveys(prev => [newSurvey, ...prev]);
    setUploadParent('');
    setUploadStudent('');
    setUploadedFile(null);
    setActiveTab('list');
    showToast("Đã nộp tệp khảo sát ý kiến thành công!", "success");
  };

  const updateSurveyStatus = (id: number, status: 'Đã tiếp thu' | 'Đang xử lý') => {
    saveSurveysStateForUndo();
    setSurveys(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    showToast("Đã cập nhật trạng thái xử lý thành công!", "success");
  };

  // -- CRUDS MODAL FOR SUBMITTED SURVEYS (ADD & EDIT) --
  const handleOpenAddSurveyModal = () => {
    setEditingSurvey(null);
    setModalParentName('');
    setModalStudentName('');
    setModalClassInfo('6A');
    setModalContent('');
    setModalStatus('Mới nhận');
    // Pre-select first category if any
    const defaultSelection: Record<string, number> = {};
    if (availableTopics.length > 0) {
      defaultSelection[availableTopics[0]] = 5;
    }
    setModalSelectedTopics(defaultSelection);
    setIsSurveyModalOpen(true);
  };

  const handleOpenEditSurveyModal = (s: Survey) => {
    setEditingSurvey(s);
    setModalParentName(s.parentName);
    setModalStudentName(s.studentName);
    setModalClassInfo(s.classInfo);
    setModalContent(s.content);
    setModalStatus(s.status as any);

    // Reconstruct checked topics and star scores
    const selectionMap: Record<string, number> = {};
    const parts = s.topic.split(' + ');
    parts.forEach(part => {
      const match = part.match(/(.+)\s+\((\d)★\)/);
      if (match) {
        selectionMap[match[1].trim()] = parseInt(match[2]);
      } else {
        selectionMap[part.trim()] = s.rating || 5;
      }
    });
    setModalSelectedTopics(selectionMap);
    setIsSurveyModalOpen(true);
  };

  const handleSaveModalSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalParentName.trim() || !modalStudentName.trim() || !modalContent.trim()) {
      showToast("Vui lòng nhập đầy đủ các thông tin bắt buộc!", "error");
      return;
    }

    const activeEntries = Object.entries(modalSelectedTopics);
    if (activeEntries.length === 0) {
      showToast("Vui lòng tích chọn ít nhất 1 chủ đề đánh giá!", "error");
      return;
    }

    const topicString = activeEntries
      .map(([name, rating]) => `${name} (${rating}★)`)
      .join(" + ");

    const avgRating = Math.round(
      activeEntries.reduce((sum, [_, r]) => sum + (r as number), 0) / activeEntries.length
    );

    saveSurveysStateForUndo();

    if (editingSurvey) {
      // Edit survey
      setSurveys(prev => prev.map(item => {
        if (item.id === editingSurvey.id) {
          return {
            ...item,
            parentName: modalParentName.trim(),
            studentName: modalStudentName.trim(),
            classInfo: modalClassInfo,
            topic: topicString,
            rating: avgRating,
            content: modalContent.trim(),
            status: modalStatus
          };
        }
        return item;
      }));
      showToast("Đã cập nhật biên tập góp ý khảo sát thành công!", "success");
    } else {
      // Add manual survey
      const newS: Survey = {
        id: Date.now(),
        parentName: modalParentName.trim(),
        studentName: modalStudentName.trim(),
        classInfo: modalClassInfo,
        topic: topicString,
        rating: avgRating,
        content: modalContent.trim(),
        file: null,
        status: modalStatus,
        date: new Date().toLocaleDateString('vi-VN'),
      };
      setSurveys(prev => [newS, ...prev]);
      showToast("Đã bổ sung phản hồi khảo sát học vụ thành công!", "success");
    }

    setIsSurveyModalOpen(false);
  };

  const handleDeleteSurvey = (id: number) => {
    saveSurveysStateForUndo();
    setSurveys(prev => prev.filter(s => s.id !== id));
    showToast("Đã gỡ phản hồi khảo sát thành công!", "success");
  };

  // -- EXPORT DOCUMENT UTILITIES --
  const downloadBlankTemplate = (type: 'word' | 'print') => {
    const listItemsHtml = availableTopics.map(t => `<li>[ ] <b>${t}</b>: &nbsp;&nbsp;&nbsp;&nbsp; [ ] Rất tốt &nbsp;&nbsp; [ ] Tốt &nbsp;&nbsp; [ ] Bình thường &nbsp;&nbsp; [ ] Chưa đạt</li>`).join('');

    const bodyHtml = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 45%;">
          SỞ GD&ĐT THÀNH PHỐ HÀ NỘI<br>
          TRƯỜNG THCS HÒA PHÚ<br>
          -------
        </div>
        <div style="text-align: center; font-weight: bold; font-size: 13px; width: 50%;">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          Độc lập - Tự do - Hạnh phúc<br>
          <span style="text-decoration: underline;">------------------------</span>
        </div>
      </div>
      <h2 style="text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase;">PHIẾU KHẢO SÁT Ý KIẾN PHỤ HUYNH HỌC SINH TỔNG HỢP</h2>
      <p style="text-align: center; font-style: italic; font-size: 11px;">(Áp dụng chuẩn hóa chỉ số hài lòng các chuyên mục học đường)</p>
      
      <p style="margin-top: 25px;"><b>Họ và tên Phụ huynh đóng góp:</b> ...........................................................................................................................................</p>
      <p><b>Phụ huynh em học sinh:</b> .............................................................................................. Lớp học: .......................................</p>
      <p><b>Số điện thoại gia đình:</b> ..............................................................................................................................................................</p>
      
      <p style="margin-top: 20px;"><b>I. ĐÁNH GIÁ CHỈ SỐ HÀI LÒNG CHO CÁC CHỦ ĐỀ KHẢO SÁT CHỌN LỌC (Tích đánh giá nhiều chủ đề):</b></p>
      <ul style="line-height: 2; font-size: 12px; list-style-type: none; padding-left: 10px;">
        ${listItemsHtml}
      </ul>
      
      <p style="margin-top: 20px;"><b>II. Ý KIẾN ĐÓNG GÓP XÂY DỰNG, HIẾN KẾ CHI TIẾT GỬI NHÀ TRƯỜNG:</b></p>
      <div style="border: 1px dashed #475569; padding: 25px; min-height: 120px; font-size: 11px; color: #94a3b8; font-style: italic; border-radius: 6px; margin: 15px 0;">
        Kính mong Quý phụ huynh chia sẻ thẳng thắn, góp ý khách quan để nhà trường cải tổ hiệu năng học vụ, an toàn thực phẩm bán trú và các hoạt động trải nghiệm văn thể mỹ bám sát cơ chế học vụ số.
      </div>
      
      <table style="width: 100%; border: none; margin-top: 40px; font-size: 13px;">
        <tr>
          <td style="width: 50%; border: none; text-align: center;">
            <b>TM. BAN GIÁM HIỆU NHÀ TRƯỜNG</b><br>
            <i>(Trích duyệt số hóa điện tử)</i><br><br><br>
            <b>Thầy Hiệu trưởng Trần Hữu Phúc</b>
          </td>
          <td style="width: 50%; border: none; text-align: center;">
            <i>Hòa Xá, ngày ..... tháng ..... năm 2026</i><br>
            <b>CHỮ KÝ CỦA PHỤ HUYNH KHẢO SÁT</b><br>
            <i>(Ký và ghi rõ họ tên đóng góp)</i>
          </td>
        </tr>
      </table>
    `;

    if (type === 'word') {
      exportToWord('Bieu_Mau_Khao_Sat_Tong_Hop.doc', 'Biểu Mẫu Khảo Sát Tổng Hợp', bodyHtml);
    } else {
      triggerPrintWindow('In Biểu Mẫu Khảo Sát Nhiều Chủ Đề', bodyHtml);
    }
  };

  const downloadSingleForm = (s: Survey) => {
    // Parse categories from compound string
    const parts = s.topic.split(' + ');
    const listItemsHtml = parts.map(part => {
      const match = part.match(/(.+)\s+\((\d)★\)/);
      if (match) {
        return `<li>- ${match[1]}: <b>${match[2]} / 5 Sao 🌟</b></li>`;
      }
      return `<li>- ${part}: <b>${s.rating} / 5 Sao 🌟</b></li>`;
    }).join('');

    const singleHtml = `
      <div style="display: flex; justify-content: space-between; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; margin-bottom: 25px;">
        <div>
          <h2 style="margin: 0; color: #1e3a8a; font-size: 15px; font-weight: bold;">TRƯỜNG THCS HÒA PHÚ</h2>
          <h3 style="margin: 3px 0 0 0; color: #334155; font-size: 12px; font-weight: bold;">PHÂN HỆ HỌC VỤ & KHẢO SÁT CHẤT LƯỢNG</h3>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 11px; font-weight: bold; color: #ea580c;">XÁC THỰC SỐ: RECS-${s.id}</p>
          <p style="margin: 3px 0 0 0; font-size: 9px; color: #64748b;">Hòa Xá, Hà Nội</p>
        </div>
      </div>
      
      <h2 style="text-align: center; color: #1e3a8a; font-size: 16px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase;">PHIẾU TIẾP NHẬN Ý KIẾN PHỤ HUYNH (ĐA CHỦ ĐỀ)</h2>
      
      <p>Cổng thông tin điện trạng học bạ trường THCS Hòa Phú kính xác nhận ý kiến khảo sát đầy tâm huyết từ gia đình:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="width: 35%; font-weight: bold; padding: 10px;">Họ tên phụ huynh đóng góp</td>
          <td style="padding: 10px;">${s.parentName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="font-weight: bold; padding: 10px;">Họ tên học sinh liên đới</td>
          <td style="padding: 10px;">${s.studentName} (Lớp ${s.classInfo})</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="font-weight: bold; padding: 10px; vertical-align: top;">Danh sách các chủ đề đã chấm sao</td>
          <td style="padding: 10px; color: #1e3a8a;">
            <ul style="margin: 0; padding-left: 15px; line-height: 1.6;">
              ${listItemsHtml}
            </ul>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="font-weight: bold; padding: 10px;">Thang điểm trung bình chung</td>
          <td style="padding: 10px; font-weight: bold; color: #ea580c;">${s.rating} / 5 điểm hài lòng</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="font-weight: bold; padding: 10px;">Nội dung phản ánh chi tiết</td>
          <td style="padding: 10px; font-style: italic;">"${s.content}"</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="font-weight: bold; padding: 10px;">Ngày truyền tệp điện tử</td>
          <td style="padding: 10px; font-mono">${s.date}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 10px;">Trạng thái số hóa hiện hành</td>
          <td style="padding: 10px; font-weight: bold; color: #059669;">${s.status}</td>
        </tr>
      </table>
      
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
          <b>TM. BAN SƯ PHẠM NHÀ TRƯỜNG</b><br>
          <i>(Ký duyệt dấu số đóng sổ học vụ)</i><br><br><br>
          <b>Thầy hiệu trưởng Trần Hữu Phúc</b>
        </div>
        <div style="text-align: center; width: 45%;">
          <i>Hòa Xá, ngày ${s.date}</i><br>
          <b>XÁC NHẬN CỦA GIA ĐÌNH</b><br>
          <i>(Ký tay định danh học bạ)</i>
        </div>
      </div>
    `;

    exportToWord(`Phieu_GopY_DaChuDe_${s.parentName.replace(/\s+/g, '_')}.doc`, `Ý kiến góp ý đa chủ đề`, singleHtml);
    showToast(`Đã xuất phiếu đa chủ đề cho phụ huynh ${s.parentName}!`, "success");
  };

  const exportAggregateSurveyResultsFromState = (type: 'word' | 'print') => {
    let tableRows = '';
    let stt = 1;

    // Analyze counts based on customizable available topics
    const analysis: Record<string, { total: number; sumStars: number; avg: number }> = {};
    availableTopics.forEach(t => {
      analysis[t] = { total: 0, sumStars: 0, avg: 0 };
    });

    surveys.forEach(s => {
      const parts = s.topic.split(' + ');
      parts.forEach(part => {
        const match = part.match(/(.+)\s+\((\d)★\)/);
        if (match) {
          const tName = match[1].trim();
          const starVal = parseInt(match[2]);
          // Find standard match or fallback
          const standardTopic = availableTopics.find(at => at.toLowerCase() === tName.toLowerCase()) || availableTopics[availableTopics.length - 1] || "Ý kiến đóng góp xây dựng khác";
          if (analysis[standardTopic]) {
            analysis[standardTopic].total++;
            analysis[standardTopic].sumStars += starVal;
          }
        }
      });
    });

    for (const [topicName, data] of Object.entries(analysis)) {
      const averageVal = data.total > 0 ? (data.sumStars / data.total).toFixed(1) : 'Chưa có';
      tableRows += `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1;">${stt++}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1;"><b>${topicName}</b></td>
          <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">${data.total} lượt đánh giá</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #ea580c;">${averageVal} 🌟</td>
        </tr>
      `;
    }

    const htmlBody = `
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 25px;">
        <div style="text-align: center; font-weight: bold; font-size: 12px; width: 45%;">
          SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI<br>
          <b>TRƯỜNG THCS HÒA PHÚ</b>
        </div>
        <div style="text-align: center; font-weight: bold; font-size: 12px; width: 50%;">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <b>Độc lập - Tự do - Hạnh phúc</b>
        </div>
      </div>
      
      <h2 style="text-align: center; color: #1e3a8a; font-size: 16px; font-weight: bold; text-transform: uppercase;">BÁO CÁO PHÂN TÍCH CHỈ SỐ HÀI LÒNG ĐA CHỦ ĐỀ TOÀN TRƯỜNG</h2>
      <p style="text-align: center; font-style: italic; font-size: 11px;">(Trích xuất thời gian thực các chỉ tiêu chất lượng thiết lập qua Cổng thông tin & Học vụ số)</p>
      <p style="text-align: right; font-style: italic; font-size: 11px; margin-top: 15px;">Hòa Xá, ngày ${new Date().toLocaleDateString('vi-VN')}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #cbd5e1; padding: 10px; width: 10%;">STT</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Chủ đề đánh giá chất lượng học đường và dịch vụ</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; width: 25%;">Tổng lượng ý kiến tích chọn</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px; width: 25%;">Chỉ số Hài lòng trung bình tinh giản</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
          <b>Người trích lục báo cáo</b><br>
          <i>(Ký tên điểm chỉ danh bạ số)</i><br><br><br>
          Bộ phận Thống kê Học đường
        </div>
        <div style="text-align: center; width: 45%;">
          <b>Hiệu trưởng TRƯỜNG THCS HÒA PHÚ</b><br>
          <i>(Áp chữ ký số điện tử của trường)</i><br><br>
          <b>Thầy Trần Hữu Phúc</b>
        </div>
      </div>
    `;

    if (type === 'word') {
      exportToWord("Bao_Cao_Tong_Hop_Khao_Sat_Hài_Lòng.doc", "Báo cáo khảo sát hài lòng đa chủ đề", htmlBody);
    } else {
      triggerPrintWindow("Báo cáo phân tích ý kiến khảo sát phụ huynh THCS Hòa Phú", htmlBody);
    }
  };

  return (
    <div className="bg-white border-2 border-brand-orange/85 rounded-2xl p-4 shadow-md transition-all duration-300">
      
      {/* 1. SECTION BAR HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-3 mb-4 gap-2 text-left">
        <div>
          <span className="bg-brand-orange text-white px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest uppercase">
            Học Vụ Số Hóa & Khảo Sát
          </span>
          <h3 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5 uppercase mt-1">
            <Star className="w-4 h-4 text-brand-orange animate-pulse" />
            Vạn ý góp ý kiến - Triệu đóng góp của cha mẹ học sinh
          </h3>
        </div>
        
        <div className="flex gap-1 bg-slate-150 p-0.5 rounded-xl text-[10.5px] font-extrabold" id="survey-tabs">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
              activeTab === 'online' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-650 hover:bg-white/50'
            }`}
          >
            Ý kiến trực tuyến
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold ${
              activeTab === 'upload' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-650 hover:bg-white/50'
            }`}
          >
            Biểu mẫu bản in
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1 ${
              activeTab === 'list' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-650 hover:bg-white/50'
            }`}
          >
            Danh dách phản hồi ({surveys.length})
          </button>
        </div>
      </div>

      {/* 2. PERSISTENT UNDO CONTROLS BANNER FOR DELETED FEEDBACK */}
      {surveysHistory.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-brand-orange/40 rounded-xl p-3 flex justify-between items-center text-xs text-slate-800 animate-fade-in shadow-sm">
          <span className="font-bold flex items-center gap-1.5 text-slate-700">
            <RotateCcw className="w-4 h-4 text-brand-orange animate-spin" />
            Hệ thống ghi nhận sự thay đổi bản nộp/phản hồi khảo sát. Bạn có muốn hoàn tác không?
          </span>
          <button
            onClick={handleUndoSurveysAction}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-[10.5px] shadow transition-transform hover:scale-105 cursor-pointer"
          >
            Hoàn tác hành động ({surveysHistory.length})
          </button>
        </div>
      )}

      {/* 4. ONLINE SURVEY FORM TAB */}
      {activeTab === 'online' && (
        <form onSubmit={handleOnlineSubmit} className="space-y-4 text-left animate-fade-in pb-10">
          
          {/* Identity info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Họ tên phụ huynh</label>
              <input
                type="text"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                placeholder="Nguyễn Văn Định"
                className="w-full text-xs p-2.5 border rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange bg-slate-50"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Họ tên con học sinh</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Nguyễn Minh Thư"
                className="w-full text-xs p-2.5 border rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange bg-slate-50"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Lớp học trực thuộc</label>
              <select
                value={classInfo}
                onChange={e => setClassInfo(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
              >
                {['6A', '6B', '6C', '7A', '7B', '8A', '8B', '9A', '9B'].map(lop => (
                  <option key={lop} value={lop}>Lớp {lop}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CHECKBOX FEATURES & MULTI_RATING TOPICS */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-brand-orange" />
                <label className="block text-xs font-extrabold text-indigo-950 uppercase">
                  Tích chọn và đánh giá các chủ đề chất lượng (Đồng thời nhiều chủ đề) *
                </label>
              </div>
              
              {/* Inline Undo Button for Available Topics */}
              {isUserEducatorOrAdmin && topicsHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoTopicAction}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold border border-indigo-200 px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition flex items-center gap-1 cursor-pointer animate-fade-in"
                  title="Hoàn tác thay đổi danh sách chủ đề"
                >
                  <RotateCcw className="w-3 h-3 text-indigo-600 animate-spin-reverse-once" />
                  Hoàn tác chủ đề ({topicsHistory.length})
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Quý phụ huynh vui lòng tích chọn vào ô vuông trước mỗi chủ đề và click số sao tương ứng (1-5★) để đánh giá đồng bộ cùng lúc nhiều chỉ tiêu học vụ của trường.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {availableTopics.map((topicItem, index) => {
                const isSelected = topicItem in selectedTopics;
                const starRating = selectedTopics[topicItem] || 0;
                
                if (editingTopicIndex === index) {
                  return (
                    <div 
                      key={index} 
                      className="p-3.5 rounded-xl border border-indigo-400 bg-white shadow-sm flex flex-col justify-between gap-3 text-left animate-fade-in min-h-[110px]"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-800 uppercase block tracking-wider">Chỉnh sửa chủ đề {index + 1}</span>
                        <input
                          type="text"
                          value={editingTopicValue}
                          onChange={e => setEditingTopicValue(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 focus:outline-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleSaveEditTopic(index)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTopicIndex(null)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Hủy
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-2 text-left bg-white relative group ${
                      isSelected 
                        ? 'border-brand-orange ring-1 ring-brand-orange/20 shadow-sm' 
                        : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          id={`online-topic-${index}`}
                          checked={isSelected}
                          onChange={() => handleToggleTopicSelection(topicItem)}
                          className="mt-0.5 rounded text-brand-orange focus:ring-brand-orange cursor-pointer h-4 w-4 shrink-0"
                        />
                        <label 
                          htmlFor={`online-topic-${index}`}
                          className="text-xs font-bold text-slate-700 leading-tight cursor-pointer select-none"
                        >
                          {topicItem}
                        </label>
                      </div>

                      {/* Admin/Teacher quick edit actions directly on the card */}
                      {isUserEducatorOrAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditTopic(index);
                            }}
                            className="p-1 bg-indigo-50 text-indigo-650 hover:bg-indigo-100 rounded cursor-pointer"
                            title="Chỉnh sửa tên chủ đề"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Bạn có chắc chắn muốn xóa chủ đề này: "${topicItem}"?`)) {
                                handleDeleteTopic(index);
                              }
                            }}
                            className="p-1 bg-rose-50 text-rose-650 hover:bg-rose-100 rounded cursor-pointer"
                            title="Xóa chủ đề này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Star evaluation control block */}
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold">Chỉ số hài lòng:</span>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(starNum => {
                            const isStarred = isSelected && starNum <= starRating;
                            return (
                              <button
                                key={starNum}
                                type="button"
                                disabled={!isSelected}
                                onClick={() => handleRateSelectedTopic(topicItem, starNum)}
                                className={`p-0.5 transition hover:scale-120 ${
                                  isSelected ? 'cursor-pointer text-amber-400' : 'cursor-not-allowed text-slate-200'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                              </button>
                            );
                          })}
                        </div>
                        {isSelected ? (
                          <span className="text-[11px] font-black font-mono text-amber-600 shrink-0">
                            {starRating}/5★
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-350 italic font-mono shrink-0">Chưa chọn</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Inline creator card for Admin/Teacher */}
              {isUserEducatorOrAdmin && (
                <div className="p-3.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/20 hover:bg-indigo-50/45 flex flex-col justify-between gap-3 text-left transition duration-250 min-h-[110px] animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-900 block uppercase tracking-wider">Thêm chủ đề mới</span>
                    <input
                      type="text"
                      placeholder="e.g. Vấn đề vệ sinh học đường..."
                      value={newTopicInput}
                      onChange={e => setNewTopicInput(e.target.value)}
                      className="w-full text-xs bg-white border border-indigo-150 rounded-lg p-2 font-medium text-slate-800 focus:outline-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm vào danh mục
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback description text */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Nội dung ý kiến đóng góp / Hiến kế xây dựng</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              placeholder="Nhập những đề xuất, đóng góp tâm huyết của phụ huynh gửi tới nhà trường..."
              className="w-full text-xs p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange bg-slate-50 font-medium"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="bg-brand-orange hover:bg-brand-orange-dark text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl shadow-md transition-all duration-350 flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Send className="w-3.5 h-3.5" /> Gửi ý kiến khảo sát trực tuyến ý
            </button>
          </div>
        </form>
      )}

      {/* 5. UPLOAD SCAN PAPER TAB */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="space-y-4 animate-fade-in pb-10">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex-1">
              <h4 className="font-extrabold text-blue-800 text-xs mb-0.5">
                Bước 1: Tải về hoặc In Biểu mẫu trắng nhiều chuyên mục
              </h4>
              <p className="text-[10px] text-blue-600 leading-relaxed">
                Biểu mẫu của trường giúp rà soát chuẩn hóa ý kiến bằng bản cứng hoặc ký tươi tiện lợi, bám sát các chủ đề khảo sát mới vừa cập nhật trên hệ thống.
              </p>
            </div>
            
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => downloadBlankTemplate('word')}
                className="bg-blue-650 hover:bg-blue-700 text-white font-black text-[10px] px-3.5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Bản Word (.doc)
              </button>
              <button
                type="button"
                onClick={() => downloadBlankTemplate('print')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] px-3.5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3 h-3" /> In Trực Tiếp
              </button>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="font-extrabold text-slate-800 text-xs text-left">
              Bước 2: Điền thông tin đối chiếu và Tải bản chụp lên hệ thống
            </h4>
            
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-5 text-center relative hover:bg-slate-100 hover:border-brand-orange transition duration-200">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf, .doc, .docx, image/*"
              />
              <Paperclip className="w-8 h-8 text-brand-orange mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700" id="survey-upload-label">
                {uploadedFile ? (
                  <span className="text-emerald-600 block">
                    <UserCheck className="w-4 h-4 inline mr-1" /> Đã nhận tệp: <u>{uploadedFile.name}</u> ({uploadedFile.size})
                  </span>
                ) : (
                  <span>Kéo thả hình ảnh hoặc tệp quét của phiếu khảo sát đã điền vào đây</span>
                )}
              </p>
            </div>

            {uploadedFile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-200 text-xs animate-fade-in">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Tên phụ huynh ký phiếu</label>
                  <input
                    type="text"
                    value={uploadParent}
                    onChange={e => setUploadParent(e.target.value)}
                    placeholder="Nguyễn Văn Đại"
                    className="w-full text-xs p-2 border rounded-lg mt-1 font-bold bg-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Tên con học sinh & Lớp (Ví dụ: Nguyễn Minh A - 9A)</label>
                  <input
                    type="text"
                    value={uploadStudent}
                    onChange={e => setUploadStudent(e.target.value)}
                    placeholder="Nguyễn Minh Thư - Lớp 9A"
                    className="w-full text-xs p-2 border rounded-lg mt-1 font-bold bg-white"
                    required
                  />
                </div>
                
                <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-[10px] px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Hoàn thành gửi tập tin
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* 6. SURVEYS LIST TAB */}
      {activeTab === 'list' && (
        <div className="space-y-3 animate-fade-in text-left">
          
          {/* List Toolbar showing manual Add feedback button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-3 border rounded-xl gap-2.5">
            <div>
              <span className="font-extrabold text-xs text-slate-800 block">Sổ tiếp dẫn Phản hồi Góp ý</span>
              <span className="text-[10.5px] text-slate-500">Giáo vụ rà soát ý kiến đa chủ đề của cha mẹ và ban bố trạng thái tiếp thu điện tử.</span>
            </div>

            {isUserEducatorOrAdmin && (
              <button
                type="button"
                onClick={handleOpenAddSurveyModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-2 rounded-lg text-[10.5px] transition flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Bổ sung ý kiến ngoài (Thủ công)
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[420px] custom-scrollbar rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100 text-[10px] tracking-wide">
                  <th className="p-3 w-[180px]">Phụ huynh / Con</th>
                  <th className="p-3">Danh sách Chỉ số Hài lòng Đa chủ đề</th>
                  <th className="p-3">Nội dung đóng góp chi tiết</th>
                  <th className="p-3 text-center w-[90px]">Tổng điểm</th>
                  <th className="p-3 text-center">Bản quét file</th>
                  <th className="p-3 text-center w-[95px]">Gửi ngày</th>
                  <th className="p-4 text-right w-[170px]">Thao tác hệ thống</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {surveys.length ? (
                  surveys.map(s => {
                    // Parse multiple categories and their stars from topic string representation
                    const subTopics = s.topic.split(' + ');
                    
                    return (
                      <tr key={s.id} className="border-b hover:bg-slate-50/50 transition">
                        {/* Parent and child name card */}
                        <td className="p-3">
                          <span className="font-extrabold text-slate-850 block">{s.parentName}</span>
                          <span className="text-[10px] text-slate-500 font-bold block">Con: {s.studentName}</span>
                          <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-black inline-block mt-0.5">
                            Lớp {s.classInfo}
                          </span>
                        </td>

                        {/* Beautiful list of multi-topics evaluated with their own badge stars */}
                        <td className="p-3 min-w-[200px] max-w-[320px]">
                          <div className="flex flex-wrap gap-1.5">
                            {subTopics.map((part, pIdx) => {
                              const match = part.match(/(.+)\s+\((\d)★\)/);
                              const tName = match ? match[1].trim() : part.trim();
                              const starredNum = match ? parseInt(match[2]) : s.rating || 5;

                              return (
                                <div 
                                  key={pIdx} 
                                  className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg text-[10px] text-indigo-900 font-semibold space-y-0.5"
                                >
                                  <div className="truncate max-w-[150px]" title={tName}>{tName}</div>
                                  <div className="flex items-center text-amber-500 text-[8.5px]">
                                    {Array.from({ length: starredNum }).map((_, stIdx) => (
                                      <span key={stIdx}>★</span>
                                    ))}
                                    <span className="text-slate-400 text-[9px] font-bold font-mono ml-0.5">({starredNum})</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Content text */}
                        <td className="p-3 max-w-[240px] whitespace-normal">
                          <p className="text-slate-600 italic text-[11px] leading-relaxed break-words line-clamp-3" title={s.content}>
                            "{s.content}"
                          </p>
                        </td>

                        {/* Average math rating */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-black font-mono">{s.rating} / 5</span>
                            <div className="flex items-center text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < (s.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Scanned attached files */}
                        <td className="p-3 text-center">
                          {s.file ? (
                            <div className="inline-block max-w-[110px] truncate text-brand-orange text-[10px] font-bold bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5">
                              <Paperclip className="w-3 h-3 inline mr-0.5" />
                              {s.file.name}
                            </div>
                          ) : (
                            <span className="text-slate-350 italic text-[10px]">Trực tuyến</span>
                          )}
                        </td>

                        {/* Submitted Date */}
                        <td className="p-3 text-center text-slate-450 font-mono text-[10px] font-bold">{s.date}</td>

                        {/* Action buttons (Duyệt, Bản In, Sửa, Xóa) */}
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {/* Duyệt tiếp thu */}
                              {isUserEducatorOrAdmin && s.status !== 'Đã tiếp thu' && (
                                <button
                                  onClick={() => updateSurveyStatus(s.id, 'Đã tiếp thu')}
                                  className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white font-extrabold text-[9.5px] px-2 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  Duyệt Tiếp Thu
                                </button>
                              )}
                              
                              {/* Sắp xếp trạng thái tiếp quản */}
                              {isUserEducatorOrAdmin && s.status === 'Mới nhận' && (
                                <button
                                  onClick={() => updateSurveyStatus(s.id, 'Đang xử lý')}
                                  className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-extrabold text-[9.5px] px-2 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  Đang xử lý
                                </button>
                              )}

                              {/* Print word report */}
                              <button
                                onClick={() => downloadSingleForm(s)}
                                className="bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white font-bold p-1.5 rounded-lg transition cursor-pointer"
                                title="Xuất biểu mẫu ký nhận"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Individual Edit survey */}
                              {isUserEducatorOrAdmin && (
                                <button
                                  onClick={() => handleOpenEditSurveyModal(s)}
                                  className="bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-white font-bold p-1.5 rounded-lg transition cursor-pointer"
                                  title="Biên tập phản hồi"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Individual Delete survey */}
                              {isUserEducatorOrAdmin && (
                                <button
                                  onClick={() => handleDeleteSurvey(s.id)}
                                  className="bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white font-bold p-1.5 rounded-lg transition cursor-pointer"
                                  title="Xóa ý kiến này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-wider uppercase border ${
                              s.status === 'Đã tiếp thu' ? 'bg-emerald-100 text-emerald-800 border-emerald-250' : 
                              s.status === 'Đang xử lý' ? 'bg-indigo-100 text-indigo-800 border-indigo-250' : 
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-bold italic">
                      Chưa ghi nhận phản ánh khảo sát nào từ phụ huynh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <button
              onClick={() => exportAggregateSurveyResultsFromState('word')}
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-[10.5px] px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Xuất Thống Kê Tổng Hợp đa chủ đề (Word)
            </button>
            <button
              onClick={() => exportAggregateSurveyResultsFromState('print')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> In Thống Kê Chỉ Số Hài Lòng Toàn Trường (PDF)
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          7. ADD & EDIT DIALOG MODAL FOR SUBMITTED SURVEY RESPONSES 
         ======================================================= */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up text-left">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-brand-orange to-amber-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="w-5.5 h-5.5 text-white animate-spin" />
                <h3 className="font-extrabold text-white text-base">
                  {editingSurvey ? 'Biên Tập Phiếu Đóng Góp Học Vụ' : 'Nhập Phiếu Khảo Sát Phụ Huynh Thủ Công'}
                </h3>
              </div>
              <button
                onClick={() => setIsSurveyModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModalSurvey} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Parent, student and class info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-650 uppercase">Tên Phụ Huynh *</label>
                  <input
                    type="text"
                    required
                    value={modalParentName}
                    onChange={e => setModalParentName(e.target.value)}
                    placeholder="Nguyễn Văn Đại"
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-650 uppercase">Tên Học Sinh *</label>
                  <input
                    type="text"
                    required
                    value={modalStudentName}
                    onChange={e => setModalStudentName(e.target.value)}
                    placeholder="Nguyễn Minh Huy"
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-650 uppercase">Lớp trực thuộc *</label>
                  <select
                    value={modalClassInfo}
                    onChange={e => setModalClassInfo(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold text-slate-800"
                  >
                    {['6A', '6B', '6C', '7A', '7B', '8A', '8B', '9A', '9B'].map(lop => (
                      <option key={lop} value={lop}>Lớp {lop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and categorization */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-650 uppercase">Trạng thái tiếp nhận *</label>
                <select
                  value={modalStatus}
                  onChange={e => setModalStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg font-bold text-slate-800"
                >
                  <option value="Mới nhận">Mới nhận (Yêu cầu rà soát)</option>
                  <option value="Đang xử lý">Đang xử lý (Chuyển tiếp bộ phận liên đới)</option>
                  <option value="Đã tiếp thu">Đã tiếp thu (Duyệt khóa điện tử)</option>
                </select>
              </div>

              {/* Checklist & evaluation categories */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <span className="block text-[10px] font-bold text-slate-800 uppercase">
                  Danh mục tích chọn và chấm điểm Hài lòng (Đánh giá đa chủ đề) *
                </span>
                
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableTopics.map((topicItem, index) => {
                    const isChecked = topicItem in modalSelectedTopics;
                    const ratingScore = modalSelectedTopics[topicItem] || 5;

                    return (
                      <div key={index} className="flex items-center justify-between p-1.5 bg-white border rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setModalSelectedTopics(prev => {
                                const copy = { ...prev };
                                if (topicItem in copy) {
                                  delete copy[topicItem];
                                } else {
                                  copy[topicItem] = 5;
                                }
                                return copy;
                              });
                            }}
                            className="rounded text-brand-orange focus:ring-brand-orange h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[280px]">
                            {topicItem}
                          </span>
                        </div>

                        {isChecked && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(starNum => (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => {
                                  setModalSelectedTopics(prev => ({
                                    ...prev,
                                    [topicItem]: starNum
                                  }));
                                }}
                                className="text-amber-400 p-0.5 hover:scale-125 transition"
                              >
                                <Star className={`w-3.5 h-3.5 ${starNum <= ratingScore ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                              </button>
                            ))}
                            <span className="text-[10px] font-black text-amber-600 font-mono ml-1">{ratingScore}★</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback detailed content text */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-650 uppercase">Nội dung ý kiến chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={modalContent}
                  onChange={e => setModalContent(e.target.value)}
                  placeholder="Gói gọn nội dung ý kiến đóng góp của phụ huynh tại đây..."
                  className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-medium text-slate-800"
                />
              </div>

              {/* Prompt actions */}
              <div className="pt-2 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSurveyModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Lưu phiếu khảo sát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
