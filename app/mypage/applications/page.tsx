"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react"
import Link from "next/link"

const myApplications = [
  {
    id: 1,
    sport: "축구",
    title: "주말 축구 함께할 하실 분!",
    location: "강남구 역삼동",
    time: "7월 20일 오후 2시",
    participants: "7/10명",
    cost: "15,000원",
    status: "승인대기",
    appliedDate: "2024-07-15",
  },
  {
    id: 2,
    sport: "테니스",
    title: "테니스 레슨 후 게임 하실 분",
    location: "서초구 반포동",
    time: "7월 21일 오전 10시",
    participants: "4/4명",
    cost: "25,000원",
    status: "승인완료",
    appliedDate: "2024-07-14",
  },
  {
    id: 3,
    sport: "농구",
    title: "농구 3vs3 게임 하실 분",
    location: "마포구 홍대입구",
    time: "7월 19일 오후 8시",
    participants: "6/6명",
    cost: "무료",
    status: "거절",
    appliedDate: "2024-07-13",
  },
]

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState("all") // "all", "pending", "approved", "rejected"

  const filteredApplications = myApplications.filter((app) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return app.status === "승인대기"
    if (activeTab === "approved") return app.status === "승인완료"
    if (activeTab === "rejected") return app.status === "거절"
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "승인완료":
        return "bg-green-500"
      case "승인대기":
        return "bg-yellow-500"
      case "거절":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">내 신청 내역</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className={activeTab === "all" ? "bg-blue-500 text-white" : ""}
          >
            전체 ({myApplications.length})
          </Button>
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pending")}
            className={activeTab === "pending" ? "bg-blue-500 text-white" : ""}
          >
            승인대기 ({myApplications.filter((a) => a.status === "승인대기").length})
          </Button>
          <Button
            variant={activeTab === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("approved")}
            className={activeTab === "approved" ? "bg-blue-500 text-white" : ""}
          >
            승인완료 ({myApplications.filter((a) => a.status === "승인완료").length})
          </Button>
          <Button
            variant={activeTab === "rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("rejected")}
            className={activeTab === "rejected" ? "bg-blue-500 text-white" : ""}
          >
            거절 ({myApplications.filter((a) => a.status === "거절").length})
          </Button>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Link key={application.id} href={`/post/${application.id}`}>
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="secondary"
                      className={`${
                        application.sport === "축구"
                          ? "bg-blue-100 text-blue-700"
                          : application.sport === "테니스"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {application.sport}
                    </Badge>
                    <Badge className={`${getStatusColor(application.status)} text-white`}>{application.status}</Badge>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-3">{application.title}</h4>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{application.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{application.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>{application.participants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">신청일: {application.appliedDate}</div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{application.cost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">신청 내역이 없습니다</p>
            <Link href="/">
              <Button className="bg-blue-500 hover:bg-blue-600">홈으로 가기</Button>
            </Link>
          </div>
        )}
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
