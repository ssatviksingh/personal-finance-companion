import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { GoalScreen } from '../features/goals/GoalScreen';
import { HomeScreen } from '../features/dashboard/HomeScreen';
import { InsightsScreen } from '../features/insights/InsightsScreen';
import { TransactionFormScreen } from '../features/transactions/TransactionFormScreen';
import { TransactionsScreen } from '../features/transactions/TransactionsScreen';
import { getShadow } from '../theme/shadows';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { colors } = useAppTheme();
  const headerShadow =
    Platform.OS === 'ios'
      ? {
          ...getShadow(colors.shadow, 'sm'),
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        }
      : { elevation: 0 };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          ...headerShadow,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700' as const,
          fontSize: 17,
          letterSpacing: -0.35,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 86 : 62,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.35,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            onPress={(e) => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              props.onPress?.(e);
            }}
          />
        ),
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: 'grid-outline',
            Transactions: 'receipt-outline',
            Insights: 'pie-chart-outline',
            Goal: 'trophy-outline',
          };
          const name = map[route.name as keyof MainTabParamList];
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Transactions' }}
      />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      <Tab.Screen name="Goal" component={GoalScreen} options={{ title: 'Savings goal' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { navigationTheme, colors } = useAppTheme();
  const modalHeader = {
    headerStyle: {
      backgroundColor: colors.surface,
    },
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontSize: 17,
      letterSpacing: -0.35,
      color: colors.text,
    },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddTransaction"
          component={TransactionFormScreen}
          options={{
            title: 'New transaction',
            presentation: 'modal',
            ...modalHeader,
          }}
        />
        <Stack.Screen
          name="EditTransaction"
          component={TransactionFormScreen}
          options={{
            title: 'Edit transaction',
            presentation: 'modal',
            ...modalHeader,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
