import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { Mail, X, RefreshCw } from 'lucide-react'

export default function EmailConfirmBanner() {
  const { user, refreshUser } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  // Ẩn banner nếu user chưa login, đã confirm, hoặc user dismiss
  if (!user) return null
  if (user.email_confirmed_at) return null
  if (dismissed) return null

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })
    setResending(false)
    if (error) setResendMsg('Thất bại: ' + error.message)
    else setResendMsg('Đã gửi lại email xác nhận!')
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail size={14} className="text-amber-600" />
          </div>
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Email chưa xác nhận.</span>{' '}
            <span className="hidden sm:inline">Vui lòng kiểm tra hộp thư đến để kích hoạt tài khoản.</span>
          </p>
        </div>
        {resendMsg && (
          <span className="text-xs text-emerald-700 font-medium">{resendMsg}</span>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
          <button
            onClick={() => refreshUser()}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-medium transition-colors"
          >
            Tôi đã xác nhận
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md hover:bg-amber-100 text-amber-700 transition-colors"
            title="Ẩn"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}