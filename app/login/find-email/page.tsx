"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function FindEmailPage() {
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setMaskedEmail(null)
    try {
      const res = await apiClient.findEmail(nickname.trim())
      const email = (res as any)?.data?.email ?? (res as any)?.email
      if (!email) {
        setError("일치하는 계정이 없습니다.")
      } else {
        setMaskedEmail(email) // 마스킹된 이메일이 내려옴
      }
    } catch (e: any) {
      setError(e?.message || "조회 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">이메일 찾기</h1>

        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-600">{error}</div>}
        {maskedEmail && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-700">
            이메일: <span className="font-semibold">{maskedEmail}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nickname" className="mb-3 block">닉네임</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !nickname.trim()}>
            {loading ? "조회 중..." : "이메일 조회"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          비밀번호가 기억나지 않나요?{" "}
          <Link href="/login/forgot-password" className="text-blue-500 hover:text-blue-600 font-semibold text-sm transition-colors">
            비밀번호 재설정
          </Link>
        </div>

        <div className="mt-3 text-sm">
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">← 로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  )
}
