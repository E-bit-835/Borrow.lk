export interface AiRentalMatch {
  id: string;
  title: string;
  category: string;
  isCommercialHost?: boolean;
  providerName: string;
  providerVerified: boolean;
  rating: number;
  reviewsCount: number;
  image: string;
  locationBadge: string;
  district: string;
  tags: string[];
  pricePerDay: number;
  matchScoreBadge?: string;
  specifications: Record<string, string>;
  includedItems: string[];
  instantConfirm?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  timestamp: string;
  metaLocation?: string;
  userAvatar?: string;
  userName?: string;
  matchesHeading?: string;
  matchesDescription?: string;
  matches?: AiRentalMatch[];
  suggestionChips?: string[];
}

export interface AiConversation {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  category: string;
  location: string;
  messages: ChatMessage[];
}
