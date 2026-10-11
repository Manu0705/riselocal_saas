'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type HostelSidebarStateValue = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

const HostelSidebarStateContext =
  createContext<HostelSidebarStateValue | null>(null);

export function HostelSidebarStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <HostelSidebarStateContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </HostelSidebarStateContext.Provider>
  );
}

export function useHostelSidebarState() {
  const state = useContext(HostelSidebarStateContext);

  if (!state) {
    throw new Error(
      'useHostelSidebarState must be used within HostelSidebarStateProvider',
    );
  }

  return state;
}
