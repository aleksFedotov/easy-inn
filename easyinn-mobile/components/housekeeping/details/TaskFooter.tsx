import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';
import { CleaningTask, User } from '@/lib/types';

interface TaskActionsFooterProps {
  user: User;
  task: CleaningTask;
  isChecklistComplete: boolean;
  isLoading: boolean;
  actions: {
    onStart: () => void;
    onFinish: () => void;
    onStartInspection: () => void;
    onInspect: () => void;
    onToggleRush: () => void;
  };
}

export const TaskActionsFooter: React.FC<TaskActionsFooterProps> = ({
  user,
  task,
  isChecklistComplete,
  isLoading,
  actions,
}) => {
  const renderButton = (
    onPress: () => void,
    disabled: boolean,
    variant: 'primary' | 'secondary' = 'primary',
    icon: React.ReactNode,
    text: string
  ) => (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {icon}
        <Text style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
          disabled && styles.disabledButtonText
        ]}>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (user.role === USER_ROLES.HOUSEKEEPER) {
    if (task.status === CLEANICNG_STATUSES.ASSIGNED) {
      return (
        <View style={styles.container}>
          {renderButton(
            actions.onStart,
            isLoading,
            'primary',
            isLoading ? (
              <ActivityIndicator size="small" color="white" style={styles.icon} />
            ) : (
              <Feather name='play' size={16} color="white" style={styles.icon} />
            ),
            'Начать уборку'
          )}
        </View>
      );
    }

    if (task.status === CLEANICNG_STATUSES.IN_PROGRESS) {
      return (
        <View style={styles.container}>
          {renderButton(
            actions.onFinish,
            !isChecklistComplete || isLoading,
            'primary',
            isLoading ? (
              <ActivityIndicator size="small" color="white" style={styles.icon} />
            ) : (
              <AntDesign name='checkcircleo' size={16} color="white" style={styles.icon} />

            ),
            'Завершить уборку'
          )}
        </View>
      );
    }
  }

  if ([USER_ROLES.MANAGER, USER_ROLES.FRONT_DESK].includes(user.role)) {
    const canBeChecked = [CLEANICNG_STATUSES.CHECKING, CLEANICNG_STATUSES.COMPLETED].includes(task.status);
    const canBeRushed = CLEANICNG_STATUSES.ASSIGNED === task.status;
    if (task.status === CLEANICNG_STATUSES.WAITING_CHECK) {
      return (
        <View style={styles.container}>
          {renderButton(
            actions.onStartInspection,
            isLoading,
            'primary',
            isLoading ? (
              <ActivityIndicator size="small" color="white" style={styles.icon} />
            ) : (
              <Feather name='play' size={16} color="white" style={styles.icon} />
            ),
            'Начать проверку'
          )}
        </View>
      );
    }
    if(canBeChecked) {

      return (
        <View style={styles.container}>
          {canBeChecked && (
            <View style={styles.buttonWrapper}>
              {renderButton(
                actions.onInspect,
                !isChecklistComplete || isLoading,
                'primary',
                isLoading ? (
                  <ActivityIndicator size="small" color="white" style={styles.icon} />
                ) : (
                  <AntDesign name='checkcircleo' size={16} color="white" style={styles.icon} />
                ),
                'Завершить проверку'
              )}
            </View>
          )}
          {canBeRushed && (
            <View style={styles.buttonWrapper}>
              {renderButton(
                actions.onToggleRush,
                isLoading,
                'secondary',
                isLoading ? (
                  <ActivityIndicator size="small" color="#6b7280" style={styles.icon} />
                ) : (
                  <Octicons name='flame' size={16} color={task.is_rush ? '#ef4444' : '#6b7280'}  style={styles.icon} />
                ),
                task.is_rush ? 'Снять срочность' : 'Пометить как срочную'
              )}
            </View>
          )}
        </View>
      );
    }
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 150,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});