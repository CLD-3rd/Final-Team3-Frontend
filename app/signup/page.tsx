"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useEffect } from "react";
import { useSearchParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-client";


const sports = [
  { id: "FOOTBALL", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
  { id: "VOLLEYBALL", name: "배구", icon: "🏐" },
]

const regions = {
  서울특별시: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  부산광역시: ["강서구", "금정구", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구", "기장군"],
  대구광역시: ["남구", "달서구", "동구", "북구", "서구", "수성구", "중구", "달성군"],
  인천광역시: ["계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "중구", "강화군", "옹진군"],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산광역시: ["남구", "동구", "북구", "중구", "울주군"],
  세종특별자치시: ["세종시"],
  경기도: ["고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시", "가평군", "양평군", "여주군", "연천군"],
  강원도: ["강릉시", "동해시", "삼척시", "속초시", "원주시", "춘천시", "태백시", "고성군", "양구군", "양양군", "영월군", "인제군", "정선군", "철원군", "평창군", "홍천군", "화천군", "횡성군"],
  충청북도: ["제천시", "청주시", "충주시", "괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "증평군", "진천군", "청원군"],
  충청남도: ["계룡시", "공주시", "논산시", "보령시", "서산시", "아산시", "천안시", "금산군", "당진군", "부여군", "서천군", "연기군", "예산군", "청양군", "태안군", "홍성군"],
  전라북도: ["군산시", "김제시", "남원시", "익산시", "전주시", "정읍시", "고창군", "무주군", "부안군", "순창군", "완주군", "임실군", "장수군", "진안군"],
  전라남도: ["광양시", "나주시", "목포시", "순천시", "여수시", "강진군", "고흥군", "곡성군", "구례군", "담양군", "무안군", "보성군", "신안군", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  경상북도: ["경산시", "경주시", "구미시", "김천시", "문경시", "상주시", "안동시", "영주시", "영천시", "포항시", "고령군", "군위군", "봉화군", "성주군", "영덕군", "영양군", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군"],
  경상남도: ["거제시", "김해시", "마산시", "밀양시", "사천시", "양산시", "진주시", "진해시", "창원시", "통영시", "거창군", "고성군", "남해군", "산청군", "의령군", "창녕군", "하동군", "함안군", "함양군", "합천군"],
  제주특별자치도: ["서귀포시", "제주시"]
}

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    age: "",
    gender: "" as "MALE" | "FEMALE" | "",
    sido: "",
    sigungu: "",
    sports: "",
    isKakaoUser: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("");
  const [emailChecked, setEmailChecked] = useState<null | boolean>(null);
  const [nicknameChecked, setNicknameChecked] = useState<null | boolean>(null);
  const [nicknameError, setNicknameError] = useState("");
  const [kakaoConfig, setKakaoConfig] = useState<any>(null);

  useEffect(() => {
  // 컴포넌트 마운트 시 카카오 설정값 받아오기
  fetch("http://localhost:8080/api/kakao-config")
    .then((res) => res.json())
    .then(setKakaoConfig)
    .catch(() => setKakaoConfig(null));
  }, []);

  const searchParams = useSearchParams();
  const kakaoEmail = searchParams.get("kakaoEmail");

  useEffect(() => {
    if (kakaoEmail) {
      setFormData((prev) => ({
        ...prev,
        email: kakaoEmail,
        isKakaoUser: true,
      }));
    }
  }, [kakaoEmail]);

  const handleKakaoSignup = () => {
    if (!kakaoConfig) {
      alert("카카오 인증 정보를 불러오지 못했습니다.");
      return;
  }
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoConfig.clientId}&redirect_uri=${encodeURIComponent(kakaoConfig.signupRedirectUri)}&response_type=code`;
    console.log("카카오 인증 URL:", kakaoAuthUrl);
    window.location.href = kakaoAuthUrl;
  };

  const handleSportToggle = (sportId: string) => {
    setFormData((prev) => ({
      ...prev,
      //preferredSports: prev.sports.includes(sportId)
      //  ? prev.sports.filter((s) => s !== sportId)
      //  : [...prev.sports, sportId],
      sports: sportId,
    }))
  }

  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;


  const handleEmailCheck = async () => {
    if (!formData.email) {
      setError("이메일을 입력해주세요.")
      return
    }
    
    try {
    const response = await apiClient.checkEmailDuplicate(formData.email);

    if (response.code === "USER202") {
      setEmailChecked(true); // 사용 가능
      setError("");         
    } else if (response.code === "USER400") {
      setEmailChecked(false); // 이미 사용 중
      setError("");           
    } else {
      setEmailChecked(false);
      setError(response.message || "이메일 중복 확인 중 오류가 발생했습니다.");
    }
    } catch (error) {
      setEmailChecked(false);
      setError("이메일 중복 확인 중 네트워크 오류가 발생했습니다.");
    }
  }

  const handleNicknameCheck = async () => {
  if (!formData.nickname) {
    setNicknameError("닉네임을 입력해주세요.");
    setNicknameChecked(null);
    return;
  }
  
  try {
    const response = await apiClient.checkNicknameDuplicate(formData.nickname);

    if (response.code === "USER203") {
      setNicknameChecked(true);
      setNicknameError(""); 
    } else if (response.code === "USER401") {
      setNicknameChecked(false);
      setNicknameError("");
    } else {
      setNicknameChecked(false);
      setNicknameError(response.message || "닉네임 중복 확인 중 오류가 발생했습니다.");
    }
  } catch (error) {
    setNicknameChecked(false);
    setNicknameError("닉네임 중복 확인 중 네트워크 오류가 발생했습니다.");
  }
};

  const handleSidoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      sido: value,
      sigungu: "", // 시/도가 변경되면 구/군 초기화
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validation
    if (!emailChecked) {
      setError("이메일 중복확인을 해주세요.")
      setLoading(false)
      return
    }

    const isLengthValid = formData.password.length >= 8
    const hasLetter = /[a-zA-Z]/.test(formData.password)
    const hasNumber = /\d/.test(formData.password)
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(formData.password)
    const isPasswordValid = isLengthValid && hasLetter && hasNumber && hasSpecialChar

    if (!isPasswordValid) {
      setError("비밀번호가 잘못된 형식입니다.")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setLoading(false)
      return
    }

    if (!formData.gender) {
      setError("성별을 선택해주세요.")
      setLoading(false)
      return
    }

    if (!formData.age || parseInt(formData.age) < 14 || parseInt(formData.age) > 100) {
      setError("올바른 나이를 입력해주세요. (14-100세)")
      setLoading(false)
      return
    }

    if (!formData.sido || !formData.sigungu) {
      setError("지역을 선택해주세요.")
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        age: parseInt(formData.age),
        gender: formData.gender,
        town: `${formData.sido} ${formData.sigungu}`,
        sports: formData.sports,
        isKakaoUser: formData.isKakaoUser,
      })
      

    if (response.code === "USER200") {
      setSuccess(response.message || "회원가입이 완료되었습니다!");
      router.push("/login");  
    } else {
      setError("회원가입에 실패했습니다."); // 응답에 .message 필드는 없으니 직접 메시지 작성
    }
    } catch (error) {
      setError("회원가입 중 오류가 발생했습니다.")
      console.error("Signup error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">운동 메이트와 함께 건강한 라이프스타일을 시작하세요</p>
        </div>

        {/* Success message */}
        {success && (<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>)}

        {/* Error Message */}
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {/* Kakao Signup */}
        <Button
          type="button"
          onClick={handleKakaoSignup}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold mb-6 py-3 rounded"
        >
          <span className="mr-2">💬</span>
          카카오로 시작하기
        </Button>

        {/* Divider */}
        <div className="text-center text-gray-500 mb-6">
          <span>또는</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">
              이메일 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                  setEmailChecked(null) // 이메일이 변경되면 중복확인 초기화
                }}
                className="flex-1"
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="bg-blue-500 text-white border-blue-500 px-4"
                onClick={handleEmailCheck}
              >
                중복확인
              </Button>
            </div>
            {emailChecked == true && (
              <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 이메일입니다.</p>
            )}
            {emailChecked == false && (
              <p className="text-sm text-red-600 mt-1">이미 사용 중인 이메일입니다.</p>
            )}
          </div>
        
        {/* Password */}
        {!formData.isKakaoUser && (  
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium">
              비밀번호 <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="8자 이상, 영문/숫자/특수문자 포함"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="pr-10"
                required
              />
              <ul className="text-sm mt-2 ml-1 space-y-1">
                <li className={`flex items-center ${formData.password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                  {formData.password.length >= 8 ? "✓" : "○"}&nbsp;8자 이상
                </li>
                <li className={`flex items-center ${/[a-zA-Z]/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}>
                  {/^[\s\S]*[a-zA-Z]+[\s\S]*$/.test(formData.password) ? "✓" : "○"}&nbsp;영문 포함
                </li>
                <li className={`flex items-center ${/\d/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}>
                  {/\d/.test(formData.password) ? "✓" : "○"}&nbsp;숫자 포함
                </li>
                <li className={`flex items-center ${/[^a-zA-Z0-9]/.test(formData.password) ? "text-green-600" : "text-gray-500"}`}>
                  {/[^a-zA-Z0-9]/.test(formData.password) ? "✓" : "○"}&nbsp;특수문자 포함
                </li>
              </ul>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
          {/* Confirm Password */}
        {!formData.isKakaoUser && (
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              비밀번호 확인 <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword.length > 0 && (
              <p className={`mt-2 text-sm ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                {passwordsMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
              </p>
            )}
          </div>
        )}
          {/* Nickname */}
          <div>
            <Label htmlFor="nickname" className="text-gray-700 font-medium">
              닉네임 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="nickname"
                placeholder="2-10자의 한글, 영문, 숫자"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nickname: e.target.value }));
                  setNicknameChecked(null);
                  setNicknameError("");
                }}
                className="flex-1"
                required
              />
              <Button type="button" variant="outline" size="sm" className="bg-blue-500 text-white border-blue-500 px-4" onClick={handleNicknameCheck}>
                중복확인
              </Button>
            </div>
            {nicknameChecked === true && (
              <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 닉네임입니다.</p>
            )}
            {nicknameChecked === false && (
              <p className="text-sm text-red-600 mt-1">이미 사용 중인 닉네임입니다.</p>
            )}
            {nicknameError && (
              <p className="text-sm text-red-600 mt-1">{nicknameError}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <Label htmlFor="age" className="text-gray-700 font-medium">
              나이 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="나이를 입력하세요"
              value={formData.age}
              onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
              className="mt-1"
              min="14"
              max="100"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              성별 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.gender === "MALE" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, gender: "MALE" }))}
                className={`h-16 flex flex-col items-center justify-center gap-2 ${
                  formData.gender === "MALE" ? "bg-blue-500 text-white" : "border-gray-200"
                }`}
              >
                <span className="text-2xl">👨</span>
                <span>남성</span>
              </Button>
              <Button
                type="button"
                variant={formData.gender === "FEMALE" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, gender: "FEMALE" }))}
                className={`h-16 flex flex-col items-center justify-center gap-2 ${
                  formData.gender === "FEMALE" ? "bg-blue-500 text-white" : "border-gray-200"
                }`}
              >
                <span className="text-2xl">👩</span>
                <span>여성</span>
              </Button>
            </div>
          </div>

          {/* Region */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">
              지역 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Select value={formData.sido} onValueChange={handleSidoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="시/도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(regions).map((sido) => (
                      <SelectItem key={sido} value={sido}>
                        {sido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={formData.sigungu} 
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, sigungu: value }))}
                  disabled={!formData.sido}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="구/군 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.sido && regions[formData.sido as keyof typeof regions]?.map((sigungu) => (
                      <SelectItem key={sigungu} value={sigungu}>
                        {sigungu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preferred Sports */}
          <div>
            <Label className="text-gray-700 font-medium mb-3 block">선호 종목</Label>
            <div className="grid grid-cols-3 gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  variant={formData.sports === sport.id ? "default" : "outline"}
                  onClick={() => handleSportToggle(sport.id)}
                  className={`h-16 flex flex-col items-center justify-center gap-1 ${
                    formData.sports === sport.id
                      ? "bg-blue-500 text-white"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="text-xl">{sport.icon}</span>
                  <span className="text-xs">{sport.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-gray-400 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "회원가입 중..." : "회원가입"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-blue-500 hover:underline font-semibold">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}