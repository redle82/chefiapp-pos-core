import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description = 'Faça seu pedido online com rapidez e comodidade.',
    image,
    url,
    siteName = 'ChefIApp'
}) => {
    const fullTitle = `${title} | ${siteName}`;
    const currentUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            {image && <meta property="og:image" content={image} />}
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
};
