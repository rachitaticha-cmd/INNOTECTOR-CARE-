import React from 'react';
import { Home, History as HistoryIcon, MessageSquare, User } from 'lucide-react';

export type ScreenTab = 'home' | 'history' | 'messages' | 'account';

interface BottomNavBarProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  activeQueueCount: number;
  unreadChatCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  activeQueueCount,
  unreadChatCount = 0,
}) => {
  const tabs = [
    { id: 'home' as ScreenTab, label: 'หน้าหลัก', icon: Home },
    { id: 'history' as ScreenTab, label: 'ประวัติ', icon: HistoryIcon, badge: activeQueueCount },
    { id: 'messages' as ScreenTab, label: 'ข้อความ', icon: MessageSquare, badge: unreadChatCount },
    { id: 'account' as ScreenTab, label: 'บัญชี', icon: User },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-100 h-16 absolute bottom-0 left-0 right-0 px-3 flex justify-around items-center text-slate-400 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 cursor-pointer ${
              isActive ? 'text-emerald-800 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] text-emerald-800' : 'stroke-[1.8px]'}`} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-heading mt-1 leading-tight">{tab.label}</span>
            {isActive && (
              <span className="w-1 h-1 bg-emerald-600 rounded-full mt-0.5 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
