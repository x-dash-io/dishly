import React, { useRef, useMemo, useCallback } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';

export default function TabsLayout() {
  const router = useRouter();
  const createSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['28%'], []);

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  return (
    <>
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
                onPress={() => createSheetRef.current?.present()}
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

      {/* Create mode chooser */}
      <BottomSheetModal
        ref={createSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: COLORS.border }}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>What would you like to create?</Text>
          <View style={styles.sheetOptionsRow}>
            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.8}
              onPress={() => {
                createSheetRef.current?.dismiss();
                router.push('/create');
              }}
            >
              <View style={[styles.optionIconBg, { backgroundColor: COLORS.primary + '22' }]}>
                <AppIcon name="create" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.optionTitle}>Create Recipe</Text>
              <Text style={styles.optionSubtitle}>Step-by-step wizard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.8}
              onPress={() => {
                createSheetRef.current?.dismiss();
                router.push('/ai-generate');
              }}
            >
              <View style={[styles.optionIconBg, { backgroundColor: COLORS.aiPurple + '22' }]}>
                <AppIcon name="aiGenerate" size={28} color={COLORS.aiPurple} />
              </View>
              <Text style={[styles.optionTitle, { color: COLORS.aiPurple }]}>✦ AI Generate</Text>
              <Text style={styles.optionSubtitle}>From fridge or text</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
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
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sheetBg: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
  },
  sheetContent: {
    padding: 24,
    paddingTop: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  sheetOptionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sheetOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
