import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import type { ReactNode } from 'react';
import { HolyricsTab } from './holyrics-tab';
import { ProPresenterTab } from './pro-presenter-tab';
import { InteractiveDisplayTab } from './interactive-display-tab';

const codes = ['interactive-display', 'holyrics', 'pro-presenter'] as const;
type Code = (typeof codes)[number];

interface TabsProps {
  code: Code;
  name: string;
  content: ReactNode;
}

export const ConfigView = () => {
  const tabs: TabsProps[] = [
    {
      code: 'interactive-display',
      name: 'Interactive Display Config',
      content: <InteractiveDisplayTab />,
    },

    {
      code: 'holyrics',
      name: 'Holyrics',
      content: <HolyricsTab />,
    },
    {
      code: 'pro-presenter',
      name: 'Pro-Preseter',
      content: <ProPresenterTab />,
    },
  ];

  return (
    <Tabs defaultValue="interactive-display">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.code} value={tab.code}>
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.code} value={tab.code}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
