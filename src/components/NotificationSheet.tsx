import React from 'react';
import { X, CheckCheck, Bell, MapPin, Sparkles } from 'lucide-react';
import { NotificationItem } from '../types';
import { markNotificationRead, saveNotifications } from '../services/storage';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onUpdateNotifications: (items: NotificationItem[]) => void;
  onNavigateTab?: (tab: 'home' | 'history' | 'messages' | 'account') => void;
  onTriggerGpsCheck?: () => void;
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({
  isOpen,
  onClose,
  notifications,
  onUpdateNotifications,
  onNavigateTab,
  onTriggerGpsCheck,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    onUpdateNotifications(updated);
  };

  const handleItemClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    const updated = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    onUpdateNotifications(updated);
    if (item.linkTab && onNavigateTab) {
      onClose();
      onNavigateTab(item.linkTab);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Bottom Sheet matching Screenshot */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[32px] p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300 border-t border-slate-100">
        {/* Top Drag Handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-3 shrink-0" />

        {/* Header matching Screenshot 151321 */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-extrabold text-base text-slate-900">
              การแจ้งเตือน
            </h3>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-emerald-700 font-bold hover:underline px-2 py-1 cursor-pointer"
              >
                อ่านทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto no-scrollbar divide-y divide-slate-100 text-xs">
          {notifications.map((item) => {
            const dotColor =
              item.color === 'amber'
                ? 'bg-amber-500'
                : item.color === 'emerald'
                ? 'bg-emerald-600'
                : item.color === 'sky'
                ? 'bg-sky-500'
                : item.color === 'rose'
                ? 'bg-rose-500'
                : 'bg-slate-400';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`py-3.5 flex items-start gap-3 cursor-pointer transition rounded-xl px-2 -mx-2 hover:bg-slate-50 ${
                  !item.read ? 'bg-emerald-50/30' : ''
                }`}
              >
                {/* Colored Bullet Dot matching Screenshot */}
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 mt-1.5`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className={`font-heading text-xs sm:text-sm text-slate-900 leading-snug ${
                        !item.read ? 'font-extrabold text-emerald-950' : 'font-bold'
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {item.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* GPS Quick Refresh Action in Notifications */}
        {onTriggerGpsCheck && (
          <div className="pt-3 mt-2 border-t border-slate-100 shrink-0">
            <button
              onClick={() => {
                onTriggerGpsCheck();
              }}
              className="w-full bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer font-heading"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>อัปเดตตำแหน่งพิกัด GPS สดเดี๋ยวนี้</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
