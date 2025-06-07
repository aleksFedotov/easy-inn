import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressCircleProps {
  progress: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ progress }) => {
    const roundedProgress = Math.round(progress);
    const size = 128;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (roundedProgress / 100) * circumference;

    return (
        <View style={styles.container} accessibilityLabel={`Прогресс выполнения: ${roundedProgress}%`}>
            <View style={styles.circleContainer}>
                <Svg width={size} height={size} style={styles.svg}>
                    {/* Фоновый круг */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Прогресс-круг */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#0070f3"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </Svg>
                <View style={styles.textContainer}>
                    <Text style={styles.progressText}>{roundedProgress}%</Text>
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
    svg: {
        position: 'absolute',
    },
    textContainer: {
        position: 'absolute',
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