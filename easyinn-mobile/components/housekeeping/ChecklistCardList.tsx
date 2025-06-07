import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Checklist, ChecklistProgress } from '@/lib/types';

interface CheckboxProps {
    checked: boolean;
    onPress: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress }) => (
    <TouchableOpacity style={[styles.checkbox, checked && styles.checkboxChecked]} onPress={onPress}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
);

interface ChecklistCardListProps {
    checklist: Checklist;
    onChange: (checklistId: number, progress: ChecklistProgress) => void;
}

const ChecklistCardList: React.FC<ChecklistCardListProps> = ({
    checklist,
    onChange
}) => {
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    const [checkedItemIds, setCheckedItemIds] = useState<number[]>([]);

    const toggleCard = () => {
        setIsCardExpanded(!isCardExpanded);
    };

    useEffect(() => {
        onChange(checklist.id, {
            total: checklist.items.length,
            completed: checkedItemIds.length
        });
    }, [checkedItemIds, checklist.id, checklist.items.length, onChange]);

    const handleCheckboxChange = (itemId: number) => {
        setCheckedItemIds((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderChecklistItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.checklistItem}
            onPress={() => handleCheckboxChange(item.id)}
            activeOpacity={0.7}
        >
            <Checkbox
                checked={checkedItemIds.includes(item.id)}
                onPress={() => handleCheckboxChange(item.id)}
            />
            <Text style={[
                styles.itemText,
                checkedItemIds.includes(item.id) && styles.itemTextChecked
            ]}>
                {item.text}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={toggleCard} activeOpacity={0.7}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>{checklist.name}</Text>
                    <ChevronDown
                        size={20}
                        color="#6b7280"
                        style={[
                            styles.chevron,
                            isCardExpanded && styles.chevronRotated
                        ]}
                    />
                </View>
            </TouchableOpacity>
            
            {isCardExpanded && (
                <View style={styles.content}>
                    {checklist.items.length === 0 ? (
                        <Text style={styles.emptyText}>
                            Нет пунктов в этом чек-листе.
                        </Text>
                    ) : (
                        <FlatList
                            data={checklist.items}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderChecklistItem}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#ffffff',
    },
    header: {
        padding: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    chevron: {
        marginLeft: 8,
        transform: [{ rotate: '0deg' }],
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
        fontStyle: 'italic',
        paddingVertical: 16,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
        lineHeight: 24,
    },
    itemTextChecked: {
        textDecorationLine: 'line-through',
        color: '#9ca3af',
    },
});

export default ChecklistCardList;