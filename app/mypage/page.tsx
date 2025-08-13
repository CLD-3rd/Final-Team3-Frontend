"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, User, Settings, FileText, Heart, List, ReceiptPoundSterling, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-client";

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
  status: "PENDING" | "APPROVED" | "REJECTED"
  postStatus: "OPEN" | "CLOSED"
}

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
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({
    participatedCount: 0,
    myPostsCount: 0,
    favoritesCount: 0,
  })
  const [userLoading, setUserLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  
  const getToken = () => {
    if (typeof window === 'undefined') return null 
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  }

  const makeAuthenticatedRequest = async (url: string, options?: RequestInit) => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
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
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
        router.push('/login')
        return
      }
      throw new Error(`서버 오류: ${response.status}`)
    }

    return response
  }

  const fetchUserProfile = async (): Promise<UserProfile> => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user/mypage`)
    if (!response) return Promise.reject(new Error('인증이 필요합니다'))
    const result: ApiResponse<UserProfile> = await response.json()
    return result.data
  }

  const fetchMyPosts = async (): Promise<MyPost[]> => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/mine`)
    if (!response) return Promise.reject(new Error('인증이 필요합니다'))
    const result: ApiResponse<MyPosts> = await response.json()
    return result.data.posts
  }

  const fetchMyFollows = async (): Promise<FollowPost[]> => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user/follow`)
    if (!response) return Promise.reject(new Error('인증이 필요합니다'))
    const result: ApiResponse<FollowPost[]> = await response.json()
    return result.data
  }

  const fetchMyApplications = async (): Promise<MyApplication[]> => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/posts/apply`)
    if (!response) return Promise.reject(new Error('인증이 필요합니다'))
    const result: ApiResponse<MyApplication[]> = await response.json()
    return result.data
  }

  const calculateParticipatedCount = (applications: MyApplication[]): number => {
    const now = new Date()
    return applications.filter(app => {
      if (app.status !== 'APPROVED') return false
      if (app.postStatus !== 'CLOSED') return false
      const meetingDate = new Date(app.date)
      return meetingDate < now
    }).length
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

    const loadData = async () => {
      try {
        setError(null)

        const userProfile = await fetchUserProfile()
        setUser(userProfile)
        setUserLoading(false) 

        const [myPosts, follows, applications] = await Promise.all([
          fetchMyPosts(),
          fetchMyFollows(),
          fetchMyApplications(),
        ])

        setStats({
          participatedCount: calculateParticipatedCount(applications),
          myPostsCount: myPosts.length,
          favoritesCount: follows.length,
        })
        setStatsLoading(false) 

      } catch (err) {
        if (err instanceof Error && err.message.includes('인증')) {
          router.push('/login')
          return
        }
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
        console.error('Failed to fetch data:', err)
        setUserLoading(false)
        setStatsLoading(false)
      }
    }

    loadData()
  }, [mounted, router])

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token')
        }
        router.push("/login")
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
      <div className="bg-gray-400 text-white px-5 py-8">
        <div className="relative">
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