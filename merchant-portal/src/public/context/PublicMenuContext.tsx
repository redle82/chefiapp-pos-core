import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useProducts } from '../../cinematic/context/ProductContext';
// import { useStaff } from '../../cinematic/context/StaffContext'; 

// Define the shape of the Public Menu Data
interface PublicMenuData {
    storeName: string;
    categories: string[];
    products: any[]; // Using the Product type from ProductContext
    isLoading: boolean;
}

const PublicMenuContext = createContext<PublicMenuData | undefined>(undefined);

export const PublicMenuProvider: React.FC<{ children: ReactNode; slug?: string }> = ({ children, slug }) => {
    // Hack: slug is currently unused but kept for interface consistency
    console.log('PublicMenuProvider mounted for slug:', slug);

    const { products } = useProducts();

    // Removed StaffContext usage for now to fix build/circular/type issues.
    // We will assume identity is static or passed via props later.

    // Derive categories from products
    const categories: string[] = useMemo(() => {
        const cats = new Set<string>();
        products.forEach((p: any) => {
            if (typeof p.category === 'string') cats.add(p.category);
        });
        return Array.from(cats);
    }, [products]);

    // Mock Identity (since we don't have a unified Store Identity context yet besides Onboarding contracts)
    // We'll read from localStorage or default.
    const storeName = "ChefIApp Bistro";

    const value = {
        storeName,
        categories,
        products,
        isLoading: false,
    };

    return (
        <PublicMenuContext.Provider value={value}>
            {children}
        </PublicMenuContext.Provider>
    );
};

export const usePublicMenu = () => {
    const context = useContext(PublicMenuContext);
    if (!context) {
        throw new Error('usePublicMenu must be used within a PublicMenuProvider');
    }
    return context;
};
