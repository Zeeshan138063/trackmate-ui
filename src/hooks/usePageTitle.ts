import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/auth': 'Sign In',
    '/trackers': 'Job Trackers',
    '/interview-practice': 'Interview Practice',
    '/interview-feedback': 'Interview Feedback',
    '/resume-builder': 'Resume Builder',
    '/meeting-hub': 'Meeting Hub',
    '/connections': 'Connections',
    '/dream-companies': 'Dream Companies',
    '/job-search': 'Job Search',
    '/application-copilot': 'Application Copilot',
    '/strategy-guide': 'Strategy Guide',
    '/growth-engine': 'Growth Engine',
    '/settings': 'Account Settings',
    '/support': 'Support Center',
};

export const usePageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        const title = pageTitles[path] || 'CareerPilot AI';
        document.title = `${title} | CareerPilot AI`;
    }, [location]);
};
