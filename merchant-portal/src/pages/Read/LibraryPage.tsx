import React from 'react';
import { Link } from 'react-router-dom';

export const LibraryPage = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' }}>
                    Sovereign Hospitality<br /><span style={{ color: '#32d74b' }}>Research Hub</span>
                </h1>
                <p style={{ fontSize: '20px', opacity: 0.6, lineHeight: '1.6' }}>
                    Conceitos profundos sobre operação, comportamento humano<br />e a realidade das cozinhas profissionais.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                <ArticleCard
                    slug="founding-ppvista"
                    title="O Manifesto PPVista: Por que KPIs tradicionais falham"
                    excerpt="A maioria dos softwares mede o que já aconteceu. O PPVista arquiteta o comportamento antes dele acontecer."
                    tag="Framework"
                    readTime="5 min"
                />
            </div>
        </div>
    );
};

const ArticleCard = ({ slug, title, excerpt, tag, readTime }: { slug: string, title: string, excerpt: string, tag: string, readTime: string }) => (
    <Link to={`/read/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <article className="hover-lift" style={{
            padding: '32px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.2s'
        }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '16px' }}>
                <span style={{ color: '#32d74b', opacity: 1 }}>{tag}</span>
                <span>•</span>
                <span>{readTime}</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#f5f5f7' }}>{title}</h2>
            <p style={{ fontSize: '16px', opacity: 0.6, lineHeight: '1.6', color: '#aaa' }}>{excerpt}</p>
        </article>
    </Link>
);
