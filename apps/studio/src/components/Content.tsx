import SplitPane from './SplitPane';
import { Editor } from './Editor/Editor';
import { Navigation } from './Navigation';
import { Navigationv3 } from './Navigationv3';
import { Template } from './Template';
import { VisualiserTemplate } from './Visualiser';

import { debounce } from '@/helpers';
import { usePanelsState, useDocumentsState } from '@/state';

import { FunctionComponent } from 'react';
import { AsyncAI } from './AsyncAI';

interface ContentProps {}

export const Content: FunctionComponent<ContentProps> = () => {
  // eslint-disable-line sonarjs/cognitive-complexity
  const { show, secondaryPanelType } = usePanelsState();
  const document =
    useDocumentsState((state) => state.documents['asyncapi']?.document) || null;
  const isV3 = document?.version() === '3.0.0';
  const navigationEnabled = show.primarySidebar;
  const aiEnabled = show.aiPanel;

  const editorEnabled = show.primaryPanel;
  const viewEnabled = show.secondaryPanel;
  const viewType = secondaryPanelType;

  const splitPosLeft = 'splitPos:left';
  const splitPosRight = 'splitPos:right';

  const localStorageLeftPaneSize =
    parseInt(localStorage.getItem(splitPosLeft) || '0', 10) || 220;
  const localStorageRightPaneSize =
    parseInt(localStorage.getItem(splitPosRight) || '0', 10) || '55%';

  const secondPaneSize =
    navigationEnabled && !editorEnabled
      ? localStorageLeftPaneSize
      : localStorageRightPaneSize;
  const secondPaneMaxSize = navigationEnabled && !editorEnabled ? 360 : '100%';

  const navigationAndEditor = (
    <SplitPane
      minSize={290}
      maxSize={360}
      pane1Style={
        navigationEnabled || aiEnabled
          ? { overflow: 'auto', width: '300px' }
          : { width: '0px' }
      }
      pane2Style={editorEnabled ? undefined : { width: '0px' }}
      primary={editorEnabled ? 'first' : 'second'}
      defaultSize={localStorageLeftPaneSize}
      onChange={debounce((size: string) => {
        localStorage.setItem(splitPosLeft, String(size));
      }, 100)}
    >
      {(() => {
        if (aiEnabled) {
          // Render AI component when AI panel is enabled
          return <AsyncAI />;
        }

        if (navigationEnabled) {
          // Render Navigation or Navigationv3 based on the version
          return isV3 ? <Navigationv3 /> : <Navigation />;
        }

        // Default case (renders nothing)
        return <></>;
      })()}

      <Editor />
    </SplitPane>
  );

  return (
    <div className='flex flex-1 flex-row relative'>
      <div className='flex flex-1 flex-row relative'>
        <SplitPane
          size={viewEnabled ? secondPaneSize : 0}
          minSize={0}
          maxSize={secondPaneMaxSize}
          pane1Style={
            navigationEnabled || editorEnabled ? undefined : { width: '0px' }
          }
          pane2Style={viewEnabled ? { overflow: 'auto' } : { width: '0px' }}
          primary={viewEnabled ? 'first' : 'second'}
          defaultSize={localStorageRightPaneSize}
          onChange={debounce((size: string) => {
            localStorage.setItem(splitPosRight, String(size));
          }, 100)}
        >
          {navigationAndEditor}
          {viewType === 'template' && <Template />}
          {viewType === 'visualiser' && <VisualiserTemplate />}
        </SplitPane>
      </div>
    </div>
  );
};
