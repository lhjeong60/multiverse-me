import { useState, useEffect, useRef } from 'react'

export default function TypeWriter({ text, speed = 30, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)
  const prevText = useRef('')

  useEffect(() => {
    // Reset if text changes
    if (text !== prevText.current) {
      prevText.current = text
      idx.current = 0
      setDisplayed('')
    }

    const interval = setInterval(() => {
      if (idx.current < text.length) {
        idx.current++
        setDisplayed(text.slice(0, idx.current))
      } else {
        clearInterval(interval)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return <span>{displayed}</span>
}
