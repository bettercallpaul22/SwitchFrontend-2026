import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  Briefcase,
  CalendarDays,
  Camera,
  CircleDollarSign,
  CircleUserRound,
  History,
  Inbox,
  LifeBuoy,
  LogOut,
  Music2,
  Target,
  Tv,
  Wallet,
  X
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../components/ui/AppText';

type DriverDrawerProps = {
  visible: boolean;
  onClose: () => void;
  driverName: string;
  driverPhone: string;
  profilePhotoUrl?: string | null;
  onOpenProfile?: () => void;
  onLogout: () => void;
};

type DrawerItemProps = {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  badge?: string;
  onPress?: () => void;
};

const DRAWER_WIDTH = 314;

function DrawerItem({ label, Icon, badge, onPress }: DrawerItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.itemRow, pressed ? styles.pressed : undefined]}>
      <Icon color="#e2e8f0" size={16} />
      <AppText variant="lg" style={styles.itemLabel}>
        {label}
      </AppText>
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="xs" style={styles.badgeText}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function DrawerMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCard}>
      <AppText variant="metric" style={styles.metricValue}>
        {value}
      </AppText>
      <AppText variant="sm" style={styles.metricLabel}>
        {label}
      </AppText>
    </View>
  );
}

export function DriverDrawer({
  visible,
  onClose,
  driverName,
  driverPhone,
  profilePhotoUrl,
  onOpenProfile,
  onLogout
}: DriverDrawerProps) {
  const insets = useSafeAreaInsets();
  const [renderModal, setRenderModal] = useState(visible);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const profileInitials = useMemo(() => {
    return driverName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }, [driverName]);

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      }).start();
      return;
    }

    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 180,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setRenderModal(false);
      }
    });
  }, [translateX, visible]);

  if (!renderModal) {
    return null;
  }

  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX }]
            }
          ]}>
          <SafeAreaView
            edges={['top']}
            style={[
              styles.safeArea,
              {
                paddingTop: 8,
                paddingBottom: Math.max(14, insets.bottom + 10)
              }
            ]}>
          <View style={styles.header}>
            <View style={styles.profileWrap}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileFallback}>
                  <AppText variant="sm" style={styles.profileFallbackText}>
                    {profileInitials || 'DR'}
                  </AppText>
                </View>
              )}
              <View style={styles.profileMeta}>
                <AppText variant="label" style={styles.nameText}>
                  {driverName}
                </AppText>
                <AppText variant="sm" style={styles.phoneText}>
                  {driverPhone}
                </AppText>
              </View>
            </View>

            <Pressable style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : undefined]} onPress={onClose}>
              <X color="#f8fafc" size={18} />
            </Pressable>
          </View>

          <View style={styles.metricsRow}>
            <DrawerMetric value="90%" label="Driver score" />
            <DrawerMetric value="65%" label="Acceptance rate" />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuBlock}>
            <DrawerItem label="Profile" Icon={CircleUserRound} onPress={onOpenProfile} />
            <DrawerItem label="Inbox" Icon={Inbox} badge="10+" />
            <DrawerItem label="Milestones" Icon={Target} />
            <DrawerItem label="Earnings" Icon={CircleDollarSign} />
            <DrawerItem label="Wallet" Icon={Wallet} />
            <DrawerItem label="Trip History" Icon={History} />
            <DrawerItem label="Scheduled rides" Icon={CalendarDays} />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuBlock}>
            <DrawerItem label="Driver Portal" Icon={Briefcase} />
            <DrawerItem label="Contact support" Icon={LifeBuoy} />
          </View>

          <View style={styles.flexSpacer} />
          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <Pressable style={({ pressed }) => [styles.logoutRow, pressed ? styles.pressed : undefined]} onPress={onLogout}>
              <LogOut color="#ef4444" size={17} />
              <AppText variant="lg" style={styles.logoutText}>
                Log out
              </AppText>
            </Pressable>

            <View style={styles.socials}>
              <Camera color="#9ca3af" size={15} />
              <Music2 color="#9ca3af" size={15} />
              <X color="#9ca3af" size={15} />
              <Tv color="#9ca3af" size={15} />
            </View>
          </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#02060a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16
  },
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  profileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  profileFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.75)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileFallbackText: {
    color: '#e2e8f0'
  },
  profileMeta: {
    gap: 1
  },
  nameText: {
    color: '#f8fafc'
  },
  phoneText: {
    color: '#9ca3af'
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1016'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#03231e',
    borderWidth: 1,
    borderColor: 'rgba(6, 95, 70, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  metricValue: {
    color: '#f8fafc'
  },
  metricLabel: {
    color: '#cbd5e1',
    marginTop: 2
  },
  divider: {
    height: 1,
    marginTop: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(71, 85, 105, 0.45)'
  },
  menuBlock: {
    gap: 2
  },
  itemRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  itemLabel: {
    color: '#f1f5f9'
  },
  badge: {
    marginLeft: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 1
  },
  badgeText: {
    color: '#e2e8f0'
  },
  flexSpacer: {
    flex: 1
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoutText: {
    color: '#ef4444'
  },
  socials: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  pressed: {
    opacity: 0.78
  }
});
