"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

const sports = [
  { id: "soccer", name: "축구", icon: "⚽" },
  { id: "tennis", name: "테니스", icon: "🎾" },
  { id: "pingpong", name: "탁구", icon: "🏓" },
  { id: "basketball", name: "농구", icon: "🏀" },
  { id: "badminton", name: "배드민턴", icon: "🏸" },
  { id: "volleyball", name: "배구", icon: "🏐" },
]

const genderOptions = [
  { id: "all", name: "남녀 모두" },
  { id: "male", name: "남성만" },
  { id: "female", name: "여성만" },
]

export default function CreatePostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    location: "",
    date: "",
    time: "",
    maxParticipants: 4,
    gender: "" as "all" | "male" | "female" | "",
    cost: "",
    content: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleParticipantChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      maxParticipants: increment ? Math.min(prev.maxParticipants + 1, 20) : Math.max(prev.maxParticipants - 1, 1),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const postData = {
        title: formData.title,
        content: formData.content,
        sport: formData.sport,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        maxParticipants: formData.maxParticipants,
        cost: Number.parseInt(formData.cost) || 0,
        gender: formData.gender as "all" | "male" | "female",
      }

      await apiClient.createPost(postData)
      router.push("/my-posts")
    } catch (error) {
      setError("모집글 등록 중 오류가 발생했습니다.")
      console.error("Create post error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-cyan-400">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Link href="/my-posts">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold">운동 모집하기</h1>
        <Button variant="ghost" className="text-white hover:bg-white/20">
          임시저장
        </Button>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl p-6 space-y-6">
        {/* Error Message */}
        {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="어떤 운동을 함께 할지 간단히 적어주세요"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="bg-gray-50 border-gray-200"
              required
            />
          </div>

          {/* Sports Selection */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              운동 종목 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  variant={formData.sport === sport.id ? "default" : "outline"}
                  onClick={() => setFormData((prev) => ({ ...prev, sport: sport.id }))}
                  className={`h-20 flex flex-col items-center justify-center gap-2 ${
                    formData.sport === sport.id
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className="text-sm">{sport.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              위치 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="지역명 또는 장소명을 입력하세요"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="bg-gray-50 border-gray-200"
              required
            />
          </div>

          {/* Date and Time */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              날짜 및 시간 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="bg-gray-50 border-gray-200"
                required
              />
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                className="bg-gray-50 border-gray-200"
                required
              />
            </div>
          </div>

          {/* Participants Counter */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              총 인원 (본인 포함) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleParticipantChange(false)}
                className="w-12 h-12 rounded-full bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{formData.maxParticipants}</span>
                <span className="text-lg text-gray-600">명</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleParticipantChange(true)}
                className="w-12 h-12 rounded-full bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              참여 성별 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {genderOptions.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={formData.gender === option.id ? "default" : "outline"}
                  onClick={() => setFormData((prev) => ({ ...prev, gender: option.id as "all" | "male" | "female" }))}
                  className={`h-12 ${
                    formData.gender === option.id
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Cost */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">1인당 비용</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                className="bg-gray-50 border-gray-200"
              />
              <span className="text-gray-600">원</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">상세 설명</Label>
            <Textarea
              placeholder={`운동에 대한 추가 정보를 입력하세요.
예) 초보자 환영, 준비물, 운동 후 식사 계획 등`}
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              className="bg-gray-50 border-gray-200 resize-none"
              maxLength={300}
            />
            <div className="text-right text-sm text-gray-500 mt-1">{formData.content.length}/300자</div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-4 text-lg mt-8"
            disabled={loading}
          >
            {loading ? "등록 중..." : "모집글 등록하기"}
          </Button>
        </form>
      </div>
    </div>
  )
}
