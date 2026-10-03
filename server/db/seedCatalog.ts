import { query, pool } from '../config/db';
import { CATEGORIES } from '../utils/categories';

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;

/** Upserts the nine BorrowLK categories and removes any older category rows. */
export async function seedCategories() {
  for (const cat of CATEGORIES) {
    await query(
      `INSERT INTO categories (id, name, slug, icon_name, count) VALUES ($1, $2, $1, $3, 0)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon_name = EXCLUDED.icon_name`,
      [cat.slug, cat.name, cat.icon]
    );
  }
  const slugs = CATEGORIES.map((c) => c.slug);
  // Clothing types hang off a category row: move them to Fashion before dropping the old categories
  await query(`UPDATE clothing_types SET category_id = 'fashion' WHERE category_id <> ALL($1)`, [slugs]);
  await query(`DELETE FROM categories WHERE id <> ALL($1)`, [slugs]);
}

/** Listings created before the nine-category model: move them into the right category. */
const LEGACY_LISTINGS: Array<[string, string, string, string]> = [
  // [id, category, slug, subcategory]
  ['prod_canon_r6', 'Electronics', 'electronics', 'Cameras'],
  ['prod_sony_fx3', 'Electronics', 'electronics', 'Cameras'],
  ['prod_bridal_saree', 'Fashion', 'fashion', 'Wedding Wear'],
  ['prod_tuxedo_suit', 'Fashion', 'fashion', 'Suits'],
  ['prod_prius_car', 'Vehicle', 'vehicle', 'Cars'],
];

const HOST = 'usr_prov_1';
const PROVIDER = 'usr_prov_2';

/** A small sample covering every category, each with the fields that category uses. */
const SAMPLE_LISTINGS = [
  {
    id: 'lst_apartment_col5', owner: HOST, type: 'rental', title: '2 Bedroom Furnished Apartment in Havelock Town',
    category: 'Property', slug: 'property', subcategory: 'Apartments', price: 8000, unit: 'night', deposit: 20000,
    location: 'Colombo 05', district: 'Colombo', province: 'Western', image: 'photo-1522708323590-d24dbb6b0267',
    description: 'Bright two-bedroom apartment close to Havelock City with parking, Wi-Fi and a fully equipped kitchen.',
    specs: { 'Property Type': 'Apartment', Bedrooms: '2', Bathrooms: '2', Capacity: '4 guests', Furnished: 'Furnished', 'Rental Period': 'Nightly or monthly' },
    included: ['Wi-Fi', 'Air conditioning', 'Parking', 'Kitchen', 'Washing machine'],
    terms: ['No smoking indoors', 'No parties or events', 'Check-in after 2 PM'],
  },
  {
    id: 'lst_villa_galle', owner: HOST, type: 'rental', title: 'Beachside Villa with Pool near Unawatuna',
    category: 'Property', slug: 'property', subcategory: 'Villas', price: 32000, unit: 'night', deposit: 50000,
    location: 'Unawatuna', district: 'Galle', province: 'Southern', image: 'photo-1582268611958-ebfd161ef9cf',
    description: 'Private three-bedroom villa a short walk from the beach, with a pool, garden and daily housekeeping.',
    specs: { 'Property Type': 'Villa', Bedrooms: '3', Bathrooms: '3', Capacity: '6 guests', Furnished: 'Furnished', 'Rental Period': 'Nightly' },
    included: ['Private pool', 'Wi-Fi', 'Air conditioning', 'Housekeeping', 'Parking'],
    terms: ['No loud music after 10 PM', 'Pets on request'],
  },
  {
    id: 'lst_kdh_van', owner: HOST, type: 'rental', title: 'Toyota KDH High Roof Van (14 Seats)',
    category: 'Vehicle', slug: 'vehicle', subcategory: 'Vans', price: 14000, unit: 'day', deposit: 25000,
    location: 'Kandy City', district: 'Kandy', province: 'Central', image: 'photo-1570125909232-eb263c188f7e',
    description: 'Comfortable high roof van for tours and family trips. Dual A/C and adjustable seats.',
    specs: { 'Vehicle Type': 'Van', Brand: 'Toyota', Model: 'KDH 200', Year: '2017', Transmission: 'Automatic', 'Fuel Type': 'Diesel', Seats: '14', Condition: 'Good' },
    included: ['Dual A/C', 'Comprehensive insurance', 'Spare wheel'],
    terms: ['Valid driving licence required', 'Return with the same fuel level', '200 km per day included'],
  },
  {
    id: 'lst_epson_projector', owner: HOST, type: 'rental', title: 'Epson Full HD Projector with 100" Screen',
    category: 'Electronics', slug: 'electronics', subcategory: 'Projectors', price: 4500, unit: 'day', deposit: 10000,
    location: 'Kurunegala Town', district: 'Kurunegala', province: 'North Western', image: 'photo-1517604931442-7e0c8ed2963c',
    description: 'Bright 3,600-lumen projector for events, lectures and movie nights. Screen and cables included.',
    specs: { Type: 'Projector', Brand: 'Epson', Model: 'EH-TW750', Condition: 'Like New' },
    included: ['100-inch tripod screen', 'HDMI cable', 'Remote', 'Carry bag'],
    terms: ['Handle the lens with care', 'Return in the carry bag'],
  },
  {
    id: 'lst_office_desks', owner: HOST, type: 'rental', title: 'Office Desk and Ergonomic Chair Set',
    category: 'Furniture', slug: 'furniture', subcategory: 'Office Furniture', price: 6500, unit: 'month', deposit: 8000,
    location: 'Negombo', district: 'Gampaha', province: 'Western', image: 'photo-1518455027359-f3f8164ba6bd',
    description: 'Sturdy work desk with a mesh ergonomic chair. Ideal for a home office or short-term project team.',
    specs: { 'Furniture Type': 'Office Furniture', Material: 'Engineered wood and steel', Dimensions: '120 x 60 x 75 cm', Condition: 'Good', Delivery: 'Delivery available' },
    included: ['Desk', 'Ergonomic chair'],
    terms: ['Minimum rental of one month', 'Delivery within Gampaha district'],
  },
  {
    id: 'lst_macbook_pro', owner: HOST, type: 'rental', title: 'MacBook Pro 14" M2 Pro for Editing',
    category: 'Computers', slug: 'computers', subcategory: 'Laptops', price: 5500, unit: 'day', deposit: 30000,
    location: 'Colombo 03', district: 'Colombo', province: 'Western', image: 'photo-1517336714731-489689fd1ca8',
    description: 'Fast laptop for video editing and development work. Charger and sleeve included.',
    specs: { 'Device Type': 'Laptop', Brand: 'Apple', Model: 'MacBook Pro 14', Processor: 'Apple M2 Pro', RAM: '16 GB', Storage: '512 GB SSD', Display: '14-inch Liquid Retina XDR', 'Operating System': 'macOS', Condition: 'Like New' },
    included: ['96W charger', 'Protective sleeve'],
    terms: ['Do not install system-level software', 'Returned devices are wiped'],
  },
  {
    id: 'lst_driver_colombo', owner: PROVIDER, type: 'service', title: 'Professional Driver for Tours and Airport Transfers',
    category: 'Services', slug: 'services', subcategory: 'Drivers', price: 5000, unit: 'day', deposit: 0,
    location: 'Colombo', district: 'Colombo', province: 'Western', image: 'photo-1449965408869-eaa3f722e40d',
    description: 'Licensed driver with 12 years of experience on long-distance tours, airport runs and corporate travel.',
    specs: { 'Service Type': 'Driver', Experience: '12 years', 'Service Area': 'Island-wide', 'Available Days': 'Monday to Sunday', 'Available Hours': '5:00 AM to 10:00 PM', Skills: 'English speaking, defensive driving, tour routes' },
    included: ['Driver only (your vehicle or a rented one)'],
    terms: ['Meals and accommodation covered by the customer on overnight trips'],
  },
  {
    id: 'lst_plumber_kandy', owner: PROVIDER, type: 'service', title: 'Plumbing Repairs and Installations',
    category: 'Services', slug: 'services', subcategory: 'Plumbers', price: 1500, unit: 'hour', deposit: 0,
    location: 'Kandy', district: 'Kandy', province: 'Central', image: 'photo-1585704032915-c3400ca199e7',
    description: 'Leak repairs, tap and sink installation, water tank and pump fitting for homes and small businesses.',
    specs: { 'Service Type': 'Plumber', Experience: '8 years', 'Service Area': 'Kandy district', 'Available Days': 'Monday to Saturday', 'Available Hours': '8:00 AM to 6:00 PM', Skills: 'Leak repair, pipe fitting, pump installation' },
    included: ['Standard tools'],
    terms: ['Materials are charged separately', 'Minimum charge of one hour'],
  },
  {
    id: 'lst_al_physics_books', owner: HOST, type: 'rental', title: 'A/L Physics Textbook Set (English Medium)',
    category: 'Books', slug: 'books', subcategory: 'Academic Books', price: 1200, unit: 'month', deposit: 2000,
    location: 'Matara', district: 'Matara', province: 'Southern', image: 'photo-1524995997946-a1c2e315a42f',
    description: 'Complete set of Advanced Level Physics textbooks with past paper collections.',
    specs: { Author: 'Various', Edition: '2023', Language: 'English', 'Book Category': 'Academic', Condition: 'Good' },
    included: ['3 textbooks', 'Past paper book'],
    terms: ['No writing or highlighting in the books'],
  },
  {
    id: 'lst_camping_tent', owner: HOST, type: 'rental', title: '4-Person Camping Tent with Sleeping Mats',
    category: 'Other', slug: 'other', subcategory: 'Camping Equipment', price: 2500, unit: 'day', deposit: 5000,
    location: 'Nuwara Eliya', district: 'Nuwara Eliya', province: 'Central', image: 'photo-1504280390367-361c6d9f38f4',
    description: 'Waterproof dome tent that sets up in ten minutes. Great for Horton Plains and Knuckles trips.',
    specs: { 'Item Type': 'Camping tent', Brand: 'Quechua', Condition: 'Good' },
    included: ['Tent', '4 sleeping mats', 'Pegs and guy lines', 'Carry bag'],
    terms: ['Return clean and dry'],
  },
];

export async function seedListings() {
  for (const [id, category, slug, subcategory] of LEGACY_LISTINGS) {
    await query(
      `UPDATE products SET category = $2, category_slug = $3, subcategory = $4, listing_type = 'rental',
              price_unit = 'day', province = COALESCE(province, 'Western') WHERE id = $1`,
      [id, category, slug, subcategory]
    );
  }

  // The sample service listings belong to this seed account, so it needs the provider capability
  await query(`UPDATE users SET provider_status = 'approved' WHERE id = $1`, [PROVIDER]);

  // The sample host has more listings than the free plan allows, so the seed gives it a paid plan
  await query(
    `INSERT INTO subscriptions (user_id, plan_id, expires_at)
     SELECT $1, 'plan_standard', NOW() + INTERVAL '365 days'
      WHERE EXISTS (SELECT 1 FROM subscription_plans WHERE id = 'plan_standard')
     ON CONFLICT (user_id) DO NOTHING`,
    [HOST]
  );

  for (const l of SAMPLE_LISTINGS) {
    await query(
      `INSERT INTO products (id, provider_id, listing_type, title, category, category_slug, subcategory, images,
                             price_per_day, price_unit, deposit, location, district, province, rating, reviews_count,
                             description, specifications, included_items, rental_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 5.0, 0, $15, $16, $17, $18)
       ON CONFLICT (id) DO UPDATE SET
         listing_type = EXCLUDED.listing_type, title = EXCLUDED.title, category = EXCLUDED.category,
         category_slug = EXCLUDED.category_slug, subcategory = EXCLUDED.subcategory, images = EXCLUDED.images,
         price_per_day = EXCLUDED.price_per_day, price_unit = EXCLUDED.price_unit, deposit = EXCLUDED.deposit,
         location = EXCLUDED.location, district = EXCLUDED.district, province = EXCLUDED.province,
         description = EXCLUDED.description, specifications = EXCLUDED.specifications,
         included_items = EXCLUDED.included_items, rental_terms = EXCLUDED.rental_terms`,
      [
        l.id, l.owner, l.type, l.title, l.category, l.slug, l.subcategory, JSON.stringify([img(l.image)]),
        l.price, l.unit, l.deposit, l.location, l.district, l.province, l.description,
        JSON.stringify(l.specs), JSON.stringify(l.included), JSON.stringify(l.terms),
      ]
    );
  }
}

// Execute directly: npm run db:seed:catalog
if (process.argv[1]?.includes('seedCatalog')) {
  (async () => {
    await seedCategories();
    await seedListings();
    console.log(`✅ Catalog ready: ${CATEGORIES.length} categories, ${SAMPLE_LISTINGS.length} sample listings.`);
    await pool.end();
  })().catch((err) => {
    console.error('❌ Catalog seed failed:', err.message);
    process.exit(1);
  });
}
