const auth = {
    async login(email, password) {
        const result = await window.api.post('/auth/login', { email, password });
        
        if (result && result.isSuccess) {
            const data = result.data;
            window.api.setToken(data.accessToken || data.AccessToken);
            localStorage.setItem('user_info', JSON.stringify({
                email: data.email || data.Email,
                role: data.role || data.Role || 'User',
                name: data.name || data.Name || (data.email || data.Email || '').split('@')[0] || 'User'
            }));
            localStorage.setItem('user_businesses', JSON.stringify(data.businesses || data.Businesses || []));
            return { success: true };
        }
        
        return { success: false, message: result ? result.message : 'Login failed' };
    },

    async register(userData) {
        const result = await window.api.post('/users/register', userData);
        
        if (result && result.isSuccess) {
            return { success: true };
        }
        
        return { success: false, message: result ? result.message : 'Registration failed' };
    },

    getUserInfo() {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },

    async switchBusiness(businessId) {
        const result = await window.api.post(`/business/switch-business/${businessId}`);
        
        if (result && result.isSuccess) {
            const data = result.data;
            window.api.setToken(data.accessToken || data.AccessToken);
            localStorage.setItem('current_business_id', businessId);
            const email = data.email || data.Email || '';
            localStorage.setItem('user_info', JSON.stringify({
                email,
                role: data.role || data.Role,
                name: data.name || data.Name || email.split('@')[0]
            }));
            localStorage.setItem('user_businesses', JSON.stringify(data.businesses || data.Businesses || []));
            return { success: true };
        }
        
        return { success: false, message: result ? result.message : 'Switching business failed' };
    },

    getCurrentBusiness() {
        const businessId = localStorage.getItem('current_business_id');
        const businesses = JSON.parse(localStorage.getItem('user_businesses') || '[]');
        if (!businessId || !businesses.length) return null;
        return businesses.find(b => (b.businessId || b.BusinessId) == businessId);
    }
};

window.auth = auth;
