import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const numericTarget = Number(target) || 0;
    const startTime = performance.now();
    const startValue = 0;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = startValue + (numericTarget - startValue) * eased;
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setValue(numericTarget);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value);
}

export default useCountUp;