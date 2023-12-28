import {create} from 'zustand'

export interface UserSessionStore {
    loggedIn: boolean;
    setLoggedIn: (loggedIn: boolean) => void;
}

export const useUserConnectionStore = create<UserSessionStore>()(
    (set) => ({
        loggedIn: false,
        setLoggedIn: (loggedIn: boolean) => set({loggedIn}),
    })
);