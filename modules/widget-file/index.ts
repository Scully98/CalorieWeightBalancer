import { requireOptionalNativeModule } from 'expo';

type WidgetFileModule = {
  write(group: string, path: string, contents: string): boolean;
  read(group: string, path: string): string | null;
  remove(group: string, path: string): void;
  isProtectedDataAvailable(): Promise<boolean>;
};

// null without the native module, e.g. in Jest.
export const WidgetFile =
  requireOptionalNativeModule<WidgetFileModule>('WidgetFile');
