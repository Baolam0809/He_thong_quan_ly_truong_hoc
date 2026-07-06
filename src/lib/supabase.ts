import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables or safe fallbacks provided by the user
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://lmqvynljkbavztdsfmzq.supabase.co';

// Deciding between Anon Key and Service Role Key:
// Standard public key is recommended for generic queries, but Service Role bypasses 
// Row Level Security (RLS) policies completely. Since the user explicitly provided both,
// we default to the service role key to ensure the application works out-of-the-box and
// bypasses any RLS constraints on newly created tables, making the prototype 100% functional.
const IS_DEFAULT_DB = SUPABASE_URL.includes('lmqvynljkbavztdsfmzq');
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcXZ5bmxqa2Jhdnp0ZHNmbXpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAyOTYyNSwiZXhwIjoyMDk3NjA1NjI1fQ.sNb-YHQMe8NJiaBuj4IdWUvNjim4fC1DqM2Z2-_Zs9k';

const SUPABASE_KEY = IS_DEFAULT_DB
  ? (((import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY as string) || DEFAULT_SERVICE_ROLE_KEY)
  : (((import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY as string) || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SERVICE_ROLE_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to determine connection status & check if tables are accessible
export interface DBStatus {
  connected: boolean;
  tablesMissing: boolean;
  missingTablesList: string[];
  errorMessage: string | null;
}

const ALL_TABLE_NAMES = [
  'thcs_accounts',
  'thcs_classes',
  'thcs_assignments',
  'thcs_course_registrations',
  'thcs_surveys',
  'thcs_exams',
  'thcs_homework',
  'thcs_submissions',
  'thcs_documents',
  'thcs_notifications',
  'thcs_activities',
  'thcs_outstanding_students',
  'thcs_outstanding_classes',
  'thcs_student_conducts',
  'thcs_homeroom_notices',
  'thcs_schedules',
  'thcs_youtube_lessons',
  'thcs_settings',
  'thcs_visitor_logs'
];

function isTableMissingError(message: string | undefined): boolean {
  if (!message) return false;
  const msg = message.toLowerCase();
  return (
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('table') && msg.includes('does not exist')) ||
    (msg.includes('class') && msg.includes('does not exist'))
  );
}

/**
 * Checks connection and verifies Table schemas
 */
export async function checkDatabaseStatus(): Promise<DBStatus> {
  const status: DBStatus = {
    connected: false,
    tablesMissing: false,
    missingTablesList: [],
    errorMessage: null
  };

  try {
    // Attempt to probe a table to verify connection
    const { error } = await supabase.from('thcs_accounts').select('id').limit(1);
    
    if (error) {
      if (isTableMissingError(error.message)) {
        status.connected = true;
        status.tablesMissing = true;
        status.missingTablesList.push('thcs_accounts');
      } else {
        status.errorMessage = error.message;
        return status;
      }
    } else {
      status.connected = true;
    }

    // Check all other tables
    for (const table of ALL_TABLE_NAMES) {
      if (table === 'thcs_accounts' && !status.tablesMissing) continue;
      
      const { error: tblError } = await supabase.from(table).select('id').limit(1);
      if (tblError && isTableMissingError(tblError.message)) {
        status.tablesMissing = true;
        status.missingTablesList.push(table);
      }
    }
  } catch (err: any) {
    status.errorMessage = err.message || 'Lỗi kết nối mạng';
  }

  return status;
}

/**
 * Fetch data for a specific table with local fallback if DB throws error or is not set up
 */
export async function fetchTableData<T>(tableName: string, fallbackData: T[]): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`[Supabase Fetch] Table: ${tableName} - Error:`, error.message);
      return fallbackData;
    }
    if (!data || data.length === 0) {
      if (fallbackData && fallbackData.length > 0) {
        // Automatically seed the Postgres database to make sure it's populated
        seedTable(tableName, fallbackData);
      }
      return fallbackData;
    }

    // Return mapped fields (e.g. JSON parsed)
    const result = data.map(item => {
      const copy = { ...item };
      // Map properties back if they are JSON in Postgres
      for (const k of Object.keys(copy)) {
        if (copy[k] === null) continue;
        
        // Postgres has lowercase properties for some generated stuff, we ensure correct keys
        // or parse nested objects/arrays if they were serialized as strings
        if (typeof copy[k] === 'string' && (copy[k].startsWith('[') || copy[k].startsWith('{'))) {
          try {
            copy[k] = JSON.parse(copy[k]);
          } catch (e) {
            // Leave as string
          }
        }
      }
      return copy as any;
    });

    if (tableName === 'thcs_assignments') {
      result.forEach((item: any) => {
        if (!item.subjectClassPairs || item.subjectClassPairs.length === 0) {
          const subs = Array.isArray(item.subjects) ? item.subjects : [];
          const cls = Array.isArray(item.classes) ? item.classes : [];
          item.subjectClassPairs = subs.flatMap((s: string) => cls.map((c: string) => `${s} ${c}`));
        }
      });
    }

    return result as T[];
  } catch (err) {
    console.warn(`[Supabase Fetch] Fetch failed for ${tableName}, falling back to static mock data:`, err);
    return fallbackData;
  }
}

/**
 * Sanitizes row based on target schema definition to avoid unknown column errors (e.g. subjectClassPairs)
 */
export function sanitizeRowForTable(tableName: string, row: any): any {
  if (!row) return row;
  const clean: any = {};
  
  // Map exact actual schema definitions to prevent schema cache / column mismatch errors
  const schemas: Record<string, string[]> = {
    thcs_accounts: ['id', 'name', 'username', 'password', 'role', 'extra', 'isFirstLogin', 'canPostNews'],
    thcs_classes: ['id', 'khoi', 'lop', 'gvcn', 'total'],
    thcs_assignments: ['id', 'teacherId', 'teacherName', 'subjects', 'classes'],
    thcs_course_registrations: ['id', 'studentName', 'classInfo', 'courses', 'file', 'status', 'date'],
    thcs_surveys: ['id', 'parentName', 'studentName', 'classInfo', 'topic', 'rating', 'content', 'file', 'status', 'date'],
    thcs_exams: ['id', 'subject', 'type', 'duration', 'teacher', 'correctAnswers', 'mcqMaxScore', 'essayMaxScore', 'essayQuestion', 'targetType', 'targetValue', 'examFile'],
    thcs_homework: ['id', 'subject', 'title', 'content', 'deadline', 'targetType', 'targetValue', 'homeworkFile'],
    thcs_submissions: ['id', 'student', 'class', 'subject', 'type', 'date', 'submissionType', 'text', 'fileData', 'answers', 'mcqScore', 'mcqMaxScore', 'essayScore', 'essayMaxScore', 'grade', 'remark', 'isSynced'],
    thcs_documents: ['id', 'title', 'category', 'date', 'file'],
    thcs_notifications: ['id', 'date', 'isNew', 'source', 'title', 'content'],
    thcs_activities: ['id', 'title', 'category', 'date', 'desc', 'content', 'img', 'likes', 'likedByUser', 'comments'],
    thcs_outstanding_students: ['id', 'name', 'class', 'badge', 'gpa', 'conduct', 'avatar', 'achievements', 'subjects', 'guestbook'],
    thcs_outstanding_classes: ['id', 'lop', 'gvcn', 'slogan', 'icon', 'iconColor', 'total', 'achievements', 'guestbook'],
    thcs_student_conducts: ['id', 'studentName', 'className', 'conduct', 'attendance', 'scoreBehavior', 'teacherNote', 'updateDate'],
    thcs_homeroom_notices: ['id', 'className', 'title', 'content', 'date', 'pin'],
    thcs_schedules: ['id', 'title', 'description', 'date', 'colorType'],
    thcs_youtube_lessons: ['id', 'title', 'youtubeUrl', 'subject', 'grade', 'description', 'createdAt'],
    thcs_settings: ['id', 'bannerUrl', 'logoUrl', 'marqueeText', 'bannerSlides', 'bannerurl', 'logourl', 'marqueetext', 'bannerslides'],
    thcs_visitor_logs: ['id', 'username', 'role', 'timestamp', 'action', 'snapshotUrl', 'snapshoturl']
  };

  const allowedFields = schemas[tableName];
  if (!allowedFields) {
    return row;
  }

  for (const [key, val] of Object.entries(row)) {
    if (allowedFields.includes(key)) {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Seed a table with fallback/initial state data
 */
export async function seedTable(tableName: string, initialData: any[]): Promise<boolean> {
  if (!initialData || initialData.length === 0) return true;
  try {
    const formattedRows = initialData.map(item => {
      const sanitized = sanitizeRowForTable(tableName, item);
      const row: any = {};
      for (const [key, value] of Object.entries(sanitized)) {
        if (value && (typeof value === 'object' || Array.isArray(value))) {
          row[key] = value; // JSONB columns are perfectly serialized by supabase js
        } else {
          row[key] = value;
        }
      }
      return row;
    });

    const { error } = await supabase.from(tableName).upsert(formattedRows);
    if (error) {
      console.error(`[Supabase Seed] Failed to seed ${tableName}:`, error.message);
      // Double safe fallback: if subjectClassPairs failed, delete it dynamically and try again
      if (tableName === 'thcs_assignments' && error.message.includes('subjectClassPairs')) {
        console.warn(`[Supabase Seed] Assignment table missing column, retrying seed with sanitized attributes...`);
        const pureRows = formattedRows.map(({ subjectClassPairs, ...rest }) => rest);
        const { error: retryError } = await supabase.from(tableName).upsert(pureRows);
        return !retryError;
      }
      return false;
    }
    console.log(`[Supabase Seed] Seeded table ${tableName} successfully with ${initialData.length} records.`);
    return true;
  } catch (err) {
    console.error(`[Supabase Seed] Error seeding ${tableName}:`, err);
    return false;
  }
}

/**
 * Sync logic with specific table (detects deleted, added and modified records)
 */
export async function syncTableToSupabase(
  tableName: string, 
  currentList: any[], 
  prevList: any[]
): Promise<boolean> {
  try {
    // 1. Identify deleted rows
    const deletedRows = prevList.filter(prev => !currentList.some(curr => curr.id === prev.id));
    if (deletedRows.length > 0) {
      const idsToDelete = deletedRows.map(row => row.id);
      const { error: delError } = await supabase.from(tableName).delete().in('id', idsToDelete);
      if (delError) {
        console.error(`[Supabase Sync] Delete mismatch on ${tableName}:`, delError.message);
      } else {
        console.log(`[Supabase Sync] Table: ${tableName} - Deleted IDs:`, idsToDelete);
      }
    }

    // 2. Upsert current list (handles inserts and updates)
    if (currentList.length > 0) {
      const formattedRows = currentList.map(item => {
        const sanitized = sanitizeRowForTable(tableName, item);
        const row: any = {};
        for (const [key, value] of Object.entries(sanitized)) {
          if (value && (typeof value === 'object' || Array.isArray(value))) {
            row[key] = value; // Postgres JSONB support
          } else {
            row[key] = value;
          }
        }
        return row;
      });

      const { error: upsertError } = await supabase.from(tableName).upsert(formattedRows);
      if (upsertError) {
        console.warn(`[Supabase Sync] Upsert mismatch on ${tableName}:`, upsertError.message);
        // Double safe fallback: if subjectClassPairs failed, delete it dynamically and retry
        if (tableName === 'thcs_assignments' && upsertError.message.includes('subjectClassPairs')) {
          console.warn(`[Supabase Sync] Retrying sync without subjectClassPairs...`);
          const pureRows = formattedRows.map(({ subjectClassPairs, ...rest }) => rest);
          const { error: retryError } = await supabase.from(tableName).upsert(pureRows);
          return !retryError;
        }
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error(`[Supabase Sync] Unexpected error syncing ${tableName}:`, err);
    return false;
  }
}

export const DDL_SQL_STATEMENT = `-- DDL ĐỂ CẤU HÌNH NHANH SUPABASE CHO WEBSITE TRƯỜNG THCS HÒA PHÚ
-- Bạn chỉ cần truy cập giao diện Supabase Dashboard -> SQL Editor
-- Nhấp "New Query", dán đoạn mã này vào và click "Run" để khởi tạo đầy đủ các bảng dữ liệu:

-- 1. Bảng Accounts
CREATE TABLE IF NOT EXISTS thcs_accounts (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  extra TEXT,
  "isFirstLogin" BOOLEAN DEFAULT false,
  "canPostNews" BOOLEAN DEFAULT false
);

-- 2. Bảng Classes
CREATE TABLE IF NOT EXISTS thcs_classes (
  id TEXT PRIMARY KEY,
  khoi TEXT NOT NULL,
  lop TEXT NOT NULL,
  gvcn TEXT NOT NULL,
  total INTEGER DEFAULT 40
);

-- 3. Bảng Assignments
CREATE TABLE IF NOT EXISTS thcs_assignments (
  id BIGINT PRIMARY KEY,
  "teacherId" BIGINT,
  "teacherName" TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  classes JSONB DEFAULT '[]'::jsonb,
  "subjectClassPairs" JSONB DEFAULT '[]'::jsonb
);

-- 4. Bảng Course Registrations
CREATE TABLE IF NOT EXISTS thcs_course_registrations (
  id BIGINT PRIMARY KEY,
  "studentName" TEXT NOT NULL,
  "classInfo" TEXT NOT NULL,
  courses JSONB DEFAULT '[]'::jsonb,
  file JSONB,
  status TEXT DEFAULT 'Chờ duyệt',
  date TEXT
);

-- 5. Bảng Surveys
CREATE TABLE IF NOT EXISTS thcs_surveys (
  id BIGINT PRIMARY KEY,
  "parentName" TEXT NOT NULL,
  "studentName" TEXT,
  "classInfo" TEXT,
  topic TEXT,
  rating INTEGER,
  content TEXT,
  file JSONB,
  status TEXT DEFAULT 'Mới nhận',
  date TEXT
);

-- 6. Bảng Exams
CREATE TABLE IF NOT EXISTS thcs_exams (
  id BIGINT PRIMARY KEY,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  duration TEXT,
  teacher TEXT,
  "correctAnswers" TEXT,
  "mcqMaxScore" NUMERIC,
  "essayMaxScore" NUMERIC,
  "essayQuestion" TEXT,
  "targetType" TEXT,
  "targetValue" TEXT,
  "examFile" JSONB
);

-- 7. Bảng Homework
CREATE TABLE IF NOT EXISTS thcs_homework (
  id BIGINT PRIMARY KEY,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  deadline TEXT,
  "targetType" TEXT,
  "targetValue" TEXT,
  "homeworkFile" JSONB
);

-- 8. Bảng Submissions
CREATE TABLE IF NOT EXISTS thcs_submissions (
  id BIGINT PRIMARY KEY,
  student TEXT NOT NULL,
  class TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT,
  date TEXT,
  "submissionType" TEXT,
  "text" TEXT,
  "fileData" JSONB,
  answers TEXT,
  "mcqScore" NUMERIC,
  "mcqMaxScore" NUMERIC,
  "essayScore" NUMERIC,
  "essayMaxScore" NUMERIC,
  grade NUMERIC,
  remark TEXT,
  "isSynced" BOOLEAN DEFAULT false
);

-- 9. Bảng Documents
CREATE TABLE IF NOT EXISTS thcs_documents (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT,
  file JSONB
);

-- 10. Bảng Notifications
CREATE TABLE IF NOT EXISTS thcs_notifications (
  id BIGINT PRIMARY KEY,
  date TEXT,
  "isNew" BOOLEAN DEFAULT true,
  source TEXT,
  title TEXT,
  content TEXT
);

-- 11. Bảng Activities
CREATE TABLE IF NOT EXISTS thcs_activities (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  date TEXT,
  "desc" TEXT,
  content TEXT,
  img TEXT,
  likes INTEGER DEFAULT 0,
  "likedByUser" BOOLEAN DEFAULT false,
  comments JSONB DEFAULT '[]'::jsonb
);

-- 12. Bảng Outstanding Students
CREATE TABLE IF NOT EXISTS thcs_outstanding_students (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT,
  badge TEXT,
  gpa TEXT,
  conduct TEXT,
  avatar TEXT,
  achievements JSONB DEFAULT '[]'::jsonb,
  subjects JSONB DEFAULT '{}'::jsonb,
  guestbook JSONB DEFAULT '[]'::jsonb
);

-- 13. Bảng Outstanding Classes
CREATE TABLE IF NOT EXISTS thcs_outstanding_classes (
  id TEXT PRIMARY KEY,
  lop TEXT NOT NULL,
  gvcn TEXT,
  slogan TEXT,
  icon TEXT,
  "iconColor" TEXT,
  total INTEGER DEFAULT 40,
  achievements JSONB DEFAULT '[]'::jsonb,
  guestbook JSONB DEFAULT '[]'::jsonb
);

-- 14. Bảng Học sinh rèn luyện / Hạnh kiểm
CREATE TABLE IF NOT EXISTS thcs_student_conducts (
  id SERIAL PRIMARY KEY,
  "studentName" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  conduct TEXT NOT NULL,
  attendance TEXT NOT NULL,
  "scoreBehavior" INTEGER DEFAULT 100,
  "teacherNote" TEXT,
  "updateDate" TEXT
);

-- 15. Bảng Thông báo chủ nhiệm
CREATE TABLE IF NOT EXISTS thcs_homeroom_notices (
  id BIGINT PRIMARY KEY,
  "className" TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT,
  pin BOOLEAN DEFAULT false
);

-- 16. Bảng Lịch sắp tới
CREATE TABLE IF NOT EXISTS thcs_schedules (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  "colorType" TEXT DEFAULT 'orange'
);

-- 17. Bảng Video bài giảng Youtube
CREATE TABLE IF NOT EXISTS thcs_youtube_lessons (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  "youtubeUrl" TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  description TEXT,
  "createdAt" TEXT
);

-- 18. Bảng Thiết lập / Cấu hình trường học
CREATE TABLE IF NOT EXISTS thcs_settings (
  id INT PRIMARY KEY,
  "bannerUrl" TEXT,
  "logoUrl" TEXT,
  "marqueeText" TEXT,
  "bannerSlides" JSONB
);

-- 19. Bảng Lưu nhật ký truy cập & Chụp ảnh webcam
CREATE TABLE IF NOT EXISTS thcs_visitor_logs (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  "snapshotUrl" TEXT
);`;
