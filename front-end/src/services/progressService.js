const API_URL = 'http://localhost:5000/api'; // Update with your backend URL

// Get all progress entries for a user
export const getProgressData = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/progress/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch progress data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching progress data:', error);
        throw error;
    }
};

// Get progress statistics
export const getProgressStats = async (userId, days = 30) => {
    try {
        const response = await fetch(`${API_URL}/progress/stats/${userId}?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch progress stats');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching progress stats:', error);
        throw error;
    }
};

// Track new progress entry
export const trackProgress = async (progressData) => {
    try {
        const response = await fetch(`${API_URL}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(progressData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to track progress');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error tracking progress:', error);
        throw error;
    }
};

// Update progress entry
export const updateProgress = async (id, progressData) => {
    try {
        const response = await fetch(`${API_URL}/progress/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(progressData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update progress');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating progress:', error);
        throw error;
    }
};

// Delete progress entry
export const deleteProgress = async (id) => {
    try {
        const response = await fetch(`${API_URL}/progress/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete progress');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting progress:', error);
        throw error;
    }
};