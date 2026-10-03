/**
 * BorrowLK listing taxonomy: nine primary categories on one shared listing model.
 * Category-specific data lives in a listing's `specifications`, keyed by the field labels below,
 * so the create form, the detail page and the filters all read the same definitions.
 */
export type ListingType = 'rental' | 'service';
export type PriceUnit = 'hour' | 'day' | 'night' | 'week' | 'month' | 'service' | 'quote';

export interface CategoryField {
  /** Label shown to users and used as the key inside `specifications` */
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  /** Offer this field as a marketplace filter for the category */
  filter?: boolean;
  placeholder?: string;
}

export interface CategoryDef {
  slug: string;
  name: string;
  listingType: ListingType;
  subcategories: string[];
  /** Category landing copy */
  title: string;
  description: string;
  priceUnits: PriceUnit[];
  fields: CategoryField[];
}

const CONDITION: CategoryField = {
  label: 'Condition',
  type: 'select',
  options: ['Brand New', 'Like New', 'Good', 'Fair'],
  filter: true,
};

export const CATEGORY_DEFS: CategoryDef[] = [
  {
    slug: 'property',
    name: 'Property',
    listingType: 'rental',
    subcategories: ['Houses', 'Apartments', 'Rooms', 'Villas', 'Lands', 'Commercial Properties', 'Other Property'],
    title: 'Find a Property to Rent',
    description: 'Discover houses, apartments, rooms, villas and other properties available for rent across Sri Lanka.',
    priceUnits: ['night', 'week', 'month'],
    fields: [
      { label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Room', 'Villa', 'Land', 'Commercial'], filter: true },
      { label: 'Bedrooms', type: 'number', filter: true },
      { label: 'Bathrooms', type: 'number', filter: true },
      { label: 'Capacity', type: 'text', placeholder: 'e.g. 4 guests' },
      { label: 'Furnished', type: 'select', options: ['Furnished', 'Semi-furnished', 'Unfurnished'], filter: true },
      { label: 'Rental Period', type: 'text', placeholder: 'e.g. Nightly or monthly' },
    ],
  },
  {
    slug: 'vehicle',
    name: 'Vehicle',
    listingType: 'rental',
    subcategories: ['Cars', 'Vans', 'SUVs', 'Motorcycles', 'Tuk Tuks', 'Buses', 'Trucks', 'Other Vehicles'],
    title: 'Find a Vehicle to Rent',
    description: 'Rent cars, vans, SUVs, motorcycles, tuk tuks and more from verified hosts across Sri Lanka.',
    priceUnits: ['day', 'week', 'month'],
    fields: [
      { label: 'Vehicle Type', type: 'select', options: ['Car', 'Van', 'SUV', 'Motorcycle', 'Tuk Tuk', 'Bus', 'Truck'], filter: true },
      { label: 'Brand', type: 'text', filter: true },
      { label: 'Model', type: 'text', filter: true },
      { label: 'Year', type: 'number', filter: true },
      { label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'], filter: true },
      { label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'], filter: true },
      { label: 'Seats', type: 'number', filter: true },
      { label: 'Mileage', type: 'text', placeholder: 'e.g. 85,000 km' },
      CONDITION,
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics',
    listingType: 'rental',
    subcategories: ['Cameras', 'TVs', 'Speakers', 'Projectors', 'Gaming Consoles', 'Audio Equipment', 'Other Electronics'],
    title: 'Find Electronics to Rent',
    description: 'Cameras, projectors, speakers, TVs, gaming consoles and audio equipment for your next event or project.',
    priceUnits: ['day', 'week', 'month'],
    fields: [
      { label: 'Type', type: 'text', filter: true, placeholder: 'e.g. Mirrorless camera' },
      { label: 'Brand', type: 'text', filter: true },
      { label: 'Model', type: 'text' },
      CONDITION,
    ],
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    listingType: 'rental',
    subcategories: ['Chairs', 'Tables', 'Beds', 'Sofas', 'Cabinets', 'Office Furniture', 'Other Furniture'],
    title: 'Find Furniture to Rent',
    description: 'Chairs, tables, beds, sofas and office furniture for homes, offices and events.',
    priceUnits: ['day', 'week', 'month'],
    fields: [
      { label: 'Furniture Type', type: 'text', filter: true },
      { label: 'Brand', type: 'text' },
      { label: 'Material', type: 'text', filter: true },
      { label: 'Dimensions', type: 'text', placeholder: 'e.g. 120 x 60 x 75 cm' },
      { label: 'Delivery', type: 'select', options: ['Pickup only', 'Delivery available'], filter: true },
      CONDITION,
    ],
  },
  {
    slug: 'computers',
    name: 'Computers',
    listingType: 'rental',
    subcategories: ['Laptops', 'Desktop Computers', 'Monitors', 'Tablets', 'Printers', 'Accessories', 'Other Computers'],
    title: 'Find a Computer to Rent',
    description: 'Laptops, desktops, monitors, tablets and printers for work, study and events.',
    priceUnits: ['day', 'week', 'month'],
    fields: [
      { label: 'Device Type', type: 'select', options: ['Laptop', 'Desktop', 'Monitor', 'Tablet', 'Printer', 'Accessory'], filter: true },
      { label: 'Brand', type: 'text', filter: true },
      { label: 'Model', type: 'text' },
      { label: 'Processor', type: 'text', filter: true },
      { label: 'RAM', type: 'text', filter: true, placeholder: 'e.g. 16 GB' },
      { label: 'Storage', type: 'text', filter: true, placeholder: 'e.g. 512 GB SSD' },
      { label: 'GPU', type: 'text' },
      { label: 'Display', type: 'text' },
      { label: 'Operating System', type: 'text' },
      CONDITION,
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    listingType: 'rental',
    subcategories: ['Dresses', 'Suits', 'Traditional Wear', 'Wedding Wear', 'Costumes', 'Shoes', 'Other Fashion'],
    title: 'Find Fashion to Rent',
    description: 'Wedding wear, suits, traditional clothing, costumes and shoes for every occasion.',
    priceUnits: ['day', 'week'],
    fields: [
      { label: 'Fashion Type', type: 'text', filter: true },
      { label: 'Brand', type: 'text' },
      { label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'], filter: true },
      { label: 'Gender', type: 'select', options: ['Women', 'Men', 'Unisex', 'Kids'], filter: true },
      { label: 'Color', type: 'text' },
      { label: 'Material', type: 'text' },
      { label: 'Occasion', type: 'text', filter: true, placeholder: 'e.g. Wedding' },
      { label: 'Cleaning', type: 'text', placeholder: 'e.g. Dry cleaned before every rental' },
      CONDITION,
    ],
  },
  {
    slug: 'services',
    name: 'Services',
    listingType: 'service',
    subcategories: ['Drivers', 'Plumbers', 'Electricians', 'Gardeners', 'Cleaners', 'Cooks', 'Technicians', 'Repair Services', 'Event Services', 'Other Services'],
    title: 'Find Trusted Service Providers',
    description: 'Hire drivers, plumbers, electricians, cleaners, cooks, technicians and other professionals.',
    priceUnits: ['hour', 'day', 'week', 'service', 'quote'],
    fields: [
      { label: 'Service Type', type: 'text', filter: true, placeholder: 'e.g. Driver' },
      { label: 'Experience', type: 'text', filter: true, placeholder: 'e.g. 8 years' },
      { label: 'Service Area', type: 'text', filter: true, placeholder: 'e.g. Colombo district' },
      { label: 'Skills', type: 'text' },
      { label: 'Available Days', type: 'text', placeholder: 'e.g. Monday to Saturday' },
      { label: 'Available Hours', type: 'text', placeholder: 'e.g. 8:00 AM to 6:00 PM' },
      { label: 'Service Duration', type: 'text', placeholder: 'e.g. Minimum 1 hour' },
    ],
  },
  {
    slug: 'books',
    name: 'Books',
    listingType: 'rental',
    subcategories: ['Academic Books', 'School Books', 'University Books', 'Novels', 'Reference Books', 'Other Books'],
    title: 'Find Books to Rent',
    description: 'Academic, school and university books, novels and reference books.',
    priceUnits: ['day', 'week', 'month'],
    fields: [
      { label: 'Author', type: 'text', filter: true },
      { label: 'ISBN', type: 'text' },
      { label: 'Book Category', type: 'text', filter: true },
      { label: 'Edition', type: 'text' },
      { label: 'Language', type: 'select', options: ['Sinhala', 'Tamil', 'English'], filter: true },
      CONDITION,
    ],
  },
  {
    slug: 'other',
    name: 'Other',
    listingType: 'rental',
    subcategories: ['Sports Equipment', 'Tools', 'Party Equipment', 'Musical Instruments', 'Camping Equipment', 'Other'],
    title: 'Find Other Items to Rent',
    description: 'Sports equipment, tools, party and event equipment, musical instruments, camping gear and more.',
    priceUnits: ['hour', 'day', 'week', 'month'],
    fields: [
      { label: 'Item Type', type: 'text', filter: true },
      { label: 'Brand', type: 'text' },
      CONDITION,
    ],
  },
];

/** Looks a category up by slug or display name, case-insensitively ("Property", "property"). */
export function getCategory(value: string | undefined | null): CategoryDef | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  return CATEGORY_DEFS.find((c) => c.slug === v || c.name.toLowerCase() === v);
}

const UNIT_LABEL: Record<PriceUnit, string> = {
  hour: 'hour',
  day: 'day',
  night: 'night',
  week: 'week',
  month: 'month',
  service: 'service',
  quote: 'quote',
};

export const PRICE_UNIT_OPTIONS: Record<PriceUnit, string> = {
  hour: 'Per hour',
  day: 'Per day',
  night: 'Per night',
  week: 'Per week',
  month: 'Per month',
  service: 'Per service',
  quote: 'Custom quote',
};

/** "Rs. 4,500 / day", or "Custom quote" when the provider prices each job. */
export function formatPrice(price: number, unit: PriceUnit = 'day'): { amount: string; per: string } {
  if (unit === 'quote') return { amount: 'Custom quote', per: '' };
  return { amount: `Rs. ${Math.round(price).toLocaleString()}`, per: `/ ${UNIT_LABEL[unit] || 'day'}` };
}

/** Sri Lanka's provinces and districts, for location selection and search. */
export const PROVINCES: Record<string, string[]> = {
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Southern: ['Galle', 'Matara', 'Hambantota'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  Eastern: ['Trincomalee', 'Batticaloa', 'Ampara'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Uva: ['Badulla', 'Monaragala'],
  Sabaragamuwa: ['Ratnapura', 'Kegalle'],
};

export const DISTRICTS = Object.values(PROVINCES).flat().sort();

export function provinceOf(district: string): string | undefined {
  return Object.keys(PROVINCES).find((p) => PROVINCES[p].some((d) => d.toLowerCase() === district.trim().toLowerCase()));
}
