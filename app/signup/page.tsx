"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

const sports = [
  { id: "soccer", name: "축구", icon: "⚽" },
  { id: "tennis", name: "테니스", icon: "🎾" },
  { id: "pingpong", name: "탁구", icon: "🏓" },
  { id: "basketball", name: "농구", icon: "🏀" },
  { id: "badminton", name: "배드민턴", icon: "🏸" },
  { id: "volleyball", name: "배구", icon: "🏐" },
]

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    gender: "",
    preferredSports: [] as string[],
  })

  const handleSportToggle = (sportId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sportId)
        ? prev.preferredSports.filter((s) => s !== sportId)
        : [...prev.preferredSports, sportId],
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">운동 메이트와 함께 건강한 라이프스타일을 시작하세요</p>
        </div>

        {/* Kakao Signup */}
        <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold mb-6 py-3">
          <span className="mr-2">💬</span>
          카카오로 시작하기
        </Button>

        {/* Divider */}
        <div className="text-center text-gray-500 mb-6">
          <span>또는</span>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <Label htmlFor="username" className="text-gray-700 font-medium">
              아이디 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="username"
                placeholder="4-20자의 영문, 숫자 사용 가능"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500 px-4">
                중복확인
              </Button>
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">
              이메일 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500 px-4">
                인증
              </Button>
            </div>
          </div>

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
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
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
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>8자 이상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>영문 포함</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>숫자 포함</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>특수문자 포함</span>
              </div>
            </div>
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
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nickname */}
          <div>
            <Label htmlFor="nickname" className="text-gray-700 font-medium">
              닉네임 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="nickname"
                placeholder="2-10자의 한글, 영문, 숫자"
                value={formData.nickname}
                onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500 px-4">
                중복확인
              </Button>
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              성별 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.gender === "male" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, gender: "male" }))}
                className={`h-16 flex flex-col items-center justify-center gap-2 ${
                  formData.gender === "male" ? "bg-blue-500 text-white" : "border-gray-200"
                }`}
              >
                <span className="text-2xl">👨</span>
                <span>남성</span>
              </Button>
              <Button
                type="button"
                variant={formData.gender === "female" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, gender: "female" }))}
                className={`h-16 flex flex-col items-center justify-center gap-2 ${
                  formData.gender === "female" ? "bg-blue-500 text-white" : "border-gray-200"
                }`}
              >
                <span className="text-2xl">👩</span>
                <span>여성</span>
              </Button>
            </div>
          </div>

          {/* Preferred Sports */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">선호 종목 (복수 선택 가능)</Label>
            <div className="grid grid-cols-3 gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  variant={formData.preferredSports.includes(sport.id) ? "default" : "outline"}
                  onClick={() => handleSportToggle(sport.id)}
                  className={`h-16 flex flex-col items-center justify-center gap-1 ${
                    formData.preferredSports.includes(sport.id)
                      ? "bg-blue-500 text-white"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="text-xl">{sport.icon}</span>
                  <span className="text-xs">{sport.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Link href="/login">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-4 text-lg mt-8">
              회원가입
            </Button>
          </Link>
        </div>

        <div className="text-center mt-6">
          <span className="text-gray-600">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-blue-500 hover:underline font-semibold">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
