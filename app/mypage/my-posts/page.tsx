"use client"

import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react"
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

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

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

function MyPostsContentComponent() {
  const [myPosts, setMyPosts] = useState<MyPost[]>([])
  const [applicantsMap, setApplicantsMap] = useState<Record<number, Applicant[]>>({})
  const [expandedPosts, setExpandedPosts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("auth_token") 
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

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('accessToken')
        router.push('/login')
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.")
      }

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
      if (error instanceof Error && error.message.includes('인증')) {
        throw error
      }
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
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = getAuthToken()
    if (!token) {
      router.push('/login')
      return
    }

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
        if (err instanceof Error && (err.message.includes("인증") || err.message.includes("로그인"))) {
          return
        }
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
        addToast(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadMyPosts()
  }, [mounted, router])

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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
            다시 시도
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

      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">내 모집글 관리</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="space-y-4">
          {Array.isArray(myPosts) && myPosts.map((post, index) => (
            <Card key={index} className="bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant={post.status === "OPEN" ? "default" : "secondary"}
                    className={
                      post.status === "OPEN" 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-500 text-white"
                    }
                  >
                    {getStatusText(post.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-gray-400 hover:text-blue-500"
                    onClick={() => router.push(`/edit-post/${post.postId}`)}
                  >
                    <Pencil className="w-5 h-5" />
                    <span className="sr-only">수정</span>
                  </Button>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">{post.title}</h4>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>{post.currentPeople}/{post.maxPeople}명</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    모집 현황: {post.currentPeople}/{post.maxPeople}명
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                    className="flex items-center gap-2"
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
                    <h5 className="font-medium text-gray-900">신청자 목록</h5>
                    {!applicantsMap[index] ? (
                      <p className="text-gray-500 text-center py-4">로딩 중...</p>
                    ) : applicantsMap[index].length > 0 ? (
                      applicantsMap[index].map((applicant) => (
                        <div key={applicant.userId} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {applicant.nickname.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{applicant.nickname}</p>
                                <p className="text-sm text-gray-600">
                                  {applicant.gender} · {applicant.age}세
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`${
                                applicant.status === "APPROVED"
                                  ? "bg-green-500"
                                  : applicant.status === "PENDING"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              } text-white`}
                            >
                              {getStatusText(applicant.status)}
                            </Badge>
                          </div>

                          {applicant.status === "PENDING" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white flex-1"
                                onClick={() => handleApprove(index, applicant.userId)}
                              >
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-200 hover:bg-red-50 flex-1 bg-transparent"
                                onClick={() => handleReject(index, applicant.userId)}
                              >
                                거절
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">신청자가 없습니다</p>
                        
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(!Array.isArray(myPosts) || myPosts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">작성한 모집글이 없습니다</p>
            <Link href="/create-post">
              <Button className="bg-blue-500 hover:bg-blue-600">새 모집글 작성하기</Button>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">불러오는 중...</p>
      </div>
    </div>
  )
})

export default function MyPostsManagePage() {
  return <MyPostsContent />
}