import type { Post, User, CreatePostData, LoginData, SignupData, ApiResponse } from "@/types/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // 클라이언트 사이드에서만 localStorage 접근
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // JSON 파싱 실패 시 기본 에러 메시지 사용
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return await response.json()
      } else {
        // JSON이 아닌 응답의 경우 빈 객체 반환
        return {} as T
      }
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Auth methods
  async login(data: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<ApiResponse<{ user: User; token: string }>>("/user/login", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (response.success && response.data?.token) {
      this.token = response.data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.data.token)
      }
    }

    return response
  }
  /* 
  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request<ApiResponse<{ user: User; token: string }>>("/user/signup", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }*/
  async signup(data: SignupData): Promise<string> {
    const res = await fetch(this.baseURL + "/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), 
    });
    return await res.text(); // 응답만 plain text로 받음!
  }


  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      this.token = null
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
      }
    }
  }

  // Email duplicate check
  async checkEmailDuplicate(email: string): Promise<ApiResponse<{ available: boolean }>> {
    return this.request<ApiResponse<{ available: boolean }>>("/user/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  // Nickname duplicate check
  async checkNicknameDuplicate(nickname: string): Promise<ApiResponse<{ available: boolean }>> {
    return this.request<ApiResponse<{ available: boolean }>>("/user/check-nickname", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    })
  }

  // 카카오로 회원가입
  async fetchKakaoConfig() {
  const res = await fetch(this.baseURL + "/kakao-config");
  if (!res.ok) throw new Error("카카오 설정값을 가져올 수 없습니다.");
  return await res.json();
}



  // Posts methods
  async getPosts(params?: {
    sport?: string
    sortBy?: string
    search?: string
    region?: string
    gender?: string
    date?: string
  }): Promise<Post[]> {
    try {
      const searchParams = new URLSearchParams()

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value)
        })
      }

      const queryString = searchParams.toString()
      const endpoint = `/posts${queryString ? `?${queryString}` : ""}`

      const response = await this.request<ApiResponse<Post[]>>(endpoint)
      return response.data || []
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      return []
    }
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.request<ApiResponse<Post>>(`/posts/${id}`)
    if (!response.data) {
      throw new Error("Post not found")
    }
    return response.data
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await this.request<ApiResponse<Post>>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!response.data) {
      throw new Error("Failed to create post")
    }
    return response.data
  }

  async updatePost(id: number, data: Partial<CreatePostData>): Promise<Post> {
    const response = await this.request<ApiResponse<Post>>(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    if (!response.data) {
      throw new Error("Failed to update post")
    }
    return response.data
  }

  async deletePost(id: number): Promise<void> {
    await this.request(`/posts/${id}`, { method: "DELETE" })
  }

  // Favorites methods
  async getFavorites(): Promise<{ postId: number; post: Post }[]> {
    try {
      const response = await this.request<ApiResponse<{ postId: number; post: Post }[]>>("/favorites")
      return response.data || []
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
      return []
    }
  }

  async addFavorite(postId: number): Promise<void> {
    await this.request("/favorites", {
      method: "POST",
      body: JSON.stringify({ postId }),
    })
  }

  async removeFavorite(postId: number): Promise<void> {
    await this.request(`/favorites/${postId}`, { method: "DELETE" })
  }

  // User methods
  async getProfile(): Promise<User> {
    const response = await this.request<ApiResponse<User>>("/users/profile")
    if (!response.data) {
      throw new Error("Failed to get profile")
    }
    return response.data
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<ApiResponse<User>>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    if (!response.data) {
      throw new Error("Failed to update profile")
    }
    return response.data
  }

  async getMyPosts(): Promise<Post[]> {
    try {
      const response = await this.request<ApiResponse<Post[]>>("/users/posts")
      return response.data || []
    } catch (error) {
      console.error("Failed to fetch my posts:", error)
      return []
    }
  }

  async getMyApplications(): Promise<{ post: Post; status: string; appliedAt: string }[]> {
    try {
      const response =
        await this.request<ApiResponse<{ post: Post; status: string; appliedAt: string }[]>>("/users/applications")
      return response.data || []
    } catch (error) {
      console.error("Failed to fetch my applications:", error)
      return []
    }
  }

  // Application methods
  async applyToPost(postId: number): Promise<void> {
    await this.request("/applications", {
      method: "POST",
      body: JSON.stringify({ postId }),
    })
  }

  async approveApplication(postId: number, userId: number): Promise<void> {
    await this.request(`/posts/${postId}/applications/${userId}/approve`, {
      method: "POST",
    })
  }

  async rejectApplication(postId: number, userId: number): Promise<void> {
    await this.request(`/posts/${postId}/applications/${userId}/reject`, {
      method: "POST",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
