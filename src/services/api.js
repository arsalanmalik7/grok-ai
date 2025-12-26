import axiosInstance from './axiosInstance';

// --- File Upload ---

/**
 * Upload a single file (PDF, DOCX, Image)
 * @param {File} file 
 * @param {string} [sessionId] - Optional session ID
 * @param {string} [language="en"] - Language code (default: "en")
 * @returns {Promise<Object>}
 */
export const uploadFile = async (file, sessionId, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('session_id', sessionId);
    formData.append('language', language);

    if (user) formData.append('user_id', user.uid);

    const response = await axiosInstance.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Upload multiple files
 * @param {File[]} files 
 * @param {string} [sessionId] - Optional session ID
 * @returns {Promise<Object>}
 */
export const uploadFilesBatch = async (files, sessionId, userId) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });
    if (sessionId) formData.append('session_id', sessionId);

    if (userId) formData.append('user_id', userId);

    const response = await axiosInstance.post('/upload/batch', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Get list of uploaded files
 * @param {Object} params - Query parameters
 * @param {string} [params.userId] - Filter by user
 * @param {string} [params.sessionId] - Filter by session
 * @param {number} [params.limit=50] - Number of results
 * @param {number} [params.offset] - Pagination offset
 * @returns {Promise<Object>}
 */
export const getFiles = async ({ userId, sessionId, limit = 50, offset } = {}) => {
    const params = {
        user_id: userId,
        session_id: sessionId,
        limit,
        offset,
    };
    const response = await axiosInstance.get('/files', { params });
    console.log(response.data);
    return response.data;
};

export const getFile = async (fileId) => {
    const response = await axiosInstance.get(`/files/${fileId}`);
    return response.data;
};

export const deleteFile = async (fileId) => {
    const response = await axiosInstance.delete(`/files/${fileId}`);
    return response.data;
};

// --- Voice Transcription ---

/**
 * Transcribe voice/audio file
 * @param {Blob|File} audioFile 
 * @returns {Promise<Object>}
 */
export const transcribeVoice = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const response = await axiosInstance.post('/voice/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// --- Medical Report Generation ---

/**
 * Generate a comprehensive patient report with file uploads
 * @param {FormData} formData - FormData containing files and patient info
 * @returns {Promise<Object>}
 */
export const generatePatientReport = async (formData) => {
    const token = localStorage.getItem('accessToken');
    const baseURL = axiosInstance.defaults.baseURL || '';
    const url = `${baseURL.replace(/\/$/, '')}/report/patient/upload-and-analyze`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            errorData = { message: errorText || response.statusText };
        }
        throw errorData;
    }

    return response.json();
};

// --- Report Management ---

export const getReports = async () => {
    const response = await axiosInstance.get('/reports');
    return response.data;
};

export const getReport = async (reportId) => {
    const response = await axiosInstance.get(`/reports/${reportId}`);
    return response.data;
};

export const deleteReport = async (reportId) => {
    const response = await axiosInstance.delete(`/reports/${reportId}`);
    return response.data;
};

// --- Report-Based Chat ---

export const startReportChat = async (reportId, userId, initialQuestion) => {
    const response = await axiosInstance.post(`/report/${reportId}/chat/start`, {
        user_id: userId,
        initial_question: initialQuestion
    });
    return response.data;
};

export const sendChatMessage = async (sessionId, message, userId) => {
    const response = await axiosInstance.post(`/report/chat/${sessionId}/message`, {
        message,
        user_id: userId
    });
    return response.data;
};

export const getReportChats = async (reportId, userId) => {
    const params = userId ? { user_id: userId } : {};
    const response = await axiosInstance.get(`/report/${reportId}/chats`, { params });
    return response.data;
};

export const getChatSession = async (sessionId, userId) => {
    const params = userId ? { user_id: userId } : {};
    const response = await axiosInstance.get(`/report/chat/${sessionId}`, { params });
    return response.data;
};

// --- General Chat ---

export const sendGeneralChat = async (message, sessionId, model) => {
    const response = await axiosInstance.post('/chat', {
        message,
        session_id: sessionId,
        model
    });
    return response.data;
};

export const getGeneralSessions = async () => {
    const response = await axiosInstance.get('/chat/sessions');
    return response.data;
};

export const getGeneralChatSession = async (sessionId) => {
    const response = await axiosInstance.get(`/chat/session/${sessionId}`);
    return response.data;
};

// --- Session Management ---

export const createSession = async (userId) => {
    const response = await axiosInstance.post('/session/create', { user_id: userId });
    return response.data;
};

export const getSessionInfo = async (sessionId) => {
    const response = await axiosInstance.get(`/session/${sessionId}/info`);
    return response.data;
};

export const getUserSessions = async (userId) => {
    const response = await axiosInstance.get(`chat/sessions`);
    return response.data;
};

export const updateSessionTopic = async (sessionId, userId, newTopic) => {
    const response = await axiosInstance.put(`/session/${sessionId}/topic`, {
        user_id: userId,
        new_topic: newTopic
    });
    return response.data;
};

// --- Chat Deletion (Unified if endpoints match, but prompts show different paths? No, wait) ---
// Endpoint 13: DELETE /chat/session/{session_id}
// Endpoint 14: DELETE /chat/user/{user_id}/history
// These seem general.

export const deleteChatSession = async (sessionId) => {
    const response = await axiosInstance.delete(`/chat/session/${sessionId}`);
    return response.data;
};

export const deleteUserChatHistory = async (userId) => {
    const response = await axiosInstance.delete(`/chat/user/${userId}/history`);
    return response.data;
};
