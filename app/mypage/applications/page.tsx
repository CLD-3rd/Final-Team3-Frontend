"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function ApplicationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [applications, setApplications] = useState<DisplayApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("auth_token") || localStorage.getItem("accessToken")
  }

  const makeAuthenticatedRequest = async (url: string) => {
    const token = getAuthToken()
    if (!token) throw new Error("인증 토큰이 없습니다.")

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 403) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
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

      const response = await makeAuthenticatedRequest("http://localhost:8080/api/posts/apply")

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
                <Link key={application.id} href={`/post/${application.id}`}>
                  <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
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

                      <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">{application.cost}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
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