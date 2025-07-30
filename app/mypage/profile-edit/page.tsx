"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const sports = [
  { id: "축구", name: "축구", icon: "⚽", backendId: "FOOTBALL" },
  { id: "테니스", name: "테니스", icon: "🎾", backendId: "TENNIS" },
  { id: "탁구", name: "탁구", icon: "🏓", backendId: "TABLE_TENNIS" },
  { id: "농구", name: "농구", icon: "🏀", backendId: "BASKETBALL" },
  { id: "배드민턴", name: "배드민턴", icon: "🏸", backendId: "BADMINTON" },
  { id: "배구", name: "배구", icon: "🏐", backendId: "VOLLEYBALL" },
]

const mapBackendToFrontend = (backendValue: string) => sports.find(s => s.backendId === backendValue)?.id || ""
const mapFrontendToBackend = (frontendValue: string) => sports.find(s => s.id === frontendValue)?.backendId || ""

export default function ProfileEditPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    town: "",
    age: 0,
    selectedSport: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [originalNickname, setOriginalNickname] = useState("")
  const [originalAge, setOriginalAge] = useState(0)
  const [originalSport, setOriginalSport] = useState("")
  const [nicknameStatus, setNicknameStatus] = useState({
    checked: false,
    available: false,
    message: ""
  })

  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("accessToken")

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    if (!token) throw new Error("인증 토큰이 없습니다.")

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 403) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
    }
    return response
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth_token = getAuthToken()
        if (!auth_token) {
          router.push('/login')
          return
        }

        const res = await makeAuthenticatedRequest("http://localhost:8080/api/user/mypage")
        if (!res.ok) throw new Error("유저 정보 요청 실패")
        
        const response = await res.json()
        const data = response.data || response // 새로운 형태와 기존 형태 모두 지원
        const selectedSport = mapBackendToFrontend(data.sports || "")

        setFormData({
          email: data.email || "",
          nickname: data.nickName || "",
          town: data.town || "",
          age: data.age || 0,
          selectedSport,
        })
        setOriginalNickname(data.nickName || "")
        setOriginalAge(data.age || 0)
        setOriginalSport(selectedSport)
      } catch (error) {
        console.error("유저 정보 불러오기 실패:", error)
        if (!(error instanceof Error) || !error.message.includes("인증")) {
          alert("유저 정보를 불러오는데 실패했습니다.")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [router])

  const validateNickname = (nickname: string) => /^[가-힣a-zA-Z0-9]{2,10}$/.test(nickname)

  const handleCheckNickname = async () => {
    if (!formData.nickname.trim()) {
      alert("닉네임을 입력해주세요.")
      return
    }

    if (!validateNickname(formData.nickname)) {
      setNicknameStatus({
        checked: true,
        available: false,
        message: "2-10자의 한글, 영문, 숫자만 사용 가능합니다."
      })
      return
    }

    setCheckingNickname(true)
    try {
      const res = await makeAuthenticatedRequest("http://localhost:8080/api/user/check-nickname", {
        method: "POST",
        body: JSON.stringify({ nickname: formData.nickname })
      })

      setNicknameStatus({
        checked: true,
        available: res.ok,
        message: res.ok ? "사용 가능한 닉네임입니다." : "이미 사용중인 닉네임입니다."
      })
    } catch (error) {
      console.error("닉네임 중복 확인 실패:", error)
      if (!(error instanceof Error) || !error.message.includes("인증")) {
        setNicknameStatus({
          checked: true,
          available: true,
          message: "사용 가능한 닉네임입니다."
        })
      }
    } finally {
      setCheckingNickname(false)
    }
  }

  const handleNicknameChange = (value: string) => {
    setFormData(prev => ({ ...prev, nickname: value }))
    if (value !== originalNickname) {
      setNicknameStatus({ checked: false, available: false, message: "" })
    } else {
      setNicknameStatus({ checked: true, available: true, message: "기존 닉네임입니다." })
    }
  }

  const handleSportSelect = (sportId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSport: prev.selectedSport === sportId ? "" : sportId,
    }))
  }

  const handleSave = async () => {
    const nicknameChanged = formData.nickname !== originalNickname
    if (nicknameChanged && (!nicknameStatus.checked || !nicknameStatus.available)) {
      alert("닉네임을 변경하셨습니다. 중복 확인을 완료해주세요.")
      return
    }

    setSaving(true)
    try {
      const sportBackendValue = mapFrontendToBackend(formData.selectedSport)
      const updateData = {
        nickName: formData.nickname,
        age: formData.age,
        ...(sportBackendValue ? { sports: sportBackendValue } : {})
      }

      const res = await makeAuthenticatedRequest('http://localhost:8080/api/user/mypage', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorResponse = await res.json()
          const errorData = errorResponse.data || errorResponse
          throw new Error(errorData.message || errorResponse.message || `수정 실패 (${res.status})`)
        }
        throw new Error(`수정 실패 (${res.status})`)
      }

      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const response = await res.json()
        const responseData = response.data || response // 새로운 형태와 기존 형태 모두 지원
        setFormData(prev => ({
          ...prev,
          email: responseData.email || prev.email,
          nickname: responseData.nickName || prev.nickname,
          town: responseData.town || prev.town,
          age: responseData.age || prev.age,
          selectedSport: mapBackendToFrontend(responseData.sports) || prev.selectedSport,
        }))
        setOriginalNickname(responseData.nickName || formData.nickname)
        setOriginalAge(responseData.age || formData.age)
        setOriginalSport(mapBackendToFrontend(responseData.sports) || formData.selectedSport)
      } else {
        setOriginalNickname(formData.nickname)
        setOriginalAge(formData.age)
        setOriginalSport(formData.selectedSport)
      }

      alert("개인정보가 성공적으로 수정되었습니다!")
      router.back()
    } catch (error) {
      console.error("개인정보 수정 실패:", error)
      if (!(error instanceof Error) || !error.message.includes("인증")) {
        const errorMessage = error instanceof Error ? error.message : "개인정보 수정에 실패했습니다."
        alert(errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    )
  }

  const hasChanges = formData.nickname !== originalNickname || 
                   formData.age !== originalAge || 
                   formData.selectedSport !== originalSport

  const isFormValid = formData.nickname && 
                     formData.age >= 14 && 
                     formData.age <= 100 && 
                     formData.selectedSport && 
                     hasChanges &&
                     (formData.nickname === originalNickname || (nicknameStatus.checked && nicknameStatus.available))

  const shouldShowValidationErrors = hasChanges || formData.nickname !== originalNickname || 
                                   (formData.age !== originalAge && formData.age > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">개인정보 수정</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg p-6 space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">이메일</Label>
            <Input id="email" value={formData.email} readOnly disabled className="bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>

          <div>
            <Label htmlFor="town" className="text-gray-700 font-medium mb-2 block">동네</Label>
            <Input id="town" value={formData.town} readOnly disabled className="bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">동네는 변경할 수 없습니다.</p>
          </div>

          <div>
            <Label htmlFor="nickname" className="text-gray-700 font-medium mb-2 block">닉네임 *</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                placeholder="닉네임을 입력하세요 (한글/영문/숫자 2-10자)"
                value={formData.nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-500 text-white border-blue-500 px-4 hover:bg-blue-600"
                onClick={handleCheckNickname}
                disabled={checkingNickname || !formData.nickname.trim()}
              >
                {checkingNickname ? "확인중..." : "중복확인"}
              </Button>
            </div>
            {nicknameStatus.message && (
              <p className={`text-xs mt-1 ${nicknameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                {nicknameStatus.message}
              </p>
            )}
            {formData.nickname && !validateNickname(formData.nickname) && shouldShowValidationErrors && (
              <p className="text-xs mt-1 text-red-600">
                2-10자의 한글, 영문, 숫자만 사용 가능합니다.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="age" className="text-gray-700 font-medium mb-2 block">나이 *</Label>
            <Input 
              id="age" 
              type="number"
              placeholder="나이를 입력하세요 (14-100세)"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              min="14"
              max="100"
            />
            {formData.age > 0 && (formData.age < 14 || formData.age > 100) && shouldShowValidationErrors && (
              <p className="text-xs mt-1 text-red-600">
                나이는 14세 이상 100세 이하만 가능합니다.
              </p>
            )}
          </div>

          <div>
            <Label className="text-gray-700 font-medium mb-3 block">선호 종목</Label>
            <div className="grid grid-cols-3 gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  variant={formData.selectedSport === sport.id ? "default" : "outline"}
                  onClick={() => handleSportSelect(sport.id)}
                  className={`h-16 flex flex-col items-center justify-center gap-1 ${
                    formData.selectedSport === sport.id
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  <span className="text-xl">{sport.icon}</span>
                  <span className="text-xs">{sport.name}</span>
                </Button>
              ))}
            </div>
            {formData.selectedSport && (
              <p className="text-sm text-blue-600 mt-2">
                선택된 종목: {sports.find(s => s.id === formData.selectedSport)?.name}
              </p>
            )}
            {!formData.selectedSport && shouldShowValidationErrors && (
              <p className="text-xs mt-1 text-red-600">
                선호 종목을 선택해주세요.
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-3 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
      
      {/* 
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
