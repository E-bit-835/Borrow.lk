import bcrypt from 'bcryptjs';
import { seedCategories, seedListings } from './seedCatalog';
import { query } from '../config/db';

export async function seedDatabase() {
  console.log('🌱 Seeding NeonDB database with initial data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const users = [
    {
      id: 'usr_admin',
      name: 'BorrowLK Admin',
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@borrow.lk',
      password_hash: passwordHash,
      phone: '+94771234567',
      role: 'admin',
      district: 'Colombo',
      city: 'Colombo 07',
      address: 'No. 45, Alfred House Gardens, Colombo 03',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
      verification_status: 'verified',
      email_verified: true,
      phone_verified: true,
      nic_verified: true,
    },
    {
      id: 'usr_prov_1',
      name: 'Janaka Perera',
      first_name: 'Janaka',
      last_name: 'Perera',
      email: 'janaka@borrow.lk',
      password_hash: passwordHash,
      phone: '+94712345678',
      role: 'provider',
      district: 'Colombo',
      city: 'Colombo 03',
      business_name: 'Lanka Gear & Camera Rentals',
      address: '22 Galle Road, Colombo 03',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
      verification_status: 'verified',
      email_verified: true,
      phone_verified: true,
      nic_verified: true,
      rating: 4.9,
      reviews_count: 84,
      rentals_count: 142,
    },
    {
      id: 'usr_prov_2',
      name: 'Kasun Silva',
      first_name: 'Kasun',
      last_name: 'Silva',
      email: 'kasun@borrow.lk',
      password_hash: passwordHash,
      phone: '+94703456789',
      role: 'provider',
      district: 'Colombo',
      city: 'Colombo 07',
      business_name: 'Apex Wheels Lanka',
      address: '15 Gregorys Road, Colombo 07',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
      verification_status: 'verified',
      email_verified: true,
      phone_verified: true,
      nic_verified: true,
      rating: 5.0,
      reviews_count: 62,
      rentals_count: 98,
    },
    {
      id: 'usr_cust_1',
      name: 'Kasun Dias',
      first_name: 'Kasun',
      last_name: 'Dias',
      email: 'customer@borrow.lk',
      password_hash: passwordHash,
      phone: '+94765432109',
      role: 'customer',
      district: 'Colombo',
      city: 'Bambalapitiya',
      address: '42/1 Duplication Road, Colombo 04',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces&q=80',
      verification_status: 'verified',
      email_verified: true,
      phone_verified: true,
      nic_verified: true,
      rating: 5.0,
      reviews_count: 12,
      rentals_count: 8,
    }
  ];

  for (const u of users) {
    await query(`
      INSERT INTO users (id, name, first_name, last_name, email, password_hash, phone, role, district, city, address, business_name, avatar, verification_status, email_verified, phone_verified, nic_verified, rating, reviews_count, rentals_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        district = EXCLUDED.district,
        city = EXCLUDED.city;
    `, [
      u.id, u.name, u.first_name, u.last_name, u.email, u.password_hash, u.phone, u.role, u.district, u.city,
      u.address, u.business_name || null, u.avatar, u.verification_status, u.email_verified, u.phone_verified,
      u.nic_verified, u.rating || 5.0, u.reviews_count || 0, u.rentals_count || 0
    ]);
  }

  // 2. Seed Clients (for Client Management & Order placement)
  const clients = [
    {
      id: 'cli_1',
      user_id: 'usr_prov_1',
      name: 'Apex Cinematics Ltd',
      email: 'productions@apex.lk',
      phone: '+94779876543',
      company: 'Apex Media & Film Co',
      district: 'Colombo',
      city: 'Colombo 07',
      address: '77 Horton Place, Colombo 07',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
      nic_number: '198523400192',
      status: 'active',
      client_type: 'corporate',
      total_rentals: 14,
      total_spent: 245000.00,
      trust_score: 4.95,
      notes: 'High-volume production house client. Reliable on-time return.',
    },
    {
      id: 'cli_2',
      user_id: 'usr_prov_1',
      name: 'Nadeesha Fernando',
      email: 'nadeesha.f@gmail.com',
      phone: '+94711238899',
      company: 'Freelance Photography',
      district: 'Gampaha',
      city: 'Negombo',
      address: '14/B Beach Road, Negombo',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      nic_number: '926830112V',
      status: 'active',
      client_type: 'individual',
      total_rentals: 6,
      total_spent: 78000.00,
      trust_score: 4.88,
      notes: 'Weekend wedding photographer. Frequently rents full frame lenses.',
    },
    {
      id: 'cli_3',
      user_id: 'usr_prov_2',
      name: 'Ceylon Safari & Tours',
      email: 'bookings@ceylonsafari.lk',
      phone: '+94764445566',
      company: 'Ceylon Eco Safaris',
      district: 'Kandy',
      city: 'Kandy City',
      address: '89 Peradeniya Road, Kandy',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      nic_number: '200112300481',
      status: 'active',
      client_type: 'corporate',
      total_rentals: 22,
      total_spent: 420000.00,
      trust_score: 5.00,
      notes: 'VIP tourism client. Needs 4x4 vehicles and rugged equipment.',
    },
    {
      id: 'cli_4',
      user_id: 'usr_prov_1',
      name: 'Dilshan Wickramasinghe',
      email: 'dilshan.w@outlook.com',
      phone: '+94709988776',
      company: 'Self-Employed',
      district: 'Galle',
      city: 'Galle Fort',
      address: '33 Lighthouse Street, Galle',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      nic_number: '881020443V',
      status: 'active',
      client_type: 'individual',
      total_rentals: 3,
      total_spent: 34500.00,
      trust_score: 4.70,
      notes: 'Occasional renter for coastal events and clothing.',
    }
  ];

  for (const c of clients) {
    await query(`
      INSERT INTO clients (id, user_id, name, email, phone, company, district, city, address, avatar, nic_number, status, client_type, total_rentals, total_spent, trust_score, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        total_rentals = EXCLUDED.total_rentals,
        total_spent = EXCLUDED.total_spent;
    `, [
      c.id, c.user_id, c.name, c.email, c.phone, c.company, c.district, c.city, c.address, c.avatar,
      c.nic_number, c.status, c.client_type, c.total_rentals, c.total_spent, c.trust_score, c.notes
    ]);
  }

  // 3. Seed Categories
  await seedCategories();

  // 4. Seed Clothing Types
  const clothingTypes = [
    {
      id: 'ct_saree',
      category_id: 'fashion',
      name: 'Bridal & Party Sarees (Kandyan & Indian)',
      slug: 'bridal-sarees',
      gender: 'female',
      size_chart: JSON.stringify(['Free Size', 'Custom Tailored']),
      base_deposit_rate: 25.00,
      inspection_criteria: JSON.stringify(['Zari / Embroidery integrity', 'No stains on pleats or pallu', 'Blouse fitting undamaged', 'Dry cleaning certified']),
      description: 'Luxury hand-embroidered silks and Kandyan bridal attire.',
    },
    {
      id: 'ct_sherwani',
      category_id: 'fashion',
      name: 'Royal Groom Sherwanis & Indo-Western',
      slug: 'groom-sherwanis',
      gender: 'male',
      size_chart: JSON.stringify(['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)']),
      base_deposit_rate: 20.00,
      inspection_criteria: JSON.stringify(['Buttons and brooches intact', 'Collar & inner lining spotless', 'Pants hem check']),
      description: 'Designer groom wear with stole, turban, and matching accessories.',
    },
    {
      id: 'ct_tuxedo',
      category_id: 'fashion',
      name: 'Black Tie Tuxedos & 3-Piece Italian Suits',
      slug: 'black-tie-tuxedos',
      gender: 'male',
      size_chart: JSON.stringify(['36R', '38R', '40R', '42R', '44R', '46R']),
      base_deposit_rate: 15.00,
      inspection_criteria: JSON.stringify(['Satin lapel check', 'Trouser creasing intact', 'Vest condition']),
      description: 'Classic and modern slim-fit formal suits for galas, red carpets, and corporate dinners.',
    },
    {
      id: 'ct_evening_gown',
      category_id: 'fashion',
      name: 'Haute Couture Evening Gowns',
      slug: 'evening-gowns',
      gender: 'female',
      size_chart: JSON.stringify(['UK 6 (XS)', 'UK 8 (S)', 'UK 10 (M)', 'UK 12 (L)', 'UK 14 (XL)']),
      base_deposit_rate: 30.00,
      inspection_criteria: JSON.stringify(['Sequins / Beads retention', 'Hemline free of dirt/tears', 'Zipper operational']),
      description: 'Red carpet evening gowns, prom dresses, and cocktail outfits.',
    }
  ];

  for (const ct of clothingTypes) {
    await query(`
      INSERT INTO clothing_types (id, category_id, name, slug, gender, size_chart, base_deposit_rate, inspection_criteria, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        gender = EXCLUDED.gender,
        base_deposit_rate = EXCLUDED.base_deposit_rate;
    `, [ct.id, ct.category_id, ct.name, ct.slug, ct.gender, ct.size_chart, ct.base_deposit_rate, ct.inspection_criteria, ct.description]);
  }

  // 5. Seed Products / Listings
  const products = [
    {
      id: 'prod_canon_r6',
      provider_id: 'usr_prov_1',
      title: 'Canon EOS R6 Mark II + RF 24-70mm f/2.8L IS USM',
      category: 'Photography & Video',
      category_slug: 'photography',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
      ]),
      price_per_day: 12500.00,
      deposit: 25000.00,
      location: 'Colombo 03 Hub',
      district: 'Colombo',
      rating: 4.9,
      reviews_count: 42,
      available_now: true,
      is_popular: true,
      featured_badge: 'Top Pick',
      description: 'Flagship full-frame hybrid mirrorless camera with 24.2 MP, 4K 60p oversampled 10-bit video, and ultra-fast Dual Pixel AF.',
      specifications: JSON.stringify({
        'Sensor': '24.2 MP Full-Frame CMOS',
        'Video': '6K RAW External, 4K 60p 10-bit',
        'Stabilization': 'In-Body 5-Axis (up to 8 stops)',
        'Mount': 'Canon RF Mount'
      }),
      included_items: JSON.stringify(['Canon EOS R6 Mark II Body', 'RF 24-70mm f/2.8L Lens', '2x LP-E6NH Batteries', '128GB V90 Card', 'Charger & Pelican Bag']),
      rental_terms: JSON.stringify(['NIC / Passport copy required', 'LankaPay Safe Deposit', 'Same-day returns by 8:00 PM']),
    },
    {
      id: 'prod_sony_fx3',
      provider_id: 'usr_prov_1',
      title: 'Sony FX3 Cinema Line Camera + XLR Handle Unit',
      category: 'Photography & Video',
      category_slug: 'photography',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&auto=format&fit=crop&q=80'
      ]),
      price_per_day: 18500.00,
      deposit: 35000.00,
      location: 'Colombo 07',
      district: 'Colombo',
      rating: 5.0,
      reviews_count: 31,
      available_now: true,
      is_popular: true,
      featured_badge: 'Cinema Grade',
      description: 'Compact Full-Frame Cinema Line camera with S-Cinetone, 4K 120p, active cooling fan, and professional XLR top audio handle.',
      specifications: JSON.stringify({
        'Sensor': '12.1 MP Full-Frame Exmor R BSI',
        'ISO': 'Expandable up to 409,600',
        'Cooling': 'Built-in active cooling fan'
      }),
      included_items: JSON.stringify(['Sony FX3 Body', 'XLR Handle Unit', '3x NP-FZ100 Batteries', '160GB CFexpress Type A', 'Cage & Rig']),
      rental_terms: JSON.stringify(['Commercial deposit or verified company ID required', '24h advance booking']),
    },
    {
      id: 'prod_bridal_saree',
      provider_id: 'usr_prov_1',
      title: 'Royal Kandyan Bridal Osariya with Gold-Plated Jewellery Set',
      category: 'Clothing & Designer Apparel',
      category_slug: 'clothing',
      clothing_type_id: 'ct_saree',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'
      ]),
      price_per_day: 22000.00,
      deposit: 15000.00,
      location: 'Colombo 07 Boutique',
      district: 'Colombo',
      rating: 4.95,
      reviews_count: 28,
      available_now: true,
      is_popular: true,
      featured_badge: 'Bridal Premium',
      description: 'Authentic pure silk Kandyan bridal outfit with hand-beaded zari, complete traditional 7-necklace set, Nalalpata, ear pendants, and agasthi.',
      specifications: JSON.stringify({
        'Fabric': '100% Pure Kanchipuram Silk & Velvet',
        'Work': 'Hand-crafted Zari & Kundan stone work',
        'Jewellery': '24K Micron Gold Plated Traditional Set'
      }),
      included_items: JSON.stringify(['Bridal Osariya Saree & Embroidered Blouse', 'Full Kandyan Jewellery Box (7 Necklaces)', 'Headpiece (Nalalpata)', 'Bangles & Belt']),
      rental_terms: JSON.stringify(['Professional fitting consultation included', 'Dry-cleaning handled by BorrowLK', 'Deposit returned upon inspection']),
    },
    {
      id: 'prod_tuxedo_suit',
      provider_id: 'usr_prov_1',
      title: 'Italian Wool Midnight Blue Dinner Tuxedo Set',
      category: 'Clothing & Designer Apparel',
      category_slug: 'clothing',
      clothing_type_id: 'ct_tuxedo',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80'
      ]),
      price_per_day: 8500.00,
      deposit: 10000.00,
      location: 'Colombo 03',
      district: 'Colombo',
      rating: 4.88,
      reviews_count: 19,
      available_now: true,
      is_popular: false,
      featured_badge: 'Designer Suit',
      description: 'Super 140s Italian wool midnight blue tuxedo with black silk shawl lapel, matching slim trousers, bowtie, and cufflinks.',
      specifications: JSON.stringify({
        'Material': '100% Super 140s Virgin Wool',
        'Lapel': 'Black Satin Silk Shawl',
        'Fit': 'Modern Slim European Cut'
      }),
      included_items: JSON.stringify(['Tuxedo Jacket', 'Tailored Trousers', 'Black Satin Bowtie', 'Mother of Pearl Cufflinks', 'Suit Carrier Bag']),
      rental_terms: JSON.stringify(['Standard 3-day rental bundle available', 'Alterations restricted to temporary baste']),
    },
    {
      id: 'prod_prius_car',
      provider_id: 'usr_prov_2',
      title: 'Toyota Prius 4th Gen Hybrid (Auto) - Unlimited KM Option',
      category: 'Vehicles & Scooters',
      category_slug: 'vehicles',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
      ]),
      price_per_day: 11000.00,
      deposit: 20000.00,
      location: 'Colombo Airport / City',
      district: 'Colombo',
      rating: 4.9,
      reviews_count: 112,
      available_now: true,
      is_popular: true,
      featured_badge: 'Eco Friendly',
      description: 'Smooth and ultra-fuel-efficient 2020 Toyota Prius Hybrid with Apple CarPlay, lane assist, adaptive cruise control, and clean interior.',
      specifications: JSON.stringify({
        'Engine': '1.8L Petrol Hybrid Synergy Drive',
        'Transmission': 'Automatic e-CVT',
        'Fuel Economy': '24-28 km/L',
        'Seating': '5 Passengers + 3 Luggage'
      }),
      included_items: JSON.stringify(['Comprehensive Insurance', 'Airport Pickup Available', 'Spare Wheel & Toolkit', 'Phone Mount & USB-C Cable']),
      rental_terms: JSON.stringify(['Valid Sri Lankan Driving License or International Permit', 'Security deposit via card hold', 'Return with same fuel level']),
    }
  ];

  for (const p of products) {
    await query(`
      INSERT INTO products (id, provider_id, title, category, category_slug, clothing_type_id, images, price_per_day, deposit, location, district, rating, reviews_count, available_now, is_popular, featured_badge, description, specifications, included_items, rental_terms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price_per_day = EXCLUDED.price_per_day,
        deposit = EXCLUDED.deposit,
        rating = EXCLUDED.rating;
    `, [
      p.id, p.provider_id, p.title, p.category, p.category_slug, p.clothing_type_id || null, p.images,
      p.price_per_day, p.deposit, p.location, p.district, p.rating, p.reviews_count, p.available_now,
      p.is_popular, p.featured_badge || null, p.description, p.specifications, p.included_items, p.rental_terms
    ]);
  }

  // Move the listings above into the nine BorrowLK categories and add one sample per category
  await seedListings();

  // 6. Seed Predictions (Both Open Source AI & Custom ML Model)
  const predictions = [
    {
      id: 'pred_os_101',
      user_id: 'usr_cust_1',
      client_id: 'cli_1',
      product_id: 'prod_canon_r6',
      prediction_method: 'OPEN_SOURCE_AI',
      model_name: 'meta-llama/Llama-3.2-3B-Instruct (Open Source)',
      model_version: '3.2.0',
      input_data: JSON.stringify({
        rentalDays: 3,
        itemCategory: 'Photography & Video',
        rentalPurpose: 'Commercial 3-Day Music Video Shoot',
        expectedHoursPerDay: 10,
        indoorOutdoor: 'Both',
        insuranceRequired: true
      }),
      input_image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
      prediction_result: JSON.stringify({
        recommendedDailyRate: 12500,
        estimatedTotal: 37500,
        recommendedDeposit: 25000,
        riskScore: 'Low (0.12)',
        demandForecast: 'High Peak (94% utilization this weekend)',
        compatibilityScore: 98,
        aiAssessment: 'Optimal gear match for commercial music video shoot. 4K 10-bit 60fps handles fast motion capture. Low wear risk with pro crew.',
        insights: [
          'Recommend adding 1x additional V90 high-speed memory card.',
          'Colombo 03 pickup location is 15 minutes away from studio.'
        ]
      }),
      confidence_score: 0.9620,
      status: 'completed',
    },
    {
      id: 'pred_ml_202',
      user_id: 'usr_cust_1',
      client_id: 'cli_2',
      product_id: 'prod_bridal_saree',
      prediction_method: 'CUSTOM_ML',
      model_name: 'BorrowLK-RentalIntelligence-Ensemble',
      model_version: 'v2.4.1',
      input_data: JSON.stringify({
        clothingType: 'Bridal & Party Sarees',
        occasionType: 'Wedding Reception',
        durationDays: 2,
        weatherForecast: 'Dry / Indoor Air-Conditioned Venue',
        dryCleaningRequired: true,
        sizeSpecification: 'Free Size Pleated'
      }),
      input_image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      prediction_result: JSON.stringify({
        damageRiskProbability: 0.048,
        fabricConditionScore: 99.2,
        demandIndex: 9.8,
        calculatedDynamicDeposit: 15000,
        estimatedWearAndTear: 'Minimal / Surface lint only',
        cleaningCostEstimate: 2500,
        mlClassification: {
          category: 'Luxury Bridal Silk',
          inspectionRiskLevel: 'Negligible',
          resalePreservationRate: 98.4
        },
        featureImportances: {
          clientHistoryScore: 0.38,
          fabricDelicacyIndex: 0.28,
          indoorVenueFactor: 0.22,
          durationFactor: 0.12
        }
      }),
      confidence_score: 0.9785,
      status: 'completed',
    }
  ];

  for (const pred of predictions) {
    await query(`
      INSERT INTO predictions (id, user_id, client_id, product_id, prediction_method, model_name, model_version, input_data, input_image_url, prediction_result, confidence_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        prediction_result = EXCLUDED.prediction_result,
        confidence_score = EXCLUDED.confidence_score;
    `, [
      pred.id, pred.user_id, pred.client_id, pred.product_id, pred.prediction_method, pred.model_name,
      pred.model_version, pred.input_data, pred.input_image_url, pred.prediction_result, pred.confidence_score, pred.status
    ]);
  }

  // 7. Seed Orders
  const orders = [
    {
      id: 'ord_1001',
      order_number: 'BLK-2026-1001',
      user_id: 'usr_cust_1',
      client_id: 'cli_1',
      provider_id: 'usr_prov_1',
      product_id: 'prod_canon_r6',
      start_date: '2026-10-10',
      end_date: '2026-10-13',
      days: 3,
      daily_rate: 12500.00,
      total_price: 37500.00,
      deposit: 25000.00,
      status: 'confirmed',
      prediction_method: 'OPEN_SOURCE_AI',
      prediction_id: 'pred_os_101',
      notes: 'Studio shoot at Colombo 07. Requested 2 extra batteries.',
    },
    {
      id: 'ord_1002',
      order_number: 'BLK-2026-1002',
      user_id: 'usr_cust_1',
      client_id: 'cli_2',
      provider_id: 'usr_prov_1',
      product_id: 'prod_bridal_saree',
      start_date: '2026-10-18',
      end_date: '2026-10-20',
      days: 2,
      daily_rate: 22000.00,
      total_price: 44000.00,
      deposit: 15000.00,
      status: 'pending',
      prediction_method: 'CUSTOM_ML',
      prediction_id: 'pred_ml_202',
      notes: 'Wedding reception rental. Fitting scheduled for 16th Oct.',
    }
  ];

  for (const ord of orders) {
    await query(`
      INSERT INTO orders (id, order_number, user_id, client_id, provider_id, product_id, start_date, end_date, days, daily_rate, total_price, deposit, status, prediction_method, prediction_id, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        total_price = EXCLUDED.total_price;
    `, [
      ord.id, ord.order_number, ord.user_id, ord.client_id, ord.provider_id, ord.product_id, ord.start_date,
      ord.end_date, ord.days, ord.daily_rate, ord.total_price, ord.deposit, ord.status, ord.prediction_method,
      ord.prediction_id, ord.notes
    ]);
  }

  // 8. Seed Reviews
  const reviews = [
    {
      id: 'rev_1',
      product_id: 'prod_canon_r6',
      user_id: 'usr_cust_1',
      author_name: 'Kasun Dias',
      author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      rating: 5,
      comment: 'Exceptional camera quality! Everything was neatly packed in a Pelican hard case with all batteries charged. Janaka was very prompt in Colombo 03.'
    },
    {
      id: 'rev_2',
      product_id: 'prod_bridal_saree',
      user_id: 'usr_cust_1',
      author_name: 'Dilini W.',
      author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
      rating: 5,
      comment: 'Breathtaking Kandyan saree and gold jewellery set. Everyone at our wedding was complimenting the silk quality.'
    }
  ];

  for (const r of reviews) {
    await query(`
      INSERT INTO reviews (id, product_id, user_id, author_name, author_avatar, rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [r.id, r.product_id, r.user_id, r.author_name, r.author_avatar, r.rating, r.comment]);
  }

  // 9. Seed Notifications
  const notifications = [
    {
      id: 'notif_1',
      user_id: 'usr_cust_1',
      type: 'bookings',
      title: 'Booking Confirmed (#BLK-2026-1001)',
      description: 'Your Canon EOS R6 Mark II rental for Oct 10 - Oct 13 has been confirmed by provider Janaka Perera.',
      action_url: '/bookings',
      action_label: 'View Booking'
    },
    {
      id: 'notif_2',
      user_id: 'usr_cust_1',
      type: 'predictions',
      title: 'AI Intelligence Report Ready',
      description: 'Custom ML damage risk & pricing calculation generated with 97.8% confidence score.',
      action_url: '/ai-assistant',
      action_label: 'View Prediction'
    }
  ];

  for (const n of notifications) {
    await query(`
      INSERT INTO notifications (id, user_id, type, title, description, action_url, action_label)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [n.id, n.user_id, n.type, n.title, n.description, n.action_url, n.action_label]);
  }

  console.log('✅ NeonDB seeded successfully with real users, clients, products, clothing types, orders, and dual predictions!');
}

// Execute directly if run via CLI
const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

