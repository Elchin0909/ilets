import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Printer, Calendar, Layers, Clock, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getGroups } from '../../api/groups';

export default function QrAttendancePage() {
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });

  const [selectedGroup, setSelectedGroup] = useState('');
  const [qrData, setQrData] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  function generateQR() {
    if (!selectedGroup) return;
    const sid = `att-${selectedGroup}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    setSessionId(sid);
    const data = JSON.stringify({
      type: 'ATTENDANCE',
      groupId: selectedGroup,
      sessionId: sid,
      timestamp: new Date().toISOString(),
      expiresIn: 300, // 5 minutes
    });
    setQrData(data);
  }

  function printQR() {
    if (!qrRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const group = groups.find((g) => g.id === selectedGroup);
    printWindow.document.write(`
      <html><head><title>QR Davomat - ${group?.name || ''}</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 24px; color: #1f2937; margin-bottom: 8px; }
        p { color: #6b7280; font-size: 14px; }
        .qr-container { margin: 30px auto; }
        .info { margin-top: 20px; padding: 16px; background: #f3f4f6; border-radius: 12px; display: inline-block; }
      </style></head>
      <body>
        <h1>Davomat QR Kodi</h1>
        <p>${group?.name || 'Guruh'} — ${new Date().toLocaleDateString('uz-UZ')}</p>
        <div class="qr-container">${qrRef.current.innerHTML}</div>
        <div class="info">
          <p><strong>Guruh:</strong> ${group?.name}</p>
          <p><strong>Sana:</strong> ${new Date().toLocaleDateString('uz-UZ')}</p>
          <p><strong>Amal qilish:</strong> 5 daqiqa</p>
        </div>
        <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <QrCode size={20} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">QR Davomat</h1>
          <p className="text-sm text-gray-500">Guruh uchun QR kod yaratib, davomatni oling</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Group selection */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <Layers size={14} /> Guruhni tanlang
          </label>
          <select
            value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setQrData(null); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tanlang...</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name} {g.teacherName ? `(${g.teacherName})` : ''}</option>)}
          </select>
        </div>

        {/* Generate button */}
        <button
          onClick={generateQR}
          disabled={!selectedGroup}
          className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition disabled:opacity-50 mb-6"
        >
          <QrCode size={18} /> QR Kod Yaratish
        </button>

        {/* QR Code display */}
        {qrData && (
          <div className="text-center">
            <div ref={qrRef} className="inline-block bg-white p-6 rounded-2xl border-2 border-gray-100">
              <QRCodeSVG value={qrData} size={240} level="H" includeMargin />
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date().toLocaleDateString('uz-UZ')}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> 5 daqiqa amal qiladi</span>
            </div>

            <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
              Session: {sessionId.substring(0, 20)}...
            </div>

            <div className="flex gap-3 mt-5 justify-center">
              <button onClick={printQR} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                <Printer size={16} /> Chop etish
              </button>
              <button onClick={generateQR} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition">
                <RefreshCw size={16} /> Yangilash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
