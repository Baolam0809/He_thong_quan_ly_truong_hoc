import * as XLSX from 'xlsx';

/**
 * Triggers a download of a custom string blob (e.g. for .doc Word files)
 */
export function triggerDownload(filename: string, content: string, mimeType: string = 'application/msword;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a Word Document (.doc) from HTML content
 */
export function exportToWord(filename: string, title: string, htmlBody: string) {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; padding: 30px; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .m-b { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #1e3a8a; color: white; padding: 10px; border: 1px solid #000000; text-align: left; }
        td { border: 1px solid #000000; padding: 10px; text-align: left; }
      </style>
    </head>
    <body>
      ${htmlBody}
    </body>
    </html>
  `;
  triggerDownload(filename, htmlContent);
}

/**
 * Generates and downloads an Excel file using SheetJS
 */
export function exportToExcel(filename: string, sheets: { name: string; data: any[] }[]) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  XLSX.writeFile(wb, filename);
}

/**
 * Open a window for clean, print-friendly presentation and triggers browser print
 */
export function triggerPrintWindow(title: string, printableHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Vui lòng cho phép popup để xuất và in tài liệu.");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <link href="https://cdn.tailwindcss.com" rel="stylesheet">
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; background-color: #fff; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print mb-6 text-center">
          <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition mr-3">
            In tài liệu này
          </button>
          <button onclick="window.close()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-2.5 rounded-lg transition">
            Đóng cửa sổ
          </button>
        </div>
        <div>
          ${printableHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
