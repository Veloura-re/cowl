import { useLayoutEffect } from 'react';

export function useLockBodyScroll(lock: boolean = true) {
    useLayoutEffect(() => {
        if (!lock) return;

        // Get original body overflow
        const originalStyle = window.getComputedStyle(document.body).overflow;

        // Prevent scrolling on mount
        document.body.style.overflow = 'hidden';
        document.body.classList.add('lock-scroll');

        // Re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflow = originalStyle;
            document.body.classList.remove('lock-scroll');
        };
    }, [lock]);
}
