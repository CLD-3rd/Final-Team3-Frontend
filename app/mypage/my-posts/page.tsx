"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Users, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

const myPostsWithApplicants = [
  {
    id: 1,
    sport: "축구",
    title: "주말 축구 함께할 하실 분!",
    location: "강남구 역삼동",
    time: "7월 20일 오후 2시",
    participants: "6/10명",
    cost: "15,000원",
    status: "모집중",
    applicants: [
      {
        id: 1,
        nickname: "축구왕",
        gender: "남성",
        age: 28,
        recruitCount: 5,
        applicationCount: 12,
        status: "승인대기",
      },
      {
        id: 2,
        nickname: "운동러버",
        gender: "여성",
        age: 25,
        recruitCount: 2,
        applicationCount: 8,
        status: "승인대기",
      },
      {
        id: 3,
        nickname: "스포츠맨",
        gender: "남성",
        age: 32,
        recruitCount: 8,
        applicationCount: 15,
        status: "승인완료",
      },
    ],
  },
  {
    id: 2,
    sport: "테니스",
    title: "테니스 레슨 후 게임 하실 분",
    location: "서초구 반포동",
    time: "7월 21일 오전 10시",
    participants: "4/4명",
    cost: "25,000원",
    status: "모집완료",
    applicants: [
      {
        id: 4,
        nickname: "테니스프로",
        gender: "남성",
        age: 30,
        recruitCount: 3,
        applicationCount: 6,
        status: "승인완료",
      },
    ],
  },
]

export default function MyPostsManagePage() {
  const [expandedPosts, setExpandedPosts] = useState<number[]>([])

  const toggleExpanded = (postId: number) => {
    setExpandedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const handleApprove = (postId: number, applicantId: number) => {
    alert(`신청자를 승인했습니다.`)
  }

  const handleReject = (postId: number, applicantId: number) => {
    alert(`신청자를 거절했습니다.`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Link href="/mypage">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold">내 모집글 관리</h1>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Posts List */}
        <div className="space-y-4">
          {myPostsWithApplicants.map((post) => (
            <Card key={post.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant="secondary"
                    className={`${post.sport === "축구" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                  >
                    {post.sport}
                  </Badge>
                  <Badge
                    variant={post.status === "모집중" ? "default" : "secondary"}
                    className={post.status === "모집중" ? "bg-green-500" : "bg-gray-500"}
                  >
                    {post.status}
                  </Badge>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">{post.title}</h4>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{post.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{post.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>{post.participants}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-red-500">{post.cost}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(post.id)}
                    className="flex items-center gap-2"
                  >
                    신청자 보기 ({post.applicants.length}명)
                    {expandedPosts.includes(post.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Applicants List */}
                {expandedPosts.includes(post.id) && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h5 className="font-medium text-gray-900">신청자 목록</h5>
                    {post.applicants.map((applicant) => (
                      <div key={applicant.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {applicant.nickname.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{applicant.nickname}</p>
                              <p className="text-sm text-gray-600">
                                {applicant.gender} · {applicant.age}세
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${
                              applicant.status === "승인완료"
                                ? "bg-green-500"
                                : applicant.status === "승인대기"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            } text-white`}
                          >
                            {applicant.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>모집회수: {applicant.recruitCount}회</span>
                          <span>신청횟수: {applicant.applicationCount}회</span>
                        </div>

                        {applicant.status === "승인대기" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white flex-1"
                              onClick={() => handleApprove(post.id, applicant.id)}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-200 hover:bg-red-50 flex-1 bg-transparent"
                              onClick={() => handleReject(post.id, applicant.id)}
                            >
                              거절
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {myPostsWithApplicants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">작성한 모집글이 없습니다</p>
            <Link href="/create-post">
              <Button className="bg-blue-500 hover:bg-blue-600">새 모집글 작성하기</Button>
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
