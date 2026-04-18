import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, AlertCircle, Clock } from 'lucide-react-native';
import { BaseBottomSheet } from './BaseBottomSheet';
import { appColors } from '../../theme/colors';

type RideOnTripSheetProps = {
  visible: boolean;
  ride: {
    id: string;
    pickupAddress: string;
    destinationAddress: string;
    passengerName: string;
    estimatedTimeRemaining: string;
    estimatedDistance: string;
    currentLocation?: string;
  } | null;
  onEndTrip?: () => void;
  onArrived?: () => void;
  onEmergency?: () => void;
  isLoading?: boolean;
};

/**
 * Sheet displayed during active trip (en_route)
 * Shows passenger info, destination, ETA, and trip controls
 */
export const RideOnTripSheet = ({
  visible,
  ride,
  onEndTrip,
  onArrived,
  onEmergency,
  isLoading = false
}: RideOnTripSheetProps) => {
  if (!ride) return null;

  return (
    <BaseBottomSheet visible={visible}>
      <View style={styles.container}>
        {/* Header with Status */}
        <View style={styles.header}>
          <Text style={styles.title}>Ride in Progress</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En Route</Text>
          </View>
        </View>

        {/* Passenger Info - Compact */}
        <View style={styles.passengerRow}>
          <Text style={styles.passengerLabel}>Passenger</Text>
          <Text style={styles.passengerName}>{ride.passengerName}</Text>
        </View>

        {/* Trip Info Card */}
        <View style={styles.tripCard}>
          {/* Destination */}
          <View style={styles.destinationSection}>
            <View style={styles.destinationIcon}>
              <MapPin size={18} color={appColors.primary} />
            </View>
            <View style={styles.destinationText}>
              <Text style={styles.destinationLabel}>Destination</Text>
              <Text style={styles.destinationAddress} numberOfLines={2}>
                {ride.destinationAddress}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* ETA and Distance */}
          <View style={styles.etaContainer}>
            <View style={styles.etaItem}>
              <Clock size={16} color={appColors.primary} />
              <View style={styles.etaText}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaValue}>{ride.estimatedTimeRemaining}</Text>
              </View>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <MapPin size={16} color={appColors.primary} />
              <View style={styles.etaText}>
                <Text style={styles.etaLabel}>Distance</Text>
                <Text style={styles.etaValue}>{ride.estimatedDistance}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.emergencyButton]}
            disabled={isLoading}
            onPress={onEmergency}
          >
            <AlertCircle size={18} color={appColors.danger} />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.arrivedButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={onArrived}
          >
            <Text style={styles.arrivedButtonText}>
              {isLoading ? 'Loading...' : 'Arrived'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.textDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  passengerLabel: {
    fontSize: 13,
    color: appColors.textMuted,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
    color: appColors.textDark,
  },
  tripCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  destinationSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  destinationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  destinationText: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: appColors.textDark,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaText: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 11,
    color: appColors.textMuted,
  },
  etaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: appColors.textDark,
  },
  etaDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: appColors.danger,
    flexDirection: 'row',
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.danger,
  },
  arrivedButton: {
    backgroundColor: appColors.primary,
  },
  arrivedButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.surfaceLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
