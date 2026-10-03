import type { PriceUnit } from './categories';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  count: number;
}

export interface Provider {
  id: string;
  name: string;
  businessName?: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  rentalsCount: number;
  verified: boolean;
  memberSince: string;
  responseRate: string;
  responseTime: string;
  location: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Listing {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  /** 'service' listings are hired from providers; everything else is rented from hosts */
  listingType?: 'rental' | 'service';
  subcategory?: string;
  images: string[];
  /** Price for one `priceUnit` (the field name predates units other than "day") */
  pricePerDay: number;
  priceUnit?: PriceUnit;
  province?: string;
  location: string;
  district: string;
  rating: number;
  reviewsCount: number;
  availableNow: boolean;
  isPopular?: boolean;
  isRecent?: boolean;
  featuredBadge?: string;
  provider: Provider;
  description: string;
  specifications: Record<string, string>;
  includedItems: string[];
  rentalTerms: string[];
  reviews: Review[];
}

export const CATEGORIES: Category[] = [
  { id: 'property', name: 'Property', slug: 'property', iconName: 'Building2', count: 22 },
  { id: 'vehicle', name: 'Vehicle', slug: 'vehicle', iconName: 'Car', count: 35 },
  { id: 'electronics', name: 'Electronics', slug: 'electronics', iconName: 'Camera', count: 48 },
  { id: 'furniture', name: 'Furniture', slug: 'furniture', iconName: 'Sofa', count: 33 },
  { id: 'computers', name: 'Computers', slug: 'computers', iconName: 'Laptop', count: 41 },
  { id: 'fashion', name: 'Fashion', slug: 'fashion', iconName: 'Shirt', count: 29 },
  { id: 'services', name: 'Services', slug: 'services', iconName: 'Wrench', count: 62 },
  { id: 'books', name: 'Books', slug: 'books', iconName: 'BookOpen', count: 24 },
  { id: 'other', name: 'Other', slug: 'other', iconName: 'MoreHorizontal', count: 27 },
];

export const TOP_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'Janaka Perera',
    businessName: 'Lanka Gear & Camera Rentals',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
    rating: 4.9,
    reviewsCount: 84,
    rentalsCount: 142,
    verified: true,
    memberSince: 'March 2024',
    responseRate: '99%',
    responseTime: '< 15 mins',
    location: 'Colombo 03, Western Province',
  },
  {
    id: 'prov-2',
    name: 'Kasun Silva',
    businessName: 'Apex Wheels Lanka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
    rating: 5.0,
    reviewsCount: 62,
    rentalsCount: 98,
    verified: true,
    memberSince: 'January 2024',
    responseRate: '100%',
    responseTime: '< 10 mins',
    location: 'Colombo 07, Western Province',
  },
  {
    id: 'prov-3',
    name: 'Nimali De Silva',
    businessName: 'Kandy Cine & Drone Co.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&q=80',
    rating: 4.8,
    reviewsCount: 45,
    rentalsCount: 76,
    verified: true,
    memberSince: 'May 2024',
    responseRate: '98%',
    responseTime: '< 30 mins',
    location: 'Kandy City, Central Province',
  },
  {
    id: 'prov-4',
    name: 'Tharindu Mendis',
    businessName: 'Pro Tools & Hardware Hub',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80',
    rating: 4.9,
    reviewsCount: 51,
    rentalsCount: 110,
    verified: true,
    memberSince: 'February 2024',
    responseRate: '97%',
    responseTime: '< 20 mins',
    location: 'Gampaha, Western Province',
  },
];

export const LISTINGS: Listing[] = [
  {
    id: 'canon-eos-r5',
    title: 'Canon EOS R5 Mirrorless Camera Kit',
    category: 'Electronics',
    categorySlug: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 6500,
    location: 'Colombo 03, Kollupitiya',
    district: 'Colombo',
    rating: 4.9,
    reviewsCount: 38,
    availableNow: true,
    isPopular: true,
    isRecent: true,
    featuredBadge: 'Top Rated',
    provider: TOP_PROVIDERS[0],
    description:
      'The Canon EOS R5 features a groundbreaking 45 Megapixel full-frame CMOS sensor and DIGIC X image processor. Capture stunning 8K DCI RAW cinematic video and pristine high-resolution stills with 8 stops of in-body image stabilization. Perfect for commercial shoots, high-end weddings, music videos, and creative documentaries in Sri Lanka.',
    specifications: {
      'Sensor Resolution': '45.0 Megapixels Full-Frame CMOS',
      'Video Capabilities': '8K DCI RAW up to 30fps, 4K 120fps 10-bit',
      'Autofocus System': 'Dual Pixel CMOS AF II with 1,053 zones & Eye Tracking',
      'Stabilization': 'In-Body 5-Axis Image Stabilization (up to 8 stops)',
      'Media Slots': '1x CFexpress Type B, 1x SD UHS-II',
      'ISO Range': '100 - 51,200 (Expandable to 102,400)',
    },
    includedItems: [
      'Canon EOS R5 Camera Body with sensor cap',
      '2x Genuine Canon LP-E6NH Rechargeable Batteries',
      'Canon Dual Battery Charger with power cable',
      '128GB SanDisk Extreme PRO CFexpress Type B Card & Card Reader',
      'Heavy-duty Pelican Weatherproof Hard Shell Case',
      'Original Canon padded neck strap and cable protector',
    ],
    rentalTerms: [
      'Valid National Identity Card (NIC) or Passport required upon handover',
      'Refundable security deposit of LKR 10,000 required at pickup',
      'Free cancellation up to 24 hours prior to booking start time',
      'Equipment inspected, sensor-cleaned, and sanitized prior to handover',
    ],
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Sanjaya Rathnayake',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        rating: 5,
        date: '2 days ago',
        comment:
          'Absolute beast of a camera! We used it for a 3-day commercial shoot in Negombo. Janaka gave the gear with batteries fully charged and CFexpress card formatted. 10/10 experience with BorrowLK!',
      },
      {
        id: 'rev-2',
        authorName: 'Dinuka Fernando',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        rating: 5,
        date: '1 week ago',
        comment:
          'Crystal clear 8K and the autofocus eye tracking made our wildlife documentary shoot in Yala effortless. Handover in Colombo 03 was fast and professional.',
      },
      {
        id: 'rev-3',
        authorName: 'Malik Al-Hassan',
        authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
        rating: 4.8,
        date: '3 weeks ago',
        comment:
          'Flawless condition, all accessories included. Very friendly provider who walked me through menu configurations. Will borrow again!',
      },
    ],
  },
  {
    id: 'toyota-prius',
    title: 'Toyota Prius Hybrid 2018 (Self-Drive)',
    category: 'Vehicle',
    categorySlug: 'vehicle',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 12000,
    location: 'Colombo 07, Cinnamon Gardens',
    district: 'Colombo',
    rating: 4.95,
    reviewsCount: 52,
    availableNow: true,
    isPopular: true,
    isRecent: true,
    featuredBadge: 'Verified Vehicle',
    provider: TOP_PROVIDERS[1],
    description:
      'Immaculate condition Toyota Prius 2018 Hybrid. Extremely fuel-efficient (22+ km/l), smooth automatic transmission, air-conditioned, with reverse camera and Bluetooth audio. Ideal for business trips, island tours, or airport pick-and-drop.',
    specifications: {
      Transmission: 'Automatic (CVT)',
      'Fuel Economy': '22 - 25 km/l Hybrid',
      Seats: '5 Passengers with large trunk',
      Insurance: 'Full Comprehensive Rental Insurance',
    },
    includedItems: ['Full tank handover policy', 'Mobile phone holder & USB charger', 'Spare tire and emergency toolkit'],
    rentalTerms: ['Sri Lankan driving license or International Driving Permit', 'Minimum renter age 21 years'],
    reviews: [
      {
        id: 'rev-201',
        authorName: 'Roshan Silva',
        authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
        rating: 5,
        date: '4 days ago',
        comment: 'Drove to Ella and back without a single hiccup. Extremely comfortable and economical.',
      },
    ],
  },
  {
    id: 'dewalt-drill-kit',
    title: 'DeWalt 20V Max Brushless Cordless Drill Kit',
    category: 'Other',
    categorySlug: 'other',
    subcategory: 'Tools',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 1800,
    location: 'Gampaha City',
    district: 'Gampaha',
    rating: 4.85,
    reviewsCount: 29,
    availableNow: true,
    isPopular: true,
    isRecent: true,
    provider: TOP_PROVIDERS[3],
    description:
      'Heavy-duty DeWalt hammer drill and impact driver combo. Comes with 2x 4.0Ah batteries, fast charger, and 30-piece drill/driver bit set. Perfect for home renovation, furniture building, or masonry drilling.',
    specifications: {
      'Motor Type': 'Brushless High Torque',
      'Battery Voltage': '20V Max Lithium-Ion',
      Speeds: '2-Speed Transmission (0-450 & 0-1650 RPM)',
    },
    includedItems: ['DeWalt DCD778 Hammer Drill', '2x 4.0Ah Batteries', 'Rapid Charger', 'Masonry & Wood Bit Box'],
    rentalTerms: ['Return clean with all bits checked'],
    reviews: [
      {
        id: 'rev-301',
        authorName: 'Chathura Bandara',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        rating: 5,
        date: '1 week ago',
        comment: 'Worked like a charm for mounting heavy wall shelves into concrete walls.',
      },
    ],
  },
  {
    id: 'sony-a7iv',
    title: 'Sony Alpha A7 IV Full-Frame Camera + 24-70mm GM',
    category: 'Electronics',
    categorySlug: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 5500,
    location: 'Colombo 07',
    district: 'Colombo',
    rating: 4.92,
    reviewsCount: 41,
    availableNow: true,
    isPopular: true,
    isRecent: false,
    provider: TOP_PROVIDERS[0],
    description:
      'Flagship hybrid shooter from Sony with 33MP Exmor R sensor, S-Cinetone color profile, 4K 60p video, and cutting-edge real-time autofocus. Paired with the sharp Sony 24-70mm f/2.8 G-Master lens.',
    specifications: {
      Sensor: '33 Megapixels Full-Frame BSI CMOS',
      Video: '4K 60p 10-bit 4:2:2 All-Intra',
      Lens: 'Sony FE 24-70mm f/2.8 GM included',
    },
    includedItems: ['Sony A7 IV Body', 'Sony 24-70mm f/2.8 GM Lens', '3x NP-FZ100 Batteries', 'Dual Charger', '128GB V90 SD Card'],
    rentalTerms: ['Valid ID verification required'],
    reviews: [],
  },
  {
    id: 'dji-mavic-3',
    title: 'DJI Mavic 3 Pro Cine Drone (Fly More Combo)',
    category: 'Electronics',
    categorySlug: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 8500,
    location: 'Kandy City',
    district: 'Kandy',
    rating: 4.96,
    reviewsCount: 34,
    availableNow: true,
    isPopular: true,
    isRecent: true,
    provider: TOP_PROVIDERS[2],
    description:
      'Triple-camera system featuring Hasselblad 4/3 CMOS 5.1K video, 70mm medium telephoto, and 166mm telephoto camera. Includes DJI RC Pro controller with built-in ultrabright monitor and 3 flight batteries for up to 130 mins flight time.',
    specifications: {
      FlightTime: 'Up to 43 mins per battery (3 included)',
      Video: '5.1K Apple ProRes 422 HQ / 4K 120fps',
      Transmission: 'DJI O3+ up to 15km range',
    },
    includedItems: ['DJI Mavic 3 Pro Drone', 'DJI RC Pro Smart Controller', '3x Intelligent Flight Batteries', 'ND Filter Set', 'Safety Hard Case'],
    rentalTerms: ['Experienced drone pilot required or CAA safety agreement signed'],
    reviews: [],
  },
  {
    id: 'yamaha-rayzr',
    title: 'Yamaha RayZR 125cc Fi Scooter (Daily Rental)',
    category: 'Vehicle',
    categorySlug: 'vehicle',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 2500,
    location: 'Galle Fort & Unawatuna',
    district: 'Galle',
    rating: 4.88,
    reviewsCount: 65,
    availableNow: true,
    isPopular: false,
    isRecent: true,
    provider: TOP_PROVIDERS[1],
    description:
      'Nimble, reliable, and fuel-efficient 125cc scooter. Perfect for exploring southern coastal beaches, Galle Fort, and surf spots. Helmet and phone mount included.',
    specifications: {
      Engine: '125cc Fuel Injected Blue Core',
      Weight: 'Ultra-lightweight 99 kg',
      Start: 'Electric Push & Kick Start',
    },
    includedItems: ['2x Clean Helmets', 'Waterproof Phone Mount', 'Full Tank on Handover'],
    rentalTerms: ['Valid motorcycle license required'],
    reviews: [],
  },
  {
    id: 'jbl-partybox-710',
    title: 'JBL PartyBox 710 High-Power 800W Bluetooth Speaker',
    category: 'Fashion',
    categorySlug: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 4000,
    location: 'Negombo & Katunayake',
    district: 'Gampaha',
    rating: 4.9,
    reviewsCount: 22,
    availableNow: true,
    isPopular: false,
    isRecent: true,
    provider: TOP_PROVIDERS[0],
    description:
      'Massive 800-watt RMS sound with dynamic light show synced to the beat. Splashproof IPX4, dual mic and guitar inputs, heavy-duty wheels and handle for easy transport.',
    specifications: {
      Power: '800 Watts RMS',
      Connectivity: 'Bluetooth 5.1, USB, AUX, Dual 6.3mm Mic/Guitar Inputs',
      Lighting: 'Customizable strobe, starry night, and pulse lights',
    },
    includedItems: ['JBL PartyBox 710', 'Power cord', '2x Wireless microphones'],
    rentalTerms: ['Security deposit LKR 5,000 required'],
    reviews: [],
  },
  {
    id: 'macbook-pro-m2',
    title: 'Apple MacBook Pro 16" M2 Max (32GB RAM / 1TB SSD)',
    category: 'Computers',
    categorySlug: 'computers',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80',
    ],
    pricePerDay: 7500,
    location: 'Colombo 04, Bambalapitiya',
    district: 'Colombo',
    rating: 5.0,
    reviewsCount: 19,
    availableNow: true,
    isPopular: false,
    isRecent: true,
    provider: TOP_PROVIDERS[0],
    description:
      'High-performance production laptop configured with 32-core GPU, Liquid Retina XDR display, and 32GB unified memory. Pre-loaded with Adobe Creative Cloud and DaVinci Resolve Studio.',
    specifications: {
      Chip: 'Apple M2 Max (12-core CPU, 38-core GPU)',
      Memory: '32GB Unified RAM',
      Storage: '1TB Ultra-Fast NVMe SSD',
      Screen: '16.2" Liquid Retina XDR (120Hz ProMotion, 1600 nits)',
    },
    includedItems: ['MacBook Pro 16"', '140W USB-C GaN Fast Charger & MagSafe Cable', 'Protective padded sleeve'],
    rentalTerms: ['Studio or commercial use verification required'],
    reviews: [],
  },
];
