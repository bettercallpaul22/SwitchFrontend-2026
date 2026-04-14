import type { MapStyleElement } from 'react-native-maps';

export const DRIVER_MAP_STYLE: MapStyleElement[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0f1720' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8191a4' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0a1118' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#192534' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#243241' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0b1017' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
];
