export interface HelloResponse {
  message: string;
}

export type PropertyType = 'apartment' | 'house' | 'studio' | 'room' | 'other';

export type PropertyFurnishing = 'furnished' | 'partially-furnished' | 'unfurnished' | 'unknown';

export interface PropertyImage {
  url: string;
  alt: string;
}

export interface PropertyMapPin {
  latitude: number;
  longitude: number;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  community: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: string;
  furnishing: PropertyFurnishing;
  rent: number;
  currency: string;
  rentPeriod: 'week' | 'month' | 'year';
  availabilityDate: string;
  description: string;
  images: readonly PropertyImage[];
  approximateLocation: string;
  address: string;
  mapPin: PropertyMapPin | null;
  additionalInfo: string;
  updatedAt: string;
}

export type PublicProperty = Omit<Property, 'address' | 'mapPin'>;

export type RequestStatus = 'pending' | 'on_hold' | 'accepted' | 'rejected' | 'expired';
export type RequestRejectionReason = 'profile' | 'unavailable';

export interface Request {
  id: string;
  propertyId: string;
  tenantProfileId: string;
  status: RequestStatus;
  message: string;
  createdAt: string;
  expiresAt: string;
  rejectionReason?: RequestRejectionReason;
}

export type TenantLivingArrangement = 'alone' | 'couple' | 'family';

export interface TenantProfile {
  id: string;
  name: string;
  occupation: string;
  isStudent: boolean;
  livingArrangement: TenantLivingArrangement;
  familySize: number;
  moveInDate: string;
  introduction: string;
  avatarUrl?: string;
}

export interface TextMessageContent {
  kind: 'text';
  text: string;
}

export interface LocationMessageContent {
  kind: 'location';
  mapUrl: string;
  label?: string;
}

export type MessageContent = TextMessageContent | LocationMessageContent;

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  sentAt: string;
  content: MessageContent;
}

export interface WalletBalance {
  available: number;
  reserved: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  targetUrl: string;
  readAt: string | null;
  createdAt: string;
}
