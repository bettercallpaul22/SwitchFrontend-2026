import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle
} from 'react-native';
import { MapPin, Search } from 'lucide-react-native';

import type { RideLocation } from '../../types/ride';
import { AppText } from '../ui/AppText';

type PlacesSearchVariant = 'dark' | 'light';

type GooglePlacesPrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type PlacesAutocompleteResponse = {
  status?: string;
  predictions?: GooglePlacesPrediction[];
  error_message?: string;
};

type PlaceDetailsResponse = {
  status?: string;
  result?: {
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
    place_id?: string;
  };
  error_message?: string;
};

type PlaceSuggestionItem = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type PlacesSearchInputProps = {
  apiKey: string;
  value: string;
  onChangeText: (value: string) => void;
  onPlaceSelected: (location: RideLocation) => void;
  placeholder?: string;
  countryCode?: string;
  minQueryLength?: number;
  maxSuggestions?: number;
  debounceMs?: number;
  variant?: PlacesSearchVariant;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  suggestionsContainerStyle?: StyleProp<ViewStyle>;
  rightAccessory?: React.ReactNode;
  errorText?: string | null;
  disabled?: boolean;
};

const DEFAULT_DEBOUNCE_MS = 260;
const DEFAULT_MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_SUGGESTIONS = 5;

export function PlacesSearchInput({
  apiKey,
  value,
  onChangeText,
  onPlaceSelected,
  placeholder = 'Search for a place',
  countryCode = 'ng',
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  variant = 'dark',
  containerStyle,
  inputContainerStyle,
  suggestionsContainerStyle,
  rightAccessory,
  errorText,
  disabled
}: PlacesSearchInputProps) {
  const [focused, setFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const requestSequenceRef = useRef(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = variant === 'dark';
  const trimmedValue = value.trim();
  const showSuggestions = focused && suggestions.length > 0 && trimmedValue.length >= minQueryLength;

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setLocalError(null);
      return;
    }

    if (!apiKey.trim()) {
      setSuggestions([]);
      setLocalError('Google Places API key is missing');
      return;
    }

    if (trimmedValue.length < minQueryLength) {
      setSuggestions([]);
      setLocalError(null);
      return;
    }

    const requestId = ++requestSequenceRef.current;

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setLocalError(null);

      const endpoint =
        'https://maps.googleapis.com/maps/api/place/autocomplete/json' +
        `?input=${encodeURIComponent(trimmedValue)}` +
        `&key=${encodeURIComponent(apiKey)}` +
        `&components=country:${encodeURIComponent(countryCode)}`;

      try {
        const response = await fetch(endpoint);
        const payload = (await response.json()) as PlacesAutocompleteResponse;

        if (requestId !== requestSequenceRef.current) {
          return;
        }

        if (!response.ok) {
          setSuggestions([]);
          setLocalError('Unable to load place suggestions right now');
          return;
        }

        if (payload.status === 'ZERO_RESULTS') {
          setSuggestions([]);
          return;
        }

        if (payload.status !== 'OK' || !payload.predictions) {
          setSuggestions([]);
          setLocalError(payload.error_message ?? 'Unable to load place suggestions');
          return;
        }

        const mapped = payload.predictions.slice(0, maxSuggestions).map((prediction) => {
          const mainText = prediction.structured_formatting?.main_text?.trim() || prediction.description;
          const secondaryText = prediction.structured_formatting?.secondary_text?.trim() || '';

          return {
            placeId: prediction.place_id,
            description: prediction.description,
            mainText,
            secondaryText
          } satisfies PlaceSuggestionItem;
        });

        setSuggestions(mapped);
      } catch {
        if (requestId === requestSequenceRef.current) {
          setSuggestions([]);
          setLocalError('Unable to reach Google Places service');
        }
      } finally {
        if (requestId === requestSequenceRef.current) {
          setIsSearching(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    apiKey,
    countryCode,
    debounceMs,
    disabled,
    maxSuggestions,
    minQueryLength,
    trimmedValue
  ]);

  const onSelectPlace = async (item: PlaceSuggestionItem) => {
    setLocalError(null);

    const detailsEndpoint =
      'https://maps.googleapis.com/maps/api/place/details/json' +
      `?place_id=${encodeURIComponent(item.placeId)}` +
      `&fields=formatted_address,geometry/location,place_id` +
      `&key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(detailsEndpoint);
      const payload = (await response.json()) as PlaceDetailsResponse;

      if (!response.ok || payload.status !== 'OK' || !payload.result?.geometry?.location) {
        setLocalError(payload.error_message ?? 'Unable to load selected place details');
        return;
      }

      const latitude = payload.result.geometry.location.lat;
      const longitude = payload.result.geometry.location.lng;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        setLocalError('Selected place does not include valid coordinates');
        return;
      }

      const location: RideLocation = {
        address: payload.result.formatted_address?.trim() || item.description,
        placeId: payload.result.place_id || item.placeId,
        coordinates: {
          latitude,
          longitude
        }
      };

      onChangeText(location.address);
      onPlaceSelected(location);
      setSuggestions([]);
      setFocused(false);
    } catch {
      setLocalError('Unable to fetch selected place details');
    }
  };

  const composedError = useMemo(() => errorText ?? localError, [errorText, localError]);

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.inputWrap,
          isDark ? styles.inputWrapDark : styles.inputWrapLight,
          inputContainerStyle
        ]}>
        <Search color={isDark ? '#94a3b8' : '#64748b'} size={18} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#8a97a8' : '#94a3b8'}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          editable={!disabled}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            setFocused(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => {
              setFocused(false);
            }, 120);
          }}
        />

        {isSearching ? (
          <ActivityIndicator color={isDark ? '#cbd5e1' : '#334155'} size="small" />
        ) : (
          rightAccessory
        )}
      </View>

      {composedError ? (
        <AppText variant="xs" style={styles.errorText}>
          {composedError}
        </AppText>
      ) : null}

      {showSuggestions ? (
        <View
          style={[
            styles.suggestions,
            isDark ? styles.suggestionsDark : styles.suggestionsLight,
            suggestionsContainerStyle
          ]}>
          {suggestions.map((item) => (
              <Pressable
                key={item.placeId}
                onPress={() => {
                  onSelectPlace(item).catch(() => undefined);
                }}
                style={({ pressed }) => [styles.suggestionRow, pressed ? styles.pressed : undefined]}>
              <MapPin color={isDark ? '#cbd5e1' : '#334155'} size={16} />
              <View style={styles.suggestionTextBlock}>
                <AppText variant="sm" style={styles.suggestionTitle}>
                  {item.mainText}
                </AppText>
                {item.secondaryText ? (
                  <AppText variant="xs" style={styles.suggestionSubtitle}>
                    {item.secondaryText}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    minHeight: 40,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  inputWrapDark: {
    borderColor: '#0b5f61',
    backgroundColor: 'rgba(2, 48, 50, 0.95)'
  },
  inputWrapLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff'
  },
  input: {
    flex: 1,
    height: 40,
    paddingVertical: 0
  },
  inputDark: {
    color: '#f8fafc'
  },
  inputLight: {
    color: '#0f172a'
  },
  suggestions: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  suggestionsDark: {
    borderColor: '#0b5f61',
    backgroundColor: '#012b2d'
  },
  suggestionsLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff'
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.24)'
  },
  suggestionTextBlock: {
    flex: 1,
    gap: 2
  },
  suggestionTitle: {
    color: '#f8fafc'
  },
  suggestionSubtitle: {
    color: '#cbd5e1'
  },
  errorText: {
    marginTop: 6,
    color: '#fca5a5'
  },
  pressed: {
    opacity: 0.75
  }
});
