import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import UserConnection from '../models/UserConnection';

export interface UserConnectionStore {
    userConnection: UserConnection | null;
    setUserConnection: (userConnection: UserConnection) => void;
    clearUserConnection: () => void;
}

export const useUserConnectionStore = create<UserConnectionStore>()(
    persist(
        (set) => ({
            userConnection: null,
            setUserConnection: (userConnection) => set({userConnection}),
            clearUserConnection: () => set({userConnection: null})
        }),
        {
            name: 'userConnection-storage',
        }
    )
);