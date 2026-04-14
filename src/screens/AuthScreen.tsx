import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Square,
  UserRound,
  UserRoundPlus
} from 'lucide-react-native';

import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { AppText } from '../components/ui/AppText';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { RoleToggle } from '../components/RoleToggle';
import { appColors } from '../theme/colors';
import { clearAuthError, login, registerAndLogin, setActiveRole } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

type AuthStage = 'get-started' | 'login' | 'register';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const DRIVER_CITY_OPTIONS = ['Lagos', 'Abuja'] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const dispatch = useAppDispatch();
  const { activeRole, status, error } = useAppSelector((state) => state.auth);
  const isSubmitting = status === 'loading';

  const [stage, setStage] = useState<AuthStage>('get-started');
  const [languageEnabled, setLanguageEnabled] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [username, setUsername] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isDriver = activeRole === 'driver';
  const isDriverRegister = isDriver && stage === 'register';
  const isDarkAuth = isDriver && stage !== 'get-started';
  const trimmedPassword = password.trim();
  const trimmedConfirmPassword = confirmPassword.trim();
  const trimmedCity = city.trim();
  const normalizedPhone = phone.replace(/\D/g, '');
  const isEmailValid = EMAIL_PATTERN.test(normalizeEmail(email));
  const isPhoneValid = normalizedPhone.length >= 10;
  const isPasswordValid = trimmedPassword.length >= 6;
  const isPasswordMatch = trimmedPassword.length > 0 && trimmedPassword === trimmedConfirmPassword;
  const isDriverCityValid = DRIVER_CITY_OPTIONS.some((option) => option === trimmedCity);
  const isPassengerRegisterFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    isEmailValid &&
    phone.trim().length > 0 &&
    isPhoneValid &&
    isPasswordValid &&
    isPasswordMatch;
  const isDriverRegisterFormValid =
    email.trim().length > 0 &&
    isEmailValid &&
    phone.trim().length > 0 &&
    isPhoneValid &&
    username.trim().length > 0 &&
    isDriverCityValid &&
    isPasswordValid &&
    isPasswordMatch;
  const isRegisterFormValid = isDriver
    ? isDriverRegisterFormValid && termsAccepted
    : isPassengerRegisterFormValid && termsAccepted;
  const confirmPasswordError = stage === 'register' && confirmPassword.length > 0 && !isPasswordMatch ? 'Passwords do not match' : null;

  const submitLabel = useMemo(() => {
    if (stage === 'login') {
      return 'Login';
    }

    return isDriver ? 'Register as driver' : 'Create passenger account';
  }, [stage, isDriver]);

  const loadingMessage = useMemo(() => {
    if (stage === 'login') {
      return 'Signing you in...';
    }

    return isDriver ? 'Creating your driver account...' : 'Creating your passenger account...';
  }, [stage, isDriver]);

  const clearErrors = () => {
    if (localError) {
      setLocalError(null);
    }

    if (error) {
      dispatch(clearAuthError());
    }
  };

  const validate = (): boolean => {
    if (stage === 'login') {
      if (!email.trim() || !password.trim()) {
        setLocalError('Email and password are required');
        return false;
      }

      if (!isEmailValid) {
        setLocalError('Enter a valid email address');
        return false;
      }

      return true;
    }

    if (isDriver) {
      if (!email.trim() || !phone.trim() || !trimmedCity || !username.trim() || !password.trim() || !confirmPassword.trim()) {
        setLocalError('Email, phone, city, username, password and confirm password are required');
        return false;
      }

      if (!isEmailValid) {
        setLocalError('Enter a valid email address');
        return false;
      }

      if (!isPhoneValid) {
        setLocalError('Enter a valid phone number');
        return false;
      }

      if (!isDriverCityValid) {
        setLocalError('Please select Lagos or Abuja as city');
        return false;
      }

      if (!isPasswordValid) {
        setLocalError('Password must be at least 6 characters');
        return false;
      }

      if (!isPasswordMatch) {
        setLocalError('Passwords do not match');
        return false;
      }

      return true;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError('First name, last name, email, phone, password and confirm password are required');
      return false;
    }

    if (!isEmailValid) {
      setLocalError('Enter a valid email address');
      return false;
    }

    if (!isPhoneValid) {
      setLocalError('Enter a valid phone number');
      return false;
    }

    if (!isPasswordValid) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    if (!isPasswordMatch) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const onSubmit = () => {
    clearErrors();

    if (!validate()) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    if (stage === 'login') {
      dispatch(
        login({
          email: normalizedEmail,
          password
        })
      );
      return;
    }

    if (isDriver) {
      dispatch(
        registerAndLogin({
          role: 'driver',
          payload: {
            firstName: username.trim(),
            lastName: city.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password,
            termsAccepted: true
          }
        })
      );
      return;
    }

    dispatch(
      registerAndLogin({
        role: 'passenger',
        payload: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
          termsAccepted: true
        }
      })
    );
  };

  const renderError = (dark: boolean) => {
    const message = localError ?? error;
    if (!message) {
      return null;
    }

    return (
      <AppText
        variant="caption"
        style={{
          color: dark ? '#fca5a5' : appColors.danger,
          marginTop: 6
        }}>
        {message}
      </AppText>
    );
  };

  const renderGetStarted = () => {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.backgroundDark} />
        <View style={styles.getStartedWrap}>
          <View style={styles.getStartedHeader}>
            <AppText variant="title" style={styles.getStartedTitle}>
              Switch
            </AppText>
            <AppText variant="subtitle" style={styles.getStartedSubtitle}>
              Choose your mode to continue
            </AppText>
          </View>

          <RoleToggle
            value={activeRole}
            onChange={(role) => {
              clearErrors();
              dispatch(setActiveRole(role));
            }}
            variant="dark"
          />

          <AppButton
            title={activeRole === 'driver' ? 'Continue as driver' : 'Continue as passenger'}
            variant="secondary"
            rightIcon={<UserRoundPlus color={appColors.textLight} size={18} />}
            onPress={() => setStage('login')}
            style={styles.primaryAction}
          />
        </View>
      </SafeAreaView>
    );
  };

  const renderDriverRegister = () => {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.backgroundDark} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.driverContent} keyboardShouldPersistTaps="handled">
            <View style={styles.driverHeaderRow}>
              <AppText variant="label" style={styles.driverHeaderTitle}>
                Become a driver
              </AppText>
              <Pressable style={styles.languageWrap} onPress={() => setLanguageEnabled((value) => !value)}>
                <View style={styles.languageTrack}>
                  <View style={[styles.languageThumb, languageEnabled ? styles.languageThumbOn : styles.languageThumbOff]} />
                </View>
                <AppText variant="label" style={styles.languageText}>
                  EN
                </AppText>
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <AppInput
                variant="dark"
                label="Email Address"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                keyboardType="email-address"
                autoCapitalize="none"
                leftAccessory={<Mail color="#9ca3af" size={18} />}
              />

              <AppInput
                variant="dark"
                label="Phone number"
                placeholder="Enter mobile number"
                value={phone}
                onChangeText={setPhone}
                editable={!isSubmitting}
                keyboardType="phone-pad"
                leftAccessory={
                  <View style={styles.phoneAccessory}>
                    <Square color={appColors.primary} size={12} />
                    <ChevronDown color="#9ca3af" size={14} />
                  </View>
                }
              />

              <View>
                <Pressable disabled={isSubmitting} onPress={() => setIsCityMenuOpen((open) => !open)}>
                  <View pointerEvents="none">
                    <AppInput
                      variant="dark"
                      label="City"
                      placeholder="Select city"
                      value={city}
                      editable={false}
                      leftAccessory={<MapPin color="#9ca3af" size={18} />}
                      rightAccessory={
                        <ChevronDown
                          color="#9ca3af"
                          size={18}
                          style={isCityMenuOpen ? styles.dropdownChevronOpen : undefined}
                        />
                      }
                    />
                  </View>
                </Pressable>
                {isCityMenuOpen ? (
                  <View style={styles.cityMenu}>
                    {DRIVER_CITY_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        style={[styles.cityMenuOption, city === option ? styles.cityMenuOptionSelected : undefined]}
                        onPress={() => {
                          clearErrors();
                          setCity(option);
                          setIsCityMenuOpen(false);
                        }}>
                        <AppText
                          variant="caption"
                          style={[styles.cityMenuOptionText, city === option ? styles.cityMenuOptionTextSelected : undefined]}>
                          {option}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <AppInput
                variant="dark"
                label="Username"
                placeholder="@username"
                value={username}
                onChangeText={setUsername}
                editable={!isSubmitting}
                autoCapitalize="none"
                leftAccessory={<UserRound color="#9ca3af" size={18} />}
                rightAccessory={
                  username.trim().length > 0 ? <CheckCircle2 color={appColors.primary} size={18} /> : <View />
                }
              />

              <AppInput
                variant="dark"
                label="Password"
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                leftAccessory={<LockKeyhole color="#9ca3af" size={18} />}
                rightAccessory={
                  <Pressable onPress={() => setIsPasswordVisible((value) => !value)} hitSlop={8}>
                    {isPasswordVisible ? <EyeOff color="#9ca3af" size={18} /> : <Eye color="#9ca3af" size={18} />}
                  </Pressable>
                }
              />

              <AppInput
                variant="dark"
                label="Confirm password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isSubmitting}
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
                error={confirmPasswordError}
                leftAccessory={<LockKeyhole color="#9ca3af" size={18} />}
                rightAccessory={
                  <Pressable onPress={() => setIsConfirmPasswordVisible((value) => !value)} hitSlop={8}>
                    {isConfirmPasswordVisible ? <EyeOff color="#9ca3af" size={18} /> : <Eye color="#9ca3af" size={18} />}
                  </Pressable>
                }
              />
            </View>

            <Pressable
              onPress={() => {
                clearErrors();
                setTermsAccepted((prev) => !prev);
              }}
              disabled={isSubmitting}
              style={styles.termsPressable}
            >
              <View style={styles.termsRow}>
                <View style={[styles.termsCheck, termsAccepted && styles.termsCheckActive]}>
                  {termsAccepted && <CheckCircle2 color={appColors.primary} size={14} />}
                </View>
                <AppText variant="caption" style={styles.termsText}>
                  By registering, you agree to our Terms of Service and Privacy Policy, commit to comply with legal
                  obligations and provide only legal services and content on the Switch platform.
                </AppText>
              </View>
            </Pressable>
            <AppText variant="caption" style={styles.termsSubText}>
              As a valued partner, you will occasionally receive offers and promotions related to our services.
            </AppText>

            {renderError(true)}

            <AppButton
              title={submitLabel}
              variant="secondary"
              disabled={!isRegisterFormValid}
              onPress={onSubmit}
              style={styles.driverSubmit}
            />

            <Pressable
              onPress={() => {
                clearErrors();
                setIsCityMenuOpen(false);
                setStage('login');
              }}
              disabled={isSubmitting}>
              <AppText variant="caption" style={styles.switchText}>
                Already have an account? Login
              </AppText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const renderAuthCard = () => {
    return (
      <SafeAreaView style={[styles.lightScreen, isDarkAuth ? styles.darkScreen : undefined]}>
        <StatusBar
          barStyle={isDarkAuth ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkAuth ? appColors.backgroundDark : appColors.backgroundLight}
        />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, isDarkAuth ? styles.cardDark : styles.cardLight]}>
              <AppText variant="title" style={isDarkAuth ? styles.titleDark : styles.titleLight}>
                {isDriver ? 'Driver account' : 'Passenger account'}
              </AppText>
              <AppText variant="subtitle" style={isDarkAuth ? styles.subtitleDark : styles.subtitleLight}>
                {stage === 'login' ? 'Sign in to continue' : 'Create your account'}
              </AppText>

              <AppInput
                variant={isDarkAuth ? 'dark' : 'light'}
                label="Email"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                autoCapitalize="none"
                keyboardType="email-address"
                leftAccessory={<Mail color={isDarkAuth ? '#9ca3af' : '#64748b'} size={18} />}
              />

              <AppInput
                variant={isDarkAuth ? 'dark' : 'light'}
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                leftAccessory={<LockKeyhole color={isDarkAuth ? '#9ca3af' : '#64748b'} size={18} />}
                rightAccessory={
                  <Pressable onPress={() => setIsPasswordVisible((value) => !value)} hitSlop={8}>
                    {isPasswordVisible ? (
                      <EyeOff color={isDarkAuth ? '#9ca3af' : '#64748b'} size={18} />
                    ) : (
                      <Eye color={isDarkAuth ? '#9ca3af' : '#64748b'} size={18} />
                    )}
                  </Pressable>
                }
              />

              {stage === 'register' && !isDriver ? (
                <>
                  <AppInput
                    variant="light"
                    label="First name"
                    placeholder="Enter first name"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!isSubmitting}
                    leftAccessory={<UserRound color="#64748b" size={18} />}
                  />
                  <AppInput
                    variant="light"
                    label="Last name"
                    placeholder="Enter last name"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!isSubmitting}
                    leftAccessory={<UserRound color="#64748b" size={18} />}
                  />
                  <AppInput
                    variant="light"
                    label="Phone number"
                    placeholder="Enter phone number"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!isSubmitting}
                    keyboardType="phone-pad"
                    leftAccessory={<Phone color="#64748b" size={18} />}
                  />
                  <AppInput
                    variant="light"
                    label="Confirm password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isSubmitting}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    error={confirmPasswordError}
                    leftAccessory={<LockKeyhole color="#64748b" size={18} />}
                    rightAccessory={
                      <Pressable onPress={() => setIsConfirmPasswordVisible((value) => !value)} hitSlop={8}>
                        {isConfirmPasswordVisible ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
                      </Pressable>
                    }
                  />
                  <Pressable
                    onPress={() => {
                      clearErrors();
                      setTermsAccepted((prev) => !prev);
                    }}
                    disabled={isSubmitting}
                    style={{ marginTop: 8 }}
                  >
                    <View style={styles.termsRow}>
                      <View style={[styles.termsCheck, termsAccepted && styles.termsCheckActive]}>
                        {termsAccepted && <CheckCircle2 color={appColors.primary} size={14} />}
                      </View>
                      <AppText variant="caption" style={{ color: appColors.textSubtle, flex: 1 }}>
                        I agree to the Terms of Service and Privacy Policy
                      </AppText>
                    </View>
                  </Pressable>
                </>
              ) : null}

              {renderError(isDarkAuth)}

              <AppButton
                title={submitLabel}
                variant={isDarkAuth ? 'secondary' : 'primary'}
                disabled={stage === 'register' && !isRegisterFormValid}
                leftIcon={stage === 'login' ? <LogIn color={isDarkAuth ? appColors.textLight : '#01251d'} size={18} /> : undefined}
                onPress={onSubmit}
              />

              <Pressable
                onPress={() => {
                  clearErrors();
                  setIsCityMenuOpen(false);
                  setStage(stage === 'login' ? 'register' : 'login');
                }}
                disabled={isSubmitting}>
                <AppText variant="caption" style={isDarkAuth ? styles.switchText : styles.switchTextLight}>
                  {stage === 'login' ? 'No account yet? Switch to Register' : 'Already have an account? Switch to Login'}
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  clearErrors();
                  setIsCityMenuOpen(false);
                  setStage('get-started');
                }}
                disabled={isSubmitting}>
                <AppText variant="caption" style={isDarkAuth ? styles.switchText : styles.switchTextLight}>
                  Back to role selection
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const content = stage === 'get-started'
    ? renderGetStarted()
    : isDriverRegister
      ? renderDriverRegister()
      : renderAuthCard();

  return (
    <>
      {content}
      <LoadingOverlay visible={isSubmitting} message={loadingMessage} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  darkScreen: {
    flex: 1,
    backgroundColor: appColors.backgroundDark
  },
  lightScreen: {
    flex: 1,
    backgroundColor: appColors.backgroundLight
  },
  getStartedWrap: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    gap: 24
  },
  getStartedHeader: {
    gap: 8
  },
  getStartedTitle: {
    color: appColors.textLight
  },
  getStartedSubtitle: {
    color: appColors.textMuted
  },
  primaryAction: {
    marginTop: 8
  },
  authContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14
  },
  cardLight: {
    backgroundColor: appColors.surfaceLight,
    borderWidth: 1,
    borderColor: appColors.borderLight
  },
  cardDark: {
    backgroundColor: appColors.surfaceDark,
    borderWidth: 1,
    borderColor: appColors.borderDark
  },
  titleLight: {
    color: appColors.textDark
  },
  titleDark: {
    color: appColors.textLight
  },
  subtitleLight: {
    color: appColors.textSubtle
  },
  subtitleDark: {
    color: appColors.textMuted
  },
  driverContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28
  },
  driverHeaderRow: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  driverHeaderTitle: {
    color: appColors.textLight,
    fontSize: 28,
    lineHeight: 32
  },
  languageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  languageTrack: {
    width: 28,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#27313d',
    padding: 2,
    justifyContent: 'center'
  },
  languageThumb: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  languageThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: appColors.primary
  },
  languageThumbOff: {
    alignSelf: 'flex-start',
    backgroundColor: '#64748b'
  },
  languageText: {
    color: appColors.textLight
  },
  fieldGroup: {
    gap: 16
  },
  phoneAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }]
  },
  cityMenu: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColors.borderDark,
    backgroundColor: '#151d27',
    overflow: 'hidden'
  },
  cityMenuOption: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  cityMenuOptionSelected: {
    backgroundColor: '#1f2937'
  },
  cityMenuOptionText: {
    color: '#d1d5db'
  },
  cityMenuOptionTextSelected: {
    color: appColors.primary
  },
  termsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  termsPressable: {
    marginTop: 10
  },
  termsCheck: {
    width: 16,
    height: 16,
    marginTop: 2,
    borderWidth: 2,
    borderColor: appColors.primary,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  termsCheckActive: {
    backgroundColor: appColors.primary
  },
  termsText: {
    flex: 1,
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22
  },
  termsSubText: {
    color: appColors.textMuted,
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22
  },
  driverSubmit: {
    marginTop: 26,
    borderRadius: 26,
    backgroundColor: '#033a31',
    borderColor: '#055e4d'
  },
  switchText: {
    textAlign: 'center',
    marginTop: 14,
    color: appColors.textMuted
  },
  switchTextLight: {
    textAlign: 'center',
    marginTop: 10,
    color: appColors.textSubtle
  }
});
