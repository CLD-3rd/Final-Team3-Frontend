"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus, Upload, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Search } from "lucide-react";

const townOptions = [
  { label: "서울", value: "SEOUL" },
  { label: "경기", value: "GYEONGGI" },
  { label: "대구", value: "DAEGU" },
  { label: "인천", value: "INCHEON" },
  { label: "광주", value: "GWANGJU" },
  { label: "울산", value: "ULSAN" },
  { label: "세종", value: "SEJONG" },
  { label: "충남", value: "CHUNGNAM" },
  { label: "충북", value: "CHUNGBUK" },
  { label: "전북", value: "JEONBUK" },
  { label: "전남", value: "JEONNAM" },
  { label: "경북", value: "GYEONGBUK" },
  { label: "경남", value: "GYEONGNAM" },
  { label: "제주", value: "JEJU" },
  { label: "대전", value: "DAEJEON" },
];

const sports = [
  { id: "FOOTBALL", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
  { id: "VOLLEYBALL", name: "배구", icon: "🏐" },
]

const genderOptions = [
  { id: "ALL", name: "남녀 모두" },
  { id: "MALE", name: "남성만" },
  { id: "FEMALE", name: "여성만" },
]

export default function CreatePostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    location: "",
    date: "",
    time: "",
    town: "",
    maxParticipants: 4,
    gender: "ALL" as "ALL" | "MALE" | "FEMALE",
    cost: "",
    content: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("");
  const [townModalOpen, settownModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleParticipantChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      maxParticipants: increment ? Math.min(prev.maxParticipants + 1, 20) : Math.max(prev.maxParticipants - 1, 1),
    }))
  }

  // 이미지 파일 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.")
        return
      }

      setSelectedImage(file)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
      
      setError("")
    }
  }

  // 이미지 제거
  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview(null)
    
    // 파일 input 초기화
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")

    console.log("formData.town 값:", formData.town);

    try {
      const isoDateTime = `${formData.date}T${formData.time}`;
      const selectedTownObj = townOptions.find(opt => opt.label === formData.town);
      const townValue = selectedTownObj ? selectedTownObj.value : "";

      const postData = {
        title: formData.title,
        description: formData.content,
        location: formData.location,
        status: "OPEN",
        town: formData.town,
        sports: formData.sport, 
        gender: formData.gender,
        cost: Number.parseInt(formData.cost) || 0,
        maxPeople: formData.maxParticipants,
        date: isoDateTime,
        imageUrl: null, // 일단 null로 전송 (S3 연동 전까지)
      }

      console.log("제출 직전 town 값:", postData.town, typeof postData.town, postData);
      if (!postData.town || postData.town.trim() === "") {
        setError("지역(동네)을 입력해주세요.");
        return;
      }

      const response = await apiClient.createPost(postData)
      if (response.code === "POST200") {
        console.log("등록 성공! 메시지:", response.message);
        setSuccessMessage(response.message ?? "등록 성공");
        setTimeout(() => router.push("/my-posts"), 1000);
      } else {
        setError("모집글 등록에 실패했습니다.");
      }
    } catch (error) {
      setError("모집글 등록 중 오류가 발생했습니다.");
      console.error("Create post error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-cyan-400">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Link href="/my-posts">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold">운동 모집하기</h1>
        </div>
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

          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              지역 <span className="text-red-500">*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                placeholder="지역을 선택하세요"
                value={
                  townOptions.find(opt => opt.value === formData.town)?.label || ""
                }
                readOnly
                className="bg-gray-50 border-gray-200 pr-10 "
                required
              />
              <Button
                type="button"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-50 border border-gray-200 text-gray-700 shadow-none hover:bg-gray-100"
                onClick={() => settownModalOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
            {/* 지역 선택 모달 */}
            {townModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
                <div className="bg-white rounded-2xl p-6 min-w-[320px] max-w-[90vw]">
                  <h3 className="text-lg font-semibold mb-4">지역 선택</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {townOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={formData.town === option.value ? "default" : "outline"}
                        className={formData.town === option.value ? "bg-blue-500 text-white" : ""}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, town: option.value }));
                          settownModalOpen(false);
                          console.log("선택된 town:", option.value);
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => settownModalOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 위치(상세 입력) */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              위치 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="상세 장소명을 입력하세요 (예: OO구 OO로 OO체육관, 공원 등)"
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
                  onClick={() => setFormData((prev) => ({ ...prev, gender: option.id as "ALL" | "MALE" | "FEMALE" }))}
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

          {/* Image Upload */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">구장 이미지</Label>
            
            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="mb-4 relative">
                <img 
                  src={imagePreview} 
                  alt="구장 이미지 미리보기" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    setError("이미지를 불러올 수 없습니다.")
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleImageRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* 파일 업로드 */}
            <div className="flex items-center gap-3">
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage}
              >
                <Upload className="w-4 h-4" />
                이미지 선택
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageRemove}
                  className="text-red-600 hover:text-red-700"
                >
                  이미지 제거
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG 파일만 업로드 가능
              <br />
            </p>
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
          
          {/* 성공 메시지 */}
          {successMessage && (
            <div className="text-green-600 text-center my-2">
              {successMessage}
            </div>
          )}
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