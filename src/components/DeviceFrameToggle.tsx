import React from 'react';
import { Smartphone, Monitor, Volume2, VolumeX, UserCheck, FastForward } from 'lucide-react';
import { DEMO_USERS } from '../data/mockData';
import { UserProfile } from '../types';
import { InotectorIcon } from './InotectorLogo';

interface DeviceFrameToggleProps {
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  currentUser: UserProfile;
  onSwitchUser: (userId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAdvanceActiveQueue: () => void;
  hasActiveQueue: boolean;
}

export const DeviceFrameToggle: React.FC<DeviceFrameToggleProps> = ({
  isMobileFrame,
  onToggleFrame,
  currentUser,
  onSwitchUser,
  soundEnabled,
  onToggleSound,
  onAdvanceActiveQueue,
  hasActiveQueue,
}) => {
  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-300 py-2 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs z-50 select-none">
      {/* App Branding & Tag */}
      <div className="flex items-center gap-2">
        <InotectorIcon size={24} />
        <div className="flex items-center">
          <span className="font-heading font-bold text-white text-xs sm:text-sm">Inotector Care</span>
          <span className="hidden sm:inline-block ml-2 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
            Smart Triage & Area Queue System
          </span>
        </div>
      </div>

      {/* Simulator Control Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
        {/* User Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400 hidden md:inline">ผู้ใช้:</span>
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="bg-transparent text-emerald-300 text-[11px] font-medium focus:outline-none cursor-pointer"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                {u.name} (HN: {u.hn})
              </option>
            ))}
          </select>
        </div>

        {/* Simulate Queue Advancement Button */}
        {hasActiveQueue && (
          <button
            onClick={onAdvanceActiveQueue}
            title="จำลองโรงพยาบาลเรียกคิวถัดไป เพื่อดูการอัปเดตแบบเรียลไทม์"
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white px-2.5 py-1 rounded-xl text-[11px] font-medium transition shadow-xs"
          >
            <FastForward className="w-3 h-3 text-emerald-200" />
            <span className="hidden sm:inline">จำลองเรียกคิว</span>
          </button>
        )}

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'ปิดเสียงการแจ้งเตือน' : 'เปิดเสียงการแจ้งเตือน'}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Frame Toggle */}
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white px-2.5 py-1 rounded-xl transition border border-slate-700 text-[11px]"
          title="สลับมุมมองระหว่างกรอบสมาร์ทโฟนและแดชบอร์ดเต็มจอ"
        >
          {isMobileFrame ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">โหมดจอเต็ม</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">โหมดสมาร์ทโฟน</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
