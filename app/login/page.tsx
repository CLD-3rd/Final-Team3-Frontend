"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)

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

          {/* Kakao Login */}
          <div className="mb-6">
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold mb-6">
              <span className="mr-2">💬</span>
              카카오로 시작하기
            </Button>
          </div>

          {/* Divider */}
          <div className="text-center text-gray-500 mb-6">
            <span>또는</span>
          </div>

          {/* Email/Password Form */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                아이디 또는 이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="아이디 또는 이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
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
                <Checkbox id="keep-logged-in" checked={keepLoggedIn} onCheckedChange={setKeepLoggedIn} />
                <Label htmlFor="keep-logged-in" className="text-sm text-gray-600">
                  로그인 상태 유지
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                비밀번호 찾기
              </Link>
            </div>
          </div>

          {/* Login Button */}
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-3">
              로그인
            </Button>
          </Link>

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
