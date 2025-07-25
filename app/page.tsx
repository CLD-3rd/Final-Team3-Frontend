"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Clock, Users, Bell, User, Heart, Calendar, List, ChevronDown } from "lucide-react"
import Link from "next/link"
import CalendarView from "@/components/calendar-view"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/types/api"

const sports = [
  { id: "ALL", name: "전체", icon: "🏃" },
  { id: "SOCCER", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
]

const regions = ["서울", "경기", "대전", "대구", "부산", "광주", "인천", "울산"]
const genders = ["전체", "남자", "여자"]

export default function MainPage() {
  const [sortBy, setSortBy] = useState("popular")
  const [selectedSport, setSelectedSport] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("list")
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState("내 지역")
  const [selectedGender, setSelectedGender] = useState("성별")
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")


  const [nickname, setNickname] = useState(null);
  



  useEffect(() => {
    fetchPosts()
    fetchFavorites()
  }, [selectedSport, sortBy, searchQuery, selectedRegion, selectedGender])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError("")
      const params = {
        sport: selectedSport !== "all" ? selectedSport : undefined,
        sortBy,
        search: searchQuery || undefined,
        region: selectedRegion !== "내 지역" ? selectedRegion : undefined,
        gender: selectedGender !== "성별" ? selectedGender : undefined,
        date: selectedDate || undefined,
      }
      const posts = await apiClient.getPosts(params);  // posts만 받아옴!
      setPosts(posts);
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      setError("게시글을 불러오는데 실패했습니다.")
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const data = await apiClient.getFavorites()
      setFavorites(data?.map((fav: any) => fav.postId) || [])
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
      setFavorites([])
    }
  }

  const toggleFavorite = async (postId: number) => {
    try {
      if (favorites.includes(postId)) {
        await apiClient.removeFavorite(postId)
        setFavorites((prev) => prev.filter((id) => id !== postId))
      } else {
        await apiClient.addFavorite(postId)
        setFavorites((prev) => [...prev, postId])
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
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

  const filteredPosts = selectedDate ? posts.filter((post) => post.date === selectedDate) : posts

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
          <p className="font-semibold">
            {nickname ? `${nickname}님` : "운동 메이트님"}
          </p>
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
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchPosts} className="bg-blue-500 hover:bg-blue-600">
                  다시 시도
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">
                  {selectedDate ? "해당 날짜에 모집글이 없습니다" : "조건에 맞는 모집글이 없습니다"}
                </p>
                <Link href="/create-post">
                  <Button className="bg-blue-500 hover:bg-blue-600">새 모집글 작성하기</Button>
                </Link>
              </div>
            )}

            {/* Recruitment Posts */}
            {!loading && !error && filteredPosts.length > 0 && (
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
                          {post.sport}
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
                          <span>
                            {post.date} {post.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span>
                            {post.currentParticipants}/{post.maxParticipants}명
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {post.participants?.slice(0, 4).map((participant, idx) => (
                              <div
                                key={participant.id || idx}
                                className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white"
                              >
                                {participant.nickname?.charAt(0) || "?"}
                              </div>
                            ))}
                            {post.currentParticipants > 4 && (
                              <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                                +{post.currentParticipants - 4}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">{post.cost}원</p>
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
            )}
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

