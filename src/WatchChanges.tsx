import React, { memo, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useAutoSaveContext } from './AutoSaveContext';
import useIsMounted from './useIsMounted';

interface RenderPropType {
  autosaveInputRef: React.Ref<HTMLInputElement>;
  didChangeHappen: () => void;
}

const TriggerModes = {
  BLUR: 'BLUR',
  IDLE: 'IDLE',
  MANUAL: 'MANUAL',
};

interface WatchChangesProps {
  label?: string;
  triggerAutoSave: () => void;
  triggerMode: keyof typeof TriggerModes;
  inputFadeDelay?: number;
  inputInputIdleDelay?: number;
  triggeredDelay?: number;
  children: (props: RenderPropType) => ReactNode;
}

const WatchChangesInner: React.FC<WatchChangesProps> = memo((props) => {
  const {
    label = 'Watch Changes',
    children,
    triggerMode = TriggerModes.BLUR,
    inputFadeDelay = 400,
    inputInputIdleDelay = 400,
    triggeredDelay = 0,
    triggerAutoSave,
  } = props;
  const autosaveInputRef = React.createRef<HTMLInputElement>();

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const triggeredTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isMounted = useIsMounted();

  useEffect(() => {
    console.log(`Rendering: ${label}`);
  });

  const triggerAutosaveWrapper = useCallback(() => {
    if (isMounted()) triggerAutoSave();
  }, [isMounted, triggerAutoSave]);

  useEffect(() => {
    const didInputLoseFocus = () => {
      fadeTimeoutRef.current = setTimeout(() => {
        // console.log('Input lost focus');
        triggerAutosaveWrapper();
      }, inputFadeDelay);
    };

    const didInputIdleOccur = () => {
      // console.log('Change in input');
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      const timeout = setTimeout(() => {
        triggerAutosaveWrapper();
      }, inputInputIdleDelay);
      idleTimeoutRef.current = timeout;
    };

    if (autosaveInputRef) {
      if (autosaveInputRef.current) {
        if (triggerMode === TriggerModes.BLUR) {
          autosaveInputRef.current.onblur = didInputLoseFocus;
        } else if (triggerMode === TriggerModes.IDLE) {
          autosaveInputRef.current.oninput = didInputIdleOccur;
        }
      }
    }
  }, [
    autosaveInputRef,
    triggerMode,
    triggerAutosaveWrapper,
    inputFadeDelay,
    inputInputIdleDelay,
  ]);

  const didChangeHappen = () => {
    triggeredTimeoutRef.current = setTimeout(() => {
      // console.log('A change occured in a child component');
      if (triggerMode === TriggerModes.MANUAL) triggerAutoSave();
    }, triggeredDelay);
  };

  return <div>{children({ didChangeHappen, autosaveInputRef })}</div>;
});

WatchChangesInner.displayName = 'WatchChangesInner';

const WatchChanges: React.FC<Omit<WatchChangesProps, 'triggerAutoSave'>> = (
  props,
) => {
  const { triggerAutoSave } = useAutoSaveContext();
  // The rest of your rendering logic
  return <WatchChangesInner {...props} triggerAutoSave={triggerAutoSave} />;
};

export default WatchChanges;
