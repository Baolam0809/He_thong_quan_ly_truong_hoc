import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  ShieldAlert, 
  Activity, 
  Trash2, 
  User, 
  RefreshCw, 
  Clock, 
  Database,
  ExternalLink,
  Video,
  VideoOff,
  Search,
  Eye,
  CheckCircle,
  EyeOff
} from 'lucide-react';
import { Account, VisitorLog } from '../types';
import { showToast } from './Toast';
import { syncTableToSupabase } from '../lib/supabase';

interface VisitorMonitoringSectionProps {
  currentUser: Account | null;
  visitorLogs: VisitorLog[];
  setVisitorLogs: React.Dispatch<React.SetStateAction<VisitorLog[]>>;
  dbConnected: boolean;
  onAddLog: (actionText: string) => Promise<void>;
}

export default function VisitorMonitoringSection({
  currentUser,
  visitorLogs,
  setVisitorLogs,
  dbConnected,
  onAddLog
}: VisitorMonitoringSectionProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isSecretMode, setIsSecretMode] = useState<boolean>(() => {
    return localStorage.getItem('thcs_secret_capture_mode') === 'true';
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto initialize camera stream if permission is granted, otherwise let user trigger it
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      setCameraError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      showToast("Đã kích hoạt máy ảnh giám sát học vụ!", "success");
    } catch (err: any) {
      console.error(err);
      setCameraActive(false);
      setCameraError(err.message || 'Không thể truy cập camera. Vui lòng cấp quyền hoặc kết nối thiết bị.');
      showToast("Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập!", "error");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capture a snapshot manually
  const triggerManualSnapshot = async () => {
    if (!cameraActive || !stream) {
      showToast("Vui lòng kích hoạt camera trước khi chụp!", "error");
      return;
    }

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      if (!video) return;

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip for mirror effect matching stream
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, 640, 480);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Save log via parent handler
      await onAddLog(`Chụp ảnh xác thực máy ảnh thủ công`);
      
      // Update the latest log item with the snapshot (which onAddLog creates)
      setVisitorLogs(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        // The most recent is first or last depending on sorting, but let's update logs
        // Let's find the one we just added (or update the top one)
        updated[0] = {
          ...updated[0],
          snapshotUrl: dataUrl
        };
        // Save to localStorage
        localStorage.setItem('thcs_visitor_logs', JSON.stringify(updated));
        
        // Push update to Supabase
        if (dbConnected) {
          syncTableToSupabase('thcs_visitor_logs', [updated[0]], []);
        }
        return updated;
      });

      showToast("Đã chụp và lưu ảnh xác thực thành công!", "success");
    } catch (err: any) {
      showToast(`Lỗi khi chụp ảnh: ${err.message}`, "error");
    } finally {
      setIsCapturing(false);
    }
  };

  // Clear all logs (Admin only)
  const handleClearLogs = async () => {
    if (!currentUser || currentUser.role !== 'Admin') {
      showToast("Chỉ có Quản trị viên mới được xóa nhật ký giám sát!", "error");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử và hình ảnh giám sát truy cập?")) {
      setVisitorLogs([]);
      localStorage.removeItem('thcs_visitor_logs');
      showToast("Đã xóa sạch nhật ký giám sát!", "success");
    }
  };

  // Sync to Supabase manually
  const handleSyncToSupabase = async () => {
    showToast("Đang đồng bộ nhật ký lên Supabase...", "info");
    try {
      const success = await syncTableToSupabase('thcs_visitor_logs', visitorLogs, []);
      if (success) {
        showToast("Đồng bộ nhật ký giám sát lên Supabase đám mây thành công!", "success");
      } else {
        showToast("Lỗi đồng bộ. Vui lòng kiểm tra cấu trúc bảng database.", "error");
      }
    } catch (err: any) {
      showToast(`Lỗi kết nối database: ${err.message}`, "error");
    }
  };

  // Filter logs based on search query & role
  const filteredLogs = visitorLogs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;

    // Students can only see their own logs
    if (currentUser && currentUser.role === 'Học sinh') {
      return log.username === currentUser.name && matchesSearch && matchesRole;
    }
    // Parents can only see their own logs or student logs matching their child if configured,
    // let's simplify: guests/students/parents see their own logs, admins/teachers see all
    if (currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Giáo viên') {
      return log.username === currentUser.name && matchesSearch && matchesRole;
    }

    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" id="visitor-monitoring-panel">
      {/* Upper banner section */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-900 via-brand-blue-dark to-slate-900 text-white relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Activity className="w-24 h-24 text-white animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/30 border border-red-500/50 rounded-full text-[10px] uppercase font-black tracking-widest text-red-400 self-start animate-pulse">
            <Camera className="w-3 h-3" /> Chế Độ Giám Sát Học Vụ Đang Hoạt Động
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Giám Sát Camera & Nhật Ký Truy Cập Số
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Hệ thống chụp ảnh xác thực ngẫu nhiên qua Webcam thiết bị và tự động ghi nhận tiến trình học vụ trực tuyến của học sinh, phụ huynh và cán bộ giáo viên nhà trường.
          </p>
        </div>
      </div>

      {(currentUser?.role === 'Học sinh' || currentUser?.role === 'Phụ huynh' || currentUser?.role === 'Khách') && (
        <div className="mx-5 md:mx-6 mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-808 flex items-start gap-3 shadow-sm text-left">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-[13px]">Giao Diện Nhật Ký Giới Hạn Cá Nhân (Chỉ Đọc - Read-only)</p>
            <p className="font-medium text-slate-600 leading-relaxed">
              Bạn đang xem nhật ký giám sát với tư cách là <strong className="text-amber-750">{currentUser?.role}</strong>. 
              Theo chính sách bảo mật của THCS Hòa Phú, bạn <strong>chỉ có thể theo dõi và lọc lịch sử sự kiện của riêng tài khoản cá nhân</strong>. Bạn không có quyền truy xuất cơ sở dữ liệu gốc, cấu hình camera tập trung hoặc xóa nhật ký hệ thống.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Cam setup and instructions on left, Logs listing on right */}
      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Webcam capture container */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-inner relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
            {cameraActive ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                {/* Live video streaming object */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${isSecretMode ? 'opacity-0 w-1 h-1 pointer-events-none absolute' : ''}`}
                />

                {isSecretMode ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95">
                    <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-900/50 flex items-center justify-center text-rose-400 mb-3 animate-pulse">
                      <EyeOff className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-200 uppercase tracking-widest">Chế độ chụp hình bí mật</span>
                    <span className="text-[10px] text-rose-400 font-semibold mt-1">Camera đang hoạt động ngầm hoàn toàn</span>
                    <p className="text-[10px] text-slate-400 max-w-[280px] mt-2 leading-relaxed">
                      Mọi hoạt động chụp ảnh đối chiếu được tiến hành âm thầm mà không phát sáng hiển thị gương soi mặt trên màn hình, giúp bảo mật và tự nhiên tối đa.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Overlaid proctoring guide overlay */}
                    <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 rounded-xl pointer-events-none select-none flex items-center justify-center">
                      <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center">
                        <div className="w-40 h-40 border border-dashed border-emerald-500/40 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        </div>
                      </div>
                    </div>

                    {/* Target Corners */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

                    {/* Info badge Overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/75 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span>LIVE PROCTORING: ACTIVE</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div>
                  <b className="text-slate-300 text-sm block">Thiết bị chưa cấp quyền máy ảnh</b>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Hệ thống cần máy ảnh để tự động ghi lại ảnh chân dung xác nhận học sinh làm bài tập/đóng góp khảo sát học vụ.
                  </p>
                </div>
                {cameraError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 text-[11px] text-red-400 rounded-xl leading-relaxed max-w-xs text-left">
                    <b>Lỗi:</b> {cameraError}
                  </div>
                )}
                <button
                  onClick={startCamera}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                >
                  <Video className="w-4 h-4" /> Bật Máy Ảnh Giám Sát
                </button>
              </div>
            )}

            {/* Camera controls */}
            {cameraActive && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center w-full">
                <button
                  onClick={triggerManualSnapshot}
                  disabled={isCapturing}
                  className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-55 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                >
                  <Camera className="w-4 h-4" />
                  {isCapturing ? 'Đang chụp...' : 'Chụp Ảnh Chân Dung'}
                </button>
                <button
                  onClick={() => {
                    const nextMode = !isSecretMode;
                    setIsSecretMode(nextMode);
                    localStorage.setItem('thcs_secret_capture_mode', String(nextMode));
                    showToast(nextMode ? "Đã bật chế độ chụp bí ẩn ngầm" : "Đã chuyển về giám sát trực tiếp", "success");
                  }}
                  className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer border ${
                    isSecretMode 
                      ? 'bg-rose-950/50 text-rose-400 border-rose-900/50 hover:bg-rose-900/30' 
                      : 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700'
                  }`}
                >
                  {isSecretMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isSecretMode ? 'Hiện Live Cam' : 'Bật Chụp Bí Mật'}
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setCameraActive(false);
                    showToast("Đã tắt camera giám sát.", "info");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <VideoOff className="w-4 h-4" /> Tắt Camera
                </button>
              </div>
            )}
          </div>

          {/* Quick Info details */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-orange" />
              Cơ Chế Bảo Mật & Hoạt Động
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <b>Tự động ghi nhận:</b> Mọi thao tác chuyển đổi phân hệ, làm bài tập, gửi khảo sát đều được lưu thời gian thực kèm mã hành vi.
              </li>
              <li>
                <b>Chụp ảnh webcam chân thực:</b> Giúp giáo viên/admin đối chiếu đúng danh tính người truy cập học bạ số và hoàn thiện bài thi, ngăn chặn gian lận học thuật.
              </li>
              <li>
                <b>Chế độ Chụp Bí Mật:</b> Khi được kích hoạt, luồng camera trên giao diện màn hình sẽ bị ẩn hoàn toàn để người dùng không bị phát hiện hoặc gián đoạn, không phát sáng phản chiếu màn hình lên khuôn mặt.
              </li>
              <li>
                <b>Đồng bộ đám mây:</b> Dữ liệu nhật ký được tự động đồng bộ thời gian thực lên cơ sở dữ liệu đám mây Supabase an toàn.
              </li>
              <li className="text-[10px] text-slate-500 italic list-none mt-2 pt-2 border-t border-slate-200">
                ⚠️ <b>Lưu ý phần cứng:</b> Đèn LED báo hiệu vật lý cạnh camera là tính năng an toàn trực tiếp từ bảng mạch phần cứng của nhà sản xuất (như Apple, Dell, HP) để chống lén lút quay phim. Tuy nhiên, bằng cách tắt toàn bộ hình chiếu live sáng chói trên màn hình, người dùng sẽ không nhận biết được tiến trình chụp ảnh dưới nền.
              </li>
            </ul>
          </div>
        </div>

        {/* Right column: Logs stream list */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Header toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                Dòng Sự Kiện Tiến Trình Thực Tế ({filteredLogs.length})
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {currentUser?.role === 'Admin' || currentUser?.role === 'Giáo viên' 
                  ? "Xem nhật ký tiến trình hoạt động của mọi thành viên trên hệ thống"
                  : "Chỉ hiển thị các sự kiện học vụ cá nhân của riêng bạn"
                }
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  showToast("Đang tải lại nhật ký...", "info");
                  await onAddLog("Tải lại thủ công danh sách nhật ký giám sát");
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition active:scale-95 cursor-pointer border border-slate-200"
                title="Làm mới dòng sự kiện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {currentUser?.role === 'Admin' && (
                <>
                  <button
                    onClick={handleSyncToSupabase}
                    className="bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" /> Đồng bộ DB
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-red-200 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa nhật ký
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm thành viên hoặc hoạt động..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand-blue"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-blue"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Giáo viên">Giáo viên</option>
              <option value="Học sinh">Học sinh</option>
              <option value="Phụ huynh">Phụ huynh</option>
              <option value="Khách vãng lai">Khách vãng lai</option>
            </select>
          </div>

          {/* Logs Timeline list */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex-1 max-h-[480px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Activity className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold">Chưa có nhật ký tiến trình nào được ghi nhận</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
                  Cấp quyền camera giám sát và thực hiện thao tác trên cổng thông tin để xem dòng thời gian nhật ký của bạn tự động cập nhật!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 transition flex gap-3.5 items-start">
                    
                    {/* Log Avatar / Snap block */}
                    <div className="shrink-0 relative">
                      {log.snapshotUrl ? (
                        <div 
                          className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm cursor-zoom-in group relative"
                          onClick={() => setSelectedImage(log.snapshotUrl || null)}
                        >
                          <img 
                            src={log.snapshotUrl} 
                            alt="Snapshot" 
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Log info block */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <b className="text-xs text-slate-800">{log.username}</b>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.role === 'Admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                            log.role === 'Nhân viên' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            log.role === 'Giáo viên' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            log.role === 'Học sinh' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            log.role === 'Phụ huynh' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                            log.role === 'Khách' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {log.action}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span className="flex items-center gap-1">
                          ID: <span className="text-slate-500 font-bold">{log.id.slice(0, 8)}</span>
                        </span>
                        {log.snapshotUrl && (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Đã xác thực chân dung
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Modal overlay for expanding snapshot */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-xl w-full bg-slate-900 rounded-3xl border border-slate-800 p-2 overflow-hidden shadow-2xl">
            <img 
              src={selectedImage} 
              alt="Expanded snapshot" 
              className="w-full h-auto rounded-2xl border border-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              Ảnh chụp Webcam Giám sát Học vụ • Bấm bất kỳ đâu để đóng ảnh phóng to
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
