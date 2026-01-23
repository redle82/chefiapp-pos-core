import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StyleProp, ViewStyle, TouchableHighlight } from 'react-native';

interface ThumbCardProps {
    onPress?: () => void;
    onLongPress?: () => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    statusColor?: string; // Optional border/status accent
}

export const ThumbCard: React.FC<ThumbCardProps> = ({
    onPress,
    onLongPress,
    children,
    style,
    statusColor
}) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[
                styles.card,
                statusColor && { borderLeftColor: statusColor, borderLeftWidth: 4 },
                style
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1a1a1a', // standard dark bg
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: 80, // Guarantee good hit target
        justifyContent: 'center', // Center content vertically by default check? No, let flex handle it.
        // Shadow/Elevation
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#333'
    }
});
