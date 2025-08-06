"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, Heart, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-client";
import EventDetailModal from "@/components/post-detail"


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

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

const sportsMapping: { [key: string]: string } = {
  FOOTBALL: "축구",
  TENNIS: "테니스",
  BASKETBALL: "농구",
  VOLLEYBALL: "배구",
  TABLE_TENNIS: "탁구",
  BADMINTON: "배드민턴"
}

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

const formatPrice = (price: number) => {
  if (price === 0) return "무료"
  return `${price.toLocaleString()}원`
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg transition-all backdrop-blur-sm ${
    type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    )}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
      ×
    </button>
  </div>
)

export default function FavoritesPage() {
  const router = useRouter()
  const [followPosts, setFollowPosts] = useState<FollowPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);


  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  }

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const fetchFollowList = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/user/follow`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token')
          router.push('/login')
          return
        }
        throw new Error('찜 목록을 불러오는데 실패했습니다.')
      }

      const result: ApiResponse<FollowPost[]> = await response.json()
      setFollowPosts(result.data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (postId: number) => {
    try {
      const token = getToken()
      
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/posts/${postId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token')
          router.push('/login')
          return
        }
        throw new Error('찜 상태 변경에 실패했습니다.')
      }

      const result: ApiResponse<{ postId: number; followed: boolean }> = await response.json()
      
      addToast(result.message, 'success')
      
      if (!result.data.followed) {
        setFollowPosts(prev => prev.filter(post => post.postId !== postId))
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : '오류가 발생했습니다.', 'error')
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }

    fetchFollowList()
  }, [mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">찜 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium mb-1">오류가 발생했습니다</p>
          <p className="text-gray-500 text-sm mb-6 text-center">{error}</p>
          <Button 
            onClick={fetchFollowList}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link href="/mypage" className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">찜 리스트</h1>
        </div>
      </div>

      <div className="px-5 pb-20">
        <div className="py-6">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">찜한 모집글</p>
                <p className="text-gray-500 text-sm">총 {followPosts.length}개</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {followPosts.map((post) => (
            <Card key={post.postId} className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getSportColor(post.sports)}`}
                  >
                    {sportsMapping[post.sports] || post.sports}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleFavorite(post.postId)} 
                      className="p-2 rounded-full hover:bg-red-50 transition-all duration-200 active:scale-95"
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>
                    <Badge
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        post.status === "OPEN" 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {post.status === "OPEN" ? "모집중" : "모집완료"}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-4 leading-tight">{post.title}</h3>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600 text-sm">{post.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 text-sm">{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 text-sm">{post.currentPeople}/{post.maxPeople}명</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    찜한 날짜 {post.followedAt}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-red-500">
                      {formatPrice(post.cost)}
                    </p>
                    {/* <Link href={`/post/${post.postId}`}>
                      <Button 
                        size="sm" 
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-all duration-200"
                      >
                        상세보기
                      </Button>
                    </Link> */}
                    {/* 모달 추가 부분 351-360 */}
                    <Button
                      size="sm"
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-all duration-200"
                      onClick={() => {
                        setSelectedPostId(post.postId);
                        setModalOpen(true);
                      }}
                    >
                      상세보기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* 모달 추가 부분 366-375 */}
          {modalOpen && selectedPostId !== null && (
            <EventDetailModal
              postId={selectedPostId}
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setSelectedPostId(null);
              }}
            />
          )}
        </div>

        {followPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">찜한 모집글이 없습니다</p>
            <p className="text-gray-500 text-sm mb-6">마음에 드는 모집글을 찜해보세요</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm">
                모집글 둘러보기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}