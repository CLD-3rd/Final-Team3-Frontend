"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus, Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Search } from "lucide-react"

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

interface PostData {
  id: number
  title: string
  description: string
  imageUrl: string | null
  gender: "MALE" | "FEMALE" | "ALL"
  sports: string
  cost: number
  status: "OPEN" | "CLOSED" | "FULL"
  town: string
  maxPeople: number
  date: string
  location: string
  userEmail: string 
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

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string || params?.postId as string

  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    location: "",
    date: "",
    time: "",
    town: "",
    maxParticipants: 4,
    gender: "ALL" as "ALL" | "MALE" | "FEMALE",
    cost: "",
    content: "",
    imageUrl: "" as string | null,
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [townModalOpen, settownModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null) // 원본 이미지 URL 저장
  const [imageRemoved, setImageRemoved] = useState(false) // 이미지 삭제 여부 추적
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])

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

  // 인증 토큰 가져오기
  const getAuthToken = () => localStorage.getItem("auth_token")

  // JWT 토큰에서 이메일 추출
  const getEmailFromToken = () => {
    try {
      const token = getAuthToken()
      if (!token) return null

      // JWT 토큰을 디코딩 (payload 부분만)
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload)
      console.log("JWT 토큰 payload:", payload)
      
      return payload.email || payload.sub
    } catch (error) {
      console.error('JWT 토큰 파싱 실패:', error)
      return null
    }
  }

  // 로그인 체크 (페이지 진입 시)
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      console.log("토큰이 없습니다. 로그인 페이지로 이동합니다.")
      router.push('/login')
      return
    }
  }, [router])

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    if (!token) {
      addToast("로그인이 필요합니다.", 'error')
      router.push('/login')
      throw new Error("인증 토큰이 없습니다.")
    }

    console.log("API 요청:", { url, method: options.method, hasToken: !!token })

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log("API 응답:", {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (response.status === 401) {
      addToast("인증이 만료되었습니다. 다시 로그인해주세요.", 'error')
      router.push('/login')
      throw new Error("인증 만료")
    }

    return response
  }

  // 기존 게시글 데이터 로드 및 권한 체크
  useEffect(() => {
    const fetchPostData = async () => {
      // 토큰 체크
      const token = getAuthToken()
      if (!token) {
        console.log("토큰이 없어서 로그인 페이지로 이동")
        router.push('/login')
        return
      }

      // JWT에서 이메일 추출
      const currentUserEmail = getEmailFromToken()
      if (!currentUserEmail) {
        addToast("토큰에서 사용자 정보를 가져올 수 없습니다.", 'error')
        router.push('/login')
        return
      }

      if (!postId || postId === 'undefined' || postId === 'null') {
        addToast("잘못된 게시글 ID입니다.", 'error')
        setLoadingData(false)
        return
      }

      try {
        setLoadingData(true)
        setError("")
        
        const response = await makeAuthenticatedRequest(`http://localhost:8080/api/posts/${postId}`)
        
        if (!response.ok) {
          if (response.status === 401) {
            addToast("로그인이 필요합니다.", 'error')
            router.push('/login')
            return
          } else if (response.status === 403) {
            addToast("이 게시글을 수정할 권한이 없습니다.", 'error')
            setTimeout(() => router.push('/mypage'), 2000)
            return
          } else if (response.status === 404) {
            addToast("존재하지 않는 게시글입니다.", 'error')
            setTimeout(() => router.push('/mypage'), 2000)
            return
          } else {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        }
        
        const data = await response.json()
        
        if (data && data.code === "POST201" && data.data) {
          const post: PostData = data.data
          
          console.log("권한 체크:", {
            currentUserEmail: currentUserEmail,
            postUserEmail: post.userEmail,
            isAuthor: currentUserEmail === post.userEmail
          })
          
          // 권한 체크: JWT 이메일과 게시글 작성자 이메일 비교
          if (currentUserEmail !== post.userEmail) {
            addToast("본인이 작성한 게시글만 수정할 수 있습니다.", 'error')
            setTimeout(() => router.push('/mypage'), 2000)
            return
          }
          
          // 날짜 파싱 (ISO 형식에서 date와 time 분리)
          const dateObj = new Date(post.date)
          const dateStr = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
          const timeStr = dateObj.toTimeString().substr(0, 5) // HH:MM
          
          setFormData({
            title: post.title,
            sport: post.sports,
            location: post.location,
            date: dateStr,
            time: timeStr,
            town: post.town,
            maxParticipants: post.maxPeople,
            gender: post.gender,
            cost: post.cost.toString(),
            content: post.description || "",
            imageUrl: post.imageUrl,
          })
          
          // 기존 이미지가 있으면 미리보기로 설정
          if (post.imageUrl) {
            setImagePreview(post.imageUrl)
            setOriginalImageUrl(post.imageUrl) // 원본 이미지 URL 저장
          }
        } else {
          throw new Error("게시글을 찾을 수 없습니다.")
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        if (error instanceof Error && error.message.includes('인증')) {
          addToast("로그인이 필요합니다.", 'error')
          router.push('/login')
        } else {
          addToast("게시글 데이터를 불러오는데 실패했습니다.", 'error')
          setTimeout(() => router.push('/mypage'), 2000)
        }
      } finally {
        setLoadingData(false)
      }
    }

    if (postId) {
      fetchPostData()
    }
  }, [postId, router])

  const handleParticipantChange = (increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      maxParticipants: increment ? Math.min(prev.maxParticipants + 1, 20) : Math.max(prev.maxParticipants - 1, 1),
    }))
  }

  // 이미지 파일 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      addToast("이미지 파일만 업로드 가능합니다.", 'error')
      return
    }

    setSelectedImage(file)
    setImageRemoved(false) // 새 이미지를 선택하면 삭제 상태 해제
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
    setFormData(prev => ({ ...prev, imageUrl: null }))
    setImageRemoved(true) 
    
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

    try {
      const isoDateTime = `${formData.date}T${formData.time}`
      
      // FormData 생성
      const submitFormData = new FormData()
      
      // JSON 데이터를 Blob으로 변환하여 추가
      const postData = {
        title: formData.title,
        description: formData.content,
        location: formData.location,
        date: isoDateTime,
        maxPeople: formData.maxParticipants,
        gender: formData.gender,
        status: "OPEN",
        cost: Number.parseInt(formData.cost) || 0,
        sports: formData.sport,
        town: formData.town,
        // 이미지 삭제 여부를 명시적으로 전달
        removeImage: imageRemoved && originalImageUrl !== null
      }
      
      submitFormData.append('postData', new Blob([JSON.stringify(postData)], {
        type: 'application/json'
      }))
      
      // 이미지 파일 추가 (있는 경우)
      if (selectedImage) {
        submitFormData.append('image', selectedImage)
      }

      // 토큰 가져오기
      const token = getAuthToken()
      console.log('사용 중인 토큰:', token ? '토큰 있음' : '토큰 없음')
      
      const headers: HeadersInit = {}
      
      headers['Authorization'] = `Bearer ${token}`

      console.log("수정 요청 데이터:", postData)

      if (!postData.town || postData.town.trim() === "") {
        addToast("지역(동네)을 선택해주세요.", 'error')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts/${postId}`, {
        method: 'PUT',
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
      
      if (response.status === 200 && (result.code === 'POST202' || result.code?.includes('POST'))) {
        console.log("수정 성공! 메시지:", result.message)
        addToast(result.message ?? "모집글이 성공적으로 수정되었습니다!", 'success')
        // 토스트가 보이도록 잠깐의 딜레이 후 이동
        setTimeout(() => router.push("/mypage/my-posts"), 500)
      } else {
        addToast("모집글 수정에 실패했습니다.", 'error')
      }
    } catch (error) {
      console.error("Edit post error:", error)
      if (error instanceof Error) {
        addToast(`모집글 수정 중 오류가 발생했습니다: ${error.message}`, 'error')
      } else {
        addToast("모집글 수정 중 오류가 발생했습니다.", 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // 데이터 로딩 중일 때
  if (loadingData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/mypage/my-posts">
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

        {/* 로딩 컨텐츠 */}
        <section className="px-6 py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-8"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              모집글 정보를 불러오는 중...
            </h1>
            <p className="text-lg text-gray-600">
              권한을 확인하고 데이터를 로딩하고 있습니다
            </p>
          </div>
        </section>
      </div>
    )
  }

  // 권한 없음 에러 페이지
  if (error && (error.includes('권한') || error.includes('존재하지 않는') || error.includes('본인이 작성한'))) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/mypage">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🚫</span>
                </div>
                <span className="font-bold text-gray-900">접근 제한</span>
              </div>
            </div>
          </div>
        </header>

        {/* 에러 컨텐츠 */}
        <section className="px-6 py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-8 flex items-center justify-center">
              <span className="text-4xl">🚫</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              접근할 수 없습니다
            </h1>
            <p className="text-xl text-red-600 mb-8">
              {error}
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => router.push('/mypage')} 
                className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors"
              >
                마이페이지로 돌아가기
              </button>
              <button 
                onClick={() => router.back()} 
                className="w-full py-4 border-2 border-gray-200 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors"
              >
                이전 페이지로
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 토스트 메시지들 */}
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
            <Link href="/mypage/my-posts">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✏️</span>
              </div>
              <span className="font-bold text-gray-900">MatchFit</span>
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            모집글 수정
          </h1>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* 에러 메시지만 유지 (성공 메시지는 토스트로) */}
          {error && !error.includes('권한') && !error.includes('존재하지 않는') && !error.includes('본인이 작성한') && (
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
                required
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

            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">
                지역 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  placeholder="지역을 선택하세요"
                  value={townOptions.find(opt => opt.value === formData.town)?.label || ""}
                  readOnly
                  className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50 pr-14 cursor-pointer"
                  onClick={() => settownModalOpen(true)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-xl transition-colors"
                  onClick={() => settownModalOpen(true)}
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 지역 선택 모달 */}
              {townModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 p-4">
                  <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">지역 선택</h3>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {townOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.town === option.value 
                              ? "border-black bg-black text-white" 
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, town: option.value }))
                            settownModalOpen(false)
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="w-full py-3 border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      onClick={() => settownModalOpen(false)}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-900">
                상세 위치 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="구체적인 장소명을 입력하세요 (예: OO구 OO로 OO체육관)"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
                required
              />
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">시간</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    className="h-14 text-lg border-2 border-gray-200 rounded-2xl focus:border-black focus:ring-0 bg-gray-50"
                    required
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
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
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
                {loading ? "수정하는 중..." : "모집글 수정하기"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}