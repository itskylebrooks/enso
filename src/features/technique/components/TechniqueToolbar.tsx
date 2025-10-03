import { useCallback, useMemo, type ReactElement } from 'react';
import type { Hanmi, Direction, WeaponKind, TechniqueVersionMeta } from '@shared/types';
import { Select, type SelectOption } from '@shared/components/ui/Select';
import { HandIcon, BokkenIcon, JoIcon, TantoIcon } from '@shared/components/ui/icons';

export type TechniqueToolbarValue = {
  hanmi: Hanmi;
  direction: Direction;
  weapon: WeaponKind;
  versionId?: string | null;
};

export type TechniqueToolbarProps = {
  hanmisAvailable: Hanmi[];
  directionsAvailable: Direction[];
  weaponsAvailable: WeaponKind[];
  versions: TechniqueVersionMeta[];
  value: TechniqueToolbarValue;
  onChange: (value: TechniqueToolbarValue) => void;
  // Function to check if a specific combo is available
  isComboAvailable?: (direction: Direction, weapon: WeaponKind, versionId: string | null) => boolean;
  labels: {
    hanmi: string;
    direction: string;
    weapon: string;
    version: string;
    // Hanmi labels
    aiHanmi: string;
    gyakuHanmi: string;
    // Direction labels
    irimi: string;
    tenkan: string;
    omote: string;
    ura: string;
    // Weapon labels
    emptyHand: string;
    bokken: string;
    jo: string;
    tanto: string;
    // Version labels
    standard: string;
  };
};

const HANMI_ORDER: Hanmi[] = ['ai-hanmi', 'gyaku-hanmi'];
const DIRECTION_ORDER: Direction[] = ['irimi', 'tenkan', 'omote', 'ura'];

const weaponIcons: Record<WeaponKind, ReactElement> = {
  empty: <HandIcon className="w-5 h-5" />,
  bokken: <BokkenIcon className="w-5 h-5" />,
  jo: <JoIcon className="w-5 h-5" />,
  tanto: <TantoIcon className="w-5 h-5" />,
};

export const TechniqueToolbar = ({
  hanmisAvailable,
  directionsAvailable,
  weaponsAvailable,
  versions,
  value,
  onChange,
  labels,
}: TechniqueToolbarProps): ReactElement => {
  // Hanmi options
  const hanmiOptions: SelectOption<Hanmi>[] = useMemo(
    () => {
      const labelMap: Record<Hanmi, string> = {
        'ai-hanmi': labels.aiHanmi,
        'gyaku-hanmi': labels.gyakuHanmi,
      };

      return HANMI_ORDER.map((hanmi) => {
        return {
          value: hanmi,
          label: labelMap[hanmi],
          disabled: !hanmisAvailable.includes(hanmi),
        };
      });
    },
    [hanmisAvailable, labels]
  );

  // Direction options
  const directionOptions: SelectOption<Direction>[] = useMemo(
    () => {
      const labelMap: Record<Direction, string> = {
        irimi: labels.irimi,
        tenkan: labels.tenkan,
        omote: labels.omote,
        ura: labels.ura,
      };

      return DIRECTION_ORDER.map((dir) => {
        return {
          value: dir,
          label: labelMap[dir],
          disabled: !directionsAvailable.includes(dir),
        };
      });
    },
    [directionsAvailable, labels]
  );

  // Weapon options
  const weaponOptions: SelectOption<WeaponKind>[] = useMemo(
    () => {
      const labelMap: Record<WeaponKind, string> = {
        empty: labels.emptyHand,
        bokken: labels.bokken,
        jo: labels.jo,
        tanto: labels.tanto,
      };

      const weaponOrder: WeaponKind[] = ['empty', 'bokken', 'jo', 'tanto'];

      return weaponOrder.map((weapon) => {
        return {
          value: weapon,
          label: labelMap[weapon],
          icon: weaponIcons[weapon],
          disabled: !weaponsAvailable.includes(weapon),
        };
      });
    },
    [weaponsAvailable, labels]
  );

  // Version options
  const versionOptions: SelectOption<string>[] = useMemo(
    () => {
      // "Standard" option pinned at top
      const options: SelectOption<string>[] = [
        {
          value: '__standard__',
          label: labels.standard,
        },
      ];

      // Add all other versions (no grouping, no dojo labels)
      versions.forEach((version) => {
        options.push({
          value: version.id,
          label: version.label,
        });
      });

      return options;
    },
    [versions, labels.standard]
  );

  // Handlers
  const handleHanmiChange = useCallback(
    (hanmi: Hanmi) => {
      onChange({ ...value, hanmi });
    },
    [value, onChange]
  );

  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      onChange({ ...value, direction });
    },
    [value, onChange]
  );

  const handleWeaponChange = useCallback(
    (weapon: WeaponKind) => {
      onChange({ ...value, weapon });
    },
    [value, onChange]
  );

  const handleVersionChange = useCallback(
    (versionId: string) => {
      onChange({
        ...value,
        versionId: versionId === '__standard__' ? null : versionId,
      });
    },
    [value, onChange]
  );

  const selectedVersionId = value.versionId || '__standard__';

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-center"
      role="toolbar"
      aria-label="Technique variant selector"
    >
      {/* Hanmi select - always show */}
      <fieldset className="flex-1 sm:flex-initial sm:min-w-[200px]">
        <legend className="sr-only">{labels.hanmi}</legend>
        <Select
          options={hanmiOptions}
          value={value.hanmi}
          onChange={handleHanmiChange}
          aria-label={labels.hanmi}
        />
      </fieldset>

      {/* Direction select */}
      <fieldset className="flex-1 sm:flex-initial sm:min-w-[200px]">
        <legend className="sr-only">{labels.direction}</legend>
        <Select
          options={directionOptions}
          value={value.direction}
          onChange={handleDirectionChange}
          aria-label={labels.direction}
        />
      </fieldset>

      {/* Version select */}
      <fieldset className="flex-1 sm:flex-initial sm:min-w-[240px]">
        <legend className="sr-only">{labels.version}</legend>
        <Select
          options={versionOptions}
          value={selectedVersionId}
          onChange={handleVersionChange}
          aria-label={labels.version}
          searchable={versions.length > 10}
        />
      </fieldset>

      {/* Weapon select */}
      <fieldset className="flex-1 sm:flex-initial sm:min-w-[200px]">
        <legend className="sr-only">{labels.weapon}</legend>
        <Select
          options={weaponOptions}
          value={value.weapon}
          onChange={handleWeaponChange}
          aria-label={labels.weapon}
        />
      </fieldset>
    </div>
  );
};
