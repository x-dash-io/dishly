import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { FocusAwareStatusBar } from '../../../src/components/ui/FocusAwareStatusBar';

export default function TabsLayout() {
  return (
    <>
      <FocusAwareStatusBar style="light" />
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AppIcon name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <AppIcon name="explore" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tabBarButton: (props: any) => (
            <TouchableOpacity 
              {...props} 
              style={[props.style, styles.createButtonContainer]}
              activeOpacity={0.8}
            >
              <View style={styles.createButton}>
                <AppIcon name="add" size={32} color={COLORS.textInverse} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <AppIcon name="saved" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" size={22} color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.navDark,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
  },
  createButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 16, // Rounded square
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for "raised" look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
