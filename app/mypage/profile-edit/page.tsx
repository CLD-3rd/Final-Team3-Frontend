"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const sports = [
  { id: "soccer", name: "축구", icon: "⚽" },
  { id: "tennis", name: "테니스", icon: "🎾" },
  { id: "pingpong", name: "탁구", icon: "🏓" },
  { id: "basketball", name: "농구", icon: "🏀" },
  { id: "badminton", name: "배드민턴", icon: "🏸" },
  { id: "volleyball", name: "배구", icon: "🏐" },
]

export default function ProfileEditPage() {
  const [formData, setFormData] = useState({
    nickname: "김운동",
    preferredSports: ["soccer", "tennis"], // 기존 선호 종목
  })

  const handleSportToggle = (sportId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sportId)
        ? prev.preferredSports.filter((s) => s !== sportId)
        : [...prev.preferredSports, sportId],
    }))
  }

  const handleSave = () => {
    // 저장 로직 구현
    alert("개인정보가 수정되었습니다!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">개인정보 수정</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Nickname */}
          <div>
            <Label htmlFor="nickname" className="text-gray-700 font-medium mb-2 block">
              닉네임
            </Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                placeholder="닉네임을 입력하세요"
                value={formData.nickname}
                onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500 px-4">
                중복확인
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

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-3"
          >
            저장하기
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🏠</span>
            </div>
            <span className="text-xs">홈</span>
          </Link>
          <Link href="/my-posts" className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📝</span>
            </div>
            <span className="text-xs">내 모집</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-blue-500">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👤</span>
            </div>
            <span className="text-xs">마이페이지</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
