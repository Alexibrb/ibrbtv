'use client';

import { useState, useEffect } from 'react';

type CountdownTimerProps = {
  targetDate: string;
  onComplete: () => void;
  className?: string;
};

const CountdownTimer = ({ targetDate, onComplete, className }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const calculateAndSetTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference <= 0) {
        setTimeLeft(null);
        onComplete();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      const format = (value: number) => String(value).padStart(2, '0');

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(format(hours));
      parts.push(format(minutes));
      parts.push(format(seconds));
      
      setTimeLeft(parts.join(':'));
    };

    // Calculate immediately on mount
    calculateAndSetTimeLeft();

    const timer = setInterval(calculateAndSetTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft === null) {
    return null;
  }

  return (
    <div className={className}>
      {timeLeft}
    </div>
  );
};

export default CountdownTimer;
