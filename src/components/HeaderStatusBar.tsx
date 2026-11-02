import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const HeaderStatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white/95 backdrop-blur-md text-slate-800 px-6 pt-3 pb-2 flex justify-between items-center text-xs font-heading z-30 select-none border-b border-slate-100/80 sticky top-0">
      <span className="font-bold font-mono tracking-tight text-slate-900">{time}</span>

      {/* Dynamic Island Pill */}
      <div className="w-24 h-4.5 bg-slate-900 rounded-full mx-auto flex items-center justify-between px-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
        </div>
        <span className="text-[8px] font-mono font-medium text-emerald-400 tracking-wider">LIVE</span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-700">
        <Signal className="w-3 h-3 text-slate-800" />
        <Wifi className="w-3 h-3 text-slate-800" />
        <div className="flex items-center gap-0.5">
          <BatteryMedium className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[9px] font-mono font-semibold text-slate-600">98%</span>
        </div>
      </div>
    </div>
  );
};
