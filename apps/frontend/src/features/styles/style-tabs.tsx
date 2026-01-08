import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { BibleTab } from './tabs/bible-tab';
import type { ReactNode } from 'react';
import { MusicTab } from './tabs/music-tab';
interface StyleTabsProps {
  code: string;
  name: string;
  content: ReactNode;
}
export const StyleTabs = () => {
  const tabs: StyleTabsProps[] = [
    {
      code: 'bible',
      name: 'Bíblia',
      content: <BibleTab />,
    },
    {
      code: 'music',
      name: 'Música',
      content: <MusicTab />,
    },
  ];

  return (
    <Tabs defaultValue="bible">
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
