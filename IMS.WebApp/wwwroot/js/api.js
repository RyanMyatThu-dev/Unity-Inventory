const API_BASE_URL = 'https://localhost:7217/api'; // Fallback to http, but should ideally be configurable

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const headers = {
            ...options.headers,
        };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (response.status === 401) {
                // Handle unauthorized (expired token)
                this.logout();
                window.location.href = '/Account/Login';
                return null;
            }

            const data = await response.json();

            // API always returns camelCase (PascalCase fallbacks kept for safety)
            // PagedResult shape: { isSuccess, message, data: T[], pagination: {...} }
            // Result<T> shape:   { isSuccess, message, data: T }
            const isWrapper = data.isSuccess !== undefined || data.IsSuccess !== undefined;
            const result = {
                isSuccess: isWrapper
                    ? (data.isSuccess ?? data.IsSuccess)
                    : response.ok,
                message: data.message || data.Message || (response.ok ? 'Success' : 'An error occurred'),
                data: isWrapper ? (data.data ?? data.Data ?? null) : data,
                pagination: data.pagination || data.Pagination || null,
                errors: data.errors || data.Errors || null
            };

            if (!response.ok && result.isSuccess) result.isSuccess = false;

            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { isSuccess: false, message: 'Failed to connect to server' };
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    postForm(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
        });
    },

    putForm(endpoint, formData) {
        return this.request(endpoint, {
            method: 'PUT',
            body: formData,
        });
    },

    delete(endpoint, body) {
        const options = { method: 'DELETE' };
        if (body) {
            options.body = JSON.stringify(body);
        }
        return this.request(endpoint, options);
    },

    setToken(token) {
        localStorage.setItem('access_token', token);
    },

    getToken() {
        return localStorage.getItem('access_token');
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('current_business_id');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

window.api = api;
