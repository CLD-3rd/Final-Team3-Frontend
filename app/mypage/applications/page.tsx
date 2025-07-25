"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react"
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
}

interface DisplayApplication {
  id: number
  sport: string
  title: string
  location: string
  time: string
  participants: string
  cost: string
  status: string
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
        sport: extractSportFromTitle(item.title),
        title: item.title,
        location: item.location,
        time: formatDateTime(item.date),
        participants: `${item.currentPeople}/${item.maxPeople}명`,
        cost: item.cost === 0 ? "무료" : `${item.cost.toLocaleString()}원`,
        status: getStatusInKorean(item.status),
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

  const extractSportFromTitle = (title: string): string => {
    if (title.includes('축구')) return '축구'
    if (title.includes('배드민턴')) return '배드민턴'
    if (title.includes('탁구')) return '탁구'
    if (title.includes('테니스')) return '테니스'
    if (title.includes('농구')) return '농구'
    return '기타'
  }

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

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return app.status === "승인대기"
    if (activeTab === "approved") return app.status === "승인완료"
    if (activeTab === "rejected") return app.status === "거절"
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "승인완료": return "bg-green-500"
      case "승인대기": return "bg-yellow-500"
      case "거절": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getSportColor = (sport: string) => {
    switch (sport) {
      case "축구": return "bg-blue-100 text-blue-700"
      case "테니스": return "bg-green-100 text-green-700"
      case "배드민턴": return "bg-purple-100 text-purple-700"
      case "탁구": return "bg-red-100 text-red-700"
      case "농구": return "bg-orange-100 text-orange-700"
      default: return "bg-gray-100 text-gray-700"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">내 신청 내역</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchApplications} className="bg-blue-500 hover:bg-blue-600">
              다시 시도
            </Button>
          </div>
        )}

        {!error && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className={activeTab === "all" ? "bg-blue-500 text-white" : ""}
              >
                전체 ({applications.length})
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className={activeTab === "pending" ? "bg-blue-500 text-white" : ""}
              >
                승인대기 ({applications.filter((a) => a.status === "승인대기").length})
              </Button>
              <Button
                variant={activeTab === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("approved")}
                className={activeTab === "approved" ? "bg-blue-500 text-white" : ""}
              >
                승인완료 ({applications.filter((a) => a.status === "승인완료").length})
              </Button>
              <Button
                variant={activeTab === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("rejected")}
                className={activeTab === "rejected" ? "bg-blue-500 text-white" : ""}
              >
                거절 ({applications.filter((a) => a.status === "거절").length})
              </Button>
            </div>

            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Link key={application.id} href={`/post/${application.id}`}>
                  <Card className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className={getSportColor(application.sport)}>
                          {application.sport}
                        </Badge>
                        <Badge className={`${getStatusColor(application.status)} text-white`}>
                          {application.status}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">{application.title}</h4>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>{application.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{application.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span>{application.participants}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">신청일: {application.appliedDate}</div>
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
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">신청 내역이 없습니다</p>
                <Link href="/">
                  <Button className="bg-blue-500 hover:bg-blue-600">홈으로 가기</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

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