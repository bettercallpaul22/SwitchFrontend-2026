import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AlarmClock, IdCard, PiggyBank } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { updateDriverProfile } from '../../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { DriverProfileUpdatePayload, DriverUser, EarningPreference } from '../../../types/auth';
import { DriverProfileSectionHeader } from '../components/DriverProfileSectionHeader';

type DriverProfileSetupScreenProps = {
  onBack?: () => void;
};

type ProfileSetupStep = 'driver-information' | 'preference';

type DriverInformationFormValues = {
  idNumber: string;
  driverLicenseUrl: string;
  profilePhotoUrl: string;
  ninSlipUrl: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlateNumber: string;
};

type PreferenceOption = {
  value: EarningPreference;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    value: 'one_time_payment_daily',
    title: 'One-time payment daily',
    subtitle: 'NGN 3,000 daily access fee',
    Icon: AlarmClock
  },
  {
    value: 'commission_based',
    title: 'Commission based',
    subtitle: '15% commission on each ride',
    Icon: PiggyBank
  },
  {
    value: 'subscription',
    title: 'Subscription',
    subtitle: 'Become our partner',
    Icon: IdCard
  }
];

const EMPTY_DRIVER_INFORMATION_VALUES: DriverInformationFormValues = {
  idNumber: '',
  driverLicenseUrl: '',
  profilePhotoUrl: '',
  ninSlipUrl: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleColor: '',
  vehiclePlateNumber: ''
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    return /^https?:\/\/.+/i.test(value.trim());
  } catch {
    return false;
  }
};

const getInitialDriverInformationValues = (driver: DriverUser): DriverInformationFormValues => ({
  idNumber: driver.basicProfile?.idNumber ?? '',
  driverLicenseUrl: driver.basicProfile?.driverLicenseUrl ?? '',
  profilePhotoUrl: driver.basicProfile?.profilePhotoUrl ?? '',
  ninSlipUrl: driver.basicProfile?.ninSlipUrl ?? '',
  vehicleMake: driver.vehicleDetails?.make ?? '',
  vehicleModel: driver.vehicleDetails?.model ?? '',
  vehicleColor: driver.vehicleDetails?.color ?? '',
  vehiclePlateNumber: driver.vehicleDetails?.plateNumber ?? ''
});

const validateDriverInformation = (values: DriverInformationFormValues): string | null => {
  if (!values.idNumber.trim()) {
    return 'Driver license number / NIN is required';
  }

  if (!values.driverLicenseUrl.trim() || !isValidHttpUrl(values.driverLicenseUrl.trim())) {
    return 'Provide a valid Driver\'s License URL';
  }

  if (!values.profilePhotoUrl.trim() || !isValidHttpUrl(values.profilePhotoUrl.trim())) {
    return 'Provide a valid Driver\'s Profile Photo URL';
  }

  if (!values.ninSlipUrl.trim() || !isValidHttpUrl(values.ninSlipUrl.trim())) {
    return 'Provide a valid NIN Slip URL';
  }

  if (
    !values.vehicleMake.trim() ||
    !values.vehicleModel.trim() ||
    !values.vehicleColor.trim() ||
    !values.vehiclePlateNumber.trim()
  ) {
    return 'Fill all vehicle detail fields';
  }

  return null;
};

const buildProfilePayload = (
  values: DriverInformationFormValues,
  selectedPreference: EarningPreference
): DriverProfileUpdatePayload => ({
  basicProfile: {
    idNumber: values.idNumber.trim(),
    driverLicenseUrl: values.driverLicenseUrl.trim(),
    profilePhotoUrl: values.profilePhotoUrl.trim(),
    ninSlipUrl: values.ninSlipUrl.trim()
  },
  vehicleDetails: {
    make: values.vehicleMake.trim(),
    model: values.vehicleModel.trim(),
    color: values.vehicleColor.trim(),
    plateNumber: values.vehiclePlateNumber.trim()
  },
  preference: {
    earningPreference: selectedPreference
  }
});

export function DriverProfileSetupScreen({ onBack }: DriverProfileSetupScreenProps) {
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((state) => state.auth.session?.user ?? null);

  const driverUser = sessionUser && sessionUser.role === 'driver' ? sessionUser : null;
  const [step, setStep] = useState<ProfileSetupStep>('driver-information');
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [driverInformationValues, setDriverInformationValues] = useState<DriverInformationFormValues>(() => {
    if (!driverUser) {
      return EMPTY_DRIVER_INFORMATION_VALUES;
    }

    return getInitialDriverInformationValues(driverUser);
  });
  const [selectedPreference, setSelectedPreference] = useState<EarningPreference | null>(
    driverUser?.preference?.earningPreference ?? null
  );

  const onChangeField = <K extends keyof DriverInformationFormValues>(key: K, value: DriverInformationFormValues[K]) => {
    setDriverInformationValues((prev) => ({
      ...prev,
      [key]: value
    }));

    if (submitError) {
      setSubmitError(null);
    }
  };

  const onContinueToPreference = () => {
    const validationError = validateDriverInformation(driverInformationValues);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setStep('preference');
  };

  const onContinueFromPreference = async () => {
    if (!driverUser) {
      return;
    }

    const validationError = validateDriverInformation(driverInformationValues);
    if (validationError) {
      setSubmitError(validationError);
      setStep('driver-information');
      return;
    }

    if (!selectedPreference) {
      setSubmitError('Select a preference option to continue');
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      const payload = buildProfilePayload(driverInformationValues, selectedPreference);
      await dispatch(updateDriverProfile(payload)).unwrap();
      onBack?.();
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Unable to save profile right now.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <DriverProfileSectionHeader onBack={step === 'driver-information' ? onBack : () => setStep('driver-information')} />

      {step === 'driver-information' ? (
        <View style={styles.body}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <AppText variant="xl" style={styles.stepTitle}>
                Driver Information
              </AppText>
              <AppText variant="body" style={styles.stepSubtitle}>
                Your National ID and license details will be kept private.
              </AppText>

              <AppText variant="sm" style={styles.helperText}>
                Need help getting documents? <AppText variant="sm" style={styles.helperLink}>click here!</AppText>
              </AppText>

              <AppInput
                variant="dark"
                label="Driver's license number for cars / NIN for Motorbikes and Bicycles"
                placeholder="Enter license number or NIN"
                value={driverInformationValues.idNumber}
                onChangeText={(value) => onChangeField('idNumber', value)}
              />

              <AppInput
                variant="dark"
                label="Driver's License URL"
                placeholder="https://..."
                value={driverInformationValues.driverLicenseUrl}
                onChangeText={(value) => onChangeField('driverLicenseUrl', value)}
                autoCapitalize="none"
              />

              <AppInput
                variant="dark"
                label="Driver's Profile Photo URL"
                placeholder="https://..."
                value={driverInformationValues.profilePhotoUrl}
                onChangeText={(value) => onChangeField('profilePhotoUrl', value)}
                autoCapitalize="none"
              />

              <AppInput
                variant="dark"
                label="NIN Slip URL"
                placeholder="https://..."
                value={driverInformationValues.ninSlipUrl}
                onChangeText={(value) => onChangeField('ninSlipUrl', value)}
                autoCapitalize="none"
              />

              <View style={styles.divider} />

              <AppText variant="xl" style={styles.sectionTitle}>
                Vehicle details
              </AppText>

              <AppInput
                variant="dark"
                label="Vehicle make"
                placeholder="e.g. Toyota"
                value={driverInformationValues.vehicleMake}
                onChangeText={(value) => onChangeField('vehicleMake', value)}
              />

              <AppInput
                variant="dark"
                label="Vehicle model"
                placeholder="e.g. Corolla"
                value={driverInformationValues.vehicleModel}
                onChangeText={(value) => onChangeField('vehicleModel', value)}
              />

              <AppInput
                variant="dark"
                label="Vehicle color"
                placeholder="e.g. Black"
                value={driverInformationValues.vehicleColor}
                onChangeText={(value) => onChangeField('vehicleColor', value)}
              />

              <AppInput
                variant="dark"
                label="Vehicle plate number"
                placeholder="e.g. LND-239FK"
                value={driverInformationValues.vehiclePlateNumber}
                onChangeText={(value) => onChangeField('vehiclePlateNumber', value)}
                autoCapitalize="characters"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton title="Continue" variant="secondary" onPress={onContinueToPreference} />
            {submitError ? (
              <AppText variant="xs" style={styles.errorText}>
                {submitError}
              </AppText>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.preferenceIntro}>
              <AppText variant="xl" style={styles.preferenceTitle}>
                Hey Switchster!
              </AppText>
              <AppText variant="md" style={styles.preferenceSubtitle}>
                How do you wanna Earn today?
              </AppText>
            </View>

            {PREFERENCE_OPTIONS.map((option) => {
              const selected = selectedPreference === option.value;
              const Icon = option.Icon;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSelectedPreference(option.value);
                    if (submitError) {
                      setSubmitError(null);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.preferenceCard,
                    selected ? styles.preferenceCardSelected : undefined,
                    pressed ? styles.pressed : undefined
                  ]}>
                  <View style={styles.preferenceCardContent}>
                    <View style={styles.preferenceIconWrap}>
                      <Icon color="#d1d5db" size={20} strokeWidth={2} />
                    </View>

                    <View style={styles.preferenceMeta}>
                      <AppText variant="lg" style={styles.preferenceCardTitle}>
                        {option.title}
                      </AppText>
                      <AppText variant="sm" style={styles.preferenceCardSubtitle}>
                        {option.subtitle}
                      </AppText>
                      <AppText variant="xs" style={styles.preferenceLearnMore}>
                        Learn more
                      </AppText>
                    </View>

                    <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : undefined]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <AppText variant="xs" style={styles.preferenceHint}>
              You can change your preference later in Accounts
            </AppText>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title={isSaving ? 'Saving profile...' : 'Continue'}
              variant="secondary"
              loading={isSaving}
              disabled={isSaving}
              onPress={onContinueFromPreference}
            />
            {submitError ? (
              <AppText variant="xs" style={styles.errorText}>
                {submitError}
              </AppText>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000'
  },
  body: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 14
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#000000',
    gap: 14
  },
  stepTitle: {
    color: '#f8fafc'
  },
  stepSubtitle: {
    color: '#9ca3af'
  },
  helperText: {
    color: '#e5e7eb'
  },
  helperLink: {
    color: '#0f766e',
    textDecorationLine: 'underline'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    marginVertical: 4
  },
  sectionTitle: {
    color: '#f8fafc'
  },
  preferenceIntro: {
    gap: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  preferenceTitle: {
    color: '#f8fafc'
  },
  preferenceSubtitle: {
    color: '#f8fafc'
  },
  preferenceCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#008f90',
    backgroundColor: '#00383a',
    paddingVertical: 14,
    paddingHorizontal: 12
  },
  preferenceCardSelected: {
    borderColor: '#00b4b6',
    backgroundColor: '#00474a'
  },
  preferenceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  preferenceIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  preferenceMeta: {
    flex: 1,
    gap: 4
  },
  preferenceCardTitle: {
    color: '#f8fafc'
  },
  preferenceCardSubtitle: {
    color: '#e5e7eb'
  },
  preferenceLearnMore: {
    color: '#d1d5db',
    textDecorationLine: 'underline',
    marginTop: 4
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOuterSelected: {
    borderColor: '#f8fafc'
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#f8fafc'
  },
  preferenceHint: {
    color: '#a3a3a3',
    marginTop: -2
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8
  },
  errorText: {
    color: '#fca5a5'
  },
  pressed: {
    opacity: 0.85
  }
});
