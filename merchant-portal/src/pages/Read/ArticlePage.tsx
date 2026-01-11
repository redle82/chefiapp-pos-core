import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FoundingPPVista } from './content/FoundingPPVista';
import { OperationalHospitality } from './content/OperationalHospitality';
import { AntiMarketing } from './content/AntiMarketing';

export const ArticlePage = () => {
    const { slug } = useParams();

    // Registry of articles
    // In a real CMS, this would be a fetch. For now, it's a strategic hardcode for speed/SEO.
    const articles: Record<string, React.ReactNode> = {
        'founding-ppvista': <FoundingPPVista />,
        'operational-hospitality': <OperationalHospitality />,
        'anti-marketing': <AntiMarketing />
    };

    const content = articles[slug || ''];

    if (!content) {
        return <Navigate to="/read" replace />;
    }

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
            {content}
        </div>
    );
};
