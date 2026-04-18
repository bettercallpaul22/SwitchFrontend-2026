import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Zap, ThumbsUp } from 'lucide-react-native';
import { BaseBottomSheet } from './BaseBottomSheet';
import { appColors } from '../../theme/colors';

type RideCompletedSheetProps = {
  visible: boolean;
  ride: {
    id: string;
    passengerName: string;
    pickupAddress: string;
    destinationAddress: string;
    tripDuration: string;
    tripDistance: string;
    fare: number;
    currency: string;
  } | null;
  onRatePassenger?: () => void;
  onClose: () => void;
  isLoading?: boolean;
};

/**
 * Sheet displayed after ride completion
 * Shows trip summary, earnings, and option to rate passenger
 */
export const RideCompletedSheet = ({
  visible,
  ride,
  onRatePassenger,
  onClose,
  isLoading = false
}: RideCompletedSheetProps) => {
  if (!ride) return null;

  return (
    <BaseBottomSheet visible={visible}>
      <View style={styles.container}>
        {/* Completion Badge */}
        <View style={styles.completionBadge}>
          <Text style={styles.completionText}>✓ Trip Completed</Text>
        </View>

        {/* Passenger */}
        <View style={styles.passengerSection}>
          <Text style={styles.passengerName}>{ride.passengerName}</Text>
          <View style={styles.ratingContainer}>
            <ThumbsUp size={16} color={appColors.primary} />
            <Text style={styles.ratingText}>Rate Passenger</Text>
          </View>
        </View>

        {/* Trip Details Card */}
        <View style={styles.detailsCard}>
          {/* Pickup */}
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, { backgroundColor: '#34C759' }]}>
              <MapPin size={16} color={appColors.surfaceLight} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {ride.pickupAddress}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.verticalDivider} />

          {/* Destination */}
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, { backgroundColor: '#FF3B30' }]}>
              <MapPin size={16} color={appColors.surfaceLight} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {ride.destinationAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Clock size={18} color={appColors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{ride.tripDuration}</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <MapPin size={18} color={appColors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{ride.tripDistance}</Text>
            </View>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Ride Fare</Text>
            <Text style={styles.earningsValue}>
              {ride.currency} {ride.fare.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rateButton]}
            disabled={isLoading || !onRatePassenger}
            onPress={onRatePassenger || onClose}
          >
            <ThumbsUp size={18} color={appColors.primary} />
            <Text style={styles.rateButtonText}>
              {onRatePassenger ? 'Rate Passenger' : 'Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.closeButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              {isLoading ? 'Loading...' : 'Done'}
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
  },
  completionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  passengerSection: {
    marginBottom: 16,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.textDark,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: appColors.primary,
  },
  detailsCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: appColors.textDark,
  },
  verticalDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: appColors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.primary,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#D4E7F5',
    marginHorizontal: 8,
  },
  earningsCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    color: appColors.textDark,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F57F17',
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateButton: {
    backgroundColor: '#EBF7FF',
    flexDirection: 'row',
    gap: 8,
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.primary,
  },
  closeButton: {
    backgroundColor: appColors.primary,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.surfaceLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
