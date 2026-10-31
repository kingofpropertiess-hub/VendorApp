import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

/** Auth stack — pre-login (includes the guest preview home). */
export type AuthStackParamList = {
  GuestHome: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

/** Tab sets differ per authorized category; params stay simple: none. */
export type TabParamList = {
  Dashboard: undefined;
  Manage: undefined;
  Inbox: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Main: undefined;
  /* Hospitality */
  StayDetail: { stayId: string; stay?: never };
  StayForm: { stayId?: string };
  RoomTypeForm: { stayId: string; roomTypeId?: string };
  RoomCalendar: { stayId: string };
  /* To-Let rentals */
  PropertyForm: { propertyId?: string };
  PropertySlots: { propertyId: string; title?: string };
  /* Style experts */
  ExpertForm: { expertId?: string };
  /* Shared */
  BookingDetail: { bookingId: string };
  LeadDetail: { leadId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Analytics: undefined;
  AccountStatusScreen: undefined;
  Onboarding: undefined;
};

export type RootStackParamList = AuthStackParamList &
  MainStackParamList & {
    Main: undefined;
    Login: undefined;
    Register: undefined;
  };

/* Screen-prop shorthands */
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;
export type StackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;
