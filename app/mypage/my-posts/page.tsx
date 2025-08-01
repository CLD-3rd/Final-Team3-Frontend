"use client"

import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

interface MyPost {
  postId?: number
  title: string
  date: string
  currentPeople: number
  maxPeople: number
  status: "OPEN" | "CLOSED"
}

interface Applicant {
  userId: number
  nickname: string
  gender: string
  age: number
  status: "PENDING" | "APPROVED" | "REJECTED"
}

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

// 백엔드 응답 구조
interface GetMyPosts {
  posts: MyPost[]
}

interface GetMyPostApplicants {
  applicants: Applicant[]
}

interface DecisionApplicant {
  applicantId: number
  nickName: string
  decision: string
}

// 토스트 메시지 타입
interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

// 토스트 컴포넌트
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

function MyPostsContentComponent() {
  const [myPosts, setMyPosts] = useState<MyPost[]>([])
  const [applicantsMap, setApplicantsMap] = useState<Record<number, Applicant[]>>({})
  const [expandedPosts, setExpandedPosts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const router = useRouter()
  const getAuthToken = () => {
    return localStorage.getItem("auth_token") || localStorage.getItem("accessToken")
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

  const makeAuthenticatedRequest = async (url: string, options?: RequestInit) => {
    const token = getAuthToken()
    if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (response.status === 403) {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        })
        
        return retryResponse
      }

      return response
    } catch (error) {
      throw new Error("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.")
    }
  }

  const fetchMyPosts = async (): Promise<MyPost[]> => {
    const response = await makeAuthenticatedRequest("http://localhost:8080/api/posts/mine")
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`)
    }
    const result: ApiResponse<GetMyPosts> = await response.json()
    
    if (!result.data || !Array.isArray(result.data.posts)) {
      return []
    }
    
    return result.data.posts
  }

  const fetchApplicants = async (postId: number): Promise<Applicant[]> => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}/applicants`)
      
      if (response.status === 403) {
        return []
      }
      
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} - ${response.statusText}`)
      }
      
      const result: ApiResponse<GetMyPostApplicants> = await response.json()
      
      return result.data.applicants || []
    } catch (error) {
      return []
    }
  }

  const manageApplicant = async (postId: number, applicantId: number, decision: 'ACCEPT' | 'REJECT') => {
    try {
      const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}/apply`, {
        method: 'PATCH',
        body: JSON.stringify({
          applicantId,
          decision,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`서버 오류: ${response.status} - ${response.statusText}`)
      }
      
      const result: ApiResponse<DecisionApplicant> = await response.json()

      addToast(result.message, 'success') 
      
      return result.data
    } catch (error) {
      throw error
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '승인대기'
      case 'APPROVED': return '승인완료'
      case 'REJECTED': return '거절됨'
      case 'OPEN': return '모집중'
      case 'CLOSED': return '모집완료'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    const period = hours >= 12 ? '오후' : '오전'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    
    return `${month}월 ${day}일 ${period} ${displayHours}시${minutes > 0 ? ` ${minutes}분` : ''}`
  }

  useEffect(() => {
    const loadMyPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const posts = await fetchMyPosts()
        setMyPosts(posts)
        
        for (let i = 0; i < posts.length; i++) {
          try {
            const postId = posts[i].postId || (i + 1)
            const applicants = await fetchApplicants(postId)
            setApplicantsMap(prev => ({
              ...prev,
              [i]: applicants
            }))
          } catch (err) {
            setApplicantsMap(prev => ({
              ...prev,
              [i]: []
            }))
          }
        }
      } catch (err) {
        if (!(err instanceof Error) || !err.message.includes("인증")) {
          setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
          addToast(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.', 'error')
        }
      } finally {
        setLoading(false)
      }
    }
    loadMyPosts()
  }, [])

  const toggleExpanded = async (postIndex: number) => {
    const isExpanding = !expandedPosts.includes(postIndex)
    
    setExpandedPosts(prev => 
      prev.includes(postIndex) 
        ? prev.filter(id => id !== postIndex)
        : [...prev, postIndex]
    )
    
    if (isExpanding && (!applicantsMap[postIndex] || applicantsMap[postIndex].length === 0)) {
      try {
        const postId = myPosts[postIndex]?.postId || (postIndex + 1)
        const applicants = await fetchApplicants(postId)
        setApplicantsMap(prev => ({
          ...prev,
          [postIndex]: applicants
        }))
        
      } catch (err) {
        setApplicantsMap(prev => ({
          ...prev,
          [postIndex]: []
        }))
        addToast('신청자 목록을 불러오는데 실패했습니다.', 'error')
      }
    }
  }

  const handleApprove = async (postIndex: number, applicantId: number) => {
    try {
      const postId = myPosts[postIndex]?.postId || (postIndex + 1)
      const result = await manageApplicant(postId, applicantId, 'ACCEPT')
      
      setApplicantsMap(prev => ({
        ...prev,
        [postIndex]: prev[postIndex]?.map(applicant => 
          applicant.userId === applicantId 
            ? { ...applicant, status: 'APPROVED' as const }
            : applicant
        ) || []
      }))

      setMyPosts(prev => prev.map((post, index) => {
        if (index === postIndex) {
          const newCurrentPeople = post.currentPeople + 1
          const newStatus = newCurrentPeople >= post.maxPeople ? 'CLOSED' : post.status
          return { 
            ...post, 
            currentPeople: newCurrentPeople,
            status: newStatus as "OPEN" | "CLOSED"
          }
        }
        return post
      }))

    } catch (err) {
      addToast(err instanceof Error ? err.message : '승인에 실패했습니다.', 'error')
    }
  }

  const handleReject = async (postIndex: number, applicantId: number) => {
    try {
      const postId = myPosts[postIndex]?.postId || (postIndex + 1)
      const result = await manageApplicant(postId, applicantId, 'REJECT')
      
      const currentApplicant = applicantsMap[postIndex]?.find(applicant => applicant.userId === applicantId)
      const wasApproved = currentApplicant?.status === 'APPROVED'
      
      setApplicantsMap(prev => ({
        ...prev,
        [postIndex]: prev[postIndex]?.map(applicant => 
          applicant.userId === applicantId 
            ? { ...applicant, status: 'REJECTED' as const }
            : applicant
        ) || []
      }))

      if (wasApproved) {
        setMyPosts(prev => prev.map((post, index) => {
          if (index === postIndex) {
            const newCurrentPeople = Math.max(0, post.currentPeople - 1)
            const newStatus = newCurrentPeople < post.maxPeople ? 'OPEN' : post.status
            return { 
              ...post, 
              currentPeople: newCurrentPeople,
              status: newStatus as "OPEN" | "CLOSED"
            }
          }
          return post
        }))
      }

    } catch (err) {
      addToast(err instanceof Error ? err.message : '거절에 실패했습니다.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">불러오는 중...</p>
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
            onClick={() => window.location.reload()} 
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
          <h1 className="text-xl font-bold text-gray-900">내 모집글 관리</h1>
        </div>
      </div>

      <div className="px-5 pb-20">
        <div className="space-y-3 pt-6">
          {Array.isArray(myPosts) && myPosts.map((post, index) => (
            <Card key={index} className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.status === "OPEN" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {getStatusText(post.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                    onClick={() => router.push(`/edit-post/${post.postId}`)}
                  >
                    <Pencil className="w-5 h-5" />
                    <span className="sr-only">수정</span>
                  </Button>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-4 leading-tight">{post.title}</h3>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 text-sm">{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 text-sm">{post.currentPeople}/{post.maxPeople}명</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    모집 현황: {post.currentPeople}/{post.maxPeople}명
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                    className="flex items-center gap-2 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    신청자 보기 ({(applicantsMap[index]?.length ?? '?')}명)
                    {expandedPosts.includes(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {expandedPosts.includes(index) && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h5 className="font-semibold text-gray-900">신청자 목록</h5>
                    {!applicantsMap[index] ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">로딩 중...</p>
                      </div>
                    ) : applicantsMap[index].length > 0 ? (
                      applicantsMap[index].map((applicant) => (
                        <div key={applicant.userId} className="bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {applicant.nickname.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{applicant.nickname}</p>
                                <p className="text-sm text-gray-500">
                                  {applicant.gender} · {applicant.age}세
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                applicant.status === "APPROVED"
                                  ? "bg-green-500 text-white"
                                  : applicant.status === "PENDING"
                                  ? "bg-orange-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {getStatusText(applicant.status)}
                            </Badge>
                          </div>

                          {applicant.status === "PENDING" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white flex-1 rounded-xl font-medium active:scale-95 transition-all duration-200"
                                onClick={() => handleApprove(index, applicant.userId)}
                              >
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-200 hover:bg-red-50 flex-1 bg-transparent rounded-xl font-medium active:scale-95 transition-all duration-200"
                                onClick={() => handleReject(index, applicant.userId)}
                              >
                                거절
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-1 font-medium">신청자가 없거나 조회 권한이 없습니다</p>
                        <p className="text-xs text-gray-400">
                          일부 게시글은 권한 설정으로 인해 신청자를 조회할 수 없을 수 있습니다
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(!Array.isArray(myPosts) || myPosts.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Pencil className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">작성한 모집글이 없습니다</p>
            <p className="text-gray-500 text-sm mb-6">새로운 모집글을 작성해보세요</p>
            <Link href="/create-post">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm">
                새 모집글 작성하기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const MyPostsContent = dynamic(() => Promise.resolve(MyPostsContentComponent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    </div>
  )
})

export default function MyPostsManagePage() {
  return <MyPostsContent />
}