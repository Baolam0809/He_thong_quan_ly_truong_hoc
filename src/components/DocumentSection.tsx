import React, { useState } from 'react';
import { FolderCheck, UploadCloud, Search, Eye, Download } from 'lucide-react';
import { DocumentItem, Account } from '../types';
import { triggerDownload } from '../utils';
import { showToast } from './Toast';

interface DocumentSectionProps {
  currentUser: Account | null;
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  onOpenUploadDoc: () => void;
  onSyncDocumentToNotification?: (doc: DocumentItem) => void;
}

export default function DocumentSection({
  currentUser,
  documents,
  setDocuments,
  onOpenUploadDoc,
  onSyncDocumentToNotification,
}: DocumentSectionProps) {
  const [activeFilter, setActiveTabFilter] = useState<'all' | 'Cấp Sở/Bộ' | 'Cấp UBND xã' | 'Cấp Trường'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const canUpload = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Giáo viên');

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = activeFilter === 'all' || doc.category === activeFilter;
    const matchesKeyword = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesKeyword;
  });

  const handleDownload = (doc: DocumentItem) => {
    if (doc.file?.content) {
      const a = document.createElement('a');
      a.href = doc.file.content;
      a.download = doc.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Đã tải về tệp tin: ${doc.title.slice(0, 30)}...`, "success");
    } else {
      triggerDownload(doc.file?.name || `${doc.title}.doc`, `Nội dung chính thức: ${doc.title}. Bản ban hành chính thức cấp ${doc.category}.`);
      showToast(`Đã tải về tệp tin: ${doc.title.slice(0, 30)}...`, "success");
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
      <div className="flex justify-between items-center border-b pb-3 mb-4 flex-wrap gap-2">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <FolderCheck className="w-5 h-5 text-brand-orange" />
          Quản lý Văn bản chỉ đạo, Quy định và Tài liệu học vụ
        </h3>
        
        {canUpload && (
          <button
            onClick={onOpenUploadDoc}
            className="bg-brand-orange hover:bg-brand-orange-dark text-white text-xs px-4 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Tải lên văn bản mới
          </button>
        )}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
        <div className="flex flex-wrap gap-1.5" id="doc-filter-tabs">
          {(['all', 'Cấp Sở/Bộ', 'Cấp UBND xã', 'Cấp Trường'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTabFilter(tab)}
              className={`doc-tab px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === tab
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'all' ? 'Tất cả' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm tên văn bản quy định..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Docs Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-150 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold uppercase text-[10px]">
              <th className="p-3 w-3/4">Tên Quyết định / Văn bản ban hành</th>
              <th className="p-3 text-center">Gửi ngày</th>
              <th className="p-3 text-right">Tập tin liên kết</th>
            </tr>
          </thead>
          <tbody id="documents-table-body" className="divide-y divide-slate-100 font-medium">
            {filteredDocs.length ? (
              filteredDocs.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-slate-50/50 transition">
                  <td className="p-3">
                    <span className="font-extrabold text-slate-800 text-[11.5px] block">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-450 block font-bold mt-0.5">
                      Ban hành: <b className="text-brand-orange">{doc.category}</b>
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-550 font-mono font-semibold">
                    {doc.date}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap md:flex-nowrap">
                      {canUpload && onSyncDocumentToNotification && (
                        <button
                          onClick={() => onSyncDocumentToNotification(doc)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/60 font-extrabold cursor-pointer flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-150 transition-all text-[11px]"
                          title="Đồng bộ ngay sang mục Thông báo & Tin giáo vụ"
                        >
                          Đồng bộ TB
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-brand-blue hover:text-brand-blue-dark hover:underline font-extrabold cursor-pointer flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 hover:border-brand-blue transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về tệp ({doc.file ? doc.file.size : '1.2 MB'})</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-400 font-bold italic">
                  Không tìm thấy hướng dẫn văn bản nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
