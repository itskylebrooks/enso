const weaponLabels: Record<string, string> = {
  'empty-hand': 'Empty hand',
  tanto: 'Tantō',
  jo: 'Jō',
  bokken: 'Bokken',
};

export const formatDetailLabel = (value?: string | null): string | null => {
  if (!value) return null;
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export const formatWeaponLabel = (value?: string | null): string | null => {
  if (!value) return null;
  return weaponLabels[value] ?? formatDetailLabel(value);
};
