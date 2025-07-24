"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { CalendarEvent } from "@/types/api"

interface CalendarViewProps {
  onDateSelect: (date: string) => void
}

export default function CalendarView({ onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarEvents()
  }, [currentDate])

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // API에서 해당 월의 이벤트 데이터를 가져옴
      const posts = await apiClient.getPosts({
        date: `${year}-${month.toString().padStart(2, "0")}`,
      })

      // 게시글 데이터를 캘린더 이벤트 형태로 변환
      const calendarEvents: CalendarEvent[] = []
      const eventMap = new Map<string, Map<string, number>>()

      posts.forEach((post) => {
        const date = post.date
        if (!eventMap.has(date)) {
          eventMap.set(date, new Map())
        }
        const sportMap = eventMap.get(date)!
        sportMap.set(post.sport, (sportMap.get(post.sport) || 0) + 1)
      })

      eventMap.forEach((sportMap, date) => {
        sportMap.forEach((count, sport) => {
          calendarEvents.push({
            date,
            sport,
            count,
            color: getSportColor(sport),
          })
        })
      })

      setEvents(calendarEvents)
    } catch (error) {
      console.error("Failed to fetch calendar events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getSportColor = (sport: string): string => {
    const colorMap: { [key: string]: string } = {
      축구: "bg-blue-500",
      테니스: "bg-green-500",
      탁구: "bg-red-500",
      농구: "bg-orange-500",
      배드민턴: "bg-purple-500",
      배구: "bg-pink-500",
    }
    return colorMap[sport] || "bg-gray-500"
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => event.date === dateStr)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]

  // 고유한 스포츠 목록 생성
  const uniqueSports = Array.from(new Set(events.map((event) => event.sport)))

  return (
    <div className="bg-white rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} disabled={loading}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} disabled={loading}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <>
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dayEvents = getEventsForDate(day)
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

              return (
                <button
                  key={day}
                  onClick={() => onDateSelect(dateStr)}
                  className="h-16 p-1 border border-gray-100 hover:bg-gray-50 flex flex-col items-center justify-start rounded transition-colors"
                >
                  <span className="text-sm font-medium mb-1">{day}</span>
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <Badge key={idx} className={`${event.color} text-white text-xs px-1 py-0 h-4 min-w-0`}>
                        {event.count}
                      </Badge>
                    ))}
                    {dayEvents.length > 2 && (
                      <Badge className="bg-gray-400 text-white text-xs px-1 py-0 h-4">+{dayEvents.length - 2}</Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          {uniqueSports.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {uniqueSports.map((sport) => (
                <div key={sport} className="flex items-center gap-1">
                  <div className={`w-3 h-3 ${getSportColor(sport)} rounded`}></div>
                  <span className="text-xs">{sport}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">이번 달에 등록된 모집글이 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
