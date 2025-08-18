"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus, Upload, X, CheckCircle, AlertCircle, MapPin } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Search } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-client";

const townOptions = [
  { label: "서울", value: "SEOUL" },
  { label: "경기", value: "GYEONGGI" },
  { label: "강원", value: "GANGWON"},
  { label: "대전", value: "DAEJEON" },
  { label: "대구", value: "DAEGU" },
  { label: "인천", value: "INCHEON" },
  { label: "광주", value: "GWANGJU" },
  { label: "울산", value: "ULSAN" },
  { label: "부산", value: "BUSAN"},
  { label: "세종", value: "SEJONG" },
  { label: "충남", value: "CHUNGNAM" },
  { label: "충북", value: "CHUNGBUK" },
  { label: "전북", value: "JEONBUK" },
  { label: "전남", value: "JEONNAM" },
  { label: "경북", value: "GYEONGBUK" },
  { label: "경남", value: "GYEONGNAM" },
  { label: "제주", value: "JEJU" },
]

const sports = [
  { id: "FOOTBALL", name: "축구", icon: "⚽" },
  { id: "TENNIS", name: "테니스", icon: "🎾" },
  { id: "TABLE_TENNIS", name: "탁구", icon: "🏓" },
  { id: "BASKETBALL", name: "농구", icon: "🏀" },
  { id: "BADMINTON", name: "배드민턴", icon: "🏸" },
  { id: "VOLLEYBALL", name: "배구", icon: "🏐" },
]

const genderOptions = [
  { id: "ALL", name: "남녀 모두" },
  { id: "MALE", name: "남성만" },
  { id: "FEMALE", name: "여성만" },
]

export const MAX_COST = 1_000_000;
export const krFormat = new Intl.NumberFormat("ko-KR");
export const digitsOnly = (s: string) => s.replace(/[^\d]/g, "");

// Google Maps API 타입 선언
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string
                componentRestrictions: { country: string }
                types: string[]
                language: string
              },
              callback: (predictions: any[], status: string) => void
            ) => void
          }
          PlacesServiceStatus: {
            OK: string
            ZERO_RESULTS: string
            OVER_QUERY_LIMIT: string
            REQUEST_DENIED: string
            INVALID_REQUEST: string
            NOT_FOUND: string
          }
        }
      }
    }
  }
}

// 구글 Places API 타입 정의
interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

// 토스트 컴포넌트
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all transform animate-in slide-in-from-right-5 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? (
      <CheckCircle className="w-6 h-6" />
    ) : (
      <AlertCircle className="w-6 h-6" />
    )}
    <span className="font-semibold">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white transition-colors">
      <span className="text-xl">×</span>
    </button>
  </div>
)

// 지역 매핑 함수
const getRegionFromAddress = (address: string): string => {
  const addressLower = address.toLowerCase();
  
  // 1단계: 도/광역시명이 직접 포함된 경우 우선 매칭
  const primaryMapping = [
    { keywords: ['서울특별시', '서울시', '서울'], value: 'SEOUL' },
    { keywords: ['경기도', '경기'], value: 'GYEONGGI' },
    { keywords: ['강원도', '강원특별자치도', '강원'], value: 'GANGWON' },
    { keywords: ['대전광역시', '대전시'], value: 'DAEJEON' },
    { keywords: ['대구광역시', '대구시'], value: 'DAEGU' },
    { keywords: ['인천광역시', '인천시'], value: 'INCHEON' },
    { keywords: ['광주광역시', '광주시'], value: 'GWANGJU' },
    { keywords: ['울산광역시', '울산시'], value: 'ULSAN' },
    { keywords: ['부산광역시', '부산시'], value: 'BUSAN' },
    { keywords: ['세종특별자치시', '세종시'], value: 'SEJONG' },
    { keywords: ['충청남도', '충남'], value: 'CHUNGNAM' },
    { keywords: ['충청북도', '충북'], value: 'CHUNGBUK' },
    { keywords: ['전라북도', '전북'], value: 'JEONBUK' },
    { keywords: ['전라남도', '전남'], value: 'JEONNAM' },
    { keywords: ['경상북도', '경북'], value: 'GYEONGBUK' },
    { keywords: ['경상남도', '경남'], value: 'GYEONGNAM' },
    { keywords: ['제주특별자치도', '제주도'], value: 'JEJU' },
  ];

  // 1단계 매칭 시도
  for (const region of primaryMapping) {
    for (const keyword of region.keywords) {
      if (addressLower.includes(keyword)) {
        return region.value;
      }
    }
  }

  // 2단계: 고유한 시/군명으로 매칭 (중복되지 않는 것들만)
  const uniqueCityMapping = [
    // 경기도 고유 시/군
    { keywords: ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '광명시', '김포시', '군포시', '이천시', '양주시', '오산시', '구리시', '안성시', '포천시', '의왕시', '하남시', '여주시', '여주군', '양평군', '동두천시', '과천시', '가평군', '연천군'], value: 'GYEONGGI' },
    
    // 강원도 고유 시/군
    { keywords: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'], value: 'GANGWON' },
    
    // 충청남도 고유 시/군
    { keywords: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'], value: 'CHUNGNAM' },
    
    // 충청북도 고유 시/군
    { keywords: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'], value: 'CHUNGBUK' },
    
    // 전라북도 고유 시/군
    { keywords: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'], value: 'JEONBUK' },
    
    // 전라남도 고유 시/군
    { keywords: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'], value: 'JEONNAM' },
    
    // 경상북도 고유 시/군
    { keywords: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'], value: 'GYEONGBUK' },
    
    // 경상남도 고유 시/군
    { keywords: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'], value: 'GYEONGNAM' },
    
    // 제주도 고유 시
    { keywords: ['제주시', '서귀포시'], value: 'JEJU' },
  ];

  // 2단계 매칭 시도
  for (const region of uniqueCityMapping) {
    for (const keyword of region.keywords) {
      if (addressLower.includes(keyword)) {
        return region.value;
      }
    }
  }

  // 3단계: 특별한 경우 처리 (대전, 대구, 광주의 경우 시명만으로도 매칭)
  if (addressLower.includes('대전')) return 'DAEJEON';
  if (addressLower.includes('대구')) return 'DAEGU';
  if (addressLower.includes('광주')) return 'GWANGJU';
  if (addressLower.includes('울산')) return 'ULSAN';
  if (addressLower.includes('부산')) return 'BUSAN';
  if (addressLower.includes('인천')) return 'INCHEON';
  if (addressLower.includes('세종')) return 'SEJONG';
  if (addressLower.includes('제주')) return 'JEJU';

  return '';
};

const cleanAddress = (address: string): string => {
  return address
    .replace(/대한민국\s*/, '')
    .replace(/Republic of Korea\s*/, '')
    .replace(/South Korea\s*/, '')
    .trim();
};

export default function CreatePostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    location: "",
    date: "",
    time: "",
    town: "",
    maxParticipants: 4,
    gender: "ALL" as "ALL" | "MALE" | "FEMALE",
    cost: 0,
    content: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [townModalOpen, settownModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])

  // Places API 관련 상태
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const predictionsRef = useRef<HTMLDivElement>(null)
  const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "AIzaSyAEdB2-APCc2ml50ipMsoTdtKEGOvT6Flc"
  
  // Google Places Autocomplete Service 초기화
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        return Promise.resolve()
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=ko`
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    loadGoogleMapsScript().catch(console.error)
  }, [])

  const fetchPlacePredictions = async (input: string) => {
    if (!input.trim() || input.length < 1) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps API가 로드되지 않았습니다.')
      return
    }

    setIsLoadingPlaces(true)
    
    try {
      const service = new window.google.maps.places.AutocompleteService()
      
      const request = {
        input: input,
        componentRestrictions: { country: 'kr' },
        types: ['establishment', 'geocode'],
        language: 'ko'
      }

      service.getPlacePredictions(request, (predictions, status) => {
        setIsLoadingPlaces(false)
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formattedPredictions = predictions.map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: {
              main_text: prediction.structured_formatting?.main_text || prediction.description,
              secondary_text: prediction.structured_formatting?.secondary_text?.replace('대한민국 ', '') || ''
            }
          }))
          
          setPredictions(formattedPredictions)
          setShowPredictions(true)
        } else {
          setPredictions([])
          setShowPredictions(false)
        }
      })
    } catch (error) {
      console.error('Places API 오류:', error)
      setPredictions([])
      setShowPredictions(false)
      setIsLoadingPlaces(false)
    }
  }

  // 실시간 자동완성 검색 (디바운스 적용)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.location && formData.location.length >= 1) {
        fetchPlacePredictions(formData.location)
      } else {
        setPredictions([])
        setShowPredictions(false)
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [formData.location])

  // 외부 클릭 시 예측 결과 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationInputRef.current && 
        !locationInputRef.current.contains(event.target as Node) &&
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePredictionSelect = (prediction: PlacePrediction) => {
    
    const cleanedAddress = cleanAddress(prediction.description);
    const detectedRegion = getRegionFromAddress(prediction.description);
    
    setFormData(prev => ({ 
      ...prev, 
      location: cleanedAddress,
      town: detectedRegion
    }));
    
    setShowPredictions(false)
    setPredictions([])
  }

  // 토스트 메시지 추가
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 2000)
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const pad2 = (n: number) => String(n).padStart(2, "0");

  // 로컬 시간 기준 "YYYY-MM-DD"
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  };

  const handleParticipantChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      maxParticipants: increment ? Math.min(prev.maxParticipants + 1, 20) : Math.max(prev.maxParticipants - 1, 1),
    }))
  }

  // 이미지 파일 선택 
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png']

    if (!allowedTypes.includes(file.type)) {
    addToast("이미지는 JPG, PNG만 가능합니다.", 'error')
    
    e.currentTarget.value = ""
    return
  }

    setSelectedImage(file)
    setError("")

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  // 이미지 제거 
  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview(null)
    
    // 파일 input 초기화
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")

    let hasError = false
    if (!formData.title) {
      addToast("제목을 입력하세요.", "error")
      hasError = true
    }
    if (!formData.sport) {
      addToast("운동 종목을 선택하세요.", "error")
      hasError = true
    }
    if (!formData.location) {
      addToast("상세 위치를 입력하세요.", "error")
      hasError = true
    }
    if (hasError) {
      setLoading(false)
      return
    }

    if (!formData.date || !formData.time) {
      setLoading(false)
      setError("날짜와 시간을 입력해 주세요.")
      addToast("날짜와 시간을 입력해 주세요.", "error")
      return
    }

    // "YYYY-MM-DDTHH:mm(:ss)" → 로컬 기준 Date
    const timeStr = formData.time.length === 5 ? formData.time + ":00" : formData.time
    const selected = new Date(`${formData.date}T${timeStr}`)
    const now = new Date()
    // '이후'만 허용 → 같거나 과거면 막기
    if (selected <= now) {
      setLoading(false)
      setError("현재 시간 이후로 설정해야 됩니다.")
      addToast("현재 시간 이후로 설정해야 됩니다.", "error")
      return
    }

    try {
      const isoDateTime = `${formData.date}T${formData.time}`
      
      // FormData 생성
      const submitFormData = new FormData()
      
      // JSON 데이터를 Blob으로 변환하여 추가
      const postData = {
        title: formData.title,
        description: formData.content,
        location: formData.location,
        status: "OPEN",
        town: formData.town,
        sports: formData.sport, 
        gender: formData.gender,
        // cost: formData.cost ? Number.parseInt(formData.cost) : 0,
        cost: formData.cost,
        maxPeople: formData.maxParticipants,
        date: isoDateTime,
      }
      
      submitFormData.append('postData', new Blob([JSON.stringify(postData)], {
        type: 'application/json'
      }))
      
      // 이미지 파일 추가 (있는 경우)
      if (selectedImage) {
        submitFormData.append('image', selectedImage)
      }

      // 토큰 가져오기
      const token = sessionStorage.getItem('auth_token') 
      console.log('사용 중인 토큰:', token ? '토큰 있음' : '토큰 없음')
      
      const headers: HeadersInit = {}
      
      headers['Authorization'] = `Bearer ${token}`
        
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: headers,
        body: submitFormData,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      if (response.status === 200 && result.code === 'POST200') {
        console.log("등록 성공! 메시지:", result.message)
        addToast(result.message ?? "모집글이 성공적으로 등록되었습니다!", 'success')
        setTimeout(() => router.push("/"), 500)
      } else {
        addToast("모집글 등록에 실패했습니다.", 'error')
      }
    } catch (error) {
      console.error("Create post error:", error)
      if (error instanceof Error) {
        addToast(`모집글 등록 중 오류가 발생했습니다: ${error.message}`, 'error')
      } else {
        addToast("모집글 등록 중 오류가 발생했습니다.", 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚽</span>
              </div>
              <span className="font-bold text-gray-900">MatchFit</span>
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            새로운 운동 메이트를<br/>찾아보세요
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            함께 운동할 사람들을 모집하고<br/>
            건강한 라이프스타일을 만들어가세요
          </p>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="어떤 운동을 함께 할지 간단히 적어주세요"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">
                운동 종목 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, sport: sport.id }))}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      formData.sport === sport.id
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{sport.icon}</div>
                      <div className="font-semibold">{sport.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 relative">
              <Label className="text-lg font-semibold text-gray-900">
                상세 위치 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  ref={locationInputRef}
                  placeholder="장소명을 입력하세요 (예: 강남구 스포츠센터)"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }}
                  onFocus={() => {
                    if (predictions.length > 0) {
                      setShowPredictions(true)
                    }
                  }}
                  className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50 pr-12"
                />
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                {/* 로딩 인디케이터 */}
                {isLoadingPlaces && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-black rounded-full"></div>
                  </div>
                )}
              </div>

              {/* 자동완성 예측 결과 */}
              {showPredictions && predictions.length > 0 && (
                <div 
                  ref={predictionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50"
                >
                  {predictions.map((prediction, index) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handlePredictionSelect(prediction)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                        index !== predictions.length - 1 ? 'border-b border-gray-100' : ''
                      } ${index === 0 ? 'rounded-t-xl' : ''} ${
                        index === predictions.length - 1 ? 'rounded-b-xl' : ''
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">
                          {prediction.structured_formatting.main_text}
                        </div>
                        {prediction.structured_formatting.secondary_text && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {prediction.structured_formatting.secondary_text}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 지역 선택 (자동으로 설정됨) */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">
                지역 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={townOptions.find(opt => opt.value === formData.town)?.label || ""}
                  readOnly
                  className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-100 pr-14 cursor-not-allowed"
                />

              </div>

            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">
                날짜 및 시간 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">날짜</label>
                  <Input
                    type="date"
                    value={formData.date}
                    min={getTodayStr()}
                    onChange={(e) => {
                    const today = getTodayStr();
                    const selected = e.target.value;

                    // 오늘 이전이면 강제로 오늘로 맞추고 에러/토스트
                    if (selected < today) {
                      setError("오늘 이후 날짜만 선택 가능합니다.");
                      addToast?.("오늘 이후 날짜만 선택 가능합니다.", "error");
                      setFormData((prev) => ({ ...prev, date: today }));
                      return;
                    }  else {
                      setError("");
                      setFormData((prev) => ({ ...prev, date: selected })); 
                    }
                  }}
                    className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">시간</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">
                총 인원 (본인 포함) <span className="text-red-500">*</span>
              </Label>
              <div className="bg-gray-50 rounded-3xl p-8">
                <div className="flex items-center justify-center gap-8">
                  <button
                    type="button"
                    onClick={() => handleParticipantChange(false)}
                    className="w-16 h-16 rounded-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg hover:scale-105"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">{formData.maxParticipants}</div>
                    <div className="text-lg text-gray-600 font-medium">명</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleParticipantChange(true)}
                    className="w-16 h-16 rounded-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg hover:scale-105"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">
                참여 성별 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {genderOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: option.id as "ALL" | "MALE" | "FEMALE" }))}
                    className={`p-4 rounded-2xl border-2 transition-all font-semibold ${
                      formData.gender === option.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">1인당 참가비</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={krFormat.format(formData.cost)} // 기본값은 0원
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    if (raw === "") {
                      setFormData(prev => ({ ...prev, cost: 0 }));
                      return;
                    }
                    const n = Math.min(parseInt(raw, 10), MAX_COST);
                    setFormData(prev => ({ ...prev, cost: n })); // 숫자로 보관
                  }}
                  className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-600">원</span>
              </div>
            </div>      

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">구장 이미지</Label>
              
              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="relative bg-gray-50 rounded-3xl overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="구장 이미지 미리보기" 
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                      addToast("이미지를 불러올 수 없습니다.", 'error')
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* 파일 업로드 버튼 */}
              <div className="flex flex-col gap-4">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-6 h-6" />
                  <span className="font-medium">이미지 선택하기</span>
                </button>
                <p className="text-sm text-gray-500 text-center">
                  JPG, PNG 파일만 업로드 가능합니다
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">상세 설명</Label>
              <div className="relative">
                <Textarea
                  placeholder={`운동에 대한 추가 정보를 입력하세요.
예) 초보자 환영, 준비물, 운동 후 식사 계획 등`}
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50 resize-none"
                  maxLength={300}
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-500 bg-white px-2 py-1 rounded-lg">
                  {formData.content.length}/300자
                </div>
              </div>
            </div>
            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-6 rounded-2xl font-bold text-xl transition-all duration-300 ${
                  loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? "등록하는 중..." : "모집글 등록하기"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
