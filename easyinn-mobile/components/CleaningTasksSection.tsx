import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { Feather, MaterialCommunityIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import TaskCard from './TaskCard';
import { CleaningTask } from '../lib/types';

interface CleaningTasksSectionProps {
  checkoutTasks: CleaningTask[];
  currentTasks: CleaningTask[];
  zoneTasks: CleaningTask[];
  otherTasks: CleaningTask[];
  isDashBoard?: boolean;
}

const initialLayout = { width: Dimensions.get('window').width };

const CleaningTasksSection: React.FC<CleaningTasksSectionProps> = ({
  checkoutTasks,
  currentTasks,
  zoneTasks,
  otherTasks,
  isDashBoard = false,
}) => {
  const [index, setIndex] = useState(0);

  const tabsConfig = [
    {
      key: 'checkout',
      title: 'Выезд',
      icon: 'log-out',
      tasks: checkoutTasks,
      getColor: (task: CleaningTask) =>
        task.is_guest_checked_out ? '#fee2e2' : '#e5e7eb',
      emptyText: 'Нет задач уборки после выезда.',
    },
    {
      key: 'current',
      title: 'Текущая',
      icon: 'bed-empty',
      tasks: currentTasks,
      getColor: () => '#fef3c7',
      emptyText: 'Нет текущих задач уборки.',
    },
    {
      key: 'zones',
      title: 'Зоны',
      icon: 'home',
      tasks: zoneTasks,
      getColor: () => '#fef3c7',
      emptyText: 'Нет задач уборки зон.',
    },
    {
      key: 'other',
      title: 'Другое',
      icon: 'boxes',
      tasks: otherTasks,
      getColor: () => '#fef3c7',
      emptyText: 'Нет других задач.',
    },
  ];

  const routes = tabsConfig.map((tab) => ({
    key: tab.key,
    title: tab.title,
  }));


  const CheckoutRoute = () => {
    return (
      <View style={styles.sceneContainer}>
        <ScrollView 
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        >
          {checkoutTasks.length > 0 ? (
            checkoutTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                cardColor={tabsConfig[0].getColor(task)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{tabsConfig[0].emptyText}</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const CurrentRoute = () => {
    return (
      <View style={styles.sceneContainer}>
        <ScrollView 
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        >
          {currentTasks.length > 0 ? (
            currentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                cardColor={tabsConfig[1].getColor(task)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{tabsConfig[1].emptyText}</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const ZonesRoute = () => {

    return (
      <View style={styles.sceneContainer}>
        <ScrollView 
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        >
          {zoneTasks.length > 0 ? (
            zoneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                cardColor={tabsConfig[2].getColor(task)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{tabsConfig[2].emptyText}</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const OtherRoute = () => {

    return (
      <View style={styles.sceneContainer}>
        <ScrollView 
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
        >
          {otherTasks.length > 0 ? (
            otherTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                cardColor={tabsConfig[3].getColor(task)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{tabsConfig[3].emptyText}</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderScene = SceneMap({
    checkout: CheckoutRoute,
    current: CurrentRoute,
    zones: ZonesRoute,
    other: OtherRoute,
  });

  const renderIcon = (iconName: string, focused: boolean) => {
    const color = focused ? '#2563EB' : '#6B7280';
    const size = 18;

    try {
      switch (iconName) {
        case 'log-out':
          return <Feather name="log-out" size={size} color={color} />;
        case 'bed-empty':
          return <MaterialCommunityIcons name="bed-empty" size={size} color={color} />;
        case 'home':
          return <Entypo name="home" size={size} color={color} />;
        case 'boxes':
          return <FontAwesome5 name="boxes" size={size} color={color} />;
        default:
          // Fallback иконка
          return <Feather name="circle" size={size} color={color} />;
      }
    } catch (error) {
      console.log('Icon render error:', error);
      return <Feather name="circle" size={size} color={color} />;
    }
  };


const CustomTabBar = ({ navigationState, jumpTo }: any) => {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1 }}>
      {navigationState.routes.map((route: any, i: number) => {
        const focused = navigationState.index === i;
        const tab = tabsConfig.find((t) => t.key === route.key);

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => jumpTo(route.key)}
            style={{ flex: 1, padding: 10, alignItems: 'center' }}
          >
            {tab?.icon && renderIcon(tab.icon, focused)}
            <Text style={{ color: focused ? '#2563EB' : '#6B7280' }}>
              {tab?.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


  return (
    <View style={styles.container}>
      {isDashBoard && (
        <Text style={styles.header}>Последние задачи по уборке</Text>
      )}
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={CustomTabBar}
          lazy={false}
          swipeEnabled={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
    marginHorizontal: 16,
    color: '#111827',
  },
  tabViewContainer: {
    flex: 1,
      minHeight: 400,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    width: 'auto',
    minWidth: 90,
    paddingHorizontal: 8,
  },
  indicator: {
    backgroundColor: '#2563EB',
    height: 3,
    borderRadius: 1.5,
  },
  tabLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    minWidth: 80,
    minHeight: 44,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  taskList: {
    padding: 12,
    flexGrow: 1,
    minHeight: 300,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default CleaningTasksSection;