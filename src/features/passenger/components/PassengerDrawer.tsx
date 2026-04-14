import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  X,
  ChevronRight,
  Trophy,
  Bell,
  Sparkles,
  MessageCircle,
  Coins,
  CalendarClock,
  Activity,
  Tag,
  HelpCircle,
  CreditCard,
  Heart,
  Pencil,
  Users
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../components/ui/AppText';
import { appColors } from '../../../theme/colors';

type PassengerDrawerProps = {
  visible: boolean;
  onClose: () => void;
  passengerName: string;
  passengerHandle?: string;
  passengerPhone: string;
  profilePhotoUrl?: string | null;
  coinBalance?: number;
  onLogout: () => void;
  onEditProfile?: () => void;
  onCreateFamilyAccount?: () => void;
};

type DrawerItemProps = {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  badge?: string;
  badgeType?: 'dot' | 'pill' | 'chip';
  disabled?: boolean;
  onPress?: () => void;
};

const DRAWER_WIDTH = 314;

function DrawerItem({ label, Icon, badge, badgeType = 'pill', disabled, onPress }: DrawerItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.itemRow, pressed && !disabled ? styles.pressed : undefined]}
    >
      <View style={styles.itemIconWrap}>
        <Icon color={disabled ? '#4b5563' : '#e2e8f0'} size={18} strokeWidth={1.6} />
      </View>

      <AppText variant="lg" style={[styles.itemLabel, disabled && styles.itemLabelDisabled]}>
        {label}
      </AppText>

      <View style={styles.itemRight}>
        {badge && badgeType === 'dot' && (
          <View style={styles.dotBadge} />
        )}
        {badge && badgeType === 'chip' && (
          <View style={styles.chipBadge}>
            <AppText variant="xs" style={styles.chipText}>{badge}</AppText>
          </View>
        )}
        {badge && badgeType === 'pill' && (
          <View style={styles.pillBadge}>
            <AppText variant="xs" style={styles.pillText}>{badge}</AppText>
          </View>
        )}
        <ChevronRight color={disabled ? '#374151' : '#6b7280'} size={16} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="sm" style={styles.sectionHeaderText}>{title}</AppText>
    </View>
  );
}

export function PassengerDrawer({
  visible,
  onClose,
  passengerName,
  passengerHandle,
  passengerPhone,
  profilePhotoUrl,
  coinBalance = 3000,
  onLogout,
  onEditProfile,
  onCreateFamilyAccount
}: PassengerDrawerProps) {
  const insets = useSafeAreaInsets();
  const [renderModal, setRenderModal] = useState(visible);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const profileInitials = useMemo(() => {
    return passengerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }, [passengerName]);

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
      if (finished) setRenderModal(false);
    });
  }, [translateX, visible]);

  if (!renderModal) return null;

  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* Teal Header */}
          <View style={[styles.headerBg, { paddingTop: Math.max(insets.top + 8, 20) }]}>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <X color="#ffffff" size={20} strokeWidth={2.5} />
            </Pressable>

            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <AppText variant="label" style={styles.nameText} numberOfLines={2}>
                  {passengerName}
                </AppText>

                <Pressable
                  style={({ pressed }) => [styles.familyRow, pressed && styles.pressed]}
                  onPress={onCreateFamilyAccount}
                >
                  <Users color="#a7f3d0" size={13} strokeWidth={2} />
                  <AppText variant="sm" style={styles.familyText}>Create Family Account</AppText>
                  <ChevronRight color="#a7f3d0" size={13} strokeWidth={2.5} />
                </Pressable>
              </View>

              <View style={styles.headerRight}>
                <View style={styles.avatarWrap}>
                  {profilePhotoUrl ? (
                    <Image source={{ uri: profilePhotoUrl }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileFallback}>
                      <AppText variant="sm" style={styles.profileFallbackText}>
                        {profileInitials || 'PS'}
                      </AppText>
                    </View>
                  )}
                  <Pressable
                    style={({ pressed }) => [styles.editBadge, pressed && styles.pressed]}
                    onPress={onEditProfile}
                  >
                    <Pencil color="#ffffff" size={10} strokeWidth={2.5} />
                  </Pressable>
                </View>
                {passengerHandle ? (
                  <AppText variant="xs" style={styles.handleText}>@{passengerHandle}</AppText>
                ) : null}
              </View>
            </View>
          </View>

          {/* Scrollable Menu */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={[
              styles.menuContent
            ]}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="FOR MORE VALUE" />

            <DrawerItem label="Rewards" Icon={Trophy} />
            <DrawerItem label="Subscription" Icon={Bell} />
            <DrawerItem label="Challenges" Icon={Sparkles} disabled />

            <SectionHeader title="MY ACCOUNT" />

            <DrawerItem
              label="Messages"
              Icon={MessageCircle}
              badge="•"
              badgeType="dot"
            />
            <DrawerItem
              label="Switch Coins"
              Icon={Coins}
              badge={`Coin Bal: ${coinBalance.toLocaleString()}`}
              badgeType="chip"
            />
            <DrawerItem
              label="Schedule"
              Icon={CalendarClock}
              badge="NEW"
              badgeType="pill"
            />
            <DrawerItem label="My Activity" Icon={Activity} />
            <DrawerItem label="Promocodes" Icon={Tag} />
            <DrawerItem label="F.A.Qs." Icon={HelpCircle} />
            <DrawerItem label="Payments" Icon={CreditCard} />
            <DrawerItem label="Favourites" Icon={Heart} />
          </ScrollView>

          {/* Fixed Logout Footer */}
          <View style={[styles.logoutFooter, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <Pressable
              onPress={onLogout}
              style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
            >
              <View style={styles.itemIconWrap}>
                <X color="#ef4444" size={18} strokeWidth={1.6} />
              </View>
              <AppText variant="lg" style={styles.logoutText}>Logout</AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
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
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 41, 59, 0.6)'
  },

  // ── Header ──────────────────────────────────────────────
  headerBg: {
    backgroundColor: appColors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginLeft: -4
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8
  },
  headerLeft: {
    flex: 1,
    gap: 10,
    paddingTop: 4
  },
  nameText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  familyText: {
    color: '#a7f3d0',
    fontSize: 13
  },
  headerRight: {
    alignItems: 'center',
    gap: 6
  },
  avatarWrap: {
    position: 'relative'
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  profileFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  profileFallbackText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600'
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: appColors.primary
  },
  handleText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    letterSpacing: 0.2
  },

  // ── Menu ────────────────────────────────────────────────
  menuScroll: {
    flex: 1
  },
  menuContent: {
    paddingTop: 6,
    paddingBottom: 12
  },
  logoutFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  logoutRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6
  },
  sectionHeaderText: {
    color: appColors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  itemRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(55, 65, 81, 0.4)'
  },
  itemIconWrap: {
    width: 26,
    alignItems: 'center'
  },
  itemLabel: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 15
  },
  itemLabelDisabled: {
    color: '#4b5563'
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  // Badges
  dotBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444'
  },
  chipBadge: {
    borderRadius: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500'
  },
  pillBadge: {
    borderRadius: 999,
    backgroundColor: '#ef4444',
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  pillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },

  pressed: {
    opacity: 0.72
  }
});