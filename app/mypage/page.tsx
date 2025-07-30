"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, User, Settings, FileText, Heart, List, ReceiptPoundSterling } from "lucide-react"
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
    if (!mounted) ReceiptPoundSterling

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-6">
        <div className="text-center relative">
          {/* 오른쪽 상단에 홈 아이콘 배치 */}
          <Link href="/" className="absolute top-0 right-0 m-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10.75L12 4l9 6.75M4.5 10.75V19a1.25 1.25 0 001.25 1.25h3.5A1.25 1.25 0 0010.5 19v-4.25h3V19A1.25 1.25 0 0014.75 20.25h3.5A1.25 1.25 0 0019.5 19v-8.25"
              />
            </svg>
          </Link>
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">{user?.nickName}님</h2>
          <p className="text-sm opacity-90 mb-2">{user?.email}</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="bg-white/20 px-3 py-1 rounded-full">
              {user?.age}세
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              {sportsMapping[user?.sports || ""] || user?.sports}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-500">{stats.participatedCount}</p>
                  <p className="text-sm text-gray-600">참여한 모임</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-500">{stats.myPostsCount}</p>
                  <p className="text-sm text-gray-600">내 모집글</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-500">{stats.favoritesCount}</p>
                  <p className="text-sm text-gray-600">찜한 모집글</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
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
            className="w-full text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
          >
            로그아웃
          </Button>
        </div>
      </div>

      {/* Bottom Navigation 
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
      </div>*/}
    </div>
  )
}
