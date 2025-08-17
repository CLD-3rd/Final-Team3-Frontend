"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token") || ""
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [serverErrCode, setServerErrCode] = useState<string | null>(null)

  const hasLen = formData.password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(formData.password)
  const hasDigit = /\d/.test(formData.password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password)
  const isValidPassword = hasLen && hasLetter && hasDigit && hasSpecial
  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword


  const canSubmit = Boolean(token && isValidPassword && passwordsMatch)
  const submitBlocked = loading || !canSubmit || serverErrCode === "USER407"

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitBlocked) return
    setLoading(true); setErr(null); setMsg(null); setServerErrCode(null)
    try {
      const res = await apiClient.confirmPasswordReset(token, formData.password)

      // 성공 응답 규격이 {code, message, data} 같은 ApiResponseDTO 라면:
      if (res?.code === "USER407") {
        setServerErrCode("USER407")
        setErr("이전 비밀번호와 동일합니다.")
        return
      }

      if (res?.code === "USER209") {
      setMsg("비밀번호가 변경되었습니다.")
      setTimeout(() => router.replace("/login"), 1200)
      return
    }

    } catch (e: any) {
      // 실패 응답에서 코드 추출 (axios 가정)
      const code =
        e?.code ||
        e?.response?.data?.code ||
        e?.response?.data?.errorCode ||
        e?.data?.code

      if (code === "USER407") {
        setServerErrCode("USER407")
        setErr("이전 비밀번호와 동일합니다.")
      } else {
        setErr(e?.response?.data?.message || e?.message || "비밀번호 변경 중 오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">비밀번호 재설정</h1>

        {err && <div className="mb-4 p-3 rounded bg-red-50 text-red-600">{err}</div>}
        {msg && <div className="mb-4 p-3 rounded bg-green-50 text-green-700">{msg}</div>}

        {!token ? (
          <>
            <div className="text-sm text-gray-600 mb-4">
              유효한 토큰이 없습니다. 메일의 링크를 통해 접속해주세요.
            </div>
            <Link
              href="/login/forgot-password"
              className="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              비밀번호 재설정 요청하기
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                비밀번호 <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상, 영문/숫자/특수문자 포함"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                    if (serverErrCode) { setServerErrCode(null); setErr(null) } // ⬅️ 추가
                  }}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <ul className="text-sm mt-2 ml-1 space-y-1">
                <li className={`flex items-center ${hasLen ? "text-green-600" : "text-gray-500"}`}>
                  {hasLen ? "✓" : "○"}&nbsp;8자 이상
                </li>
                <li className={`flex items-center ${hasLetter ? "text-green-600" : "text-gray-500"}`}>
                  {hasLetter ? "✓" : "○"}&nbsp;영문 포함
                </li>
                <li className={`flex items-center ${hasDigit ? "text-green-600" : "text-gray-500"}`}>
                  {hasDigit ? "✓" : "○"}&nbsp;숫자 포함
                </li>
                <li className={`flex items-center ${hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                  {hasSpecial ? "✓" : "○"}&nbsp;특수문자 포함
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.confirmPassword.length > 0 && (
                <p className={`mt-2 text-sm ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                  {passwordsMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-sm">
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
