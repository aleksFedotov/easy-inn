import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressCircleProps {
  progress: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ progress }) => {
    const roundedProgress = Math.round(progress);
    
    return (
        <View style={styles.container} accessibilityLabel={`Прогресс выполнения: ${roundedProgress}%`}>
            <View style={styles.circleContainer}>
                <View style={styles.progressCircle}>
                    <View style={styles.textContainer}>
                        <Text style={styles.progressText}>{roundedProgress}%</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.labelText}>
                Общий прогресс
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 128,
        alignSelf: 'center',
    },
    circleContainer: {
        position: 'relative',
        width: 128,
        height: 128,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCircle: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 8,
        borderColor: '#e5e7eb',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    progressText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0c0a09',
        textAlign: 'center',
    },
    labelText: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
});