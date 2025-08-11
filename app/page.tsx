"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Clock, Users, Bell, User, Heart, Calendar, List, ChevronDown, Plus, Filter, ArrowRight, Play, Star, Trophy, Target } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CalendarView from "@/components/calendar-view"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/types/api"
import EventDetailModal from "@/components/post-detail"

const sports = [
  { id: "ALL", name: "전체", icon: "🏃" },
  { id: "FOOTBALL", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
  { id: "VOLLEYBALL", name: "배구", icon: "🏐" },
]

const regions = ["서울", "경기", "강원", "대전", "대구", "인천", "울산", "부산", "광주", "세종", "충북", "충남", "경북", "경남", "전북", "전남", "제주"]
const genders = ["남녀 모두", "남자", "여자"]

const genderMap = {
  "남녀 모두": "ALL",
  "남자": "MALE",
  "여자": "FEMALE",
};

function formatTimeToKorean12Hour(dateString: string) {
  if (!dateString) return "";
  let fixedDateString = dateString.replace(" ", "T");
  if (fixedDateString.length === 16) fixedDateString += ":00";
  const dateObj = new Date(fixedDateString);
  if (isNaN(dateObj.getTime())) return "";
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const isAM = hours < 12;
  let period = isAM ? "오전" : "오후";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return minutes === 0
    ? `${period} ${hours}시`
    : `${period} ${hours}시 ${minutes}분`;
}

function extractMainRegion(town: string): string | undefined {
  if (!town) return undefined;
  return regions.find(region => town.startsWith(region));
}

const getAuthToken = () => localStorage.getItem("auth_token");

export default function MainPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("recent")
  const [selectedSport, setSelectedSport] = useState("전체")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState("모든 지역")
  const [selectedGender, setSelectedGender] = useState("남녀 모두")
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [tempGender, setTempGender] = useState(selectedGender);
  const [showRegionModal, setShowRegionModal] = useState(false); 
  const [tempRegion, setTempRegion] = useState(selectedRegion);  
  const [myRegion, setMyRegion] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  
  const handleCreatePost = () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    router.push('/create-post');
  };

  useEffect(() => {
    setSelectedSport("전체");
    setSelectedRegion("모든 지역");
    setSelectedGender("성별");
    setSelectedDate(null);
    setViewMode("list");
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await apiClient.getProfile();
        setMyRegion(res.town || "");
        setNickname(res.nickName || ""); 
      } catch (error) {
        setMyRegion("");
        setNickname("");
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    apiClient.getPosts().then(setPosts);
  }, []);

  useEffect(() => {
    const fetchMyFollows = async () => {
      try {
        const ids = await apiClient.getMyFollows();
        setFavorites(ids);
      } catch (error) {
        setFavorites([]);
      }
    };
    fetchMyFollows();
  }, []);
  
  useEffect(() => {
    fetchPosts()
    fetchFavorites()
  }, [selectedSport, sortBy, searchQuery, selectedRegion, selectedGender, selectedDate])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError("")
      const params = {
        sports: selectedSport !== "전체" ? selectedSport : undefined,
        sortBy,
        search: searchQuery || undefined,
        gender: genderMap[selectedGender as keyof typeof genderMap],
        date: selectedDate || undefined,
      }
      const posts = await apiClient.getPosts(params);  
      setPosts(posts);
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      setError("게시글을 불러오는데 실패했습니다.")
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log(posts);
    if (posts.length > 0) {
      console.log(posts[0].date);
    }
  }, [posts]);
  
  const fetchFavorites = async () => {
    try {
      const ids = await apiClient.getMyFollows()
      setFavorites(ids);
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
      setFavorites([]);
    }
  }

  const toggleFavorite = async (postId: number) => {
    try {
      const res = await apiClient.toggleFollow(postId);
      console.log("toggleFollow 응답:", res);
      if (res.data?.followed) {
        setFavorites((prev) => 
          prev.includes(Number(postId)) ? prev : [...prev, Number(postId)]
        );
      } else {
        setFavorites((prev) => prev.filter((id) => id !== Number(postId)));
      }
    } catch (error) {
      alert("찜 상태 변경에 실패했습니다.");  
      console.error(error);
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setViewMode("list")
  }

  const now = new Date();
  const myMainRegion = extractMainRegion(myRegion);
  // tempRegion이 selectedRegion으로
  const filteredPosts = posts.filter(post => {
    // 1. 지역 필터
    const regionMatch = selectedRegion === "모든 지역"
      ? true
      : selectedRegion === "내 지역"
        ? extractMainRegion(post.town) === myMainRegion
        : post.town === selectedRegion;

    if (!regionMatch) return false;

    // 2. 현재 시각 이후 모집글만 (항상 적용)
    if (post.date) {
      const postDateTime = new Date(post.date.replace(" ", "T"));
      // 현재 시각 이후만 남김
      if (postDateTime <= now) return false;
    }

    // 3. 특정 날짜가 선택된 경우 해당 날짜만 필터링
    if (selectedDate) {
      const postDateStr = post.date?.split("T")[0];
      if (postDateStr !== selectedDate) return false;
    }

    // selectedDate가 없으면 모두 통과
    return true;
  });

  const sortedPosts = (() => {
    if (sortBy === "popular") {
      return [...filteredPosts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    if (sortBy === "recent") {
      return [...filteredPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return filteredPosts;
  })();

  return (
    <div className="min-h-screen bg-white">
      {showGenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">성별</h3>
                <button 
                  onClick={() => setShowGenderModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-400 text-xl">×</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {genders.map((gender) => (
                <label key={gender} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    checked={tempGender === gender}
                    onChange={() => setTempGender(gender)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900 font-medium">{gender}</span>
                </label>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                className="w-full bg-black text-white rounded-xl py-3 font-semibold hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedGender(tempGender);
                  setShowGenderModal(false);
                }}
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">지역 선택</h3>
                <button 
                  onClick={() => setShowRegionModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-400 text-xl">×</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {["모든 지역", "내 지역", ...regions].map((region) => (
                <label key={region} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    checked={tempRegion === region}
                    onChange={() => setTempRegion(region)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900 font-medium">{region}</span>
                </label>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                className="w-full bg-black text-white rounded-xl py-3 font-semibold hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedRegion(tempRegion);
                  setShowRegionModal(false);
                }}
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚽</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MatchFit</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </button>
              </Link>
              <Link href={nickname ? "/mypage" : "/login"}>
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
                  <User className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-20"
          style={{
            backgroundImage: `url('https://media.istockphoto.com/id/949190756/ko/%EC%82%AC%EC%A7%84/%EC%9E%94%EB%94%94%EC%97%90-%EB%8B%A4%EC%96%91-%ED%95%9C-%EC%8A%A4%ED%8F%AC%EC%B8%A0-%EC%9E%A5%EB%B9%84.jpg?s=612x612&w=0&k=20&c=m6PvZd3ZGMRV1hoZ1mS1HGenVJcLo5U5BKtRNgmCN48=')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            운동이 더 즐거워지는 순간
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 font-light leading-relaxed">
            안녕하세요, {nickname || "운동메이트"}님<br/>
            함께 땀 흘리며 건강한 인연을 만들어보세요
          </p>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-3 bg-white text-black px-12 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            새 모집글 작성하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              다양한 스포츠와 함께
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              축구부터 테니스까지, 당신이 좋아하는 운동을 함께할 사람들을 찾아보세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {sports.map((sport, index) => (
              <div 
                key={sport.name}
                className="group bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {sport.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{sport.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
                더 쉽고 안전하게
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">맞춤 매칭</h3>
                    <p className="text-gray-600">지역, 실력, 선호도를 고려한 정확한 매칭 시스템</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">안전한 모임</h3>
                    <p className="text-gray-600">모든 신청은 주최자의 승인 하에 진행</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">성장하는 재미</h3>
                    <p className="text-gray-600">함께 운동하며 실력도 늘고 친구도 사귀는 특별한 경험</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">⚽</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">오늘 오후 축구 모임</h4>
                    <p className="text-gray-500 text-sm">한강공원 · 6명 참여</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <p className="text-gray-700">같이 축구하실 분들 모집해요! 초보자도 환영 🙌</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">무료</span>
                  <button className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium">
                    참여하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">모집글 찾기</h3>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <span className="text-gray-700 font-medium">{selectedRegion}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowGenderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <span className="text-gray-700 font-medium">{selectedGender}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  viewMode === "list" 
                    ? "bg-black text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="font-medium">리스트</span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  viewMode === "calendar" 
                    ? "bg-black text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">캘린더</span>
              </button>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <CalendarView onDateSelect={handleDateSelect} />
          ) : (
            <>
              <div className="mb-12">
                <h3 className="text-2xl font-semibold text-gray-900 mb-8">운동 종목</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                  {sports.map((sport) => (
                    <button
                      key={sport.name}
                      onClick={() => setSelectedSport(sport.name)}
                      className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                        selectedSport === sport.name
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{sport.icon}</div>
                        <div className="text-sm font-medium">{sport.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedDate ? `${selectedDate} 모집글` : "모집글 목록"}
                  </h3>
                  <p className="text-gray-500 mt-1">
                    총 {filteredPosts.length}개의 모집글
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedDate && (
                    <button 
                      onClick={() => {
                        setSelectedDate(null)
                        setViewMode("list")
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      전체보기
                    </button>
                  )}
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      sortBy === "popular" 
                        ? "bg-gray-900 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    인기순
                  </button>
                  <button
                    onClick={() => setSortBy("nearest")}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      sortBy === "nearest" 
                        ? "bg-gray-900 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    가까운 순
                  </button>
                </div>
              </div>

              {loading && !error && (
                <div className="text-center py-16">
                  <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-lg">로딩 중...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-red-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <span className="text-red-500 text-3xl">⚠️</span>
                  </div>
                  <p className="text-red-600 mb-6 font-medium text-lg">{error}</p>
                  <button 
                    onClick={fetchPosts}
                    className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {!loading && !error && filteredPosts.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">
                    {selectedDate ? "해당 날짜에 모집글이 없습니다" : "조건에 맞는 모집글이 없습니다"}
                  </h4>
                  <p className="text-gray-500 mb-8 text-lg">새로운 모집글을 작성해보세요!</p>
                  <button 
                    onClick={handleCreatePost}
                    className="px-12 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-lg"
                  >
                    새 모집글 작성하기
                  </button>
                </div>
              )}

              {!loading && !error && filteredPosts.length > 0 && (
                <div className="grid gap-8 lg:grid-cols-2">
                  {sortedPosts.map((post) => (
                    <Card key={post.id} className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold">
                              {post.sports}
                            </Badge>
                            <Badge
                              className={`px-4 py-2 rounded-full font-semibold ${
                                post.status === "모집중" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {post.status}
                            </Badge>
                          </div>
                          <button 
                            onClick={() => toggleFavorite(post.id)} 
                            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <Heart
                              className={`w-6 h-6 ${
                                favorites.includes(Number(post.id)) 
                                  ? "fill-red-500 text-red-500" 
                                  : "text-gray-400 hover:text-red-400"
                              }`}
                            />
                          </button>
                        </div>

                        <h4 className="font-bold text-gray-900 mb-6 text-xl group-hover:text-gray-700 transition-colors">
                          {post.title}
                        </h4>

                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="font-medium">{post.town}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-medium">
                              {post.date?.split("T")[0]} {post.date && formatTimeToKorean12Hour(post.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="font-medium">
                              {post.currentPeople}/{post.maxPeople}명 참여
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                              {post.participants?.slice(0, 3).map((participant, idx) => (
                                <div
                                  key={participant.id || idx}
                                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-3 border-white flex items-center justify-center text-sm text-white font-semibold shadow-lg"
                                >
                                  {participant.nickName?.charAt(0) || "?"}
                                </div>
                              ))}
                              {/* {post.currentPeople > 3 && (
                                <div className="w-10 h-10 bg-gray-500 rounded-full border-3 border-white flex items-center justify-center text-sm text-white font-semibold shadow-lg">
                                  +{post.currentPeople - 3}
                                </div>
                              )} */}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div>
                              <p className="text-sm text-gray-500 font-medium mb-1">참가비</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {post.cost === 0 || post.cost === undefined
                                  ? "무료"
                                  : `${Number(post.cost).toLocaleString()}원`}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPostId(post.id)
                                setModalOpen(true)
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold group-hover:scale-105"
                            >
                              상세보기
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {modalOpen && selectedPostId !== null && (
                    <EventDetailModal
                      postId={selectedPostId}
                      isOpen={modalOpen}
                      onClose={() => {
                        setModalOpen(false);
                        setSelectedPostId(null);
                        fetchPosts();
                        fetchFavorites();
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h4 className="text-4xl md:text-5xl font-bold mb-8">
            운동 메이트를 모집해보세요
          </h4>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-3 bg-white text-black px-12 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            모집글 작성하기
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  )
}