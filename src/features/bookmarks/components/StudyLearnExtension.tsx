import { LearnSetupMenu } from '@features/learn';
import { ContextExtensionTool, usePinButton } from '@shared/components/ui';
import { Brain } from 'lucide-react';
import type { ReactElement } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { LearnSetupOptions } from '@features/learn';

type StudyLearnExtensionProps = {
  copy: Copy;
  cardCount: number;
  japaneseCardCount: number;
  variant: 'desktop' | 'mobile';
  onStart: (options: LearnSetupOptions) => void;
};

export const StudyLearnExtension = ({
  copy,
  cardCount,
  japaneseCardCount,
  variant,
  onStart,
}: StudyLearnExtensionProps): ReactElement => {
  const pinButtonContext = usePinButton();
  const isContextSidebarPinned = Boolean(pinButtonContext?.isPinned);

  if (variant === 'mobile') {
    return (
      <LearnSetupMenu
        copy={copy}
        cardCount={cardCount}
        japaneseCardCount={japaneseCardCount}
        enableJapaneseMode
        variant="inline"
        onStart={onStart}
      />
    );
  }

  return (
    <ContextExtensionTool
      label={copy.learn}
      icon={Brain}
      count={cardCount}
      size={isContextSidebarPinned ? 'compact' : 'normal'}
    >
      <LearnSetupMenu
        copy={copy}
        cardCount={cardCount}
        japaneseCardCount={japaneseCardCount}
        enableJapaneseMode
        variant="panel"
        onStart={onStart}
      />
    </ContextExtensionTool>
  );
};
