"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, Heart, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

// API 응답 타입 정의
interface FollowPost {
  postId: number
  title: string
  sports: string
  location: string
  date: string
  currentPeople: number
  maxPeople: number
  followedAt: string
  cost: number
  status: string
}

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

// 토스트 메시지 타입
interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

// 스포츠 한글 매핑
const sportsMapping: { [key: string]: string } = {
  FOOTBALL: "축구",
  TENNIS: "테니스",
  BASKETBALL: "농구",
  VOLLEYBALL: "배구",
  TABLE_TENNIS: "탁구",
  BADMINTON: "배드민턴"
}

// 스포츠별 색상 매핑
const getSportColor = (sport: string) => {
  switch (sport) {
    case "TENNIS":
      return "bg-blue-100 text-blue-700"
    case "FOOTBALL":
      return "bg-green-100 text-green-700"
    case "BASKETBALL":
      return "bg-orange-100 text-orange-700"
    case "VOLLEYBALL":
      return "bg-purple-100 text-purple-700"
    case "TABLE_TENNIS":
      return "bg-red-100 text-red-700"
    case "BADMINTON":
      return "bg-yellow-100 text-yellow-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  const period = hours >= 12 ? "오후" : "오전"
  const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  
  return `${month}월 ${day}일 ${period} ${hour12}시${minutes > 0 ? ` ${minutes}분` : ""}`
}

// 가격 포맷팅 함수
const formatPrice = (price: number) => {
  if (price === 0) return "무료"
  return `${price.toLocaleString()}원`
}

// 토스트 컴포넌트
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? (
      <CheckCircle className="w-5 h-5" />
    ) : (
      <XCircle className="w-5 h-5" />
    )}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
      ×
    </button>
  </div>
)

export default function FavoritesPage() {
  const [followPosts, setFollowPosts] = useState<FollowPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // JWT 토큰 가져오기
  const getToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  }

  // 토스트 메시지 추가
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  // 토스트 메시지 제거
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // 찜 목록 조회
  const fetchFollowList = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      if (!token) {
        throw new Error('로그인이 필요합니다.')
      }

   
      const response = await fetch('http://localhost:8080/api/user/follow', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('찜 목록을 불러오는데 실패했습니다.')
      }

      const result: ApiResponse<FollowPost[]> = await response.json()
      setFollowPosts(result.data)
      
     
      // addToast(result.message, 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 찜 토글 (찜 취소)
  const toggleFavorite = async (postId: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        addToast('로그인이 필요합니다.', 'error')
        return
      }

      const response = await fetch(`http://localhost:8080/api/posts/${postId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('찜 상태 변경에 실패했습니다.')
      }

      const result: ApiResponse<{ postId: number; followed: boolean }> = await response.json()
      
      // 백엔드 성공 메시지 표시
      addToast(result.message, 'success')
      
      if (!result.data.followed) {
        // 찜이 취소되었으면 목록에서 제거
        setFollowPosts(prev => prev.filter(post => post.postId !== postId))
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : '오류가 발생했습니다.', 'error')
    }
  }

  // 컴포넌트 마운트 시 찜 목록 조회
  useEffect(() => {
    fetchFollowList()
  }, [])

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">찜 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchFollowList} className="bg-blue-500 hover:bg-blue-600">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 토스트 메시지들 */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

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
          <p className="text-gray-600">총 {followPosts.length}개의 모집글을 찜했습니다</p>
        </div>

        {/* Favorites List */}
        <div className="space-y-4">
          {followPosts.map((post) => (
            <Card key={post.postId} className="bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant="secondary"
                    className={getSportColor(post.sports)}
                  >
                    {sportsMapping[post.sports] || post.sports}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleFavorite(post.postId)} 
                      className="p-1 transition-colors hover:scale-110"
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>
                    <Badge
                      variant={post.status === "OPEN" ? "default" : "secondary"}
                      className={post.status === "OPEN" ? "bg-green-500" : "bg-gray-500"}
                    >
                      {post.status === "OPEN" ? "모집중" : "모집완료"}
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
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>{post.currentPeople}/{post.maxPeople}명</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    찜한 날짜: {post.followedAt}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">
                      {formatPrice(post.cost)}
                    </p>
                    <Link href={`/post/${post.postId}`}>
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

        {/* Empty State */}
        {followPosts.length === 0 && (
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
