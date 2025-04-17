import { MaterialIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface TabBarIconProps {
  name: IconName;
  color: string;
}

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <MaterialIcons size={24} name={name} color={color} />;
}