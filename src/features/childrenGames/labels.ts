import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGameMaterial, ChildrenGameSetting } from '@shared/types';

export const getChildrenGameMaterialLabel = (material: ChildrenGameMaterial, copy: Copy): string =>
  ({
    none: copy.childrenGames.materialNone,
    'soft-balls': copy.childrenGames.materialSoftBalls,
    'mat-floor': copy.childrenGames.materialMatFloor,
    'werewolves-game': copy.childrenGames.materialWerewolves,
    indiaca: copy.childrenGames.materialIndiaca,
    blindfolds: copy.childrenGames.materialBlindfolds,
    coasters: copy.childrenGames.materialCoasters,
  })[material];

export const getChildrenGameSettingLabel = (setting: ChildrenGameSetting, copy: Copy): string =>
  ({
    outdoor: copy.childrenGames.settingOutdoor,
    indoor: copy.childrenGames.settingIndoor,
    evening: copy.childrenGames.settingEvening,
  })[setting];

export const formatChildrenGameParticipants = (min: number, max: number, copy: Copy): string =>
  `${min}–${max} ${copy.childrenGames.participantsShort}`;
