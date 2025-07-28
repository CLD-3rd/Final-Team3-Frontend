export interface User {
  id: number
  email: string
  nickName: string
  age: number
  gender: "male" | "female"
  region: string
  town?: string
  preferredSports: string[]
  createdAt: string
  updatedAt: string
}

export interface Post {
  id: number
  title: string
  content?: string
  sports: string
  town: string // 게시글에 표시하는 지역명
  location?: string // 게시글 상세 조회에서 나오는 지역명
  date: string
  time: string
  currentPeople: number
  maxPeople: number
  viewCount?: number
  cost: number
  gender: "all" | "male" | "female"
  status: "모집중" | "모집완료" | "마감임박"
  authorId: number
  author?: User
  participants?: User[]
  favoriteCount: number
  image?: string
  createdAt: string
  updatedAt: string
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  nickname: string
  age: number
  gender: "MALE" | "FEMALE"
  town: string
  sports: string
  isKakaoUser : boolean
}

export interface CreatePostData {
  title: string
  content: string
  sport: string
  location: string
  date: string
  time: string
  maxParticipants: number
  cost: number
  gender: "all" | "male" | "female"
}

export interface ApiResponse<T> {
  success: boolean
  code?: string
  data?: T
  message?: string
  error?: string
}

export interface CalendarEvent {
  day: string
  event: {
    sports: string
    totalEvents: number
    time: string[]  
  }
  color: string
}
