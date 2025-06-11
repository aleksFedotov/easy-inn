import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTaskDetails } from '@/hooks/housekeeping/details/useTaskDetailsData';
import { useTaskActions } from '@/hooks/housekeeping/details/useTaskActions';
import { useChecklistLogic } from '@/hooks/housekeeping/details/useChecklistLogic';
import { TaskHeader } from '@/components/housekeeping/details/TaskHeader';
import { TaskInfo } from '@/components/housekeeping/details/TaskInfo';
import { ProgressCircle } from '@/components/housekeeping/details/ProgressCircle';
import ChecklistCardList from '@/components/housekeeping/ChecklistCardList';
import { TaskActionsFooter } from '@/components/housekeeping/details/TaskFooter';
import AuthRequiredMessage from '@/components/AuthRequiredMessage';
// import { ErrorMessage } from '@/components/ErrorMessage';
import { Checklist, ChecklistProgress } from '@/lib/types';
import { CLEANICNG_STATUSES, USER_ROLES } from '@/lib/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
type CleaningStatus = typeof CLEANICNG_STATUSES[keyof typeof CLEANICNG_STATUSES]


export default function CleaningTaskDetailsPage() {
    const { id: taskId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const { taskDetails, isLoading: isTaskLoading, fetchTaskDetails } = useTaskDetails(taskId);
    
    const { 
        isActionLoading,
        startCleaning, 
        finishCleaning, 
        startInspection,
        finishInspection, 
        toggleRush 
    } = useTaskActions(taskId, fetchTaskDetails, router);

    const checklistData: Checklist[] = useMemo(() => (taskDetails?.checklist_data as Checklist[] | undefined) || [], [taskDetails]);

    const {
        isChecklistComplete,
        totalProgress,
        updateChecklist
    } = useChecklistLogic(checklistData);

    const handleChecklistChange = useCallback((checklistId: number, progress: ChecklistProgress) => {
        updateChecklist((prev) => ({
            ...prev,
            [checklistId]: progress
        }));
    }, [updateChecklist]);

    const shouldRenderChecklist = (role : UserRole, status:CleaningStatus) => {
        if (role === USER_ROLES.HOUSEKEEPER) {
            return status !== CLEANICNG_STATUSES.ASSIGNED;
        }
        return status !== CLEANICNG_STATUSES.WAITING_CHECK;
    };


    const handleBackPress = () => {
        router.back();
    };

    if (isAuthLoading || isTaskLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!isAuthenticated || !user) {
        return <AuthRequiredMessage />;
    }

  
    if (!taskDetails) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>Задача не найдена.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleBackPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color="#6b7280" style={styles.backIcon} />
                    <Text style={styles.backText}>Назад к списку задач</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <TaskHeader task={taskDetails} />

                    <View style={styles.cardContent}>
                        <TaskInfo task={taskDetails} />

                        <View style={styles.progressContainer}>
                            <ProgressCircle progress={totalProgress} />
                        </View>
                        
                        {shouldRenderChecklist(user.role, taskDetails.status) && checklistData.map((checklist) => (
                            <ChecklistCardList
                                key={checklist.id}
                                checklist={checklist}
                                onChange={handleChecklistChange}
                            />
                        ))}
                    </View>
                    
                    <TaskActionsFooter
                        user={user}
                        task={taskDetails}
                        isChecklistComplete={isChecklistComplete}
                        isLoading={isActionLoading}
                        actions={{
                            onStart: startCleaning,
                            onFinish: finishCleaning,
                            onStartInspection: startInspection,
                            onInspect: finishInspection,
                            onToggleRush: () => toggleRush(taskDetails.is_rush),
                        }}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    backIcon: {
        marginRight: 8,
    },
    backText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardContent: {
        padding: 16,
        gap: 24,
    },
    progressContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    notFoundContainer: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    notFoundText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
});