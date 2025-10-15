"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  onChange: (dateTime: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({
  onChange,
  placeholder = "Select date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [time, setTime] = React.useState<string>("10:30:00")

  //  组合日期与时间
  const combineDateTime = (date?: Date, timeStr?: string): Date | undefined => {
    if (!date || !timeStr) return undefined
    const [hours, minutes, seconds] = timeStr.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    newDate.setSeconds(seconds || 0)
    return newDate
  }

  // 每次 date 或 time 改变时，自动触发 onChange
  React.useEffect(() => {
    onChange(combineDateTime(date, time))
  }, [date, time])

  return (
    <div className="flex gap-4">
      {/* 日期选择 */}
      <div className="flex flex-col gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : placeholder}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(d) => {
                setDate(d)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 时间输入 */}
      <div className="flex flex-col gap-3">
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
