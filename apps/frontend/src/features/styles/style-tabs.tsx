import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { BibleTable } from './features/bible/bible-table';
import type { ReactNode } from 'react';
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
      content: <BibleTable />,
    },
    {
      code: 'music',
      name: 'Música',
      content: <div>Música</div>,
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
