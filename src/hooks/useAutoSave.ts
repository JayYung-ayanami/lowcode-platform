import { useEffect, useRef } from 'react';
import { useAppSelector } from '../store/hook';
import { projectStorage } from '../utils/storage';

const SAVE_DELAY = 1000; // 1秒防抖

export const useAutoSave = () => {
  const page = useAppSelector((state) => state.project.present.page);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 清除上一次的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的定时器
    timerRef.current = setTimeout(() => {
      projectStorage.saveProject(page).catch(err => {
        console.error('AutoSave failed:', err);
      });
    }, SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [page]);
};

