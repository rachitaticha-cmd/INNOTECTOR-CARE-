import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Smartphone,
} from 'lucide-react';
import { DEMO_USERS } from '../data/mockData';
import { UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Main screen mode: 'main_form' (matches Screenshot 120040), 'google_sheet', 'line_sheet', 'apple_sheet'
  const [activeModal, setActiveModal] = useState<'none' | 'google' | 'apple' | 'line'>('none');
  const [isSignUp, setIsSignUp] = useState<boolean>(true);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email continue submission
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมลของคุณ');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setErrorMsg('รูปแบบอีเมลไม่ถูกต้อง (เช่น email@domain.com)');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Determine if demo user or new user
      const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        onLoginSuccess(matched);
      } else {
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          name: fullName.trim() || 'ผู้ใช้งาน',
          email: email.trim(),
          hn: `67-${Math.floor(100000 + Math.random() * 900000)}`,
          nationalId: '1-1004-98765-43-2',
          age: 30,
          gender: 'ชาย',
          bloodType: 'O',
          heightCm: 170,
          weightKg: 65,
          bmi: 22.5,
          drugAllergies: ['ไม่มีประวัติแพ้ยา'],
          chronicDiseases: ['ไม่มี'],
          medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
          assignedHospital: 'โรงพยาบาลราชพิพัฒน์',
          secondaryHospital: 'โรงพยาบาลศิริราช (รับส่งต่อ)',
          emergencyContact: {
            name: 'ผู้ติดต่อฉุกเฉิน',
            relationship: 'ครอบครัว',
            phone: '081-234-5678',
          },
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        };
        onLoginSuccess(newUser);
      }
    }, 600);
  };

  // Google account selection
  const handleGoogleSelect = (user: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user);
    }, 600);
  };

  // Apple login simulation
  const handleAppleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const appleUser: UserProfile = {
        id: `apple-user-${Date.now()}`,
        name: 'ผู้ใช้งาน',
        email: 'user.apple@privaterelay.appleid.com',
        hn: '67-009412',
        nationalId: '1-1004-98765-43-2',
        age: 28,
        gender: 'ชาย',
        bloodType: 'O',
        heightCm: 175,
        weightKg: 68,
        bmi: 22.2,
        drugAllergies: ['ไม่มีประวัติแพ้ยา'],
        chronicDiseases: ['ไม่มี'],
        medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
        assignedHospital: 'โรงพยาบาลราชพิพัฒน์',
        secondaryHospital: 'โรงพยาบาลศิริราช (รับส่งต่อ)',
        emergencyContact: {
          name: 'ผู้ติดต่อฉุกเฉิน',
          relationship: 'ครอบครัว',
          phone: '081-234-5678',
        },
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AppleUser',
      };
      onLoginSuccess(appleUser);
    }, 600);
  };

  // LINE login simulation
  const handleLineLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const lineUser: UserProfile = {
        id: `line-user-${Date.now()}`,
        name: 'ผู้ใช้งาน',
        email: 'line.user@line.me',
        hn: '67-009412',
        nationalId: '1-1004-98765-43-2',
        age: 29,
        gender: 'หญิง',
        bloodType: 'B',
        heightCm: 162,
        weightKg: 52,
        bmi: 19.8,
        drugAllergies: ['ไม่มีประวัติแพ้ยา'],
        chronicDiseases: ['ไม่มี'],
        medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
        assignedHospital: 'โรงพยาบาลราชพิพัฒน์',
        emergencyContact: {
          name: 'ผู้ติดต่อฉุกเฉิน',
          relationship: 'ครอบครัว',
          phone: '089-876-5432',
        },
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LineUser',
      };
      onLoginSuccess(lineUser);
    }, 600);
  };

  // Facebook login simulation
  const handleFacebookLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const fbUser: UserProfile = {
        id: `fb-user-${Date.now()}`,
        name: 'ผู้ใช้งาน',
        email: 'user.fb@facebook.com',
        hn: '67-009412',
        nationalId: '1-1004-98765-43-2',
        age: 31,
        gender: 'ชาย',
        bloodType: 'O',
        heightCm: 172,
        weightKg: 66,
        bmi: 22.3,
        drugAllergies: ['ไม่มีประวัติแพ้ยา'],
        chronicDiseases: ['ไม่มี'],
        medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
        assignedHospital: 'โรงพยาบาลราชพิพัฒน์',
        emergencyContact: {
          name: 'ผู้ติดต่อฉุกเฉิน',
          relationship: 'ครอบครัว',
          phone: '081-234-5678',
        },
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FbUser',
      };
      onLoginSuccess(fbUser);
    }, 600);
  };

  return (
    <div className="relative min-h-full h-full flex flex-col justify-between bg-gradient-to-b from-[#113824] via-[#16472f] to-[#0f2e21] text-white select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header exactly matching Screenshot 120040 */}
      <div className="pt-12 sm:pt-16 pb-6 px-6 text-center flex flex-col items-center justify-center relative z-10">
        {/* The + App Logo */}
        <div className="w-20 h-20 rounded-[26px] bg-white text-emerald-950 shadow-2xl flex items-center justify-center mb-4 transition transform hover:scale-105 border border-white/90">
          <Plus className="w-11 h-11 text-slate-800 stroke-[3.5]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
          Inotector Care
        </h1>
        <p className="text-xs sm:text-sm text-[#bcd9c9] font-medium mt-1">
          AI Smart Triage System
        </p>
      </div>

      {/* Bottom Container Card matching Screenshot 120040 */}
      <div className="relative z-20 flex-1 flex flex-col justify-end">
        <div className="bg-white text-slate-800 rounded-t-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.5)] p-6 sm:p-7 space-y-4 animate-in slide-in-from-bottom duration-300">
          {/* Card Title & Subtitle */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-extrabold font-heading text-slate-900">
                {isSignUp ? 'Create an account' : 'Sign in to account'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {isSignUp ? 'Enter your email to sign up for this app' : 'Enter your email to continue'}
            </p>
          </div>

          {/* Email input form matching Screenshot */}
          <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="email@domain.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1c4c39] focus:border-transparent transition shadow-xs"
              />
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1c4c39] hover:bg-[#153c2c] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-sm font-heading flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>

          {/* Divider "or" */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 font-medium">or</span>
          </div>

          {/* Social Auth Buttons matching Screenshot_20261101_161202_Chrome.jpg: Google, Apple, LINE, Facebook */}
          <div className="space-y-2.5">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => setActiveModal('google')}
              className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm font-heading flex items-center justify-center gap-3 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Continue with Apple */}
            <button
              type="button"
              onClick={handleAppleLogin}
              className="w-full py-3 px-4 rounded-2xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.87-14.23-7.52-11.41-13.19-24.58-17.02-39.5-3.83-14.92-5.75-28.7-5.75-41.34 0-14.59 3.37-26.68 10.12-36.27 6.74-9.59 15.54-14.49 26.39-14.7 4.8 0 10.12 1.25 15.96 3.75 5.85 2.5 9.77 3.86 11.77 4.08 2.45-.43 6.64-1.89 12.57-4.38 5.93-2.49 11.02-3.64 15.26-3.46 11.64.65 20.89 4.89 27.76 12.71-9.9 6-14.74 14.37-14.53 25.13.22 8.49 3.47 15.68 9.77 21.57 6.3 5.88 13.82 9.29 22.56 10.22-2.18 6.75-4.8 13.62-7.85 20.61zM119.22 31.86c0-7.39 2.65-14.45 7.96-21.17 5.3-6.73 11.87-10.69 19.7-11.89.22 1.09.33 2.18.33 3.27 0 7.39-2.73 14.34-8.17 20.84-5.45 6.5-12 10.42-19.64 11.77-.07-.94-.18-1.88-.18-2.82z" />
              </svg>
              <span>Continue with Apple</span>
            </button>

            {/* Continue with LINE */}
            <button
              type="button"
              onClick={handleLineLogin}
              className="w-full py-3 px-4 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-[#06C755] font-extrabold text-[9px] tracking-tighter">LINE</span>
              </div>
              <span>Continue with LINE</span>
            </button>

            {/* Continue with Facebook */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>
          </div>

          {/* Toggle between Create Account / Sign In */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-emerald-800 font-semibold hover:underline cursor-pointer"
            >
              {isSignUp
                ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่'
                : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่'}
            </button>
          </div>

          {/* Legal Terms Footer matching Screenshot_20261101_161202_Chrome.jpg */}
          <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
            การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว
          </p>
        </div>
      </div>

      {/* ================= GOOGLE ACCOUNT CHOOSER SHEET MODAL ================= */}
      {activeModal === 'google' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 text-slate-800 animate-in slide-in-from-bottom duration-200">
            {/* Google Colorful G Logo */}
            <div className="text-center mb-4 relative">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="absolute top-0 right-0 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="font-heading font-bold text-base text-slate-900">เลือกบัญชี</h3>
              <p className="text-xs text-slate-500 mt-0.5">เพื่อดำเนินการต่อไปยัง Inotector Care</p>
            </div>

            {isLoading ? (
              <div className="py-8 space-y-2 text-center">
                <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium">กำลังเข้าสู่ระบบ...</p>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-slate-100">
                {/* Account 1: Blue circle with 'ผ' -> ผู้ใช้งาน */}
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleSelect({
                      ...DEMO_USERS[0],
                      name: 'ผู้ใช้งาน',
                    })
                  }
                  className="w-full py-3 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-2xl transition cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    ผ
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      ผู้ใช้งาน Inotector
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      user.demo@gmail.com
                    </p>
                  </div>
                </button>

                {/* Account 2: Green circle with 'ส' -> สมชาย ใจดี */}
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleSelect({
                      ...DEMO_USERS[0],
                      name: 'สมชาย ใจดี',
                    })
                  }
                  className="w-full py-3 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-2xl transition cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#188038] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    ส
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      สมชาย ใจดี
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      somchai.jaidee@gmail.com
                    </p>
                  </div>
                </button>

                {/* Use Another Account Row */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('none');
                    setEmail('');
                  }}
                  className="w-full py-3 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-2xl transition cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      ใช้บัญชีอื่น (กรอกอีเมล)
                    </p>
                  </div>
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
