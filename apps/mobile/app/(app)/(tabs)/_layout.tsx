import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
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
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.fabWrapper}
                activeOpacity={0.85}
                onPress={() => setShowCreateModal(true)}
              >
                <View style={styles.fab}>
                  <AppIcon name="add" size={28} color={COLORS.textInverse} />
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

      {/* Create Modal — bottom sheet style */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowCreateModal(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
            onPress={() => { /* stops backdrop tap from propagating through the sheet */ }}
          >
            {/* Handle */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>What would you like to create?</Text>

            <View style={styles.optionsRow}>
              {/* Human Create */}
              <TouchableOpacity
                style={styles.option}
                activeOpacity={0.8}
                onPress={() => {
                  setShowCreateModal(false);
                  router.push('/create');
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.primary + '1A' }]}>
                  <AppIcon name="create" size={26} color={COLORS.primary} />
                </View>
                <Text style={styles.optionTitle}>Create Recipe</Text>
                <Text style={styles.optionSub}>Step-by-step wizard</Text>
              </TouchableOpacity>

              {/* AI Generate */}
              <TouchableOpacity
                style={[styles.option, styles.optionAI]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowCreateModal(false);
                  router.push('/ai-generate');
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.aiPurple + '1A' }]}>
                  <AppIcon name="aiGenerate" size={26} color={COLORS.aiPurple} />
                </View>
                <Text style={[styles.optionTitle, { color: COLORS.aiPurple }]}>✦ AI Generate</Text>
                <Text style={styles.optionSub}>From fridge or ingredients</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.navDark,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  fabWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  option: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionAI: {
    borderColor: COLORS.aiPurple + '40',
    backgroundColor: COLORS.aiPurpleLight,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  optionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
