import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EmptyStateProps {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    title: string;
    message: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <MaterialIcons name={icon} size={48} color={theme.icon} style={styles.icon} />
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        marginVertical: Spacing.xl,
        minHeight: 150,
    },
    icon: {
        marginBottom: Spacing.md,
        opacity: 0.5,
    },
    title: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    message: {
        fontSize: FontSizes.sm,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});