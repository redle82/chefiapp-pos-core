import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Users, Info } from 'lucide-react';
import PublicLayout from '../PublicLayout';
import OptionCard from '../components/OptionCard';
import { Typography, Spacing, Colors } from '../../../ui/design-system/tokens';
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

interface PublicHomeProps {
    restaurantName: string;
    description: string;
    onSelectOption: (option: 'menu' | 'staff' | 'contact') => void;
}

const PublicHome: React.FC<PublicHomeProps> = ({ restaurantName, description, onSelectOption }) => {
    return (
        <PublicLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', marginBottom: Spacing['3xl'] }}
            >
                <h1 style={{
                    ...Typography.displayLarge,
                    background: 'linear-gradient(135deg, #FFF 0%, #CCC 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: Spacing.sm
                }}>
                    {restaurantName}
                </h1>
                <p style={{ ...Typography.uiLarge, color: Colors.text.secondary, maxWidth: '600px', margin: '0 auto' }}>
                    {description}
                </p>
            </motion.div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: Spacing.xl,
                maxWidth: '1000px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* OPTION 1: CUSTOMER */}
                <OptionCard
                    title={OSCopy.menu.airlock.viewMenu}
                    description={OSCopy.menu.airlock.viewMenuDesc}
                    icon={Utensils}
                    color="primary"
                    onClick={() => onSelectOption('menu')}
                    delay={0.1}
                />

                {/* OPTION 2: STAFF */}
                <OptionCard
                    title={OSCopy.menu.airlock.staffArea}
                    description={OSCopy.menu.airlock.staffAreaDesc}
                    icon={Users}
                    color="secondary"
                    onClick={() => onSelectOption('staff')}
                    delay={0.2}
                />

                {/* OPTION 3: INFO */}
                <OptionCard
                    title={OSCopy.menu.airlock.info}
                    description={OSCopy.menu.airlock.infoDesc}
                    icon={Info}
                    color="info"
                    onClick={() => onSelectOption('contact')}
                    delay={0.3}
                />
            </div>
        </PublicLayout>
    );
};

export default PublicHome;
