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
        const data = response.data || response
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
        const responseData = response.data || response
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium">잠시만 기다려주세요</p>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="flex items-center justify-between h-14 px-6 max-w-2xl mx-auto">
          <Link href="/mypage" className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">개인정보 수정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-6 py-8 pb-24 max-w-2xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">이메일</Label>
            <div className="relative">
              <Input 
                value={formData.email} 
                readOnly 
                disabled 
                className="h-14 text-base bg-gray-50 border-0 text-gray-500 font-medium pl-4 rounded-2xl"
              />
            </div>
            <p className="text-xs text-gray-400 pl-1">이메일은 변경할 수 없어요</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">동네</Label>
            <div className="relative">
              <Input 
                value={formData.town} 
                readOnly 
                disabled 
                className="h-14 text-base bg-gray-50 border-0 text-gray-500 font-medium pl-4 rounded-2xl"
              />
            </div>
            <p className="text-xs text-gray-400 pl-1">동네는 변경할 수 없어요</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">닉네임 *</Label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="닉네임 입력 (한글/영문/숫자 2-10자)"
                  value={formData.nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  className="h-14 text-base border-2 border-gray-100 focus:border-blue-500 rounded-2xl pl-4 transition-all duration-200"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleCheckNickname}
                disabled={checkingNickname || !formData.nickname.trim()}
                className="h-14 px-6 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl font-semibold text-sm whitespace-nowrap disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200"
              >
                {checkingNickname ? "확인중" : "중복확인"}
              </Button>
            </div>
            {nicknameStatus.message && (
              <div className={`flex items-center gap-2 pl-1 ${nicknameStatus.available ? 'text-blue-600' : 'text-red-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${nicknameStatus.available ? 'bg-blue-600' : 'bg-red-500'}`}></div>
                <p className="text-xs font-medium">{nicknameStatus.message}</p>
              </div>
            )}
            {formData.nickname && !validateNickname(formData.nickname) && shouldShowValidationErrors && (
              <div className="flex items-center gap-2 pl-1 text-red-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <p className="text-xs font-medium">2-10자의 한글, 영문, 숫자만 사용할 수 있어요</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">나이 *</Label>
            <Input 
              type="number"
              placeholder="나이 입력 (14-100세)"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
              min="14"
              max="100"
              className="h-14 text-base border-2 border-gray-100 focus:border-blue-500 rounded-2xl pl-4 transition-all duration-200"
            />
            {formData.age > 0 && (formData.age < 14 || formData.age > 100) && shouldShowValidationErrors && (
              <div className="flex items-center gap-2 pl-1 text-red-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <p className="text-xs font-medium">14세 이상 100세 이하만 입력할 수 있어요</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-900">선호 종목 *</Label>
            <div className="grid grid-cols-6 gap-4">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleSportSelect(sport.id)}
                  className={`h-24 flex flex-col items-center justify-center gap-2 border-2 rounded-2xl transition-all duration-200 ${
                    formData.selectedSport === sport.id
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className="text-xs font-semibold">{sport.name}</span>
                </Button>
              ))}
            </div>
            {!formData.selectedSport && shouldShowValidationErrors && (
              <div className="flex items-center gap-2 pl-1 text-red-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <p className="text-xs font-medium">선호 종목을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className={`w-full h-14 text-base font-bold rounded-2xl transition-all duration-200 ${
              isFormValid && !saving
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                저장 중...
              </div>
            ) : (
              "저장하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}