

import { useEffect, useRef } from 'react';

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface HistoryStackProps {
  isOverlayVisible: boolean;
  closeTopOverlay: () => void;
}

export const useHistoryStack = ({ isOverlayVisible, closeTopOverlay }: HistoryStackProps) => {
  const popStateInProgress = useRef(false);
  const wasOverlayVisible = usePrevious(isOverlayVisible);

  useEffect(() => {
    const onPopState = () => {
        // This function will be called by popstate event.
        // It should close the top-most layer of the UI. (LIFO)
        popStateInProgress.current = true;
        closeTopOverlay();
    };

    window.addEventListener('popstate', onPopState);

    return () => {
        window.removeEventListener('popstate', onPopState);
    };
  }, [closeTopOverlay]); // Re-bind if the close function changes

  useEffect(() => {
      if (isOverlayVisible && !wasOverlayVisible) {
          // An overlay was just opened, push a state to history
          window.history.pushState({ axismea: true }, '');
      } else if (!isOverlayVisible && wasOverlayVisible) {
          // An overlay was just closed by a button, not by popstate
          if (popStateInProgress.current) {
              // This was triggered by our popstate handler, so history is correct. Reset flag.
              popStateInProgress.current = false;
          } else {
              // This was a manual close, so we need to go back in history.
              if (window.history.state?.axismea) {
                  window.history.back();
              }
          }
      }
  }, [isOverlayVisible, wasOverlayVisible]);
};