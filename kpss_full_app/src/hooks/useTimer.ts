import { useState, useEffect } from 'react';

interface UseTimerProps {
  category?: string;
  year?: string;
  enabled: boolean;
}

export function useTimer({ category, year, enabled }: UseTimerProps) {
  const [timer, setTimer] = useState(() => {
    if (!enabled) return 0;
    const saved = localStorage.getItem(`timer_${category}_${year}`);
    return saved ? parseInt(saved) : 0;
  });

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (enabled && isActive) {
      interval = setInterval(() => {
        setTimer(t => {
          const newTime = t + 1;
          localStorage.setItem(`timer_${category}_${year}`, newTime.toString());
          localStorage.setItem(`timer_ts_${category}_${year}`, Date.now().toString());
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [enabled, isActive, category, year]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        const savedTs = localStorage.getItem(`timer_ts_${category}_${year}`);
        if (savedTs) {
          const diff = Math.floor((Date.now() - parseInt(savedTs)) / 1000);
          if (diff > 1) {
            setTimer(t => {
              const syncedTime = t + diff;
              localStorage.setItem(`timer_${category}_${year}`, syncedTime.toString());
              return syncedTime;
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isActive, category, year]);

  const resetTimer = () => {
    setTimer(0);
    localStorage.removeItem(`timer_${category}_${year}`);
    localStorage.removeItem(`timer_ts_${category}_${year}`);
  };

  return { timer, isActive, setIsActive, resetTimer };
}
