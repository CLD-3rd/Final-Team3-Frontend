"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, Heart, Users, Clock, MapPin, AlertTriangle, Bell, User, Eye, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

interface PostData {
  currentPeople: number
  id: number
  title: string
  description: string
  imageUrl: string | null
  gender: "MALE" | "FEMALE" | "ALL"
  sports: string
  cost: number
  status: "OPEN" | "CLOSED" | "FULL"
  town: string
  maxPeople: number
  date: string
  location: string
  bookmarked: boolean
}

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

interface EventDetailProps {
  // postId를 props로 받지 않고 URL 파라미터에서 직접 가져옴
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

export default function EventDetail({}: EventDetailProps) {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string || params?.postId as string
  
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNotifying, setIsNotifying] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // 인증 토큰 가져오기 및 API 호출 함수
  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("accessToken")

  // 토스트 메시지 추가
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

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    if (!token) throw new Error("인증 토큰이 없습니다.")

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 403) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
    }
    return response
  }

  // 포스트 데이터 로딩
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || postId === 'undefined' || postId === 'null') {
        setError("잘못된 게시글 ID입니다.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        
        const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data && data.code === "POST201" && data.data) {
          setPost(data.data)
          setIsFavorited(data.data.bookmarked || false)
        } else {
          throw new Error("게시글을 찾을 수 없습니다.")
        }
      } catch (error) {
        console.error("API 호출 실패:", error)
        setError("게시글을 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId])

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || '스포츠 메이트 모집',
          text: `${formatTimeToKorean12Hour(post?.date || '')} ${getSportName(post?.sports || '')} 모집`,
          url: window.location.href
        })
      } catch (error) {
        console.error('공유 실패:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 복사되었습니다!')
      } catch (error) {
        console.error('클립보드 복사 실패:', error)
      }
    }
  }

  const toggleFavorite = async () => {
    const token = getAuthToken()
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}/follow`, {
        method: 'POST'
      })
      
      if (response.ok) {
        let data = null
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json()
            
            if (data && data.code === "FOLLOW200" && data.data) {
              const isNowFollowed = data.data.followed
              setIsFavorited(isNowFollowed)
              
              if (post) {
                setPost({ ...post, bookmarked: isNowFollowed })
              }
              
              if (data.message) {
                showToast(data.message, 'success')
              } else {
                showToast(isNowFollowed ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
              }
            } else {
              throw new Error('응답 형식이 올바르지 않습니다.')
            }
          } catch (jsonError) {
            const newFavoriteState = !isFavorited
            setIsFavorited(newFavoriteState)
            if (post) {
              setPost({ ...post, bookmarked: newFavoriteState })
            }
            showToast(newFavoriteState ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
          }
        } else {
          const newFavoriteState = !isFavorited
          setIsFavorited(newFavoriteState)
          if (post) {
            setPost({ ...post, bookmarked: newFavoriteState })
          }
          showToast(newFavoriteState ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          router.push('/login')
        } else {
          try {
            const errorData = await response.json()
            const errorMessage = errorData?.message || '찜하기 처리에 실패했습니다.'
            showToast(errorMessage, 'error')
          } catch (parseError) {
            showToast('찜하기 처리에 실패했습니다.', 'error')
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        router.push('/login')
      } else {
        const errorMessage = error instanceof Error ? error.message : '찜하기 처리에 실패했습니다.'
        showToast(errorMessage, 'error')
      }
    }
  }

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    addToast(message, type)
  }

  const handleJoinEvent = async () => {
    const token = getAuthToken()
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}/apply`, {
        method: 'POST'
      })
      
      if (response.ok) {
        let data = null
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json()
          } catch (jsonError) {
            data = { message: '참가 신청이 완료되었습니다!' }
          }
        } else {
          data = { message: '참가 신청이 완료되었습니다!' }
        }
        
        setIsJoined(true)
        showToast(data.message || '참가 신청이 완료되었습니다!', 'success')
      } else {
        let errorData = null
        const contentType = response.headers.get('content-type')
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const textResponse = await response.text()
            errorData = { message: textResponse || '요청 처리 중 오류가 발생했습니다.' }
          }
        } catch (parseError) {
          errorData = { message: '요청 처리 중 오류가 발생했습니다.' }
        }
        
        if (response.status === 400) {
          const duplicateMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '이미 신청한 모집글입니다'
          showToast(duplicateMessage, 'error')
        } else if (response.status === 403) {
          showToast('이미 신청한 모집글입니다', 'error')
        } else if (response.status === 409) {
          const duplicateMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '이미 신청한 모집글입니다'
          showToast(duplicateMessage, 'error')
        } else if (response.status === 401) {
          router.push('/login')
        } else {
          const errorMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '참가 신청에 실패했습니다.'
          showToast(errorMessage, 'error')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        router.push('/login')
      } else {
        const errorMessage = error instanceof Error ? error.message : '참가 신청에 실패했습니다.'
        showToast(errorMessage, 'error')
      }
    }
  }

  const formatTimeToKorean12Hour = (dateString: string) => {
    if (!dateString) return ""
    const dateObj = new Date(dateString)
    if (isNaN(dateObj.getTime())) return ""
    
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]
    
    let hours = dateObj.getHours()
    const minutes = dateObj.getMinutes()
    const isAM = hours < 12
    const period = isAM ? "오전" : "오후"
    hours = hours % 12
    if (hours === 0) hours = 12
    
    const timeStr = minutes === 0 ? `${period} ${hours}시` : `${period} ${hours}시 ${minutes}분`
    
    return `${month}월 ${day}일 (${weekDay}) ${timeStr}`
  }

  const getSportName = (sport: string) => {
    const sportNames: { [key: string]: string } = {
      'FOOTBALL': '축구',
      'TENNIS': '테니스',
      'TABLE_TENNIS': '탁구',
      'BASKETBALL': '농구',
      'BADMINTON': '배드민턴',
      'VOLLEYBALL': '배구'
    }
    return sportNames[sport] || sport
  }

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'FOOTBALL': '⚽',
      'TENNIS': '🎾',
      'TABLE_TENNIS': '🏓',
      'BASKETBALL': '🏀',
      'BADMINTON': '🏸',
      'VOLLEYBALL': '🏐'
    }
    return icons[sport] || '🏃'
  }

  const getGenderText = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      'MALE': '남자만',
      'FEMALE': '여자만',
      'ALL': '남녀 모두'
    }
    return genderMap[gender] || '남녀 모두'
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'OPEN': '모집중',
      'CLOSED': '모집마감',
      'FULL': '정원마감'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'OPEN': 'bg-green-500',
      'CLOSED': 'bg-red-500',
      'FULL': 'bg-orange-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            뒤로가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-500 font-bold">⚽</span>
            </div>
            <h1 className="text-xl font-bold">스포츠 메이트</h1>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6" />
            <Link href="/mypage">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm opacity-90">모집글 상세</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20 p-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              뒤로가기
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {/* 상단 정보 카드 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(post.status)} text-white`}>
                  {getStatusText(post.status)}
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {getSportIcon(post.sports)} {getSportName(post.sports)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  className="p-1"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-1"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>{post.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{formatTimeToKorean12Hour(post.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-green-500" />
                <span>현재 {post.currentPeople}명 / 최대 {post.maxPeople}명</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-4 h-4 text-center">👫</span>
                <span>{getGenderText(post.gender)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-blue-600">😊</span>
              <span className="text-blue-800">무더위엔 내 몸상태를 세심하게 살피고 즐겁게 뛰어요</span>
            </div>
          </CardContent>
        </Card>

        {/* 가격 정보 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">참가비</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {post.cost.toLocaleString()}원
            </div>
            <div className="text-gray-600 mb-4">/ 1인당</div>
          </CardContent>
        </Card>

        {/* 매치 포인트 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">매치 포인트</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: "😊", text: "모든 레벨" },
                { icon: "👫", text: getGenderText(post.gender) },
                { icon: "👥", text: `${post.maxPeople}명 모집` },
                { icon: "🏃", text: "초보자 환영" }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 border rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <span className="text-2xl block mb-2">{item.icon}</span>
                  <div className="text-sm font-medium text-gray-800">{item.text}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 상세 설명 */}
        {post.description && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">상세 설명</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 구장 정보 */}
        {post.imageUrl && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">구장 정보</h3>
              
              {/* 구장 이미지*/}
              {post.imageUrl && (
                <div className="mb-6">
                  <div className="relative overflow-hidden rounded-xl shadow-sm bg-gray-100 max-w-5xl mx-auto">
                    <img 
                      src={post.imageUrl} 
                      alt="구장 사진" 
                      className="w-full h-auto object-contain"
                      style={{
                        imageRendering: 'high-quality',
                        imageRendering: '-webkit-optimize-contrast',
                        imageRendering: 'crisp-edges'
                      }}
                      loading="lazy"
                      onLoad={(e) => {
                        // 이미지 로드 완료 시 선명도 향상
                        const img = e.target as HTMLImageElement;
                        img.style.filter = 'contrast(1.05) brightness(1.02) saturate(1.1)';
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const placeholder = img.parentElement?.querySelector('.image-placeholder');
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="image-placeholder absolute inset-0 hidden items-center justify-center bg-gray-200 text-gray-500">
                      <div className="text-center">
                        <span className="text-3xl mb-2 block">🏟️</span>
                        <span className="text-sm">구장 이미지를 불러올 수 없습니다</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { icon: "☂️", text: "그늘막" },
                  { icon: "🚿", text: "샤워실" },
                  { icon: "🚗", text: "유료주차" },
                  { icon: "🧊", text: "음료 판매" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 border rounded-lg p-3 flex flex-col items-center gap-2 text-center">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{item.text}</span>
                  </div>
                ))}
              </div>
              */}

          </CardContent>
        </Card>)}
    </div>
              

      {/* Bottom Navigation  
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="">
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
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👤</span>
            </div>
            <span className="text-xs">마이페이지</span>
          </Link>
        </div>
      </div>*/}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-16 right-4 flex flex-col gap-2">
        <Button
          onClick={handleJoinEvent}
          disabled={post.status !== 'OPEN' || isJoined}
          className={`shadow-lg hover:shadow-xl transition-shadow ${
            post.status === 'OPEN' && !isJoined
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isJoined ? '참가 완료' : post.status === 'OPEN' ? '참가 신청하기' : '모집 마감'}
        </Button>
      </div>
    </div>
  )
}