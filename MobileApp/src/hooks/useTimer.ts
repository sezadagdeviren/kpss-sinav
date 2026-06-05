import { useState, useEffect } from 'react';

export function useTimer(enabled: boolean = true) {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(enabled);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const resetTimer = () => setTimer(0);

  return { timer, isActive, setIsActive, resetTimer };
}
