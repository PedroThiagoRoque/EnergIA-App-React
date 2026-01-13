import { User } from '../types';

export interface ParsedUserData {
    user: User | null;
    isAuthenticated: boolean;
}

/**
 * Extracts user data from Dashboard HTML
 * This logic is shared between the User Service (Dashboard retrieval)
 * and Auth Service (Login response parsing) to ensure consistency.
 */
export function parseUserFromDashboardHtml(html: string, fallbackEmail?: string): ParsedUserData {
    console.log('📄 htmlParser: Parsing user data from HTML...');

    let userName = 'Usuário';
    let userEmail = fallbackEmail || '';

    // Extract Name
    const namePatterns = [
        /Olá,\s*([^<,!]+)/i,
        /Hello,\s*([^<,!]+)/i,
        /Bem-vindo,\s*([^<,!]+)/i,
        /Welcome,\s*([^<,!]+)/i,
        /name['"]\s*:\s*['"]([^'"]+)['"]/i, // JS vars check
        /"user":\s*"([^"]+)"/i
    ];

    for (const pattern of namePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            userName = match[1].trim();
            break;
        }
    }

    // Extract UserID and Group from hidden metadata (Backend feature)
    // <div id="user-metadata" style="display:none;" data-userid="<%= userId %>" data-group="<%= group %>"></div>
    let userId = 'dashboard-extracted';
    let userGroup: 'Watts' | 'Volts' = 'Watts';

    const metaMatch = html.match(/data-userid=["']([^"']+)["']/);
    const groupMatch = html.match(/data-group=["'](Watts|Volts)["']/i);

    if (metaMatch && metaMatch[1]) {
        userId = metaMatch[1];
        console.log('✅ htmlParser: Extracted Real UserID:', userId);
    }

    if (groupMatch && groupMatch[1]) {
        userGroup = groupMatch[1] as 'Watts' | 'Volts';
        console.log('✅ htmlParser: Extracted Group:', userGroup);
    } else {
        // Fallback heuristic
        if (html.includes('dashboard_gen') || html.includes('Visualização Genérica')) {
            console.log('⚠️ htmlParser: Group fallback heuristic triggered (Volts)');
            userGroup = 'Volts';
        } else {
            console.log('⚠️ htmlParser: No group found, defaulting to Watts');
        }
    }

    // Extract Email if not provided or if we want to confirm
    const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        userEmail = emailMatch[1];
    }

    console.log('🔍 htmlParser: Final Parsed User:', { userId, userName, userGroup });

    // Check for Auth failure indicators in HTML
    if (html.includes('login') || html.includes('Login')) {
        return { user: null, isAuthenticated: false };
    }

    if (userName !== 'Usuário' || userEmail) {
        return {
            user: {
                id: userId,
                name: userName,
                email: userEmail,
                group: userGroup
            },
            isAuthenticated: true
        };
    }

    return { user: null, isAuthenticated: false };
}
