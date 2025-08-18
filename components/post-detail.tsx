"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, Heart, Users, Clock, MapPin, AlertTriangle, Bell, User, Eye, CheckCircle, XCircle, Shield, Zap, Trophy, Star, X } from "lucide-react"
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-client";

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
  userEmail?: string 
}

interface MyApplication {
  postId: number
  title: string
  date: string
  currentPeople: number
  maxPeople: number
  location: string
  cost: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  postStatus: "OPEN" | "CLOSED" | "EXPIRED"
}

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

interface EventDetailModalProps {
  postId: number
  isOpen: boolean
  onClose: () => void
  onLogin?: () => void
}

// 토스트 컴포넌트
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-8 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all transform animate-in slide-in-from-right-5 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? (
      <CheckCircle className="w-6 h-6" />
    ) : (
      <XCircle className="w-6 h-6" />
    )}
    <span className="font-semibold">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white transition-colors">
      <span className="text-xl">×</span>
    </button>
  </div>
)

export default function EventDetailModal({ postId, isOpen, onClose, onLogin }: EventDetailModalProps) {
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNotifying, setIsNotifying] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [currentApplication, setCurrentApplication] = useState<MyApplication | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter();

  // 인증 토큰 가져오기 및 API 호출 함수
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("auth_token") || sessionStorage.getItem("accessToken")
    }
    return null
  }

  // JWT 토큰에서 이메일 추출
  const getEmailFromToken = () => {
    try {
      const token = getAuthToken()
      if (!token) return null

      // JWT 토큰을 디코딩 (payload 부분만)
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload)
      console.log("JWT 토큰 payload:", payload)
      
      return payload.email || payload.sub
    } catch (error) {
      console.error('JWT 토큰 파싱 실패:', error)
      return null
    }
  }

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

  // 인증이 필요한 API 호출
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

  // 비인증 API 호출
  const makeGuestRequest = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  // 내가 신청한 모집글 목록 가져오기
  const fetchMyApplications = async () => {
    if (!isLoggedIn) return

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/apply`)
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.code === "POST208" && data.data) {
          setMyApplications(data.data)
          
          // 현재 게시글에 대한 신청 상태 찾기
          const application = data.data.find((app: MyApplication) => app.postId === postId)
          setCurrentApplication(application || null)
          setIsJoined(!!application)
        }
      }
    } catch (error) {
      console.error("내 신청 목록 가져오기 실패:", error)
    }
  }

  // 로그인 상태 확인
  useEffect(() => {
    const token = getAuthToken()
    const userEmail = getEmailFromToken()
    
    setIsLoggedIn(!!token)
    if (userEmail) {
      setCurrentUserEmail(userEmail)
    }
  }, [])

  // 내 신청 목록 가져오기
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      fetchMyApplications()
    }
  }, [isLoggedIn, isOpen, postId])

  // 포스트 데이터 가져오기 함수
  const fetchPostData = async () => {
    if (!postId) return

    try {
      setLoading(true)
      setError("")
      
      let response
      const token = getAuthToken()
      
      // 로그인한 사용자는 인증된 요청, 비로그인은 게스트 요청
      if (token) {
        try {
          response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}`)
        } catch (authError) {
          // 인증 실패 시 게스트 요청으로 대체
          response = await makeGuestRequest(`${API_BASE_URL}/posts/${postId}`)
        }
      } else {
        response = await makeGuestRequest(`${API_BASE_URL}/posts/${postId}`)
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data && data.code === "POST201" && data.data) {
        setPost(data.data)
        
        if (isLoggedIn) {
          setIsFavorited(data.data.bookmarked || false)
          
          // 작성자 확인 - JWT 이메일과 모집글 작성자 이메일 비교
          const userEmail = getEmailFromToken()
          if (userEmail && data.data.userEmail) {
            setIsAuthor(userEmail === data.data.userEmail)
          }
        }
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

  // 포스트 데이터 로딩
  useEffect(() => {
    if (isOpen && postId) {
      fetchPostData()
    }
  }, [postId, isOpen, isLoggedIn])

  const handleClose = () => {
    setPost(null)
    setError("")
    setToasts([])
    setMyApplications([])
    setCurrentApplication(null)
    setIsJoined(false)
    onClose()
  }

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      handleClose()
      if (onLogin) onLogin()
      return
    }

    const token = getAuthToken()

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/follow`, {
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
                addToast(data.message, 'success')
              } else {
                addToast(isNowFollowed ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
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
            addToast(newFavoriteState ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
          }
        } else {
          const newFavoriteState = !isFavorited
          setIsFavorited(newFavoriteState)
          if (post) {
            setPost({ ...post, bookmarked: newFavoriteState })
          }
          addToast(newFavoriteState ? '찜하기가 완료되었습니다!' : '찜하기가 해제되었습니다!', 'success')
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          handleClose()
          if (onLogin) onLogin()
        } else {
          try {
            const errorData = await response.json()
            const errorMessage = errorData?.message || '찜하기 처리에 실패했습니다.'
            addToast(errorMessage, 'error')
          } catch (parseError) {
            addToast('찜하기 처리에 실패했습니다.', 'error')
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        handleClose()
        if (onLogin) onLogin()
      } else {
        const errorMessage = error instanceof Error ? error.message : '찜하기 처리에 실패했습니다.'
        addToast(errorMessage, 'error')
      }
    }
  }

  const handleJoinEvent = async () => {
    if (!isLoggedIn) {
      handleClose()
      if (onLogin) onLogin()
      return
    }

    const token = getAuthToken()
    if (!token) {
      handleClose()
      if (onLogin) onLogin()
      return
    }

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/apply`, {
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
        addToast(data.message || '참가 신청이 완료되었습니다!', 'success')
        
        // 신청 후 내 신청 목록 다시 가져오기
        await fetchMyApplications()
        
        // 게시글 정보 다시 가져오기 (인원수 변경 반영)
        await fetchPostData()
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
          addToast(duplicateMessage, 'error')
        } else if (response.status === 403) {
          addToast('이미 신청한 모집글입니다', 'error')
        } else if (response.status === 409) {
          const duplicateMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '이미 신청한 모집글입니다'
          addToast(duplicateMessage, 'error')
        } else if (response.status === 401) {
          handleClose()
          if (onLogin) onLogin()
        } else {
          const errorMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '참가 신청에 실패했습니다.'
          addToast(errorMessage, 'error')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        handleClose()
        if (onLogin) onLogin()
      } else {
        const errorMessage = error instanceof Error ? error.message : '참가 신청에 실패했습니다.'
        addToast(errorMessage, 'error')
      }
    }
  }

  const handleCancelApplication = async () => {
    if (!isLoggedIn) {
      handleClose()
      if (onLogin) onLogin()
      return
    }

    const token = getAuthToken()
    if (!token) {
      handleClose()
      if (onLogin) onLogin()
      return
    }

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/apply`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        let data = null
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json()
          } catch (jsonError) {
            data = { message: '참가 신청이 취소되었습니다!' }
          }
        } else {
          data = { message: '참가 신청이 취소되었습니다!' }
        }
        
        setIsJoined(false)
        setCurrentApplication(null)
        addToast(data.message || '참가 신청이 취소되었습니다!', 'success')
        
        // 취소 후 내 신청 목록 다시 가져오기
        await fetchMyApplications()
        
        // 게시글 정보 다시 가져오기
        await fetchPostData()
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
        
        if (response.status === 400 && errorData?.code === "PARTICIPATION400") {
          addToast(errorData.message, 'error')
        } else if (response.status === 401) {
          handleClose()
          if (onLogin) onLogin()
        } else {
          const errorMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '참가 신청 취소에 실패했습니다.'
          addToast(errorMessage, 'error')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        handleClose()
        if (onLogin) onLogin()
      } else {
        const errorMessage = error instanceof Error ? error.message : '참가 신청 취소에 실패했습니다.'
        addToast(errorMessage, 'error')
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
      'EXPIRED': '모집만료'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'OPEN': 'bg-emerald-500',
      'CLOSED': 'bg-red-500',
      'EXPIRED': 'bg-gray-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getApplicationStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': '승인 대기',
      'APPROVED': '승인됨',
      'REJECTED': '거절됨'
    }
    return statusMap[status] || status
  }

  const getApplicationStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'PENDING': 'bg-yellow-500',
      'APPROVED': 'bg-green-500',
      'REJECTED': 'bg-red-500'
    }
    return colorMap[status] || 'bg-gray-500'
  }

  if (!isOpen) return null

  return (
    <>
      {/* 토스트 메시지들 */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* 모달 오버레이 */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        {/* 모달 컨테이너 */}
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl ">
          {/* 모달 헤더 */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚽</span>
                </div>
                <span className="font-bold text-gray-900">MatchFit</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${
                    isLoggedIn && isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          </header>

          {/* 모달 콘텐츠 */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] ">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-lg font-medium">로딩 중...</p>
                </div>
              </div>
            ) : error || !post ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center px-6">
                  <div className="w-24 h-24 bg-red-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
                  <p className="text-gray-600 mb-8 text-lg">{error}</p>
                </div>
              </div>
            ) : (
              <>
                {/* 메인 섹션 */}
                <section className="relative px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      <Badge className={`${getStatusColor(post.status)} text-white px-4 py-2 rounded-full font-semibold`}>
                        {getStatusText(post.status)}
                      </Badge>
                      <Badge className="bg-black text-white px-4 py-2 rounded-full font-semibold">
                        {getSportIcon(post.sports)} {getSportName(post.sports)}
                      </Badge>
                      {isLoggedIn && isAuthor && (
                        <Badge className="bg-purple-500 text-white px-4 py-2 rounded-full font-semibold">
                          내 모집글
                        </Badge>
                      )}
                      {isLoggedIn && currentApplication && (
                        <Badge className={`${getApplicationStatusColor(currentApplication.status)} text-white px-4 py-2 rounded-full font-semibold`}>
                          {getApplicationStatusText(currentApplication.status)}
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                      {post.title}
                    </h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">위치</p>
                          <p className="text-lg font-semibold text-gray-900">{post.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">일시</p>
                          <p className="text-lg font-semibold text-gray-900">{formatTimeToKorean12Hour(post.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">인원</p>
                          <p className="text-lg font-semibold text-gray-900">현재 {post.currentPeople}명 / 최대 {post.maxPeople}명</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">👫</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">성별</p>
                          <p className="text-lg font-semibold text-gray-900">{getGenderText(post.gender)}</p>
                        </div>
                      </div>
                    </div>

                    {/* 참가비 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 text-center">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">참가비</span>
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {post.cost === 0 ? '무료' : `${post.cost.toLocaleString()}원`}
                      </div>
                      {post.cost > 0 && (
                        <div className="text-gray-600">/ 1인당</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 매치 포인트 */}
                <section className="py-16 bg-gray-50">
                  <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">매치 포인트</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { icon: "😊", text: "모든 레벨", desc: "초보자부터 고수까지" },
                        { icon: "👫", text: getGenderText(post.gender), desc: "성별 구분" },
                        { icon: "👥", text: `${post.maxPeople}명 모집`, desc: "적정 인원" },
                        { icon: "🏃", text: "초보자 환영", desc: "누구나 참여 가능" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                          <span className="text-4xl block mb-4">{item.icon}</span>
                          <h3 className="font-semibold text-gray-900 mb-2">{item.text}</h3>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 상세 설명 */}
                {post.description && (
                  <section className="py-16 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-8">상세 설명</h2>
                      <div className="bg-gray-50 rounded-3xl p-8">
                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                          {post.description}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* 구장 정보 */}
                {post.imageUrl && (
                  <section className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">구장 정보</h2>
                      
                      <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                        <div className="relative">
                          <img 
                            src={post.imageUrl} 
                            alt="구장 사진" 
                            className="w-full h-80 object-cover"
                            style={{
                              imageRendering: 'high-quality',
                              imageRendering: '-webkit-optimize-contrast',
                              imageRendering: 'crisp-edges'
                            }}
                            loading="lazy"
                            onLoad={(e) => {
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
                              <span className="text-6xl mb-4 block">🏟️</span>
                              <span className="text-lg font-medium">구장 이미지를 불러올 수 없습니다</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 주의사항 */}
                <section className="py-16 bg-white">
                  <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">😊</span>
                        </div>
                        <h3 className="text-xl font-semibold text-blue-900">함께 지켜요</h3>
                      </div>
                      <p className="text-blue-800 text-lg leading-relaxed">
                        무더위엔 내 몸상태를 세심하게 살피고 즐겁게 뛰어요. 
                        안전한 운동을 위해 충분한 수분 섭취와 적절한 휴식을 잊지 마세요! 🏃‍♂️💧
                      </p>
                    </div>
                  </div>
                </section>

                {/* 참가 현황 */}
                <section className="py-8">
                  <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">참가 현황</h3>
                      <span className="text-sm text-gray-600">
                        {post.currentPeople}/{post.maxPeople}명
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((post.currentPeople / post.maxPeople) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>모집률 {Math.round((post.currentPeople / post.maxPeople) * 100)}%</span>
                      <span>
                        {post.maxPeople - post.currentPeople > 0 
                          ? `${post.maxPeople - post.currentPeople}명 더 필요` 
                          : '모집 완료'}
                      </span>
                    </div>
                  </div>
                </section>
                
                {/* 작성자가 아닌 경우에만 표시 */}
                {(!isLoggedIn || !isAuthor) && (
                  <section className="py-16 bg-gradient-to-r from-gray-900 to-black text-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                      <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        지금 바로 참여하세요
                      </h2>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {/* 신청 버튼 - 신청 상태에 따라 다른 버튼 표시 */}
                        {isLoggedIn && currentApplication ? (
                          currentApplication.status === "REJECTED" ? (
                            <div className="px-12 py-3 rounded-2xl font-bold text-lg bg-gray-400 text-white cursor-not-allowed">
                              참가 신청이 거절되었습니다
                            </div>
                          ) : (
                            <button onClick={handleCancelApplication}>
                              참가신청 취소하기
                            </button>
                          )
                        ) : (
                          <button
                            onClick={handleJoinEvent}
                            disabled={post.status !== 'OPEN' || isJoined}
                            className={`px-12 py-3 rounded-2xl font-bold text-lg transition-all duration-300 ${
                              post.status === 'OPEN' && !isJoined
                                ? 'bg-white text-black hover:bg-gray-100 hover:scale-105 shadow-lg'
                                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {!isLoggedIn 
                              ? '로그인 후 참가신청' 
                              : isJoined 
                                ? '신청 완료' 
                                : post.status === 'OPEN' 
                                  ? '참가 신청하기' 
                                  : '모집 마감'
                            }
                          </button>
                        )}
                        
                        <button
                          onClick={toggleFavorite}
                          className="flex items-center gap-2 px-6 py-3 text-lg border border-white/30 text-white rounded-2xl hover:bg-white/10 transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${
                            isLoggedIn && isFavorited ? 'fill-red-400 text-red-400' : ''
                          }`} />
                          <span className="font-medium">
                            {!isLoggedIn 
                              ? '로그인 후 찜하기' 
                              : isFavorited 
                                ? '찜 완료' 
                                : '찜하기'
                            }
                          </span>
                        </button>
                      </div> 
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
