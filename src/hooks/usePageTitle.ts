import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/auth': 'Sign In',
    '/trackers': 'Applications',
    '/interview-practice': 'Interview Practice',
    '/interview-feedback': 'Interview Feedback',
    '/resume': 'Resume',
    '/meeting-hub': 'Interviews',
    '/connections': 'Network',
    '/dream-companies': 'Watchlist',
    '/job-search': 'Discover',
    '/application-copilot': 'Copilot',
    '/strategy-guide': 'Playbook',
    '/growth': 'Analytics',
    '/settings': 'Settings',
    '/support': 'Support',
};

export const usePageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        const title = pageTitles[path] || 'JobOS';
        document.title = `${title} | JobOS`;
    }, [location]);
};

