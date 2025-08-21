"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true); setError(null); setNotice(null)
  try {
    const res = await apiClient.requestPasswordReset(email.trim())

    if (res?.code === "USER208") {
      setNotice("비밀번호 재설정 링크를 이메일로 보냈습니다. 받은 편지함/스팸함을 확인하세요.")
      return
    }

    if (res?.code === "USER408") {
      setError("가입된 이메일이 아닙니다.")
      return
    }

  } catch (err: any) {
    const code =
      err?.code ||
      err?.response?.data?.code ||
      err?.data?.code

    if (code === "USRE208") {
      setNotice("비밀번호 재설정 링크를 이메일로 보냈습니다. 받은 편지함/스팸함을 확인하세요.")
    } else if (code === "USER408") {
      setError("가입된 이메일이 아닙니다.")
    }
    else {
      setError(err?.response?.data?.message || err?.message || "비밀번호 재설정 요청 중 오류가 발생했습니다.")
    }
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">비밀번호 재설정</h1>

        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-600">{error}</div>}
        {notice && <div className="mb-4 p-3 rounded bg-green-50 text-green-700">{notice}</div>}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="mb-3 block">가입 이메일</Label>
            <Input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
            {loading ? "요청 중..." : "재설정 링크 보내기"}
          </Button>
        </form>

        <div className="mt-6 text-sm">
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
