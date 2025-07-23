"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Clock, Users, Heart, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock data - in real app, this would come from API
const mockPost = {
  id: 1,
  sport: "축구",
  title: "주말 축구 함께할 하실 분!",
  content:
    "안녕하세요! 매주 토요일마다 축구하는 모임입니다. 초보자도 환영하며, 재미있게 운동하실 분들 모집합니다. 운동 후에는 간단한 회식도 있어요!",
  location: "강남구 역삼동 축구장",
  date: "2024년 7월 20일",
  time: "오후 2:00 - 4:00",
  currentParticipants: 6,
  maxParticipants: 10,
  cost: "15,000원",
  status: "모집중",
  organizer: "김축구",
  image: "/placeholder.svg?height=200&width=400&text=축구장+이미지",
  favoriteCount: 12, // 찜 개수 추가
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">모집글 상세</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFavorite(!isFavorite)} className="p-2">
              <Heart className={`w-6 h-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
            </button>
            <button className="p-2">
              <Share2 className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Main Image */}
        <div className="mb-6">
          <Image
            src={mockPost.image || "/placeholder.svg"}
            alt="모임 장소"
            width={400}
            height={200}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {/* Post Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-100 text-blue-700">{mockPost.sport}</Badge>
              <Badge
                variant={mockPost.status === "모집중" ? "default" : "destructive"}
                className={mockPost.status === "모집중" ? "bg-green-500" : "bg-red-500"}
              >
                {mockPost.status}
              </Badge>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">{mockPost.title}</h2>

            <p className="text-gray-600 mb-6 leading-relaxed">{mockPost.content}</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">위치</p>
                  <p className="text-gray-600">{mockPost.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">일시</p>
                  <p className="text-gray-600">
                    {mockPost.date} {mockPost.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">모집 인원</p>
                  <p className="text-gray-600">
                    {mockPost.currentParticipants}/{mockPost.maxParticipants}명
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">₩</span>
                </div>
                <div>
                  <p className="font-medium">참가비</p>
                  <p className="text-gray-600">{mockPost.cost}</p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="font-medium mb-3">참가자 ({mockPost.currentParticipants}명)</p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    김
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    이
                  </div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    박
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    최
                  </div>
                  <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    정
                  </div>
                  <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                    +1
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Count */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <p className="font-medium">{mockPost.favoriteCount}명이 이 모집글을 찜했습니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apply Button */}
        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-4 text-lg">
          신청하기
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-blue-500">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👤</span>
            </div>
            <span className="text-xs">마이페이지</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
