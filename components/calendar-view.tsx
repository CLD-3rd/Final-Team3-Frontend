"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { CalendarEvent, Post } from "@/types/api"
import { fetchPostsCalender } from "@/lib/api-client";

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

       // API에서 해당 월의 모집글(이벤트) 데이터 받아오기
      const res = await fetchPostsCalender(year, month)

      const posts = res.data?.posts || [];

      const calendarEvents: CalendarEvent[] = posts.map((item: any) => ({
        day: item.day,
        event: {
          sports: item.event.sports,
          totalEvents: item.event.totalEvents,
          time: item.event.time, 
        },
        color: getSportColor(item.event.sports),
      }));    

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
      테니스: "bg-blue-300",
      축구: "bg-green-300",
      농구: "bg-orange-300",
      배구: "bg-purple-300",
      탁구: "bg-red-300",
      배드민턴: "bg-yellow-300"
    }
    return colorMap[sport] || "bg-gray-300"
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const now = new Date();

    // 오늘 날짜면 "현재 시각 이후"만
    if (dateStr === now.toISOString().split("T")[0]) {
      return events.filter(event => {
        if (event.day !== dateStr) return false;
        if (event.event && Array.isArray(event.event.time)) {
          return event.event.time.some(timeStr => {
            const [hour, minute] = timeStr.split(":").map(Number);
            const eventDateTime = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              hour,
              minute
            );
          return eventDateTime > now;
        });
      }
      return true;
      });
    }
    return events.filter((event) => event.day === dateStr);
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
  const uniqueSports = Array.from(new Set(events.map((event) => event.event.sports)))

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

            const now = new Date();
            const dateObj = new Date(dateStr); // 해당 day의 날짜
            const isToday = dateObj.toDateString() === now.toDateString();
            const isFutureDate = dateObj > now;
            
            const sportBadgeCounts: Record<string, number> = {};

            dayEvents.forEach(event => {
              const sport = event.event.sports ?? "기타";
              const times = Array.isArray(event.event.time) ? event.event.time : [];
              let futureTimesCount = 0;

              if (isFutureDate) {
                futureTimesCount = times.length;
              } else if (isToday) {
                // 오늘이면 현재 시각 이후만 카운트
                futureTimesCount = times.filter(timeStr => {
                  const [hour, minute] = timeStr.split(":").map(Number);
                  const eventDateTime = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hour,
                    minute
                  );
                  console.log(
                    `dateStr=${dateStr}`,
                    `now=${now.toISOString()}`,
                    `eventDateTime=${eventDateTime.toISOString()}`,
                    `eventDateTime > now =`, eventDateTime > now
                  );
                  return eventDateTime > now;
                }).length;
              }
              // 과거 날짜면 0

              if (futureTimesCount > 0) {
                sportBadgeCounts[sport] = (sportBadgeCounts[sport] || 0) + futureTimesCount;
              }
            });

              // 종목별 뱃지(2개까지), 나머지는 +n
            const sportBadgeEntries = Object.entries(sportBadgeCounts).filter(([_, count]) => count > 0);

            const hasFutureEvent = sportBadgeEntries.length > 0;

            return (
              <button
                key={day}
                onClick={() => onDateSelect(dateStr)}
                className="h-16 p-1 border border-gray-100 hover:bg-gray-50 flex flex-col items-center justify-start rounded transition-colors"
              >
                <span className="text-sm font-medium mb-1">{day}</span>
                <div className="flex flex-wrap gap-1">
                  { hasFutureEvent && sportBadgeEntries.slice(0, 6).map(([sport, count], idx) => (
                    <Badge
                      key={sport}
                      className={`${getSportColor(sport)} text-white text-xs px-1 py-0 h-4 min-w-0`}
                    >
                    {count}
                    </Badge>
                    ))}
                 {/* { hasFutureEvent && dayEvents.length > 2 && (
                    <Badge className="bg-gray-400 text-white text-xs px-1 py-0 h-4">+{sportBadgeEntries.length - 2}</Badge>
                  )} */}
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
