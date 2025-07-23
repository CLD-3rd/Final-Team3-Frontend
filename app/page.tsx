"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Clock, Users, Bell, User, Heart, Calendar, List, ChevronDown } from "lucide-react"
import Link from "next/link"
import CalendarView from "@/components/calendar-view"

const sports = [
  { id: "all", name: "전체", icon: "🏃" },
  { id: "soccer", name: "축구", icon: "⚽" },
  { id: "tennis", name: "테니스", icon: "🎾" },
  { id: "pingpong", name: "탁구", icon: "🏓" },
  { id: "basketball", name: "농구", icon: "🏀" },
  { id: "badminton", name: "배드민턴", icon: "🏸" },
]

const regions = ["서울", "경기", "대전", "대구", "부산", "광주", "인천", "울산"]
const genders = ["전체", "남자", "여자"]

const recruitmentPosts = [
  {
    id: 1,
    sport: "축구",
    title: "주말 축구 함께할 하실 분!",
    location: "강남구 역삼동",
    time: "7월 20일 오후 2시",
    participants: "6/10명",
    cost: "15,000원",
    badge: "축구",
    status: "모집중",
  },
  {
    id: 2,
    sport: "테니스",
    title: "테니스 레슨 후 게임 하실 분",
    location: "서초구 반포동",
    time: "7월 21일 오전 10시",
    participants: "3/4명",
    cost: "25,000원",
    badge: "테니스",
    status: "모집중",
  },
  {
    id: 3,
    sport: "탁구",
    title: "탁구 동호회 회원 모집",
    location: "송파구 잠실동",
    time: "7월 22일 오후 7시",
    participants: "8/12명",
    cost: "12,000원",
    badge: "탁구",
    status: "모집중",
  },
  {
    id: 4,
    sport: "농구",
    title: "농구 3vs3 게임 하실 분",
    location: "마포구 홍대입구",
    time: "7월 19일 오후 8시",
    participants: "5/6명",
    cost: "무료",
    badge: "농구",
    status: "마감임박",
  },
]

export default function MainPage() {
  const [sortBy, setSortBy] = useState("popular")
  const [selectedSport, setSelectedSport] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("list") // "list" or "calendar"
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState("내 지역")
  const [selectedGender, setSelectedGender] = useState("성별")
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)

  const toggleFavorite = (postId: number) => {
    setFavorites((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setViewMode("list")
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
    setShowRegionDropdown(false)
  }

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender)
    setShowGenderDropdown(false)
  }

  const filteredPosts = selectedDate
    ? recruitmentPosts.filter((post) => {
        const postDate = "2024-07-20"
        return postDate === selectedDate
      })
    : recruitmentPosts

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Link href="/login">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm opacity-90">안녕하세요!</p>
          <p className="font-semibold">김운동님</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="지역, 운동 종목으로 검색해보세요"
            className="pl-10 bg-white text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {/* Region Filter */}
          <div className="relative">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-500 text-white whitespace-nowrap flex items-center gap-1"
              onClick={() => {
                setShowRegionDropdown(!showRegionDropdown)
                setShowGenderDropdown(false)
              }}
            >
              {selectedRegion}
              <ChevronDown className="w-3 h-3" />
            </Button>
            {showRegionDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => handleRegionSelect(region)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gender Filter */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap bg-transparent flex items-center gap-1"
              onClick={() => {
                setShowGenderDropdown(!showGenderDropdown)
                setShowRegionDropdown(false)
              }}
            >
              {selectedGender}
              <ChevronDown className="w-3 h-3" />
            </Button>
            {showGenderDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[80px]">
                {genders.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleGenderSelect(gender)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {gender}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 ${viewMode === "list" ? "bg-blue-500 text-white" : ""}`}
          >
            <List className="w-4 h-4" />
            리스트
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 ${viewMode === "calendar" ? "bg-blue-500 text-white" : ""}`}
          >
            <Calendar className="w-4 h-4" />
            캘린더
          </Button>
        </div>

        {/* Close dropdowns when clicking outside */}
        {(showRegionDropdown || showGenderDropdown) && (
          <div
            className="fixed inset-0 z-5"
            onClick={() => {
              setShowRegionDropdown(false)
              setShowGenderDropdown(false)
            }}
          />
        )}

        {viewMode === "calendar" ? (
          <CalendarView onDateSelect={handleDateSelect} />
        ) : (
          <>
            {/* Sports Categories */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">운동 종목</h3>
              <div className="grid grid-cols-3 gap-4">
                {sports.map((sport) => (
                  <Button
                    key={sport.id}
                    variant={selectedSport === sport.id ? "default" : "outline"}
                    className={`h-20 flex flex-col items-center justify-center gap-2 ${
                      selectedSport === sport.id ? "bg-blue-500 text-white" : "bg-white border-gray-200 text-gray-700"
                    }`}
                    onClick={() => setSelectedSport(sport.id)}
                  >
                    <span className="text-2xl">{sport.icon}</span>
                    <span className="text-sm">{sport.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{selectedDate ? `${selectedDate} 모집글` : "인기 모집글"}</h3>
              <div className="flex gap-2">
                {selectedDate && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="text-blue-500">
                    전체보기
                  </Button>
                )}
                <Button
                  variant={sortBy === "popular" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("popular")}
                  className={sortBy === "popular" ? "bg-blue-500 text-white" : ""}
                >
                  인기순
                </Button>
                <Button
                  variant={sortBy === "nearest" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("nearest")}
                  className={sortBy === "nearest" ? "bg-blue-500 text-white" : ""}
                >
                  가까운 순
                </Button>
                <Button variant="ghost" size="sm">
                  필터 ▼
                </Button>
              </div>
            </div>

            {/* Recruitment Posts */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge
                        variant="secondary"
                        className={`${
                          post.sport === "축구"
                            ? "bg-blue-100 text-blue-700"
                            : post.sport === "테니스"
                              ? "bg-green-100 text-green-700"
                              : post.sport === "탁구"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {post.badge}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFavorite(post.id)} className="p-1">
                          <Heart
                            className={`w-5 h-5 ${
                              favorites.includes(post.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                            }`}
                          />
                        </button>
                        <Badge
                          variant={post.status === "모집중" ? "default" : "destructive"}
                          className={post.status === "모집중" ? "bg-green-500" : "bg-red-500"}
                        >
                          {post.status}
                        </Badge>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">{post.title}</h4>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>{post.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{post.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>{post.participants}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                            C
                          </div>
                          <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                            E
                          </div>
                          <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                            C
                          </div>
                          <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                            O
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">+2명</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-500">{post.cost}</p>
                        <Link href={`/post/${post.id}`}>
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            상세보기
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-blue-500">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
      </div>
    </div>
  )
}
