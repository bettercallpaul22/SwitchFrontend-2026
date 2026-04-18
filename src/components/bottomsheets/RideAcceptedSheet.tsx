import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Phone, Clock } from 'lucide-react-native';
import { BaseBottomSheet } from './BaseBottomSheet';
import { appColors } from '../../theme/colors';

type RideAcceptedSheetProps = {
  visible: boolean;
  ride: {
    id: string;
    pickupAddress: string;
    destinationAddress: string;
    passengerName: string;
    passengerPhone: string;
    estimatedPickupTime: string;
    paymentMethod: string;
  } | null;
  onStartTrip: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

/**
 * Sheet displayed when driver accepts a ride and is heading to pickup location
 * Shows pickup/destination addresses, passenger info, and estimated arrival time
 */
export const RideAcceptedSheet = ({
  visible,
  ride,
  onStartTrip,
  onCancel,
  isLoading = false
}: RideAcceptedSheetProps) => {
  const [showCallConfirm, setShowCallConfirm] = useState(false);

  if (!ride) return null;

  return (
    <BaseBottomSheet visible={visible}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Ride Accepted</Text>
        <Text style={styles.subtitle}>Head to pickup location</Text>

        {/* Passenger Info */}
        <View style={styles.passengerCard}>
          <View>
            <Text style={styles.passengerName}>{ride.passengerName}</Text>
            <Text style={styles.passengerRating}>⭐ 4.8</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            disabled={isLoading}
            onPress={() => setShowCallConfirm(true)}
          >
            <Phone size={20} color={appColors.surfaceLight} />
          </TouchableOpacity>
        </View>

        {/* Locations */}
        <View style={styles.locationsContainer}>
          {/* Pickup */}
          <View style={styles.locationItem}>
            <View style={[styles.locationIcon, { backgroundColor: '#34C759' }]}>
              <MapPin size={18} color={appColors.surfaceLight} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {ride.pickupAddress}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Destination */}
          <View style={styles.locationItem}>
            <View style={[styles.locationIcon, { backgroundColor: '#FF3B30' }]}>
              <MapPin size={18} color={appColors.surfaceLight} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {ride.destinationAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Estimated Pickup Time */}
        <View style={styles.estimatedContainer}>
          <Clock size={16} color={appColors.primary} />
          <Text style={styles.estimatedText}>
            Pickup in {ride.estimatedPickupTime}
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentLabel}>Payment</Text>
          <Text style={styles.paymentMethod}>{ride.paymentMethod}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            disabled={isLoading}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.startButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={onStartTrip}
          >
            <Text style={styles.startButtonText}>
              {isLoading ? 'Loading...' : 'Start Trip'}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: appColors.textMuted,
    marginBottom: 16,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: appColors.textDark,
    marginBottom: 4,
  },
  passengerRating: {
    fontSize: 13,
    color: appColors.textMuted,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
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
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  estimatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  estimatedText: {
    fontSize: 13,
    fontWeight: '500',
    color: appColors.primary,
    marginLeft: 8,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  paymentLabel: {
    fontSize: 13,
    color: appColors.textMuted,
  },
  paymentMethod: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.textDark,
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
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.textDark,
  },
  startButton: {
    backgroundColor: appColors.primary,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: appColors.surfaceLight,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
