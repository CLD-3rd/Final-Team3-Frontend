"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Clock, Users, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/types/api"

export default function MyPostsPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyPosts()
  }, [])

  const fetchMyPosts = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getMyPosts()
      setPosts(data)
    } catch (error) {
      console.error("Failed to fetch my posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (id: number) => {
    if (confirm("정말로 이 모집글을 삭제하시겠습니까?")) {
      try {
        await apiClient.deletePost(id)
        setPosts((prev) => prev.filter((post) => post.id !== id))
        alert("모집글이 삭제되었습니다.")
      } catch (error) {
        console.error("Failed to delete post:", error)
        alert("삭제 중 오류가 발생했습니다.")
      }
    }
  }

  const filteredPosts = posts.filter((post) =>
    activeTab === "active" ? post.status === "모집중" : post.status === "모집완료",
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">내 모집글</h1>
          <Link href="/create-post">
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-1" />새 모집글
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => setActiveTab("active")}
            className={activeTab === "active" ? "bg-blue-500 text-white" : ""}
          >
            모집중 ({posts.filter((p) => p.status === "모집중").length})
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className={activeTab === "completed" ? "bg-blue-500 text-white" : ""}
          >
            모집완료 ({posts.filter((p) => p.status === "모집완료").length})
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : (
          /* Posts List */
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="secondary"
                      className={`${post.sports === "축구" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                    >
                      {post.sports}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Link href={`/edit-post/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-3">{post.title}</h4>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>
                        {post.date} {post.time}
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
                    <Badge
                      variant={post.status === "모집중" ? "default" : "secondary"}
                      className={post.status === "모집중" ? "bg-green-500" : "bg-gray-500"}
                    >
                      {post.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">{post.cost}원</p>
                      <Link href={`/post/${post.id}`}>
                        <Button size="sm" variant="outline">
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

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {activeTab === "active" ? "모집중인 글이 없습니다" : "모집완료된 글이 없습니다"}
            </p>
            <Link href="/create-post">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />새 모집글 작성하기
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Navigation 
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🏠</span>
            </div>
            <span className="text-xs">홈</span>
          </Link>
          <Link href="/my-posts" className="flex flex-col items-center gap-1 text-blue-500">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
