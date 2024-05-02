// import {create} from 'zustand';
// import {persist} from 'zustand/middleware';
// import Semester from "../models/Semester.ts";
//
// export interface DataStore {
//     semesters: { [key: string]: Semester }
//     _hasHydrated: boolean;
//     setHasHydrated: (state: boolean) => void;
//     addSemester: (semester: Semester) => void;
//     isEmpty: () => boolean;
// }
//
// const useDataStore = create<DataStore>()(
//     persist((set, get) => ({
//             semesters: {},
//             _hasHydrated: false,
//             setHasHydrated: (state: boolean) => set({_hasHydrated: state}),
//             addSemester: (semester: Semester) => set(state =>
//                 ({semesters: {...state.semesters, [semester.id]: semester}})
//             ),
//             isEmpty: () => Object.keys(get().semesters).length === 0
//         }),
//         {
//             name: 'data-store',
//             onRehydrateStorage: () => ((state) => state?.setHasHydrated(true))
//         }
//     )
// );
//
// export default useDataStore;