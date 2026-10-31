/**
 * Global navigation param-list augmentation so tab screens can directly
 * navigate to parent stack routes (PropertyForm, StayDetail, ...)
 * — same pattern as the Client App's navigation.d.ts.
 */

import type { MainStackParamList, AuthStackParamList } from "./navigation/types";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainStackParamList, AuthStackParamList {}
  }
}

export {};
