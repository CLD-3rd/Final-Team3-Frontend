"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, Heart } from "lucide-react"
import Link from "next/link"

const favoritesPosts = [
  {
    id: 1,
    sport: "축구",
    title: "주말 축구 함께할 하실 분!",
    location: "강남구 역삼동",
    time: "7월 20일 오후 2시",
    participants: "6/10명",
    cost: "15,000원",
    badge: "축구",
    status: "모집중",
    favoriteDate: "2024-07-15",
  },
  {
    id: 2,
    sport: "테니스",
    title: "테니스 레슨 후 게임 하실 분",
    location: "서초구 반포동",
    time: "7월 21일 오전 10시",
    participants: "3/4명",
    cost: "25,000원",
    badge: "테니스",
    status: "모집중",
    favoriteDate: "2024-07-14",
  },
  {
    id: 3,
    sport: "농구",
    title: "농구 3vs3 게임 하실 분",
    location: "마포구 홍대입구",
    time: "7월 19일 오후 8시",
    participants: "6/6명",
    cost: "무료",
    badge: "농구",
    status: "모집완료",
    favoriteDate: "2024-07-13",
  },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<number[]>([1, 2, 3]) // 찜한 게시글 ID들

  const toggleFavorite = (postId: number) => {
    setFavorites((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const activeFavorites = favoritesPosts.filter((post) => favorites.includes(post.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">찜 리스트</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Favorites Count */}
        <div className="mb-6">
          <p className="text-gray-600">총 {activeFavorites.length}개의 모집글을 찜했습니다</p>
        </div>

        {/* Favorites List */}
        <div className="space-y-4">
          {activeFavorites.map((post) => (
            <Card key={post.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant="secondary"
                    className={`${
                      post.sport === "축구"
                        ? "bg-blue-100 text-blue-700"
                        : post.sport === "테니스"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {post.badge}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(post.id)} className="p-1">
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(post.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                    <Badge
                      variant={post.status === "모집중" ? "default" : "secondary"}
                      className={post.status === "모집중" ? "bg-green-500" : "bg-gray-500"}
                    >
                      {post.status}
                    </Badge>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">{post.title}</h4>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{post.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{post.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>{post.participants}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">찜한 날짜: {post.favoriteDate}</div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">{post.cost}</p>
                    <Link href={`/post/${post.id}`}>
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                        상세보기
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeFavorites.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">찜한 모집글이 없습니다</p>
            <Link href="/">
              <Button className="bg-blue-500 hover:bg-blue-600">모집글 둘러보기</Button>
            </Link>
          </div>
        )}
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
