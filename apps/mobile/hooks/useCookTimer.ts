import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

export function useCookTimer(durationSeconds: number) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  function start() {
    if (remaining > 0) {
      setRunning(true);
    }
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRemaining(durationSeconds);
    setRunning(false);
  }

  useEffect(() => {
    // If we receive a new duration, reset it (e.g. step changed)
    setRemaining(durationSeconds);
    setRunning(false);
  }, [durationSeconds]);

  // Tick every second when running
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            // Trigger haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { clearInterval(intervalRef.current); };
  }, [running]);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  return { 
    remaining, 
    running, 
    start, 
    pause, 
    reset, 
    formatted: formatTime(remaining),
    finished: remaining === 0
  };
}
