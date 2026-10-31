/** Domain types shared across the Vendor App — mapped from the backend models. */

export type VendorCategory = "PROPERTY" | "TO_LET" | "HOTEL_VILLA" | "STYLE";

export type StyleExpertCategory = "FURNITURE" | "INTERIOR_DESIGNER" | "RENOVATION";

export type VendorStatus = "Active" | "Pending" | "Suspended" | "Rejected" | string;

/** Per `GET /auth/me` and `GET /vendor/profile`. */
export interface VendorUser {
  _id?: string;
  id?: string;
  email: string;
  role: string;
  accountType?: string;
  status: VendorStatus;
  categories: VendorCategory[];
  fullName?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  phone?: string;
  companyName?: string;
  [key: string]: unknown;
}

/* ─────────────────────────── Vendor dashboard ─────────────────────────── */

export interface DashboardStats {
  totalProperties: number;
  totalToLet: number;
  totalStays: number;
  totalHotels: number;
  totalVillas: number;
  totalStyle: number;
  activeListings: number;
  totalLeads: number;
  newInquiries: number;
  totalBookings: number;
  totalEarnings: string;
  numericEarnings: number;
  unreadNotifications: number;
  recentLeads: Lead[];
  recentBookings: VendorBooking[];
}

/* ─────────────────────────── Property / To-Let ─────────────────────────── */

export type ListingStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PUBLISHED"
  | "REJECTED"
  | "Active"
  | "Inactive"
  | string;

export interface Property {
  _id?: string;
  id?: string | number;
  vendorId?: string;
  vendorEmail?: string;
  title?: string;
  description?: string;
  listingType?: "PROPERTY" | "TO_LET" | "HOTEL_VILLA";
  purpose?: string;
  category?: string;
  type?: string;
  status?: ListingStatus;
  isVerified?: boolean;
  isFeatured?: boolean;
  city?: string;
  state?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  bhk?: string | number;
  bedrooms?: number | string;
  bathrooms?: number | string;
  areaSize?: number | string;
  carpetArea?: number | string;
  price?: number | string;
  /** To-Let fields */
  monthlyRent?: number | string;
  securityDeposit?: number | string;
  maintenance?: number | string;
  furnishing?: string;
  tenantPreference?: string;
  brokerage?: string;
  isZeroBrokerage?: boolean;
  availableFrom?: string;
  noticePeriod?: string;
  minimumRentalPeriod?: string;
  parking?: string | number;
  balconies?: number | string;
  floor?: string | number;
  totalFloors?: string | number;
  propertyAge?: string;
  society?: string;
  landmark?: string;
  petPolicy?: string;
  /** Slot configuration */
  isTimeSlotEnabled?: boolean;
  bookingType?: "Full Day" | "Hourly" | "Time Slot";
  availableDays?: string[];
  openingTime?: string;
  closingTime?: string;
  slotDuration?: number;
  enabledSlots?: string[];
  image?: string;
  images?: string[];
  amenities?: string[];
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** `GET /properties/…/slots` slot object. */
export interface PropertySlot {
  startTime: string;
  endTime: string;
  slotLabel: string;
  startMinutes: number;
  endMinutes: number;
  status: "Available" | "Past" | "Booked" | "Blocked" | "Unavailable";
  customerInfo?: {
    bookingId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    paymentStatus?: string;
    bookingStatus?: string;
  };
}

/* ───────────────────────────── Hotel / Villa ───────────────────────────── */

export interface Stay {
  _id?: string;
  id?: string;
  vendorId?: string;
  name?: string;
  type?: "hotel" | "villa";
  listingType?: string;
  description?: string;
  status?: ListingStatus;
  city?: string;
  state?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  totalRooms?: number;
  availableRooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  maximumGuests?: number;
  area?: string;
  price?: number | string;
  priceLabel?: string;
  amenities?: string[];
  image?: string;
  images?: string[];
  /** Hourly availability configuration */
  isTimeSlotEnabled?: boolean;
  availableDays?: string[];
  openingTime?: string;
  closingTime?: string;
  slotDuration?: number;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface RoomType {
  _id?: string;
  id?: string;
  roomTypeId?: string;
  stayId?: string;
  vendorId?: string;
  name: string;
  title?: string;
  description?: string;
  roomSize?: string;
  bedType?: string;
  capacity?: number;
  adults?: number;
  children?: number;
  bathroomType?: string;
  pricePerHour: number;
  minDuration?: number;
  maxDuration?: number;
  amenities?: string[];
  images?: string[];
  policies?: string;
  isActive?: boolean;
  totalPhysicalRooms?: number;
  activePhysicalRooms?: number;
  physicalRooms?: Room[];
}

export interface Room {
  _id?: string;
  id?: string;
  stayId?: string;
  roomTypeId?: string;
  roomId?: string | number;
  roomNumber: string;
  roomType?: string;
  status: "Active" | "Maintenance" | "Inactive";
  isActive?: boolean;
  pricePerHour?: number;
  capacity?: number;
  bookingsCount?: number;
  bookings?: VendorBooking[];
  [key: string]: unknown;
}

/* ───────────────────────────────── Booking ─────────────────────────────── */

export type BookingStatus = "Confirmed" | "Pending" | "Cancelled" | "Completed" | "Rejected";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export interface VendorBooking {
  _id?: string;
  id?: string;
  vendorId?: string;
  userId?: string;
  propertyId?: string | number;
  stayId?: string;
  propertyTitle?: string;
  roomId?: string;
  roomNumber?: string;
  roomType?: string;
  property?: Property;
  stay?: Stay;
  service?: string;
  /** General slot bookings */
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  slotLabel?: string;
  selectedSlots?: { startTime: string; endTime: string; slotLabel: string }[];
  /** Hotel hourly bookings */
  checkIn?: string;
  checkOut?: string;
  duration?: number;
  startMinutes?: number;
  endMinutes?: number;
  date?: string;
  guests?: number;
  adults?: number;
  children?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  name?: string;
  email?: string;
  phone?: string;
  amount?: number | string;
  basePrice?: number | string;
  taxes?: number | string;
  serviceFee?: number | string;
  discount?: number | string;
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
  vendorNotes?: string;
  specialRequests?: string;
  payment?: { transactionId?: string; amount?: number; paymentMethod?: string };
  createdAt?: string;
  [key: string]: unknown;
}

/* ─────────────────────────────── Lead / Inquiry ─────────────────────────── */

export type LeadStatus = "Pending" | "Contacted" | "Accepted" | "Closed";

export interface Lead {
  _id?: string;
  id?: string;
  vendorId?: string;
  propertyId?: string | number;
  propertyTitle?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  status: LeadStatus;
  createdAt?: string;
  [key: string]: unknown;
}

/* ────────────────────────────── Style Expert ───────────────────────────── */

export interface StyleExpert {
  _id?: string;
  id: string;
  vendorId?: string;
  vendorEmail?: string;
  name: string;
  category: StyleExpertCategory;
  status?: ListingStatus;
  title?: string;
  shortIntroduction?: string;
  profileImage?: string;
  coverImage?: string;
  experienceYears?: number;
  experience?: string;
  projectsCompleted?: number;
  city?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  serviceAreas?: string[];
  specializations?: string[];
  about?: string;
  description?: string;
  servicesOffered?: string[];
  services?: string[];
  portfolio?: string[];
  portfolioImages?: string[];
  startingPrice?: { amount?: number | string; label?: string };
  pricing?: string;
  consultationFee?: number | string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  isVerified?: boolean;
  rejectionReason?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/* ─────────────────────────────── Notification ──────────────────────────── */

export interface VendorNotification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: "info" | "system" | "booking" | "lead" | string;
  isRead: boolean;
  link?: string;
  createdAt?: string;
}

/* ──────────────────────────────── Analytics ────────────────────────────── */

export interface MonthlyPerformance {
  month: string;
  leads: number;
  bookings: number;
  earnings: number;
}

export interface AnalyticsOverview {
  totalProperties: number;
  propertyViews: number;
  activeListings: number;
  totalLeads: number;
  convertedLeads: number;
  totalBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  monthlyPerformance: MonthlyPerformance[];
}

/* ─────────────────────────────── Vendor profile ────────────────────────── */

export interface VendorSettings {
  _id?: string;
  vendorId?: string;
  emailNotifications?: boolean;
  bookingNotifications?: boolean;
  leadNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingNotifications?: boolean;
  language?: string;
  timezone?: string;
}

/** Auth API response envelope. */
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: VendorUser;
}
