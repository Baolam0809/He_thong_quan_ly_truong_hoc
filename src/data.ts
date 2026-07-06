import {
  Account,
  Class,
  Assignment,
  CourseRegistration,
  Survey,
  Exam,
  Homework,
  Submission,
  DocumentItem,
  NotificationItem,
  Activity,
  StudentDetail,
  ClassDetail
} from './types';

export const initialAccounts: Account[] = [
  { id: 1, name: 'Nghiêm Hồng Quân', username: 'admin', password: 'Bomyvn78@', role: 'Admin', extra: 'Quản trị viên', isFirstLogin: false, canPostNews: true },
  { id: 2, name: 'Nguyễn Kim Ngân', username: 'hs1', password: '123', role: 'Học sinh', extra: '9A', isFirstLogin: false, canPostNews: false },
  { id: 3, name: 'Lê Thúy Quỳnh', username: 'gv1', password: '123', role: 'Giáo viên', extra: 'Tổ Toán', isFirstLogin: false, canPostNews: true },
  { id: 4, name: 'Nguyễn Tiến Dũng', username: 'ph1', password: '123', role: 'Phụ huynh', extra: 'Phụ huynh em Nguyễn Kim Ngân', isFirstLogin: false, canPostNews: false },
  { id: 5, name: 'Trần Văn Cường', username: 'gv2', password: '123', role: 'Giáo viên', extra: 'Tổ Xã Hội', isFirstLogin: false, canPostNews: false },
  { id: 6, name: 'Phạm Thị Lan', username: 'gv3', password: '123', role: 'Giáo viên', extra: 'Tổ Ngoại Ngữ', isFirstLogin: false, canPostNews: true }
];

export const initialClasses: Class[] = [];
const blockKhoi = ['6', '7', '8', '9'];
const blockLop = ['A', 'B', 'C', 'D'];
let classIdCounter = 1;
blockKhoi.forEach(khoi => {
  blockLop.forEach(lop_char => {
    let gvcnName = 'Chưa phân công';
    if (lop_char === 'A') {
      gvcnName = 'Lê Thúy Quỳnh';
    } else if (lop_char === 'B') {
      gvcnName = 'Trần Văn Cường';
    } else if (lop_char === 'C') {
      gvcnName = 'Phạm Thị Lan';
    }
    initialClasses.push({
      id: `${khoi}${lop_char}`,
      khoi: `Khối ${khoi}`,
      lop: `${khoi}${lop_char}`,
      gvcn: gvcnName,
      total: 40
    });
  });
});

export const initialAssignments: Assignment[] = [
  { id: 101, teacherId: 3, teacherName: "Lê Thúy Quỳnh", subjects: ["Toán"], classes: ["6A", "6B", "9A"], subjectClassPairs: ["Toán 6A", "Toán 6B", "Toán 9A"] },
  { id: 102, teacherId: 5, teacherName: "Trần Văn Cường", subjects: ["Ngữ Văn", "Lịch sử"], classes: ["7C", "7D", "8A"], subjectClassPairs: ["Ngữ Văn 7C", "Ngữ Văn 7D", "Ngữ Văn 8A", "Lịch sử 7C", "Lịch sử 7D", "Lịch sử 8A"] }
];

export const initialCourseRegistrations: CourseRegistration[] = [
  {
    id: 1,
    studentName: 'Nguyễn Kim Ngân',
    classInfo: '9A',
    courses: ['Toán', 'Tiếng Anh'],
    file: { name: 'DK_Ngan.doc', size: '1.2 MB' },
    status: 'Đã duyệt',
    date: '19/06/2026'
  }
];

export const initialSurveys: Survey[] = [
  {
    id: 1,
    parentName: "Nghiêm Hồng Sơn",
    studentName: "Nghiêm Đình Phong",
    classInfo: "6A",
    topic: "Chất lượng bán trú & Dinh dưỡng học đường",
    rating: 5,
    content: "Đồ ăn bán trú đa dạng, nhà bếp sạch sẽ, các thầy cô quản lý ăn trưa vô cùng chu đáo.",
    file: null,
    status: "Đã tiếp thu",
    date: "19/06/2026"
  },
  {
    id: 2,
    parentName: "Vũ Thu Hà",
    studentName: "Nguyễn Kim Ngân",
    classInfo: "9A",
    topic: "Đổi mới học vụ chuyên môn & Chuyển đổi số",
    rating: 4,
    content: "Đề xuất nhà trường trang bị thêm các hệ thống màn hình tương tác thông minh cho các phòng học.",
    file: { name: "phieu_ks_ph_ha.pdf", size: "1.1 MB" },
    status: "Đang xử lý",
    date: "18/06/2026"
  }
];

export const initialExams: Exam[] = [
  {
    id: 1,
    subject: 'Toán',
    type: 'Giữa kỳ II',
    duration: '45 phút',
    teacher: 'Lê Thúy Quỳnh',
    correctAnswers: "1A,2B,3C,4D",
    mcqMaxScore: 5.0,
    essayMaxScore: 5.0,
    essayQuestion: "Hãy nêu ứng dụng của hệ thức lượng trong thực tế đời sóng.",
    targetType: 'class',
    targetValue: '9A',
    examFile: { name: 'DeToan_Lop9.pdf', size: '1.2MB' }
  }
];

export const initialHomework: Homework[] = [
  {
    id: 1,
    subject: 'Toán',
    title: 'Giải hệ phương trình bậc nhất hai ẩn',
    content: 'Hoàn thành các bài tập phần 1, 2, 3 trong SGK trang 45 và nộp lại file sơ đồ tư duy.',
    deadline: '25/06/2026',
    targetType: 'class',
    targetValue: '9A',
    homeworkFile: null
  }
];

export const initialSubmissions: Submission[] = [
  {
    id: 1,
    student: 'Nguyễn Kim Ngân',
    class: '9A',
    subject: 'Toán',
    type: 'Giữa kỳ II',
    date: '19/06/2026',
    submissionType: 'text',
    text: 'Em xin nộp bài làm tự luận phần thực tế: Hệ thức lượng giúp tính toán chiều cao tháp đo đạc gián tiếp thông qua bóng nắng trên mặt đất và góc nâng đo bằng giác kế.',
    fileData: null,
    answers: "1A,2B,3C,4D",
    mcqScore: 5.0,
    mcqMaxScore: 5.0,
    essayScore: null,
    essayMaxScore: 5.0,
    grade: null,
    remark: '',
    isSynced: false
  }
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    title: "Kế hoạch thi đua khen thưởng và học vụ năm học mới",
    category: "Cấp Trường",
    date: "19/06/2026",
    file: { name: "KH_ThiDuaKhenThuong.doc", ext: "doc", size: "1.2 MB" }
  },
  {
    id: 2,
    title: "Hướng dẫn thực hiện nhiệm vụ giáo dục trung học chuyên đề số hóa học bạ",
    category: "Cấp Sở/Bộ",
    date: "18/06/2026",
    file: { name: "HD_SoHoaHocBa_2026.pdf", ext: "pdf", size: "2.4 MB" }
  },
  {
    id: 3,
    title: "Nghị quyết phối hợp chăm sóc bảo đảm an toàn giao thông trước cổng trường THCS",
    category: "Cấp UBND xã",
    date: "15/06/2026",
    file: { name: "NQ_ATGT_CongTruong.pdf", ext: "pdf", size: "850 KB" }
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    date: '19/06',
    isNew: true,
    source: 'Nhà trường',
    title: 'Cập nhật hệ thống học vụ V12.15 chuyển đổi số',
    content: 'Hệ thống tuyển sinh và học vụ trực tuyến trường THCS Hòa Phú nâng cấp phân hệ V12.15 bám sát cơ chế học vụ số. Tích hợp trung tâm in ấn, báo cáo đa thông tin, biểu mẫu khảo sát ý kiến số hóa.'
  },
  {
    id: 2,
    date: '19/06',
    isNew: true,
    source: 'Xã Hòa Xá',
    title: 'Hợp tác phát động Chiến dịch Thể Thao Mùa Hè 2026',
    content: 'UBND Xã Hòa Xá đồng hành cùng Đoàn trường kêu gọi học sinh toàn trường thi đua rèn luyện sức khỏe, tổ chức hội thao xe đạp hè và chiến dịch tuyên truyền bảo vệ nguồn nước sạch sạch địa phương.'
  },
  {
    id: 3,
    date: '18/06',
    isNew: true,
    source: 'Sở GD&ĐT',
    title: 'Rà soát hoàn thiện đồng bộ dữ liệu Học bạ số quốc gia',
    content: 'Văn bản số 2840/SGDĐT chỉ đạo các cơ sở giáo dục trung học rà soát, điền đầy đủ và chuẩn hóa thông tin lý lịch cá nhân, điểm kỳ II của học sinh lên cơ sở dữ liệu quốc gia trước 30/06.'
  },
  {
    id: 4,
    date: '17/06',
    isNew: false,
    source: 'Bộ GD&ĐT',
    title: 'Phát hành quy chế đổi mới căn bản hình thức đánh giá tư duy',
    content: 'Nghị quyết mới về đổi mới căn bản phương thức thi và kiểm tra, khuyến khích kiểm tra tích hợp trắc nghiệm khách quan tự động của hệ thống kèm câu hỏi tự luận vận dụng thực tế nâng cao hiệu quả.'
  }
];

export const initialActivities: Activity[] = [
  {
    id: 1,
    title: "Hội thi Thể thao Học sinh THCS Hòa Phú tranh tài",
    category: "TIN TỨC",
    date: "12/06/2026",
    desc: "Các trận đấu sôi nổi kịch tính giữa các chi đội mạnh tranh tài môn đua xe đạp và bóng đá nam...",
    content: "Hội thi thể thao học sinh trường THCS Hòa Phú được tổ chức thường niên cực kỳ sôi nổi nhằm phát triển toàn diện thể chất và tinh thần sáng tạo của học sinh. Nội dung đua xe đạp vòng quanh khu vực hồ sinh thái Xã Hòa Xá nhận được sự hưởng ứng nồng nhiệt từ phụ huynh và giáo viên toàn trường.",
    img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400",
    likes: 42,
    likedByUser: false,
    comments: [
      { username: "Hs_NguyenNgan", text: "Trận chung kết đua xe đạp kịch tính vô cùng thầy cô ơi!", date: "12/06/2026" },
      { username: "Ph_TuanMinh", text: "Giải đấu rất ý nghĩa, nâng cao thể lực cho con em dịp hè.", date: "13/06/2026" }
    ]
  },
  {
    id: 2,
    title: "Khai mạc Tuần lễ phát động Phong trào tự học và văn hóa đọc",
    category: "SỰ KIỆN",
    date: "15/06/2026",
    desc: "Phát động văn hóa sách, trang bị không gian khám phá tri thức số tại THCS Hòa Phú...",
    content: "Lễ phát động hưởng ứng Tuần lễ học tập suốt đời năm học mới tại Thư viện điện tử trường THCS Hòa Phú. Chương trình triển khai tủ sách thông minh, thu hút hơn 800 học sinh đăng ký các chuyên đề bồi dưỡng văn hóa nâng cao bám sát chuyển đổi số giáo dục.",
    img: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400",
    likes: 28,
    likedByUser: false,
    comments: []
  },
  {
    id: 3,
    title: "Triển lãm Sáng kiến Khoa học Sáng tạo trẻ và Robot STEM",
    category: "VĂN THỂ",
    date: "18/06/2026",
    desc: "Vinh danh các mô hình robot dọn rác tự động, nhà thông minh hữu ích của học sinh...",
    content: "Triển lãm Sáng tạo kỹ thuật trẻ do Hội đồng Đội trường THCS Hòa Phú tổ chức đã công bố nhiều mô hình xuất sắc. Tiêu biểu là hệ thống robot dọn rác tự động tích hợp cảm biến siêu âm vật cản và mô hình thùng rác thông minh phân loại nhựa tái chế.",
    img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400",
    likes: 35,
    likedByUser: false,
    comments: [
      { username: "Gv_ThuyQuynh", text: "Sản phẩm cảm biến siêu âm của các em khối 8 có tiềm năng ứng dụng cao.", date: "18/06/2026" }
    ]
  }
];

export const initialOutstandingStudents: StudentDetail[] = [
  {
    id: 1,
    name: "Nguyễn Kim Ngân",
    class: "Lớp 9A",
    badge: "Thủ khoa Toán học",
    gpa: "9.8",
    conduct: "Tốt",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    achievements: [
      "Giải Nhất lập trình Violympic Toán học trẻ toàn quốc 2026",
      "Huy chương Vàng học sinh giỏi Toán cấp Thành phố",
      "Đại sứ Phong trào Đổi mới văn hóa đọc sách số trường học"
    ],
    subjects: { "Toán": 10.0, "Ngữ Văn": 9.5, "Tiếng Anh": 10.0, "KHTN": 9.8 },
    guestbook: [
      { name: "Thầy Quân", msg: "Thầy rất tự hào về tinh thần tự học bứt phá của em! Tiếp tục tỏa sáng vững vàng nhé." },
      { name: "Gv_ThuyQuynh", msg: "Kim Ngân giải toán hình học có những cách chứng minh cực kỳ sáng tạo và ngắn gọn." }
    ]
  },
  {
    id: 2,
    name: "Phạm Nam Khánh",
    class: "Lớp 8C",
    badge: "Ngôi sao Nghiên cứu Khoa học",
    gpa: "9.4",
    conduct: "Tốt",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    achievements: [
      "Giải Xuất sắc Sáng tạo Kỹ thuật Robot dọn rác xanh cấp tỉnh",
      "Giải Nhì cuộc thi Tìm hiểu vũ trụ thiên văn học trẻ 2026",
      "Hạng Nhất đấu trường Olympic ngoại ngữ ứng dụng"
    ],
    subjects: { "Toán": 9.2, "Ngữ Văn": 8.8, "Tiếng Anh": 9.8, "KHTN": 9.8 },
    guestbook: [
      { name: "Cô Lan", msg: "Nam Khánh có tư duy khoa học và lòng say mê cơ khí chế tạo vượt trội bẩm sinh." }
    ]
  },
  {
    id: 3,
    name: "Trần Minh Châu",
    class: "Lớp 7A",
    badge: "Hùng biện xuất sắc",
    gpa: "9.6",
    conduct: "Tốt",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    achievements: [
      "Huy chương Vàng Hùng biện tiếng Anh Đại sứ Môi trường xanh",
      "Bằng khen danh dự Đội viên xuất sắc có thành tích vượt khó",
      "Giải Nhất liên hoan thanh nhạc ca khúc truyền thống quê hương"
    ],
    subjects: { "Toán": 9.0, "Ngữ Văn": 9.8, "Tiếng Anh": 10.0, "KHTN": 9.4 },
    guestbook: [
      { name: "Thầy Trần Cường", msg: "Khả năng diễn đạt bằng ngôn từ và truyền tải cảm xúc của Minh Châu rất lôi cuốn!" }
    ]
  }
];

export const initialOutstandingClasses: ClassDetail[] = [
  {
    id: "9A",
    lop: "Lớp 9A",
    gvcn: "Nghiêm Hồng Quân",
    slogan: "Dẫn đầu thi đua học tốt lập nghiệp",
    icon: "fa-flag",
    iconColor: "text-orange-500 bg-orange-50",
    total: 42,
    achievements: [
      "Giải Nhất tuần lễ thi đua cao điểm chào mừng học kỳ II toàn diện",
      "Chi đội đạt danh hiệu vững mạnh dẫn đầu khối 9 liên tục 3 khóa",
      "Đơn vị tiên phong hoàn thành 100% hồ sơ học bạ số hóa trường học"
    ],
    guestbook: [
      { name: "Ban Giám Hiệu", msg: "Xứng đáng là cánh chim đầu đàn dẫn dắt phong trào học tập của toàn thể khối 9!" }
    ]
  },
  {
    id: "8C",
    lop: "Lớp 8C",
    gvcn: "Phạm Thị Lan",
    slogan: "Phát huy sức mạnh đoàn kết văn thể mỹ",
    icon: "fa-music",
    iconColor: "text-purple-600 bg-purple-50",
    total: 38,
    achievements: [
      "Giải Đặc biệt liên hoan nghệ thuật quần chúng Hoa Phượng Đỏ Xã",
      "Chi đội kỷ luật tốt nhất giữ vệ sinh xanh sạch đẹp phòng học 2026",
      "Giải Nhì giải bóng đá khối THCS Hòa Phú truyền thống"
    ],
    guestbook: []
  },
  {
    id: "7A",
    lop: "Lớp 7A",
    gvcn: "Trần Văn Cường",
    slogan: "Khỏe để học tập tốt - Vô địch thể thao",
    icon: "fa-soccer-ball",
    iconColor: "text-emerald-600 bg-emerald-50",
    total: 41,
    achievements: [
      "Cúp Vô địch bóng đá nam truyền thống học sinh THCS Hòa Phú",
      "Giải Nhất trang trí bảng chủ điểm đổi mới không gian học tập xanh",
      "Tập thể xuất sắc đóng góp quỹ bảo bối giúp bạn vượt khó đến trường"
    ],
    guestbook: []
  }
];

export const fullSubjects = [
  "Toán",
  "Ngữ Văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Công nghệ",
  "Tin học",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Mỹ thuật",
  "Âm nhạc",
  "GDTC",
  "HĐTN, HN",
  "GDĐP"
];
