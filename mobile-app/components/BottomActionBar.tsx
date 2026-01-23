import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

interface Action {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
    icon?: string; // Add icon support later if needed
    disabled?: boolean;
}

interface BottomActionBarProps {
    primary: Action;
    secondary?: Action;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({ primary, secondary }) => {
    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {secondary && (
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryBtn, secondary.variant === 'destructive' && styles.destructiveBtn]}
                        onPress={secondary.onPress}
                        disabled={secondary.disabled}
                    >
                        <Text style={[styles.text, styles.secondaryText, secondary.variant === 'destructive' && styles.destructiveText]}>
                            {secondary.label}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.primaryBtn,
                        secondary ? styles.flexGrow : styles.fullWidth,
                        primary.disabled && styles.disabledBtn,
                        primary.variant === 'destructive' && styles.destructiveBtn
                    ]}
                    onPress={primary.onPress}
                    disabled={primary.disabled}
                >
                    <Text style={[styles.text, primary.variant === 'destructive' && styles.destructiveText]}>{primary.label}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a0a0a', // Match screen background or elevate?
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Safe Area bottom
        paddingTop: 16,
        paddingHorizontal: 16,
        zIndex: 1000 // Ensure on top
    },
    container: {
        flexDirection: 'row',
        gap: 12,
        height: 56, // Fixed height for standard alignment
    },
    button: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    primaryBtn: {
        backgroundColor: '#d4a574', // Brand Primary
        shadowColor: "#d4a574",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    secondaryBtn: {
        backgroundColor: '#333',
        width: '30%', // Approx width for "Cancel" or "Edit"
    },
    destructiveBtn: {
        backgroundColor: '#330000',
        borderWidth: 1,
        borderColor: '#ff4444'
    },
    disabledBtn: {
        backgroundColor: '#333',
        opacity: 0.5
    },
    flexGrow: {
        flex: 1,
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000', // Primary text color on gold
    },
    secondaryText: {
        color: '#fff',
    },
    destructiveText: {
        color: '#ff4444'
    }
});
