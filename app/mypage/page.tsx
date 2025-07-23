"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, User, Settings, FileText, Heart, List } from "lucide-react"
import Link from "next/link"

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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-1">김운동님</h2>
          <p className="text-sm opacity-90">kim@example.com</p>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">12</p>
              <p className="text-sm text-gray-600">참여한 모임</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">3</p>
              <p className="text-sm text-gray-600">내 모집글</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">8</p>
              <p className="text-sm text-gray-600">찜한 모집글</p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
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

        {/* Logout Button */}
        <div className="mt-8">
          <Link href="/login">
            <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50 bg-transparent">
              로그아웃
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
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
      </div>
    </div>
  )
}
