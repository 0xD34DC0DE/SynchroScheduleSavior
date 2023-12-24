import axios from 'axios';

export const useAuthenticationApi = () => {
    login: async (username: string, password: string, cancel: boolean = false) => {
        const response = await axios.post('/api/login', {username, password, cancel});
        return response.data;
    }
}