import { useEffect, useState } from 'react';

/** Màn nhỏ ≤5; màn lớn 8 mục / trang (giống Admin) */
const PAGE_SIZE_SMALL = 5;
const PAGE_SIZE_LARGE = 8;
const LARGE_SCREEN_MQ = '(min-width: 1024px)';

export function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(LARGE_SCREEN_MQ).matches
      ? PAGE_SIZE_LARGE
      : PAGE_SIZE_SMALL
  );

  useEffect(() => {
    const mq = window.matchMedia(LARGE_SCREEN_MQ);
    const onChange = (e) => {
      setPageSize(e.matches ? PAGE_SIZE_LARGE : PAGE_SIZE_SMALL);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return pageSize;
}
