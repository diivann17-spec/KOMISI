// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mappings dari SF Symbols / custom keys ke MaterialIcons
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'calendar': 'event',
  'calendar.badge.clock': 'edit-calendar',
  'groups': 'groups',
  'folder.fill': 'folder',
  'menu': 'menu',
  'doc.text.viewfinder': 'document-scanner',
  'bell.fill': 'notifications',
  'person.fill': 'person',
  'chart.bar.fill': 'bar-chart',
} as Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] || 'help-outline'} style={style} />;
}
