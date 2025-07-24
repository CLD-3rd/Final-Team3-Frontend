"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    keepLoggedIn: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await apiClient.login({
        email: formData.email,
        password: formData.password,
      })

      if (response.success) {
        router.push("/")
      } else {
        setError(response.message || "로그인에 실패했습니다.")
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다.")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    // 카카오 로그인 구현
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-cyan-400 flex flex-col">
      {/* Header */}
      <div className="text-center text-white pt-12 pb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">⚽</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">스포츠 메이트</h1>
        <p className="text-sm opacity-90">함께 운동하는 즐거움</p>
      </div>

      {/* Login Form */}
      <div className="flex-1 bg-white rounded-t-3xl p-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">환영합니다!</h2>
            <p className="text-gray-600">로그인하여 운동 메이트를 찾아보세요</p>
          </div>

          {/* Error Message */}
          {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          {/* Kakao Login */}
          <div className="mb-6">
            <Button
              onClick={handleKakaoLogin}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold mb-6 py-3"
              disabled={loading}
            >
              <span className="mr-2">💬</span>
              카카오로 시작하기
            </Button>
          </div>

          {/* Divider */}
          <div className="text-center text-gray-500 mb-6">
            <span>또는</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                아이디 또는 이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="아이디 또는 이메일을 입력하세요"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                비밀번호
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keep-logged-in"
                  checked={formData.keepLoggedIn}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, keepLoggedIn: !!checked }))}
                />
                <Label htmlFor="keep-logged-in" className="text-sm text-gray-600">
                  로그인 상태 유지
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                비밀번호 찾기
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-3"
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="flex justify-center gap-4 mt-6 text-sm">
            <Link href="/find-id" className="text-blue-500 hover:underline">
              아이디 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/forgot-password" className="text-blue-500 hover:underline">
              비밀번호 찾기
            </Link>
          </div>

          <div className="text-center mt-6">
            <span className="text-gray-600">아직 계정이 없으신가요? </span>
            <Link href="/signup" className="text-blue-500 hover:underline font-semibold">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
