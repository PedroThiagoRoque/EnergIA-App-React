export interface ApiConfig {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface ApiError {
    message: string;
    code: string;
    status: number;
    details?: Record<string, unknown>;
}

export enum StorageKeys {
    ACCESS_TOKEN = 'auth.access_token',
    REFRESH_TOKEN = 'auth.refresh_token',
    USER_DATA = 'auth.user_data',
    TOKEN_EXPIRES_AT = 'auth.token_expires_at',
    AUTH_COOKIE = 'auth.cookie',
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: string[];
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    cookie?: string;
}

export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}

export interface RefreshTokenResponse {
    tokens: AuthTokens;
}

// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: 'info' | 'warning' | 'success' | 'error';
}

// Chat Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatResponse {
    response: string;
    assistantType?: string;
}

export interface Icebreaker {
    id: string;
    text: string;
    category?: string;
}

export interface IcebreakersResponse {
    icebreakers: Icebreaker[];
    dailyTip?: string;
}

// Editor Types
export interface EditorPrompt {
    prompt: string;
    context?: string;
    temperature?: number;
}

export interface EditorResponse {
    content: string;
    model: string;
    usage?: {
        tokens: number;
    };
}

// Admin Types
export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalMessages: number;
    serverHealth: 'healthy' | 'degraded' | 'down';
}