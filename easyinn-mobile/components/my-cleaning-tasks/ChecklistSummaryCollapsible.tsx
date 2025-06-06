import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ChecklistSummary = Record<string, Record<string, { total: number }>>;

interface ChecklistSummaryCollapsibleProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  checklistSummary: ChecklistSummary;
  sortedKeys: string[];
}

const ChecklistSummaryCollapsible: React.FC<ChecklistSummaryCollapsibleProps> = ({
  isOpen,
  onToggle,
  checklistSummary,
  sortedKeys,
}) => {
  const handleToggle = () => {
    onToggle(!isOpen);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.trigger}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Сводка по уборкам</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#374151" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.content}>
          {Object.keys(checklistSummary).length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {sortedKeys.map((cleaningTypeDisplay, index) => (
                <View 
                  key={cleaningTypeDisplay} 
                  style={[
                    styles.cleaningTypeContainer,
                    index === sortedKeys.length - 1 && styles.lastItem
                  ]}
                >
                  <View style={styles.cleaningTypeHeader}>
                    <Ionicons 
                      name="pricetag-outline" 
                      size={18} 
                      color="#374151" 
                      style={styles.tagIcon}
                    />
                    <Text style={styles.cleaningTypeTitle}>
                      {cleaningTypeDisplay}
                    </Text>
                  </View>
                  
                  <View style={styles.checklistItemsContainer}>
                    {Object.keys(checklistSummary[cleaningTypeDisplay]).map(checklistNames => (
                      <View 
                        key={`${cleaningTypeDisplay}-${checklistNames}`}
                        style={styles.checklistItem}
                      >
                        <Text style={styles.checklistText}>
                          {checklistNames}: 
                          <Text style={styles.checklistCount}>
                            {' '}{checklistSummary[cleaningTypeDisplay][checklistNames].total}
                          </Text>
                          {' '}номеров
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>
              Нет задач с привязанными чек-листами.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cleaningTypeContainer: {
    marginBottom: 12,
  },
  lastItem: {
    marginBottom: 0,
  },
  cleaningTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagIcon: {
    marginRight: 8,
  },
  cleaningTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  checklistItemsContainer: {
    marginLeft: 16,
  },
  checklistItem: {
    marginBottom: 4,
  },
  checklistText: {
    fontSize: 16,
    color: '#4B5563',
  },
  checklistCount: {
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
});

export default ChecklistSummaryCollapsible;