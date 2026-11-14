export type AccountStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type UserRole = 'user' | 'admin';
export type ListingType = 'offer' | 'request';
export type ListingStatus = 'active' | 'paused' | 'closed' | 'expired';
export type PriceType = 'fixed' | 'negotiable' | 'at_contact';
export type OfferStatus = 'new' | 'negotiation' | 'accepted' | 'rejected' | 'cancelled';

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: AccountStatus;
  role: UserRole;
  createdAt?: number;
}

export interface ProfileDetails {
  businessName: string | null;
  description: string | null;
  governorateId: number | null;
  area: string | null;
}

export interface UserSpecialty {
  id: number | null;
  name: string | null;
  customSpecialty: string | null;
}

export interface ContactPreferences {
  showPhone: number;
  whatsappEnabled: number;
  internalMessagesEnabled: number;
}

export interface CurrentUser extends AuthUser {
  profile: ProfileDetails | null;
  specialties: UserSpecialty[];
  contactPreferences: ContactPreferences;
}

export interface ListingImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface ListingOwner {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: AccountStatus;
  role: UserRole;
  businessName: string | null;
  governorateId: number | null;
  area: string | null;
  specialties: UserSpecialty[];
  contactPreferences: ContactPreferences;
  ratingAvg: number;
  ratingCount: number;
}

export interface Listing {
  id: number;
  userId: number;
  listingType: ListingType;
  title: string;
  categoryId: number;
  description: string | null;
  quantity: number;
  unitId: number;
  price: number | null;
  priceType: PriceType;
  governorateId: number | null;
  area: string | null;
  status: ListingStatus;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  images: ListingImage[];
  owner: ListingOwner | null;
  offerCount: number;
  myReview?: Review | null;
}

export interface Review {
  id: number;
  listingId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: number;
  updatedAt: number;
  reviewerName?: string;
  listingTitle?: string;
}

export interface ReviewList {
  summary: { average: number; count: number };
  items: Review[];
}

export interface ListingList {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryNode {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
  children: CategoryNode[];
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Specialty {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Governorate {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface Offer {
  id: number;
  listingId: number;
  listingTitle: string;
  listingType: ListingType;
  status: OfferStatus;
  proposedPrice: number;
  proposedQuantity: number;
  notes: string | null;
  createdAt: number;
  buyerId: number;
  buyerName: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  monthlyPostLimit: number;
  durationDays: number;
  isActive: boolean;
}

export interface EffectiveSubscription {
  id: number;
  planId: number;
  planName: string;
  price: number;
  monthlyPostLimit: number;
  status: string;
  startsAt: number;
  endsAt: number;
}

export interface PostUsage {
  usedPosts: number;
  remainingPosts: number;
  monthlyPostLimit: number;
}

export interface MySubscription {
  subscription: EffectiveSubscription;
  plan: Plan | null;
  freePlan: Plan;
  usage: PostUsage;
  paymentGatewayConfigured: boolean;
}

export interface CheckoutResult {
  available: boolean;
  message?: string;
  paymentId?: number;
  subscriptionId?: number;
  providerReference?: string;
  plan?: Plan;
}

export interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
  listingId?: number | null;
  listingTitle?: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId?: number;
  senderId: number;
  senderName?: string;
  content: string;
  isRead: boolean;
  createdAt: number;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: number;
}

export interface FavoriteItem {
  id: number;
  listingId: number;
  title: string;
  listingType: ListingType;
  price: number | null;
  quantity: number;
  status: ListingStatus;
  createdAt: number;
  imageUrl: string | null;
}

export interface Paged<T> {
  items: T[];
}

export interface AdminStats {
  users: { total: number; newThisMonth: number; pending: number; active: number; suspended: number };
  farmers?: number;
  listings: { total: number; offers: number; requests: number; active: number; paused: number; closed: number; expired: number };
  offers: { total: number; new: number; negotiation: number; accepted: number; rejected: number; cancelled: number };
  subscriptions: { active: number; canceled: number; expired: number };
  revenue: { total: number; successful: number; pending: number };
  recentOperations: Array<{ id: number; action: string; entityType: string; entityId: number | null; createdAt: number }>;
}

export interface AdminUser {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: AccountStatus;
  role: UserRole;
  createdAt: number;
  listingsCount?: number;
}

export interface AdminListing {
  id: number;
  title: string;
  listingType: ListingType;
  status: ListingStatus;
  price: number | null;
  ownerName: string;
  createdAt: number;
}

export interface AdminSubscription {
  id: number;
  userId: number;
  userName: string;
  planId: number;
  planName: string;
  status: string;
  amount: number;
  startsAt: number;
  endsAt: number;
  autoRenew: boolean;
  paymentProviderReference: string | null;
}

export interface AdminUserDetail {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: AccountStatus;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  profile: {
    businessName: string | null;
    description: string | null;
    governorateId: number | null;
    area: string | null;
  } | null;
  specialties: Array<{ name: string | null; customSpecialty: string | null }>;
  counts: {
    listings: number;
    offersMade: number;
    offersReceived: number;
    favorites: number;
    conversations: number;
  };
  subscription: {
    id: number;
    planName: string;
    status: string;
    startsAt: number;
    endsAt: number;
    autoRenew: boolean;
  } | null;
  recentListings: Array<{ id: number; title: string; listingType: string; status: string; createdAt: number }>;
}

export interface SettingItem {
  key: string;
  value: string;
  updatedAt: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}
