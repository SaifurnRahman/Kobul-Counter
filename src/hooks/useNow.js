import { useEffect, useState } from 'react'
import { todayNum } from '../lib/dates'

// Re-renders every second
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// Day number of today; updates when the date changes at midnight
export function useToday() {
  const [today, setToday] = useState(todayNum)
  useEffect(() => {
    const id = setInterval(() => setToday((d) => (todayNum() !== d ? todayNum() : d)), 30000)
    return () => clearInterval(id)
  }, [])
  return today
}
