import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerModalProps {
  visible: boolean;
  date: Date;
  onSelect: (date: Date) => void;
  onCancel: () => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  date,
  onSelect,
  onCancel,
}) => {
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        onSelect(selectedDate);
      } else {
        onCancel();
      }
    } else if (selectedDate) {
      onSelect(selectedDate);
    }
  };

  if (Platform.OS === 'android') {
    return visible ? (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={handleDateChange}
      />
    ) : null;
  }

  // iOS Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonText}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Выберите дату</Text>
            <TouchableOpacity 
              onPress={() => onSelect(date)} 
              style={styles.button}
            >
              <Text style={[styles.buttonText, styles.confirmButton]}>Готово</Text>
            </TouchableOpacity>
          </View>
          
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            style={styles.datePicker}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  confirmButton: {
    fontWeight: 'bold',
  },
  datePicker: {
    height: 200,
  },
});

export default DatePickerModal;