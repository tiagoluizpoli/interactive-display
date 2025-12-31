import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet';
import type { Dispatch, FormEventHandler, ReactNode, SetStateAction } from 'react';

interface Props {
  children: ReactNode;
  title: string;
  description?: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  footer?: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const StyleSheet = ({ title, description, children, trigger, open, onOpenChange, footer, onSubmit }: Props) => {
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="flex flex-col p-0"
        style={{
          maxWidth: 'unset',
          width: '45rem',
        }}
      >
        <SheetHeader className="p-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 mx-4 grow pr-4">{children}</ScrollArea>

          {footer && <SheetFooter className="p-4 px-8">{footer}</SheetFooter>}
        </form>
      </SheetContent>
    </Sheet>
  );
};
