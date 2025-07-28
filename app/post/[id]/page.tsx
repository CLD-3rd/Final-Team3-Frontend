"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Clock, Users, Heart, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/types/api"

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchPost(Number(params.id))
    }
  }, [params.id])

  const fetchPost = async (id: number) => {
    try {
      setLoading(true)
      setError("")
      const data = await apiClient.getPost(id)
      setPost(data)

      // Check if post is favorited
      try {
        const favorites = await apiClient.getFavorites()
        setIsFavorite(favorites?.some((fav) => fav.postId === id) || false)
      } catch (favError) {
        console.error("Failed to fetch favorites:", favError)
        setIsFavorite(false)
      }
    } catch (error) {
      console.error("Failed to fetch post:", error)
      setError("게시글을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!post) return

    try {
      if (isFavorite) {
        await apiClient.removeFavorite(post.id)
        setIsFavorite(false)
      } else {
        await apiClient.addFavorite(post.id)
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const handleApply = async () => {
    if (!post) return

    try {
      setApplying(true)
      await apiClient.applyToPost(post.id)
      alert("신청이 완료되었습니다!")
      // Refresh post data to update participant count
      await fetchPost(post.id)
    } catch (error) {
      console.error("Failed to apply:", error)
      alert("신청 중 오류가 발생했습니다.")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.back()} className="bg-blue-500 hover:bg-blue-600">
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()} className="bg-blue-500 hover:bg-blue-600">
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

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
            <button onClick={handleFavoriteToggle} className="p-2">
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
        {post.image && (
          <div className="mb-6">
            <Image
              src={post.image || "/placeholder.svg"}
              alt="모임 장소"
              width={400}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Post Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-100 text-blue-700">{post.sport}</Badge>
              <Badge
                variant={post.status === "모집중" ? "default" : "destructive"}
                className={post.status === "모집중" ? "bg-green-500" : "bg-red-500"}
              >
                {post.status}
              </Badge>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h2>

            {post.content && <p className="text-gray-600 mb-6 leading-relaxed">{post.content}</p>}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">위치</p>
                  <p className="text-gray-600">{post.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">일시</p>
                  <p className="text-gray-600">
                    {post.date} {post.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">모집 인원</p>
                  <p className="text-gray-600">
                    {post.currentParticipants}/{post.maxPeople}명
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">₩</span>
                </div>
                <div>
                  <p className="font-medium">참가비</p>
                  <p className="text-gray-600">{post.cost}원</p>
                </div>
              </div>
            </div>

            {/* Author Info */}
            {post.author && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="font-medium mb-2">모집자</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author.nickname?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{post.author.nickname}</p>
                    <p className="text-sm text-gray-500">
                      가입일: {new Date(post.author.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {post.participants && post.participants.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="font-medium mb-3">참가자 ({post.currentParticipants}명)</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {post.participants.slice(0, 6).map((participant, idx) => (
                      <div
                        key={participant.id || idx}
                        className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white"
                        title={participant.nickname}
                      >
                        {participant.nickname?.charAt(0) || "?"}
                      </div>
                    ))}
                    {post.currentParticipants > 6 && (
                      <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                        +{post.currentParticipants - 6}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Favorite Count */}
            {post.favoriteCount > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <p className="font-medium">{post.favoriteCount}명이 이 모집글을 찜했습니다</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={applying || post.status !== "모집중" || post.currentParticipants >= post.maxPeople}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-4 text-lg disabled:opacity-50"
        >
          {applying
            ? "신청 중..."
            : post.status !== "모집중"
              ? "모집 마감"
              : post.currentParticipants >= post.maxPeople
                ? "인원 마감"
                : "신청하기"}
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
