export interface Account {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'Admin' | 'Giáo viên' | 'Nhân viên' | 'Khách' | 'Học sinh' | 'Phụ huynh';
  extra: string;
  isFirstLogin?: boolean;
  canPostNews?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canUndo?: boolean;
  studentId?: string; // Mã định danh
  cccd?: string; // CCCD
  dob?: string; // Năm sinh
  class?: string; // Lớp
  address?: string; // Nơi ở
  parents?: string; // Cha mẹ
  phone?: string; // Số điện thoại
}

export interface Class {
  id: string; // e.g. "6A"
  khoi: string; // e.g. "Khối 6"
  lop: string; // e.g. "6A"
  gvcn: string; // e.g. "Lê Thúy Quỳnh"
  gvbm?: string; // e.g. "Trần Văn Cường"
  total: number;
}

export interface Assignment {
  id: number;
  teacherId: number;
  teacherName: string;
  subjects: string[];
  classes: string[];
  subjectClassPairs?: string[];
}

export interface CourseRegistration {
  id: number;
  studentName: string;
  classInfo: string;
  courses: string[];
  file: {
    name: string;
    size: string;
  } | null;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  date: string;
}

export interface Survey {
  id: number;
  parentName: string;
  studentName: string;
  classInfo: string;
  topic: string;
  rating: number;
  content: string;
  file: {
    name: string;
    size: string;
  } | null;
  status: 'Mới nhận' | 'Đang xử lý' | 'Đã tiếp thu';
  date: string;
}

export interface UpcomingSchedule {
  id: number;
  title: string;
  description: string;
  date: string;
  colorType: 'orange' | 'rose' | 'purple' | 'blue';
}

export interface Exam {
  id: number;
  subject: string;
  type: string; // "Thường xuyên", "Giữa kỳ II", "Cuối kỳ II"
  duration: string; // e.g. "45 phút"
  teacher: string;
  correctAnswers: string; // e.g. "1A,2B..."
  mcqMaxScore: number;
  essayMaxScore: number;
  essayQuestion: string;
  targetType: 'all' | 'class' | 'student';
  targetValue: string;
  examFile: {
    name: string;
    size?: string;
  } | null;
}

export interface Homework {
  id: number;
  subject: string;
  title: string;
  content: string;
  deadline: string;
  targetType: 'all' | 'class' | 'student';
  targetValue: string;
  homeworkFile: {
    name: string;
    size?: string;
  } | null;
}

export interface Submission {
  id: number;
  student: string;
  class: string;
  subject: string;
  type: string;
  date: string;
  submissionType: 'text' | 'file';
  text: string;
  fileData: {
    name: string;
  } | null;
  answers: string; // multiple-choice answers input
  mcqScore: number;
  mcqMaxScore: number;
  essayScore: number | null;
  essayMaxScore: number;
  grade: number | null; // total grade
  remark: string;
  isSynced: boolean;
}

export interface DocumentItem {
  id: number;
  title: string;
  category: 'Cấp Sở/Bộ' | 'Cấp UBND xã' | 'Cấp Trường';
  date: string;
  file: {
    name: string;
    ext: string;
    size: string;
    content?: string;
  } | null;
}

export interface NotificationItem {
  id: number;
  date: string;
  isNew: boolean;
  source: 'Nhà trường' | 'Xã Hòa Xá' | 'Sở GD&ĐT' | 'Bộ GD&ĐT' | 'Đoàn - Đội';
  title: string;
  content: string;
}

export interface CommentItem {
  username: string;
  text: string;
  date: string;
}

export interface Activity {
  id: number;
  title: string;
  category: string; // "TIN TỨC" | "SỰ KIỆN" | "VĂN THỂ"
  date: string;
  desc: string;
  content: string;
  img: string;
  likes: number;
  likedByUser: boolean;
  comments: CommentItem[];
}

export interface StudentDetail {
  id: number;
  name: string;
  class: string;
  badge: string;
  gpa: string;
  conduct: string;
  avatar: string;
  achievements: string[];
  subjects: Record<string, number>;
  guestbook: { name: string; msg: string }[];
}

export interface ClassDetail {
  id: string;
  lop: string;
  gvcn: string;
  slogan: string;
  icon: string;
  iconColor: string;
  total: number;
  achievements: string[];
  guestbook: { name: string; msg: string }[];
}

export interface BannerSlide {
  id: string;
  type: 'upload' | 'url';
  source: string;
  title?: string;
  createdAt: string;
}

export interface StudentConduct {
  studentName: string;
  className: string;
  conduct: 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu';
  attendance: 'Đầy đủ' | 'Nghỉ phép' | 'Nghỉ không phép';
  scoreBehavior: number;
  teacherNote: string;
  updateDate: string;
}

export interface HomeroomNotice {
  id: number;
  className: string;
  title: string;
  content: string;
  date: string;
  pin: boolean;
}

export interface YoutubeLesson {
  id: number;
  title: string;
  youtubeUrl: string;
  subject: string;
  grade: string;
  description: string;
  createdAt: string;
}

export interface VisitorLog {
  id: string;
  username: string;
  role: string;
  timestamp: string;
  action: string;
  snapshotUrl?: string; // base64 photo taken via camera
}

export interface LoginLog {
  id: string;
  userId?: number;
  name: string;
  username: string;
  role: string;
  timestamp: string;
  deviceInfo: string;
  status: string;
}

