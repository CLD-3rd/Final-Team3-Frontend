"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, RefreshCw, CheckCircle, XCircle, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-client";
import EventDetailModal from "@/components/post-detail"


interface ApiResponse {
  code: string
  message: string
  data: ApplicationData[]
}

interface ApplicationData {
  postId: number
  title: string
  date: string
  currentPeople: number
  maxPeople: number
  location: string
  cost: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  postStatus: "OPEN" | "CLOSED"
}

interface DisplayApplication {
  id: number
  title: string
  location: string
  time: string
  participants: string
  cost: string
  status: string
  postStatus: string
  appliedDate: string
}

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
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

export default function ApplicationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [applications, setApplications] = useState<DisplayApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [cancelingPostId, setCancelingPostId] = useState<number | null>(null)

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("auth_token") || localStorage.getItem("accessToken")
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

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/apply`)

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`)
      }

      const apiData: ApiResponse = await response.json()
      
      const transformedData: DisplayApplication[] = apiData.data.map((item) => ({
        id: item.postId,
        title: item.title,
        location: item.location,
        time: formatDateTime(item.date),
        participants: `${item.currentPeople}/${item.maxPeople}명`,
        cost: !item.cost || item.cost === 0 ? "무료" : `${Number(item.cost).toLocaleString()}원`,
        status: getStatusInKorean(item.status),
        postStatus: getPostStatusInKorean(item.postStatus),
        appliedDate: new Date().toISOString().split('T')[0],
      }))

      setApplications(transformedData)
    } catch (err) {
      console.error("신청 내역 불러오기 실패:", err)
      if (!(err instanceof Error) || !err.message.includes("인증")) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 참가신청 취소
  const handleCancelApplication = async (postId: number, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      setCancelingPostId(postId)

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
        
        addToast(data.message || '참가 신청이 취소되었습니다!', 'success')
        
        // 취소 후 목록 다시 가져오기
        await fetchApplications()
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
          router.push('/login')
        } else {
          const errorMessage = (errorData?.message && errorData.message !== '요청 처리 중 오류가 발생했습니다.') 
            ? errorData.message 
            : '참가 신청 취소에 실패했습니다.'
          addToast(errorMessage, 'error')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증')) {
        router.push('/login')
      } else {
        const errorMessage = error instanceof Error ? error.message : '참가 신청 취소에 실패했습니다.'
        addToast(errorMessage, 'error')
      }
    } finally {
      setCancelingPostId(null)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchApplications()
    }
  }, [mounted])

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const period = hours >= 12 ? '오후' : '오전'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    
    return `${month}월 ${day}일 ${period} ${displayHours}시`
  }

  const getStatusInKorean = (status: string): string => {
    switch (status) {
      case 'PENDING': return '승인대기'
      case 'APPROVED': return '승인완료'
      case 'REJECTED': return '거절'
      default: return '알 수 없음'
    }
  }

  const getPostStatusInKorean = (status: string): string => {
    switch (status) {
      case 'OPEN': return '모집중'
      case 'CLOSED': return '모집완료'
      default: return '알 수 없음'
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return app.status === "승인대기"
    if (activeTab === "approved") return app.status === "승인완료"
    if (activeTab === "rejected") return app.status === "거절"
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "승인완료": return "bg-green-500 text-white"
      case "승인대기": return "bg-orange-500 text-white"
      case "거절": return "bg-red-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const getPostStatusColor = (status: string) => {
    switch (status) {
      case "모집중": return "bg-green-100 text-green-700"
      case "모집완료": return "bg-gray-100 text-gray-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
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
      <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link href="/mypage" className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">내 신청 내역</h1>
        </div>
      </div>

      <div className="px-5 pb-20">
        {error && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-900 font-medium mb-1">오류가 발생했습니다</p>
            <p className="text-gray-500 text-sm mb-6 text-center">{error}</p>
            <Button 
              onClick={fetchApplications}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm"
            >
              다시 시도
            </Button>
          </div>
        )}

        {!error && (
          <>
            <div className="flex gap-2 pt-6 pb-6 overflow-x-auto scrollbar-hide">
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className={`min-w-fit px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "all" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                전체 {applications.length}
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className={`min-w-fit px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "pending" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                승인대기 {applications.filter((a) => a.status === "승인대기").length}
              </Button>
              <Button
                variant={activeTab === "approved" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("approved")}
                className={`min-w-fit px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "approved" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                승인완료 {applications.filter((a) => a.status === "승인완료").length}
              </Button>
              <Button
                variant={activeTab === "rejected" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("rejected")}
                className={`min-w-fit px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "rejected" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                거절 {applications.filter((a) => a.status === "거절").length}
              </Button>
            </div>

            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card 
                  key={application.id}
                  className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  onClick={() => {
                    setSelectedPostId(application.id)
                    setModalOpen(true)
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getPostStatusColor(application.postStatus)}`}>
                          {application.postStatus}
                        </Badge>
                      </div>
                      <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-4 leading-tight">{application.title}</h3>

                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-gray-600 text-sm">{application.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600 text-sm">{application.time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 text-sm">{application.participants}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-500">{application.cost}</p>
                      </div>
                      
                      {/* 신청취소 버튼 - 거절된 상태가 아닐 때만 표시 */}
                      {application.status !== "거절" && (
                        <Button
                          onClick={(e) => handleCancelApplication(application.id, e)}
                          disabled={cancelingPostId === application.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelingPostId === application.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              취소 중...
                            </div>
                          ) : (
                            '신청 취소'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 모달 */}
              {modalOpen && selectedPostId !== null && (
                <EventDetailModal
                  postId={selectedPostId}
                  isOpen={modalOpen}
                  onClose={() => {
                    setModalOpen(false);
                    setSelectedPostId(null);
                    // 모달 닫힐 때 목록 새로고침
                    fetchApplications();
                  }}
                />
              )}
            </div>

            {filteredApplications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium mb-1">신청 내역이 없습니다</p>
                <p className="text-gray-500 text-sm mb-6">새로운 모임에 참여해보세요</p>
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm">
                    홈으로 가기
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
