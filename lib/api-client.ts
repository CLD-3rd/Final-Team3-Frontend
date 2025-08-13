import type { Post, User, CreatePostData, LoginData, SignupData, ApiResponse } from "@/types/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

export interface PostListResponse {
    posts: Post[]
    page: number
    size: number
    totalElements: number
    totalPages: number
  }

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
    
    const response = await fetch(url, config)
    
    let data: any = {};
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
    } catch {
    // JSON 파싱 실패시 빈 객체로
      data = {};
    }

    return {
      ...data,
      status: response.status,
      ok: response.ok,
    } as T;
  }

  // Auth methods
  async login(data: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<ApiResponse<{ user: User; token: string }>>("/user/login", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (response.code === "USER201" && response.data?.token) {
      this.token = response.data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.data.token)
      }
    }
    return response
  }
  
  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request<ApiResponse<{ user: User; token: string }>>("/user/signup", {
      method: "POST",
      body: JSON.stringify(data),
    })
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

  // 카카오로 회원가입, 로그인
  async fetchKakaoConfig() {
  const res = await fetch(this.baseURL + "/kakao-config");
  if (!res.ok) throw new Error("카카오 설정값을 가져올 수 없습니다.");
  return await res.json();
}

  
  // Posts methods
  async getPosts(params?: {
    sport?: string
    sortType?: string
    search?: string
    region?: string
    gender?: string
    date?: string,
    page?: number      // 추가
    size?: number      // 추가
  }): Promise<PostListResponse> {  // 변경: 배열이 아니라 객체 리턴
    try {
      const searchParams = new URLSearchParams()

      if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))  // 값이 숫자여도 문자열로 변환해서 넣기
        }
      })
    }

      const queryString = searchParams.toString()
      const endpoint = `/posts/list${queryString ? `?${queryString}` : ""}`

      const response = await this.request<ApiResponse<PostListResponse>>(endpoint)

      // response.data가 { posts, page, size, totalElements, totalPages } 형태라고 가정
      if (response.data) {
        return response.data
      } else {
        // fallback: 빈 배열 등 초기값 반환
        return {
          posts: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        }
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      return {
        posts: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      }
    }
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.request<ApiResponse<Post>>(`/posts/${id}`)
    if (!response.data) {
      throw new Error("Post not found")
    }
    return response.data
  }

  async createPost(data: CreatePostData): Promise<ApiResponse<Post>> {
    const response = await this.request<ApiResponse<Post>>("/posts", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (response.code !== "POST200") {
      throw new Error("Failed to create post")
    }
    return response
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

  // 찜하기 기능
  async toggleFollow(postId: number): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/posts/${postId}/follow`, {
      method: "POST",
    });
  }

  // 내가 찜한 목록 조회
  async getMyFollows(): Promise<number[]> {
    const res = await this.request<ApiResponse<any[]>>("/user/follow");
    // res.data: [{ postId, ... }, ...]
    return res.data?.map(item => item.postId) || [];
  }

  // User methods
  async getProfile(): Promise<User> {
    const response = await this.request<ApiResponse<User>>("/user/mypage")
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

export async function fetchPostsCalender(year: number, month: number) {
  const monthStr = month.toString().padStart(2, "0");
  const response = await fetch(`http://localhost:8080/api/posts/calender?month=${year}-${monthStr}`);
  if (!response.ok) throw new Error("Failed to fetch calendar events");
  return await response.json();
}