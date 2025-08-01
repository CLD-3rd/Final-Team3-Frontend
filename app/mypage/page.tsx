"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, User, Settings, FileText, Heart, List, ReceiptPoundSterling, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

// API 응답 타입 정의
interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

interface UserProfile {
  id: number
  email: string
  nickName: string
  age: number
  sports: string
  town: string
  recruitCount: number
  joinCount: number
}

interface MyPost {
  postId: number
  title: string
  date: string
  currentPeople: number
  maxPeople: number
  status: string
}

interface MyPosts {
  posts: MyPost[]
}

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

interface MyApplication {
  postId: number
  title: string
  date: string
  currentPeople: number
  maxPeople: number
  location: string
  cost: number
  status: "PENDING" | "APPROVED" | "REJECTED" // 내 신청 상태
  postStatus: "OPEN" | "CLOSED" // 모집글의 상태 
}

// 스포츠 한글 매핑
const sportsMapping: { [key: string]: string } = {
  FOOTBALL: "축구",
  TENNIS: "테니스", 
  BASKETBALL: "농구",
  VOLLEYBALL: "배구",
  BADMINTON: "배드민턴",
  TABLE_TENNIS: "탁구"
}

const menuItems = [
  {
    icon: Settings,
    title: "개인정보 수정",
    href: "/mypage/profile-edit",
    description: "프로필 정보를 수정할 수 있습니다",
  },
  {
    icon: FileText,
    title: "내 신청 내역",
    href: "/mypage/applications",
    description: "신청한 모집글을 확인할 수 있습니다",
  },
  {
    icon: List,
    title: "내 모집글 관리",
    href: "/mypage/my-posts",
    description: "내가 작성한 모집글을 관리할 수 있습니다",
  },
  {
    icon: Heart,
    title: "찜 리스트",
    href: "/mypage/favorites",
    description: "관심있는 모집글을 확인할 수 있습니다",
  },
]

export default function MyPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({
    participatedCount: 0,
    myPostsCount: 0,
    favoritesCount: 0,
  })
  const [userLoading, setUserLoading] = useState(true) // 유저 정보 로딩
  const [statsLoading, setStatsLoading] = useState(true) // 통계 로딩
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false) // 마운트 상태 추가

  
  const getToken = () => {
    if (typeof window === 'undefined') return null 
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  }

  // 인증된 요청 헬퍼
  const makeAuthenticatedRequest = async (url: string, options?: RequestInit) => {
    const token = getToken()
    if (!token) {
      throw new Error('로그인이 필요합니다.')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`)
    }

    return response
  }

  // 유저 프로필 조회
  const fetchUserProfile = async (): Promise<UserProfile> => {
    const response = await makeAuthenticatedRequest('http://localhost:8080/api/user/mypage')
    const result: ApiResponse<UserProfile> = await response.json()
    return result.data
  }

  // 내 모집글 조회
  const fetchMyPosts = async (): Promise<MyPost[]> => {
    const response = await makeAuthenticatedRequest('http://localhost:8080/api/posts/mine')
    const result: ApiResponse<MyPosts> = await response.json()
    return result.data.posts
  }

  // 찜한 모집글 조회
  const fetchMyFollows = async (): Promise<FollowPost[]> => {
    const response = await makeAuthenticatedRequest('http://localhost:8080/api/user/follow')
    const result: ApiResponse<FollowPost[]> = await response.json()
    return result.data
  }

  // 내가 신청한 모집글 조회
  const fetchMyApplications = async (): Promise<MyApplication[]> => {
    const response = await makeAuthenticatedRequest('http://localhost:8080/api/posts/apply')
    const result: ApiResponse<MyApplication[]> = await response.json()
    return result.data
  }

  // 참여한 모임 수 계산
  const calculateParticipatedCount = (applications: MyApplication[]): number => {
    const now = new Date()
    return applications.filter(app => {
      if (app.status !== 'APPROVED') return false
      if (app.postStatus !== 'CLOSED') return false
      const meetingDate = new Date(app.date)
      return meetingDate < now
    }).length
  }

  // 데이터 로딩: 마운트 후에만 실행
  useEffect(() => {
    setMounted(true) 
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadData = async () => {
      try {
        setError(null)

        const userProfile = await fetchUserProfile()
        setUser(userProfile)
        setUserLoading(false) 

        // 나머지 데이터 병렬로 로드
        const [myPosts, follows, applications] = await Promise.all([
          fetchMyPosts(),
          fetchMyFollows(),
          fetchMyApplications(),
        ])

        // 통계 계산 및 업데이트
        setStats({
          participatedCount: calculateParticipatedCount(applications),
          myPostsCount: myPosts.length,
          favoritesCount: follows.length,
        })
        setStatsLoading(false) 

      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
        console.error('Failed to fetch data:', err)
        setUserLoading(false)
        setStatsLoading(false)
      }
    }

    loadData()
  }, [mounted]) // mounted가 true가 된 후에만 실행

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token')
        }
        window.location.href = "/login"
      } catch (error) {
        console.error("Logout error:", error)
      }
    }
  }

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">사용자 정보를 불러오는 중...</p>
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
            className="bg-black-600 hover:bg-black-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-400 text-white px-5 py-8">
        <div className="relative">
          {/* 홈 버튼 */}
          <Link href="/" className="absolute top-0 right-0 p-2 rounded-full hover:bg-white/10 transition-colors">
            <Home className="w-6 h-6 text-white" />
          </Link>
          
          <div className="text-center mt-8">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{user?.nickName}님</h2>
            <p className="text-white/80 text-sm mb-4">{user?.email}</p>
            <div className="flex items-center justify-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1 my-2 rounded-full">
                <span className="text-sm font-medium">{user?.age}세</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1 my-2 rounded-full">
                <span className="text-sm font-medium">
                  {sportsMapping[user?.sports || ""] || user?.sports}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 -mt-8 mb-8 relative z-10">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{stats.participatedCount}</p>
                  <p className="text-xs text-gray-500">참여한 모임</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-600 mb-1">{stats.myPostsCount}</p>
                  <p className="text-xs text-gray-500">내 모집글</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-500 mb-1">{stats.favoritesCount}</p>
                  <p className="text-xs text-gray-500">찜한 모집글</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="border border-gray-200 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-500 border-red-200 hover:bg-red-50 bg-transparent rounded-xl py-3 font-medium transition-all duration-200 active:scale-[0.98]"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}