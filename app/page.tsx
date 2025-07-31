"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Clock, Users, Bell, User, Heart, Calendar, List, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CalendarView from "@/components/calendar-view"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation";
import type { Post } from "@/types/api"
//import { toast } from 'react-hot-toast';

const sports = [
  { id: "ALL", name: "전체", icon: "🏃" },
  { id: "SOCCER", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
  { id: "VOLLEYBALL", name: "배구", icon: "🏐" },
]

const regions = ["서울", "경기", "강원", "대전", "대구", "인천", "울산", "부산", "광주", "세종", "충북", "충남", "경북", "경남", "전북", "전남", "제주"]
const genders = ["남녀 모두", "남자", "여자"]

const regionAliasMap: Record<string, string> = {
  "서울특별시": "서울",
  "부산광역시": "부산", 
  "대구광역시": "대구", 
  "인천광역시": "인천",
  "광주광역시": "광주",
  "대전광역시": "대전",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "경기도": "경기",
  "강원도": "강원",
  "경상남도": "경남",
  "경상북도": "경북",
  "전라남도": "전남",
  "전라북도": "전북",
  "충청남도": "충남",
  "충청북도": "충북",
  "제주특별자치도": "제주"
};

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

  // 1. 매핑 테이블에 있으면
  for (const [long, short] of Object.entries(regionAliasMap)) {
    if (town.startsWith(long)) return short;
  }
  // 2. regions 배열에서 찾기
  return regions.find(region => town.startsWith(region));
}
/*
// 수정한 부분
function parseDateWithTimeZone(dateStr: string): Date {
  // 1. 이미 Z(UTC)나 +09:00, -03:00 등이 붙어 있으면 그대로 사용
  if (/[Zz]|([+-]\d{2}:?\d{2})$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // 2. 초 단위 없는 경우(예: "2025-07-29T18:30") → "2025-07-29T18:30:00+09:00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr + ":00+09:00");
  }
  // 3. 초 단위 있지만 타임존 없는 경우(예: "2025-07-29T18:30:00")
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "+09:00");
  }
  // 4. 그 외(공백 등) - 최대한 ISO로 맞추기
  return new Date(dateStr.replace(" ", "T") + "+09:00");
}*/

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
        const res = await apiClient.getProfile(); // town, nickName(또는 nickname) 모두 받아옴
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
  apiClient.getPosts().then(setPosts); // 전체 모집글 또는 월별 모집글 불러오기
  }, []);

  // 찜한 모집글 초기 세팅
  useEffect(() => {
    const fetchMyFollows = async () => {
      try {
        const ids = await apiClient.getMyFollows();
        setFavorites(ids); // 내가 찜한 모집글 postId만 저장
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
  
  const router = useRouter(); 

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError("")
      const params = { // 벡엔드로 보내는 파라미터들
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
      console.log(posts); // 받아온 데이터 형태 콘솔에서 확인 가능
      if (posts.length > 0) {
        console.log(posts[0].date); // 첫 번째 포스트의 date 필드
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
    console.error( error);
  }
}

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setViewMode("list")
  }
  const now = new Date();
  const myMainRegion = extractMainRegion(myRegion);

  const filteredPosts = posts.filter(post => {
    /*tempRegion === "모든 지역"
      ? true
      : tempRegion === "내 지역"
        ? extractMainRegion(post.town) === myMainRegion
        : post.town === tempRegion*/
    const regionMatch = tempRegion === "모든 지역"
      ? true
      : tempRegion === "내 지역"
        ? extractMainRegion(post.town) === myMainRegion
        : post.town === tempRegion;

    if (!regionMatch) return false;

    // 2. 날짜 필터 + 현재 시각 이후 모집글만
    if (selectedDate) {
      const postDateStr = post.date?.split("T")[0];
      if (postDateStr !== selectedDate) return false;

      // "YYYY-MM-DDTHH:mm:ss" 또는 "YYYY-MM-DD HH:mm:ss"
      if (post.date) {
        const postDateTime = new Date(post.date.replace(" ", "T"));
        // 현재 시각 이후만 남김
        if (postDateTime <= now) return false;
      }
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
    <div className="min-h-screen bg-gray-50">
      {showGenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6 relative">
            {/* 상단 타이틀 & 닫기 버튼 */}
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">성별</span>
              <button onClick={() => setShowGenderModal(false)}>
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            {/* 성별 리스트 */}
            <div className="space-y-4">
              {genders.map((gender) => (
                <label key={gender} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={tempGender === gender}
                    onChange={() => setTempGender(gender)}
                    className="accent-blue-500"
                  />
                  <span>{gender}</span>
                </label>
              ))}
            </div>
            {/* 적용하기 버튼 */}
            <button
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-bold"
              onClick={() => {
                setSelectedGender(tempGender);
                setShowGenderModal(false);
              }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}
      {showRegionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">지역 선택</span>
              <button onClick={() => setShowRegionModal(false)}>
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="space-y-4">
              {/* 모든 지역 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tempRegion === "모든 지역"}
                  onChange={() => setTempRegion("모든 지역")}
                  className="accent-blue-500"
                />
                <span>모든 지역</span>
              </label>
              {/* 내 지역 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={tempRegion === "내 지역"}
                  onChange={() => setTempRegion("내 지역")}
                  className="accent-blue-500"
                />
                <span>내 지역</span>
              </label>
              {regions.map((region) => (
                <label key={region} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={tempRegion === region}
                    onChange={() => setTempRegion(region)}
                    className="accent-blue-500"
                  />
                  <span>{region}</span>
                </label>
              ))}
            </div>
            <button
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-bold"
              onClick={() => {
                setSelectedRegion(tempRegion);
                setShowRegionModal(false);
              }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}

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
            {/*<Bell className="w-6 h-6" />*/}
            {/* 메인페이지(홈) 아이콘 */}
            <Link href="/">
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
            <Link href={nickname ? "/mypage" : "/login"}>
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

        {/* Search Bar 
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="지역, 운동 종목으로 검색해보세요"
            className="pl-10 bg-white text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>*/}
      </div>

      <div className="p-4 pb-20">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-500 text-white whitespace-nowrap flex items-center gap-1"
              onClick={() => setShowRegionModal(true)}
            >
              {selectedRegion}
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap bg-transparent flex items-center gap-1"
              onClick={() => setShowGenderModal(true)}
            >
              {selectedGender}
              <ChevronDown className="w-3 h-3" />
            </Button>
            <div className="flex-1 flex">
              <div className="ml-auto"></div>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 text-white whitespace-nowrap flex items-center gap-1 font-medium"
                  style={{ minWidth: "88px" }}
                  onClick={handleCreatePost}
                >
                  +  새 모집글 
                </Button>
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

        {viewMode === "calendar" ? (
          <CalendarView onDateSelect={handleDateSelect} />
        ) : (
          <>
            {/* Sports Categories */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">운동 종목</h3>
              <div className="flex w-full gap-2">
                {sports.map((sports) => (
                  <Button
                    key={sports.name}
                    variant={selectedSport === sports.name ? "default" : "outline"}
                    className={`flex-1 flex flex-col items-center justify-center px-1 py-10 text-xs gap-1 rounded-lg transition ${
                      selectedSport === sports.name ? "bg-blue-500 text-white" : "bg-white border-gray-200 text-gray-700"
                    }`}
                    onClick={() => setSelectedSport(sports.name)}
                  >
                    <span className="text-2xl">{sports.icon}</span>
                    <span className="text-sm">{sports.name}</span>
                  </Button>
                ))}
              </div>
            </div>


            {/* Sort Options */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{selectedDate ? `${selectedDate} 모집글` : "인기 모집글"}</h3>
              <div className="flex gap-2">
                {selectedDate && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDate(null)
                    setViewMode("list")
                  }} className="text-blue-500">
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
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleCreatePost}
                >
                  새 모집글 작성하기
                </Button>
              </div>
            )}

            {/* Recruitment Posts */}
            {!loading && !error && filteredPosts.length > 0 && (
              <div className="space-y-4">
                {sortedPosts.map((post) => (
                  <Card key={post.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge
                          variant="secondary"
                          className={`${
                            post.sports === "축구"
                              ? "bg-blue-100 text-blue-700"
                              : post.sports === "테니스"
                                ? "bg-green-100 text-green-700"
                                : post.sports === "탁구"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {post.sports}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFavorite(post.id)} className="p-1">
                            <Heart
                              className={`w-5 h-5 ${
                                favorites.includes(Number(post.id)) ? "fill-red-500 text-red-500" : "text-gray-400"
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
                          <span>{post.town}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>
                            {post.date?.split("T")[0]}{" "}
                            {post.date && formatTimeToKorean12Hour(post.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-500" />
                          <span>
                            {post.currentPeople}/{post.maxPeople}명
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
                                {participant.nickName?.charAt(0) || "?"}
                              </div>
                            ))}
                            {post.currentPeople > 4 && (
                              <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                                +{post.currentPeople - 4}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">
                            {post.cost === 0 || post.cost === undefined
                              ? "무료"
                              : `${Number(post.cost).toLocaleString()}원`}
                          </p>
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

      {/* Bottom Navigation 
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
      </div>*/}
    </div>
  )
}
