import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type AuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { InotectorIcon } from '../components/InotectorLogo';

interface LoginViewProps {
  externalError?: string | null;
  pendingVerificationUser?: FirebaseUser | null;
  onVerificationConfirmed?: () => Promise<void> | void;
}

type AuthMode = 'login' | 'register';
type SocialChannel = 'google' | 'line' | 'facebook' | 'apple';

export const LoginView: React.FC<LoginViewProps> = ({
  externalError,
  pendingVerificationUser,
  onVerificationConfirmed,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const mapFirebaseAuthError = (err: unknown, channelLabel?: string): string => {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: string }).code)
        : '';

    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return `ยกเลิกการเข้าสู่ระบบ${channelLabel ? `ด้วย ${channelLabel}` : ''} กรุณาลองใหม่อีกครั้ง`;
      case 'auth/popup-blocked':
        return 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปแล้วลองอีกครั้ง';
      case 'auth/unauthorized-domain':
        return 'โดเมนนี้ยังไม่ได้เพิ่มใน Authorized domains ของ Firebase Authentication Console';
      case 'auth/operation-not-allowed':
      case 'auth/configuration-not-found':
        return `ช่องทาง ${channelLabel || 'นี้'} ยังไม่ได้เปิดใช้งานใน Firebase Authentication Console (กรุณาเปิดใช้งานในหน้า Sign-in method ก่อน)`;
      case 'auth/account-exists-with-different-credential':
        return 'อีเมลนี้เคยลงทะเบียนด้วยช่องทางอื่นแล้ว กรุณาเข้าสู่ระบบด้วยช่องทางเดิมที่เคยใช้';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      case 'auth/invalid-email':
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาสลับไปหน้า "เข้าสู่ระบบ"';
      case 'auth/weak-password':
        return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      case 'auth/too-many-requests':
        return 'มีการทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      default:
        return `ไม่สามารถเข้าสู่ระบบ${channelLabel ? `ด้วย ${channelLabel}` : ''}ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง`;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (authMode === 'register' && password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoadingTarget('email');
    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        await sendEmailVerification(cred.user);
        setInfoMsg('สร้างบัญชีสำเร็จแล้ว กรุณาคลิกลิงก์ยืนยันในอีเมลของคุณก่อนเข้าใช้งาน');
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, 'อีเมล'));
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('กรุณากรอกอีเมลที่ต้องการรีเซ็ตรหัสผ่านก่อน');
      return;
    }
    setLoadingTarget('reset');
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoMsg(`ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${trimmedEmail} เรียบร้อยแล้ว`);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, 'อีเมล'));
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleSocialLogin = async (channel: SocialChannel) => {
    setErrorMsg('');
    setInfoMsg('');
    setLoadingTarget(channel);

    let provider: AuthProvider;
    let channelLabel = 'Google';

    if (channel === 'google') {
      provider = googleProvider;
      channelLabel = 'Google';
    } else if (channel === 'facebook') {
      const fbProvider = new FacebookAuthProvider();
      fbProvider.addScope('email');
      provider = fbProvider;
      channelLabel = 'Facebook';
    } else if (channel === 'apple') {
      const appleProvider = new OAuthProvider('apple.com');
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      provider = appleProvider;
      channelLabel = 'Apple';
    } else {
      const lineProvider = new OAuthProvider('oidc.line');
      lineProvider.addScope('openid');
      lineProvider.addScope('profile');
      lineProvider.addScope('email');
      provider = lineProvider;
      channelLabel = 'LINE';
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, channelLabel));
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationUser) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoadingTarget('resend');
    try {
      await sendEmailVerification(pendingVerificationUser);
      setInfoMsg(`ส่งอีเมลยืนยันไปยัง ${pendingVerificationUser.email} อีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม`);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, 'ยืนยันอีเมล'));
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleCheckVerified = async () => {
    if (!pendingVerificationUser) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoadingTarget('check');
    try {
      await pendingVerificationUser.reload();
      if (auth.currentUser?.emailVerified) {
        await onVerificationConfirmed?.();
      } else {
        setErrorMsg('ยังไม่พบการยืนยันอีเมล กรุณาเปิดอีเมลและคลิกลิงก์ยืนยันก่อนกดปุ่มนี้อีกครั้ง');
      }
    } catch {
      setErrorMsg('ไม่สามารถตรวจสอบสถานะยืนยันอีเมลได้ในขณะนี้');
    } finally {
      setLoadingTarget(null);
    }
  };

  const handleSignOutPending = async () => {
    setErrorMsg('');
    setInfoMsg('');
    await signOut(auth);
  };

  const displayError = errorMsg || externalError;

  return (
    <div className="relative min-h-full h-full flex flex-col justify-between bg-gradient-to-b from-[#113824] via-[#16472f] to-[#0f2e21] text-white select-none overflow-y-auto no-scrollbar">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header with Centered Realistic Inotector Care Logo */}
      <div className="pt-10 sm:pt-12 pb-5 px-6 w-full text-center flex flex-col items-center justify-center relative z-10 shrink-0">
        <div className="w-[84px] h-[84px] rounded-[25px] bg-gradient-to-b from-white via-[#f8fcfa] to-[#eaf4ef] shadow-[0_18px_40px_rgba(0,0,0,0.38),inset_0_1.5px_1px_rgba(255,255,255,1)] ring-1 ring-white/90 flex items-center justify-center mx-auto mb-3.5 transition-transform duration-200 hover:scale-105">
          <InotectorIcon size={54} />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading text-center">
          Inotector Care
        </h1>
        <p className="text-xs text-[#bcd9c9] font-medium mt-1 text-center">
          ระบบคัดกรองอาการ &amp; นำทางสถานพยาบาลอัจฉริยะ
        </p>
      </div>

      {/* Bottom White Sheet */}
      <div className="relative z-20 flex-1 flex flex-col justify-end">
        <div className="bg-white text-slate-800 rounded-t-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
          {pendingVerificationUser ? (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-extrabold font-heading text-slate-900">
                  ยืนยันอีเมลก่อนเข้าใช้งาน
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  เราได้ส่งลิงก์ยืนยันตัวตนไปยัง{' '}
                  <strong className="text-slate-800">{pendingVerificationUser.email}</strong> แล้ว
                  เพื่อความปลอดภัยของข้อมูลสุขภาพของคุณ
                </p>
              </div>

              {displayError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              {infoMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => void handleCheckVerified()}
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl bg-[#163d2d] hover:bg-[#113124] text-white font-bold text-xs font-heading flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTarget === 'check' ? 'animate-spin' : ''}`} />
                  <span>ฉันคลิกยืนยันในอีเมลแล้ว (เข้าสู่ระบบ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={loadingTarget !== null}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs font-heading transition cursor-pointer disabled:opacity-60"
                >
                  {loadingTarget === 'resend' ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์ยืนยันอีเมลอีกครั้ง'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleSignOutPending()}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  กลับไปเลือกวิธีเข้าสู่ระบบอื่น
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs: Login / Register */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-heading">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  สมัครสมาชิกด้วยอีเมล
                </button>
              </div>

              {displayError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
              )}

              {infoMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3 text-xs">
                {authMode === 'register' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 font-heading">
                      ชื่อ - นามสกุล
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="เช่น สมใจ รักสุขภาพ"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1 font-heading">อีเมล</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 font-heading">รหัสผ่าน</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => void handleForgotPassword()}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={authMode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : 'กรอกรหัสผ่านของคุณ'}
                      autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl bg-[#163d2d] hover:bg-[#113124] active:scale-[0.99] text-white font-bold text-sm font-heading transition cursor-pointer shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingTarget === 'email' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังดำเนินการ...</span>
                    </>
                  ) : (
                    <span>
                      {authMode === 'register' ? 'สมัครสมาชิกและส่งอีเมลยืนยัน' : 'เข้าสู่ระบบด้วยอีเมล'}
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
                  หรือเข้าสู่ระบบด้วยบัญชีโซเชียล
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Social Sign-In Buttons (1 button per row, stacked vertically) */}
              <div className="flex flex-col gap-2.5">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => void handleSocialLogin('google')}
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-900 font-bold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingTarget === 'google' ? (
                    <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>ดำเนินการต่อด้วย Google</span>
                </button>

                {/* LINE */}
                <button
                  type="button"
                  onClick={() => void handleSocialLogin('line')}
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl bg-[#06C755] hover:brightness-95 active:scale-[0.99] text-white font-bold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingTarget === 'line' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4.5 h-4.5 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                  )}
                  <span>ดำเนินการต่อด้วย LINE</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => void handleSocialLogin('facebook')}
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:brightness-95 active:scale-[0.99] text-white font-bold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingTarget === 'facebook' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4.5 h-4.5 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>ดำเนินการต่อด้วย Facebook</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => void handleSocialLogin('apple')}
                  disabled={loadingTarget !== null}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm font-heading flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingTarget === 'apple' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4.5 h-4.5 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  )}
                  <span>ดำเนินการต่อด้วย Apple</span>
                </button>
              </div>

              <p className="text-[10.5px] text-slate-400 text-center leading-relaxed pt-0.5">
                ยืนยันตัวตนด้วย Firebase Authentication • การเข้าสู่ระบบถือว่ายอมรับเงื่อนไขและนโยบาย PDPA
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
