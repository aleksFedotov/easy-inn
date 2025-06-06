import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProgressCircleProps {
  progress: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ progress }) => {
    const roundedProgress = Math.round(progress);

    return (
        <div className="w-32 mx-auto" aria-label={`Прогресс выполнения: ${roundedProgress}%`}>
            <CircularProgressbar
                value={roundedProgress}
                text={`${roundedProgress}%`}
                styles={buildStyles({
                    textColor: '#0c0a09', 
                    pathColor: '#0070f3', 
                    trailColor: '#e5e7eb', 
                    pathTransitionDuration: 0.5,
                })}
            />
            <p className="text-center mt-3 text-sm font-medium text-gray-600">
                Общий прогресс
            </p>
        </div>
    );
};