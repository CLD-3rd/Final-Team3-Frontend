"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const kakaoToken = searchParams.get("kakaoToken")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(false)
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

      if (response.data?.token && response.code === "USER201") {
        router.push("/")
      } else if (response.code === "USER404") {
        setError(response.message || "존재하지 않는 사용자입니다.")
      } else if (response.code === "USER405") {
        setError(response.message || "유효하지 않은 비밀번호입니다.")
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

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }))
      setRememberEmail(true)
    }
  }, [])

  useEffect(() => {
    if (kakaoToken) {
      localStorage.setItem("auth_token", kakaoToken)
      window.location.href = "/"
    }
  }, [kakaoToken, router])

  const handleKakaoLogin = async () => {
    try {
      const config = await apiClient.fetchKakaoConfig()
      const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.loginRedirectUri)}&response_type=code`
      window.location.href = kakaoLoginUrl
    } catch (err) {
      alert("카카오 로그인 정보를 불러올 수 없습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-16 pb-12">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚽</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            MatchFit
          </h1>
          <p className="text-gray-500 text-center text-base">
            함께 운동하는 즐거움을 시작해보세요
          </p>
        </div>
      </div>

      <div className="px-6">
        <div className="max-w-sm mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* 카카오 로그인 */}
          <div className="mb-8">
            <Button
              onClick={handleKakaoLogin}
              className="w-full h-14 bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-semibold rounded-xl border-0 transition-colors duration-200"
              disabled={loading}
            >
              <span className="mr-3 text-lg">💬</span>
              카카오로 3초만에 시작하기
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900 mb-2 block">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력해주세요"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-14 px-4 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-900 mb-2 block">
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력해주세요"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-14 px-4 pr-12 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="keep-logged-in"
                checked={formData.keepLoggedIn}
                onCheckedChange={(checked) => {
                  const keep = !!checked
                  setFormData((prev) => ({ ...prev, keepLoggedIn: keep }))

                  if (keep) {
                    localStorage.setItem("rememberedEmail", formData.email)
                  } else {
                    localStorage.removeItem("rememberedEmail")
                    setFormData((prev) => ({ ...prev, email: "" }))
                  }
                }}
                className="w-5 h-5 border-2 border-gray-300 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <Label htmlFor="keep-logged-in" className="text-sm text-gray-600 cursor-pointer">
                로그인 상태 유지
              </Label>
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full h-14 bg-gray-400 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          <div className="text-center mt-8 pb-16">
            <span className="text-gray-500 text-sm">아직 계정이 없으신가요? </span>
            <Link 
              href="/signup" 
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm transition-colors"
            >
              회원가입하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
