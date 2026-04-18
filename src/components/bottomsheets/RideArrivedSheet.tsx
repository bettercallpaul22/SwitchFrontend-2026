import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, CheckCircle } from 'lucide-react-native';
import { BaseBottomSheet } from './BaseBottomSheet';
import { appColors } from '../../theme/colors';

type RideArrivedSheetProps = {
  visible: boolean;
  ride: {
    id: string;
    destinationAddress: string;
    passengerName: string;
    arrivalType: 'pickup' | 'destination'; // Whether arrived at pickup or final destination
    tripDuration?: string;
    tripDistance?: string;
  } | null;
  onConfirmArrival: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

/**
 * Sheet displayed when driver arrives at pickup or destination
 * Shows confirmation message and trip details
 */
export const RideArrivedSheet = ({
  visible,
  ride,
  onConfirmArrival,
  onCancel,
  isLoading = false
}: RideArrivedSheetProps) => {
  if (!ride) return null;

  const isPickup = ride.arrivalType === 'pickup';

  return (
    <BaseBottomSheet visible={visible}>
      <View style={styles.container}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={56} color={appColors.accent} strokeWidth={1.5} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isPickup ? 'Arrival at Pickup' : 'Arrival at Destination'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {isPickup 
            ? `You've arrived to pick up ${ride.passengerName}`
            : `You've arrived at the destination`
          }
        </Text>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconContainer}>
            <MapPin size={20} color={appColors.primary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>
              {isPickup ? 'Pickup' : 'Destination'}
            </Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {ride.destinationAddress}
            </Text>
          </View>
        </View>

        {/* Trip Details - Conditional */}
        {!isPickup && ride.tripDuration && ride.tripDistance && (
          <View style={styles.tripDetailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{ride.tripDuration}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance Covered</Text>
              <Text style={styles.detailValue}>{ride.tripDistance}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              disabled={isLoading}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Later</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              isLoading && styles.buttonDisabled,
              !onCancel && styles.buttonFullWidth
            ]}
            disabled={isLoading}
            onPress={onConfirmArrival}
          >
            <Text style={styles.confirmButtonText}>
              {isLoading ? 'Loading...' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  successContainer: {
    marginBottom: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: appColors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EBF7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: -4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: appColors.textDark,
    lineHeight: 20,
  },
  tripDetailsCard: {
    width: '100%',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: appColors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.primary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#D4E7F5',
    marginVertical: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.textDark,
  },
  confirmButton: {
    backgroundColor: appColors.accent,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.surfaceLight,
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
