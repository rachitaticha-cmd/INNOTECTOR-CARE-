import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  Smartphone,
  ExternalLink,
  FolderGit2,
  Play,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

import appTsxRaw from '../App.tsx?raw';
import mockDataRaw from '../data/mockData.ts?raw';
import storageRaw from '../services/storage.ts?raw';
import homeViewRaw from '../views/HomeView.tsx?raw';
import triageViewRaw from '../views/TriageView.tsx?raw';
import chatViewRaw from '../views/ChatView.tsx?raw';
import historyViewRaw from '../views/HistoryView.tsx?raw';
import profileViewRaw from '../views/ProfileView.tsx?raw';
import mapViewRaw from '../views/NearbyHospitalsMapView.tsx?raw';
import typesRaw from '../types/index.ts?raw';
import packageJsonRaw from '../../package.json?raw';
import readmeRaw from '../../README.md?raw';

interface FileItem {
  id: string;
  name: string;
  path: string;
  category: 'mobile_ready' | 'components' | 'logic' | 'config';
  description: string;
  badge?: string;
  content: string;
  downloadFilename: string;
  mimeType: string;
}

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('standalone_html');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'mobile_guide' | 'live_edit'>('code');
  const [liveEditContent, setLiveEditContent] = useState<string>('');
  const [previewActive, setPreviewActive] = useState<boolean>(false);
  const [standaloneHtmlContent, setStandaloneHtmlContent] = useState<string>('');
  const [loadingStandalone, setLoadingStandalone] = useState<boolean>(false);

  // Fetch standalone HTML once
  React.useEffect(() => {
    if (isOpen && !standaloneHtmlContent) {
      setLoadingStandalone(true);
      fetch('/innotector_care_standalone.html')
        .then((res) => res.text())
        .then((text) => {
          setStandaloneHtmlContent(text);
          setLiveEditContent(text);
          setLoadingStandalone(false);
        })
        .catch(() => {
          setLoadingStandalone(false);
        });
    }
  }, [isOpen, standaloneHtmlContent]);

  if (!isOpen) return null;

  const files: FileItem[] = [
    {
      id: 'standalone_html',
      name: 'innotector_care_standalone.html',
      path: '/public/innotector_care_standalone.html',
      category: 'mobile_ready',
      badge: 'แนะนำสำหรับมือถือ 🔥',
      description: 'ไฟล์เดี่ยว HTML + JS + CSS รวมจบในไฟล์เดียว เปิดแก้ในมือถือได้เลย ไม่ต้องลง Node.js',
      content: standaloneHtmlContent || '<!-- กำลังโหลดไฟล์... -->',
      downloadFilename: 'innotector_care_standalone.html',
      mimeType: 'text/html',
    },
    {
      id: 'app_tsx',
      name: 'App.tsx (Main App)',
      path: '/src/App.tsx',
      category: 'components',
      description: 'ไฟล์คอนโทรลเลอร์หลักของแอป React จัดการ State, Tab, Queue, Notification',
      content: appTsxRaw,
      downloadFilename: 'App.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'triage_view',
      name: 'TriageView.tsx (AI Triage)',
      path: '/src/views/TriageView.tsx',
      category: 'components',
      description: 'หน้าประเมินอาการ AI Smart Triage 5 ระดับความฉุกเฉิน (แดง, ชมพู, เหลือง, เขียว, ขาว)',
      content: triageViewRaw,
      downloadFilename: 'TriageView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'home_view',
      name: 'HomeView.tsx (Dashboard)',
      path: '/src/views/HomeView.tsx',
      category: 'components',
      description: 'หน้าหลักแสดงสถานะคิวสด แผนที่โรงพยาบาลใกล้เคียง ปุ่มประเมินอาการด่วน',
      content: homeViewRaw,
      downloadFilename: 'HomeView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'chat_view',
      name: 'ChatView.tsx (Telemedicine)',
      path: '/src/views/ChatView.tsx',
      category: 'components',
      description: 'ระบบแชทปรึกษาแพทย์ ส่งต่อสรุปอาการ พร้อมเสียงแจ้งเตือนข้อความ',
      content: chatViewRaw,
      downloadFilename: 'ChatView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'map_view',
      name: 'NearbyHospitalsMapView.tsx',
      path: '/src/views/NearbyHospitalsMapView.tsx',
      category: 'components',
      description: 'แผนที่โรงพยาบาล Leaflet พร้อมระบบคำนวณระยะทางจาก GPS จริง',
      content: mapViewRaw,
      downloadFilename: 'NearbyHospitalsMapView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'history_view',
      name: 'HistoryView.tsx (Queues)',
      path: '/src/views/HistoryView.tsx',
      category: 'components',
      description: 'ประวัติการรับบริการ ใบสั่งยา และจัดการคิวที่กำลังรอรับบริการ',
      content: historyViewRaw,
      downloadFilename: 'HistoryView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'profile_view',
      name: 'ProfileView.tsx (Settings)',
      path: '/src/views/ProfileView.tsx',
      category: 'components',
      description: 'โปรไฟล์ บันทึกน้ำหนัก BMI สิทธิการรักษา และดาวน์โหลดข้อมูล',
      content: profileViewRaw,
      downloadFilename: 'ProfileView.tsx',
      mimeType: 'text/plain',
    },
    {
      id: 'mock_data',
      name: 'mockData.ts (Data & Hospitals)',
      path: '/src/data/mockData.ts',
      category: 'logic',
      description: 'ข้อมูลโรงพยาบาล 15 เขต กทม., สิทธิรักษา, หมอ, ยา, ตัวจำลอง',
      content: mockDataRaw,
      downloadFilename: 'mockData.ts',
      mimeType: 'text/plain',
    },
    {
      id: 'storage',
      name: 'storage.ts (Storage & Sound)',
      path: '/src/services/storage.ts',
      category: 'logic',
      description: 'ระบบบันทึกข้อมูล LocalStorage, เสียงแจ้งเตือน Web Audio API, การคำนวณคิว',
      content: storageRaw,
      downloadFilename: 'storage.ts',
      mimeType: 'text/plain',
    },
    {
      id: 'types',
      name: 'types/index.ts',
      path: '/src/types/index.ts',
      category: 'logic',
      description: 'TypeScript Interfaces & Data Models ทั้งหมดในระบบ',
      content: typesRaw,
      downloadFilename: 'index.ts',
      mimeType: 'text/plain',
    },
    {
      id: 'package_json',
      name: 'package.json',
      path: '/package.json',
      category: 'config',
      description: 'รายการแพ็กเกจ Dependencies และสคริปต์คำสั่งรัน',
      content: packageJsonRaw,
      downloadFilename: 'package.json',
      mimeType: 'application/json',
    },
    {
      id: 'readme',
      name: 'README.md',
      path: '/README.md',
      category: 'config',
      description: 'คู่มือวิธีติดตั้งและรันโปรเจกต์',
      content: readmeRaw,
      downloadFilename: 'README.md',
      mimeType: 'text/markdown',
    },
  ];

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = (file: FileItem) => {
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEditedFile = () => {
    const blob = new Blob([liveEditContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_edited_innotector_care.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-[28px] max-w-4xl w-full h-[92vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm sm:text-base text-white truncate">
                  คลังซอร์สโค้ด & วิธีแก้บนมือถือ
                </h3>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  All Files Included
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                เลือกดูโค้ดทุกไฟล์, คัดลอก, ดาวน์โหลด หรือแก้สดบนมือถือได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/innotector-care-source.zip"
              download="innotector-care-source.zip"
              className="hidden md:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition shadow-xs"
              title="ดาวน์โหลดทั้งโฟลเดอร์โปรเจกต์ .ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>โหลดทั้งโปรเจกต์ (.ZIP)</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 py-1.5 gap-2 shrink-0 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => {
              setActiveTab('code');
              setPreviewActive(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>ดูโค้ดรายไฟล์ ({files.length} ไฟล์)</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'mobile_guide'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>วิธีแก้โค้ดบนมือถือ (Android & iOS)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('live_edit');
              if (!liveEditContent && standaloneHtmlContent) {
                setLiveEditContent(standaloneHtmlContent);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer font-medium ${
              activeTab === 'live_edit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>ทดลองแก้โค้ดสด (Live Editor)</span>
          </button>
        </div>

        {/* Tab 1: Code Viewer */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* File List Sidebar */}
            <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-2 overflow-y-auto no-scrollbar shrink-0 max-h-48 md:max-h-full">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>เลือกไฟล์ที่จะดู</span>
                <span className="text-emerald-400 font-mono">แตะเพื่อเปิด</span>
              </div>
              <div className="space-y-1">
                {files.map((file) => {
                  const isSelected = file.id === selectedFileId;
                  return (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`w-full text-left p-2 rounded-xl transition flex flex-col gap-0.5 cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-medium truncate">{file.name}</span>
                        {file.badge && (
                          <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-sans font-semibold shrink-0">
                            {file.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{file.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Direct Standalone Launch Banner */}
              <div className="mt-3 p-2.5 bg-gradient-to-br from-emerald-950/60 to-slate-900 rounded-xl border border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>เปิดไฟล์เดี่ยวบนมือถือ</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  มีไฟล์ HTML รวมทั้งหมด 1 ไฟล์ ไม่ต้องพึ่งพา Node.js เซฟลงมือถือแล้วแตะเปิดได้เลย
                </p>
                <a
                  href="/innotector_care_standalone.html"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition text-center"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>เปิดดูในแท็บใหม่ทันที</span>
                </a>
              </div>
            </div>

            {/* Code Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
              {/* File Info Bar */}
              <div className="p-2.5 sm:p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm text-emerald-400 font-bold truncate">
                      {currentFile.path}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      {currentFile.content.length.toLocaleString()} ตัวอักษร
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {currentFile.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyCode(currentFile.content)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl transition border border-slate-700 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>คัดลอกโค้ด</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadSingleFile(currentFile)}
                    className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs px-2.5 py-1.5 rounded-xl transition font-medium cursor-pointer shadow-xs"
                    title="ดาวน์โหลดไฟล์นี้ลงเครื่องมือถือ"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดไฟล์นี้</span>
                  </button>
                </div>
              </div>

              {/* Code Text Box */}
              <div className="flex-1 overflow-auto p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-slate-200 select-text bg-[#070d19]">
                {loadingStandalone && currentFile.id === 'standalone_html' ? (
                  <div className="text-center py-10 text-slate-400">กำลังโหลดโค้ด...</div>
                ) : (
                  <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                    {currentFile.content}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile Guide */}
        {activeTab === 'mobile_guide' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-300">
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-800/60 space-y-2">
              <span className="text-xl">📱</span>
              <h4 className="font-heading font-bold text-base text-white">
                วิธีเปิดดูและแก้ไขโค้ดโปรเจกต์นี้บนมือถืออย่างง่ายที่สุด
              </h4>
              <p className="text-slate-300 leading-relaxed text-xs">
                โปรเจกต์ปกติที่ใช้ React + Vite มักจะต้องรันผ่านคอมพิวเตอร์เพราะต้องใช้ Node.js และ npm แต่เราได้เตรียม
                <strong className="text-emerald-400"> "ไฟล์เดี่ยว Standalone HTML" </strong> 
                ที่รวมโครงสร้าง HTML, CSS, JavaScript และ Logic ทั้งหมดไว้ในไฟล์เดียว เพื่อให้คุณสามารถเปิดแก้ไขบนมือถือได้ทันที 100%!
              </p>
            </div>

            {/* Steps for Android */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  🤖
                </span>
                <h5 className="font-heading font-bold text-sm text-white">
                  สำหรับโทรศัพท์ Android (แนะนำที่สุด)
                </h5>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  <strong>ดาวน์โหลดไฟล์เดี่ยว:</strong> กดดาวน์โหลดไฟล์{' '}
                  <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">
                    innotector_care_standalone.html
                  </code>{' '}
                  จากหน้านี้ลงในเครื่องมือถือ
                </li>
                <li>
                  <strong>ติดตั้งแอปแก้ไขโค้ดฟรีบน Play Store:</strong>
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-400">
                    <li>
                      <strong className="text-emerald-300">Acode</strong> (แนะนำอันดับ 1 — รองรับ Syntax Highlight สวยงาม มีปุ่มกด Run ดูผลลัพธ์ในตัว)
                    </li>
                    <li>
                      <strong className="text-emerald-300">QuickEdit Text Editor</strong> หรือ <strong className="text-emerald-300">TrebEdit</strong>
                    </li>
                    <li>
                      <strong className="text-emerald-300">Spck Code Editor</strong>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>เปิดไฟล์และแก้ไข:</strong> เปิดแอป Acode แล้วกดเปิดไฟล์{' '}
                  <code>innotector_care_standalone.html</code> ที่ดาวน์โหลดไว้ สามารถแก้ไขข้อความ, เปลี่ยนสี, เพิ่มเมนูได้ทันที
                </li>
                <li>
                  <strong>ดูผลลัพธ์:</strong> ในแอป Acode หรือ TrebEdit จะมีปุ่ม Play ▶️ ให้กดดูหน้าเว็บจริงได้ทันที หรือเปิดไฟล์ผ่านแอป Google Chrome บนมือถือได้เลย!
                </li>
              </ol>
            </div>

            {/* Steps for iPhone / iPad */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  🍎
                </span>
                <h5 className="font-heading font-bold text-sm text-white">
                  สำหรับ iPhone / iPad (iOS)
                </h5>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  <strong>ดาวน์โหลดไฟล์:</strong> กดดาวน์โหลดไฟล์{' '}
                  <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">
                    innotector_care_standalone.html
                  </code>{' '}
                  จะถูกบันทึกไว้ในแอป "Files" (ไฟล์) ในโฟลเดอร์ Downloads
                </li>
                <li>
                  <strong>ติดตั้งแอปแก้ไขโค้ดฟรีบน App Store:</strong>
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-400">
                    <li>
                      <strong className="text-sky-300">Koder Code Editor</strong> (ฟรี รองรับเปิดและรันดูหน้าเว็บในตัว)
                    </li>
                    <li>
                      <strong className="text-sky-300">Runestone Text Editor</strong> หรือ <strong className="text-sky-300">Kodex</strong>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>เปิดและแก้ไข:</strong> เปิดไฟล์ผ่าน Koder แก้ไขโค้ดแล้วกดสลับดู Preview ในตัวได้ทันที
                </li>
              </ol>
            </div>

            {/* Online Mobile Editors */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <h5 className="font-heading font-bold text-sm text-white">
                  ตัวเลือกแก้ผ่านเว็บเบราว์เซอร์มือถือ (ไม่ต้องโหลดแอปเพิ่ม)
                </h5>
              </div>
              <p className="text-slate-400 leading-relaxed">
                คุณสามารถก็อปปี้โค้ดจากแท็บ "ดูโค้ดรายไฟล์" แล้วนำไปวางในเว็บเขียนโค้ดออนไลน์บนเบราว์เซอร์มือถือได้ฟรี เช่น:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href="https://codepen.io/pen/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs text-slate-200 transition"
                >
                  <div>
                    <span className="font-bold text-white block">CodePen.io</span>
                    <span className="text-[10px] text-slate-400">วางโค้ด HTML แล้วเห็นผลลัพธ์ทันที</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="https://stackblitz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs text-slate-200 transition"
                >
                  <div>
                    <span className="font-bold text-white block">StackBlitz.com</span>
                    <span className="text-[10px] text-slate-400">รัน React + Vite เต็มรูปแบบบนเบราว์เซอร์</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Live Editor right in app */}
        {activeTab === 'live_edit' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
            <div className="p-2.5 sm:p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 shrink-0">
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-white">
                  แก้ไขโค้ด Standalone HTML สดในเบราว์เซอร์นี้
                </h4>
                <p className="text-[10px] text-slate-400">
                  แก้ไขข้อความ สี หรือปุ่ม แล้วกด &quot;ดูผลลัพธ์&quot; หรือดาวน์โหลดไฟล์ที่แก้ไขแล้ว
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewActive(!previewActive)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition font-medium cursor-pointer ${
                    previewActive
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{previewActive ? 'กลับไปหน้าโค้ด' : 'ดูผลลัพธ์พรีวิว'}</span>
                </button>

                <button
                  onClick={handleDownloadEditedFile}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>บันทึกไฟล์ที่แก้แล้ว</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              {previewActive ? (
                <iframe
                  srcDoc={liveEditContent}
                  title="Live Preview"
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              ) : (
                <textarea
                  value={liveEditContent}
                  onChange={(e) => setLiveEditContent(e.target.value)}
                  className="w-full h-full p-3 sm:p-4 bg-[#070d19] text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                  placeholder="กำลังโหลดโค้ด..."
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>มีครบทุกไฟล์: React, TypeScript, Standalone HTML & Asset ทั้งหมด</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/innotector_care_standalone.html"
              download="innotector_care_standalone.html"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Download className="w-3 h-3" />
              <span>ดาวน์โหลดไฟล์เดี่ยวมือถือ (.html)</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="/innotector-care-source.zip"
              download="innotector-care-source.zip"
              className="text-slate-300 hover:underline flex items-center gap-1"
            >
              <FolderGit2 className="w-3 h-3 text-emerald-400" />
              <span>ไฟล์โปรเจกต์เต็ม (.zip)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
