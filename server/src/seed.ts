/**
 * BookIt! Seed Script
 * -------------------
 * Populates the database with:
 * - Platform Master (`master@smartpatel.co.za`)
 * - Business Owners / Admins (`admin@bookit.com` / `admin@timetrack.com`, `thabo@...`, `ayesha@...`, `pieter@...`, `naledi@...`, `riaan@...`)
 * - Customers (`sipho@bookit.com` / `sipho@timetrack.com`, `lerato@...`)
 * - 6 published South African businesses across Doctor, Salon, Mechanic, Dentist, Spa & Wellness, and Fitness
 * - Services, Professionals, 14 days of open time slots, and realistic bookings (today, upcoming, pending, completed)
 *
 * All demo accounts use password: "Password123"
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from './prisma.js';
import { logger } from './logger.js';
import { DEFAULT_WORKING_HOURS, inferTemplateId } from './serializers.js';
import { businessNow } from './timezone.js';

const PASSWORD_HASH = bcrypt.hashSync('Password123', 10);
const MASTER_OPERATOR_PASSWORD_HASH = bcrypt.hashSync('ChangeMe123!', 10);

function addDays(baseDateStr: string, offset: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offset));
  return dt.toISOString().slice(0, 10);
}

async function main() {
  logger.info('[seed] Starting BookIt! database seed...');

  // Clean existing records in dependency order
  await prisma.auditLog.deleteMany();
  await prisma.cronLock.deleteMany();
  await prisma.retentionPolicy.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  const { dateStr: today } = businessNow();

  // ── 1. Platform Master Accounts ──
  const masterUser = await prisma.user.create({
    data: {
      email: 'master@smartpatel.co.za',
      fullName: 'Platform Master',
      phone: '+27 11 555 0100',
      role: 'master',
      passwordHash: PASSWORD_HASH,
    },
  });

  await prisma.user.create({
    data: {
      email: 'ricardo@smartpatel.tech',
      fullName: 'Ricardo Smart',
      phone: '+27 82 555 0101',
      role: 'master',
      passwordHash: MASTER_OPERATOR_PASSWORD_HASH,
    },
  });

  await prisma.user.create({
    data: {
      email: 'raees@smartpatel.tech',
      fullName: 'Raees Patel',
      phone: '+27 82 555 0102',
      role: 'master',
      passwordHash: MASTER_OPERATOR_PASSWORD_HASH,
    },
  });

  // ── 2. Customers (with both @bookit.com and @timetrack.com accounts) ──
  const sipho = await prisma.user.create({
    data: {
      email: 'sipho@bookit.com',
      fullName: 'Sipho Ndlovu',
      phone: '+27 82 555 0142',
      role: 'customer',
      passwordHash: PASSWORD_HASH,
    },
  });
  await prisma.user.create({
    data: {
      email: 'sipho@timetrack.com',
      fullName: 'Sipho Ndlovu',
      phone: '+27 82 555 0142',
      role: 'customer',
      passwordHash: PASSWORD_HASH,
    },
  });

  const lerato = await prisma.user.create({
    data: {
      email: 'lerato@bookit.com',
      fullName: 'Lerato Dlamini',
      phone: '+27 83 555 0198',
      role: 'customer',
      passwordHash: PASSWORD_HASH,
    },
  });
  await prisma.user.create({
    data: {
      email: 'lerato@timetrack.com',
      fullName: 'Lerato Dlamini',
      phone: '+27 83 555 0198',
      role: 'customer',
      passwordHash: PASSWORD_HASH,
    },
  });

  // ── Helper to create a Provider + Owner User (+ @timetrack.com alias) ──
  async function createProviderBundle(cfg: {
    ownerEmail: string;
    aliasEmail: string;
    ownerName: string;
    ownerPhone: string;
    ownerRole?: 'admin' | 'manager';
    name: string;
    category: string;
    templateId?: string;
    tagline: string;
    about: string;
    phone: string;
    email: string;
    website: string;
    street: string;
    city: string;
    postcode: string;
    coverImage: string;
    billingTier: string;
    vatNumber: string;
    registrationNumber: string;
    services: Array<{
      name: string;
      description: string;
      durationMinutes: number;
      price: number;
      priceNote?: string;
    }>;
    professionals: Array<{
      name: string;
      title: string;
      bio: string;
      photoUrl: string;
    }>;
  }) {
    const owner = await prisma.user.create({
      data: {
        email: cfg.ownerEmail,
        fullName: cfg.ownerName,
        phone: cfg.ownerPhone,
        role: cfg.ownerRole || 'admin',
        passwordHash: PASSWORD_HASH,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        name: cfg.name,
        category: cfg.category,
        templateId: inferTemplateId(cfg.category, cfg.templateId),
        tagline: cfg.tagline,
        about: cfg.about,
        phone: cfg.phone,
        email: cfg.email,
        website: cfg.website,
        street: cfg.street,
        city: cfg.city,
        postcode: cfg.postcode,
        country: 'South Africa',
        coverImage: cfg.coverImage,
        workingHours: DEFAULT_WORKING_HOURS as unknown as Prisma.InputJsonValue,
        ownerEmail: owner.email,
        ownerUserId: owner.id,
        status: 'published',
        isActive: true,
        billingTier: cfg.billingTier,
        vatNumber: cfg.vatNumber,
        registrationNumber: cfg.registrationNumber,
        primaryContactName: cfg.ownerName,
      },
    });

    await prisma.user.update({
      where: { id: owner.id },
      data: { providerId: provider.id },
    });

    // Also create the @timetrack.com alias user linked to the same provider
    await prisma.user.create({
      data: {
        email: cfg.aliasEmail,
        fullName: cfg.ownerName,
        phone: cfg.ownerPhone,
        role: cfg.ownerRole || 'admin',
        passwordHash: PASSWORD_HASH,
        providerId: provider.id,
      },
    });

    // Create professionals first
    const createdPros = [];
    for (const p of cfg.professionals) {
      const pro = await prisma.professional.create({
        data: {
          providerId: provider.id,
          name: p.name,
          title: p.title,
          bio: p.bio,
          photoUrl: p.photoUrl,
          active: true,
        },
      });
      createdPros.push(pro);
    }

    const proIds = createdPros.map((p) => p.id);

    // Create services linked to professionals
    const createdServices = [];
    for (const s of cfg.services) {
      const svc = await prisma.service.create({
        data: {
          providerId: provider.id,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: new Prisma.Decimal(s.price),
          priceNote: s.priceNote || '',
          professionalIds: proIds,
          active: true,
        },
      });
      createdServices.push(svc);
    }

    const serviceIds = createdServices.map((s) => s.id);
    for (const pro of createdPros) {
      await prisma.professional.update({
        where: { id: pro.id },
        data: { serviceIds },
      });
    }

    // Create 14 days of open time slots for each professional
    const slotTimes = [
      ['09:00', '09:30'],
      ['09:30', '10:00'],
      ['10:00', '10:30'],
      ['11:00', '11:30'],
      ['11:30', '12:00'],
      ['14:00', '14:30'],
      ['14:30', '15:00'],
      ['15:30', '16:00'],
    ];

    const slotsToInsert: Array<{
      providerId: string;
      professionalId: string;
      serviceId: string | null;
      date: string;
      startTime: string;
      endTime: string;
      status: 'open';
    }> = [];

    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const dateStr = addDays(today, dayOffset);
      for (const pro of createdPros) {
        for (const [startTime, endTime] of slotTimes) {
          slotsToInsert.push({
            providerId: provider.id,
            professionalId: pro.id,
            serviceId: null,
            date: dateStr,
            startTime,
            endTime,
            status: 'open',
          });
        }
      }
    }

    await prisma.slot.createMany({ data: slotsToInsert });

    return { provider, owner, professionals: createdPros, services: createdServices };
  }

  // ── Provider 1: Sandton Medical & Family Clinic (Doctor) ──
  const clinic = await createProviderBundle({
    ownerEmail: 'admin@bookit.com',
    aliasEmail: 'admin@timetrack.com',
    ownerName: 'Diana Prince',
    ownerPhone: '+27 11 555 0101',
    ownerRole: 'admin',
    name: 'Sandton Medical & Family Clinic',
    category: 'Doctor',
    tagline: 'Same-day GP consultations, executive wellness checks & family care in Sandton.',
    about:
      'Sandton Medical & Family Clinic offers unhurried, patient-first general practice, preventative screenings, and family medicine in the heart of Sandton. Book online and walk straight into your consultation.',
    phone: '+27 11 784 2100',
    email: 'reception@sandtonclinic.co.za',
    website: '',
    street: '12 Rivonia Road, Sandton',
    city: 'Johannesburg',
    postcode: '2196',
    coverImage:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'enterprise',
    vatNumber: 'ZA4120987654',
    registrationNumber: '2021/104582/07',
    services: [
      {
        name: 'General GP Consultation',
        description: 'Comprehensive 30-minute consultation, examination & script.',
        durationMinutes: 30,
        price: 650,
      },
      {
        name: 'Executive Wellness Assessment',
        description: 'Full vitals, ECG, blood panel review & lifestyle health plan.',
        durationMinutes: 60,
        price: 1450,
      },
      {
        name: 'Paediatric & Family Check-up',
        description: 'Gentle routine check-up and developmental review for children.',
        durationMinutes: 30,
        price: 580,
      },
    ],
    professionals: [
      {
        name: 'Dr. Amahle Nkosi',
        title: 'Senior General Practitioner (MBChB Wits)',
        bio: '14 years in family medicine, preventative cardiology and women’s health.',
        photoUrl:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Charl van Rooyen',
        title: 'Family Physician & Sports Medicine',
        bio: 'Specialises in sports injuries, chronic care management and executive wellness.',
        photoUrl:
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 2: Atelier Hair & Beauty Studio (Salon) ──
  const salon = await createProviderBundle({
    ownerEmail: 'thabo@bookit.com',
    aliasEmail: 'thabo@timetrack.com',
    ownerName: 'Thabo Mokoena',
    ownerPhone: '+27 11 555 0210',
    ownerRole: 'manager',
    name: 'Atelier Hair & Beauty Studio',
    category: 'Salon',
    tagline: 'Precision cuts, natural hair artistry, balayage & luxury manicure bar in Rosebank.',
    about:
      'Tucked onto Keyes Art Mile in Rosebank, Atelier brings together master colourists, curl specialists, and nail technicians using botanical South African products.',
    phone: '+27 11 447 8890',
    email: 'hello@atelierstudio.co.za',
    website: '',
    street: '21 Keyes Avenue, Rosebank',
    city: 'Johannesburg',
    postcode: '2196',
    coverImage:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4290112233',
    registrationNumber: '2022/330912/07',
    services: [
      {
        name: 'Signature Cut & Blowwave',
        description: 'Consultation, scalp massage, precision cut and salon blowwave.',
        durationMinutes: 45,
        price: 480,
      },
      {
        name: 'Balayage & Gloss Treatment',
        description: 'Bespoke hand-painted colour with bond-building botanical gloss.',
        durationMinutes: 90,
        price: 1350,
        priceNote: 'from',
      },
      {
        name: 'Gel Manicure & Nail Art',
        description: 'Cuticle care, structured BIAB or gel overlay and custom finish.',
        durationMinutes: 45,
        price: 390,
      },
    ],
    professionals: [
      {
        name: 'Zanele Mthembu',
        title: 'Master Stylist & Colour Director',
        bio: 'Award-winning colourist and textured hair specialist.',
        photoUrl:
          'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Liam Abrahams',
        title: 'Senior Barber & Precision Stylist',
        bio: 'Known for tailored fades, classic scissor work and effortless styling.',
        photoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 3: Cape Auto Precision Mechanics (Mechanic) ──
  const mechanic = await createProviderBundle({
    ownerEmail: 'ayesha@bookit.com',
    aliasEmail: 'ayesha@timetrack.com',
    ownerName: 'Ayesha Pillay',
    ownerPhone: '+27 21 555 0340',
    ownerRole: 'manager',
    name: 'Cape Auto Precision Mechanics',
    category: 'Mechanic',
    tagline: 'RMI-approved servicing, computer diagnostics & brake specialists in Cape Town.',
    about:
      'Transparent pricing, OEM parts, and digital service reports for German, Japanese, and local vehicles. Book a timed bay slot and get back on the road the same day.',
    phone: '+27 21 461 7700',
    email: 'service@capeautoprecision.co.za',
    website: '',
    street: '45 Bree Street, City Bowl',
    city: 'Cape Town',
    postcode: '8001',
    coverImage:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'enterprise',
    vatNumber: 'ZA4550998877',
    registrationNumber: '2019/887123/07',
    services: [
      {
        name: 'Comprehensive OBD-II Diagnostics & Inspection',
        description: 'Full electronic fault scan, battery health & 40-point safety check.',
        durationMinutes: 45,
        price: 550,
      },
      {
        name: 'Minor Oil & Filter Service',
        description: 'Synthetic oil change, OEM oil & air filters, fluid top-up and stamp.',
        durationMinutes: 60,
        price: 1650,
        priceNote: 'from',
      },
      {
        name: 'Brake Pad & Disc Replacement',
        description: 'Front or rear brake pad replacement, sensor check and road test.',
        durationMinutes: 60,
        price: 1200,
        priceNote: 'labour + parts',
      },
    ],
    professionals: [
      {
        name: 'Dawid Hendricks',
        title: 'Master Diagnostic Technician',
        bio: '18 years with BMW & Volkswagen before leading Cape Auto’s diagnostic bay.',
        photoUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Tariq Jacobs',
        title: 'Senior Mechanical Specialist',
        bio: 'Specialises in suspension, braking systems and scheduled logbook servicing.',
        photoUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 4: Waterfront Dental Studio (Dentist) ──
  await createProviderBundle({
    ownerEmail: 'pieter@bookit.com',
    aliasEmail: 'pieter@timetrack.com',
    ownerName: 'Pieter van der Merwe',
    ownerPhone: '+27 21 555 0411',
    ownerRole: 'admin',
    name: 'Waterfront Dental Studio',
    category: 'Dentist',
    tagline: 'Gentle digital dentistry, airflow hygiene & whitening at the V&A Waterfront.',
    about:
      'Modern, anxiety-free dental care featuring 3D intraoral scanning, guided biofilm therapy, and cosmetic restorations with views of Table Mountain.',
    phone: '+27 21 418 5200',
    email: 'smile@waterfrontdental.co.za',
    website: '',
    street: 'Dock Road, V&A Waterfront',
    city: 'Cape Town',
    postcode: '8002',
    coverImage:
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4660123456',
    registrationNumber: '2020/554321/07',
    services: [
      {
        name: 'Dental Check-up & Digital X-Rays',
        description: 'Full oral examination, 3D scan and personalised dental plan.',
        durationMinutes: 30,
        price: 720,
      },
      {
        name: 'Airflow Guided Hygiene & Polish',
        description: 'Warm-water pain-free stain & calculus removal with fluoride finish.',
        durationMinutes: 45,
        price: 890,
      },
    ],
    professionals: [
      {
        name: 'Dr.Ananya Naidoo',
        title: 'Principal Cosmetic & Restorative Dentist',
        bio: 'Passionate about minimally invasive dentistry and confident smiles.',
        photoUrl:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 5: Fynbos Botanical Spa & Wellness (Spa & Wellness) ──
  await createProviderBundle({
    ownerEmail: 'naledi@bookit.com',
    aliasEmail: 'naledi@timetrack.com',
    ownerName: 'Naledi Khumalo',
    ownerPhone: '+27 21 555 0522',
    ownerRole: 'admin',
    name: 'Fynbos Botanical Spa & Wellness',
    category: 'Spa & Wellness',
    tagline: 'Deep tissue massage, rooibos facials & hydrotherapy in Stellenbosch.',
    about:
      'Surrounded by Cape Winelands oaks, Fynbos Spa blends indigenous buchu, marula, and rooibos extracts with restorative bodywork.',
    phone: '+27 21 886 4300',
    email: 'sanctuary@fynbosspa.co.za',
    website: '',
    street: '18 Dorp Street',
    city: 'Stellenbosch',
    postcode: '7600',
    coverImage:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4770654321',
    registrationNumber: '2021/778899/07',
    services: [
      {
        name: '60-Min Deep Tissue Kalahari Massage',
        description: 'Targeted muscle release using warm marula and rosemary oil.',
        durationMinutes: 60,
        price: 850,
      },
      {
        name: 'Botanical Rooibos & Vitamin C Facial',
        description: 'Brightening antioxidant facial with lymphatic drainage.',
        durationMinutes: 60,
        price: 920,
      },
    ],
    professionals: [
      {
        name: 'Lindiwe Zulu',
        title: 'Senior Somatologist & Holistic Therapist',
        bio: 'CIDESCO-certified therapist specialising in deep myofascial release.',
        photoUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 6: Highveld Performance Fitness (Fitness) ──
  await createProviderBundle({
    ownerEmail: 'riaan@bookit.com',
    aliasEmail: 'riaan@timetrack.com',
    ownerName: 'Riaan Botha',
    ownerPhone: '+27 12 555 0633',
    ownerRole: 'admin',
    name: 'Highveld Performance Fitness',
    category: 'Fitness',
    tagline: '1-on-1 strength coaching, biokinetics & reformer pilates in Menlyn, Pretoria.',
    about:
      'Evidence-based personal training, sports conditioning, and injury rehabilitation tailored to busy professionals and athletes.',
    phone: '+27 12 348 9100',
    email: 'coach@highveldfitness.co.za',
    website: '',
    street: '84 Atterbury Road, Menlyn',
    city: 'Pretoria',
    postcode: '0081',
    coverImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4880987123',
    registrationNumber: '2022/665432/07',
    services: [
      {
        name: '1-on-1 Strength & Conditioning Session',
        description: 'Personalised 60-minute coaching session and mobility work.',
        durationMinutes: 60,
        price: 490,
      },
      {
        name: 'Biokinetics Movement & Injury Assessment',
        description: 'Postural, gait and strength screening with rehab programme.',
        durationMinutes: 45,
        price: 680,
      },
    ],
    professionals: [
      {
        name: 'Riaan Botha',
        title: 'Head Strength Coach & Biokineticist',
        bio: 'Former provincial rugby conditioning coach with 10+ years experience.',
        photoUrl:
          'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 7: Southside Padel & Sports Club (Sport Facilities) ──
  const sportsClub = await createProviderBundle({
    ownerEmail: 'marco@bookit.com',
    aliasEmail: 'marco@timetrack.com',
    ownerName: 'Marco Ferreira',
    ownerPhone: '+27 21 555 0711',
    ownerRole: 'admin',
    name: 'Southside Padel & Sports Club',
    category: 'Sport Facilities',
    templateId: 'Sport Facilities',
    tagline: 'Panoramic padel courts, floodlit tennis & 5-a-side turf in Claremont, Cape Town.',
    about:
      'Reserve panoramic glass padel courts, championship hard tennis courts, or coaching sessions with instant floodlight and equipment hire options.',
    phone: '+27 21 671 4420',
    email: 'courts@southsidesports.co.za',
    website: '',
    street: '14 Campground Road, Claremont',
    city: 'Cape Town',
    postcode: '7708',
    coverImage:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4890112233',
    registrationNumber: '2023/112233/07',
    services: [
      {
        name: '60-Min Panoramic Padel Court Hire',
        description: 'Doubles padel court booking for up to 4 players.',
        durationMinutes: 60,
        price: 480,
        priceNote: 'per court',
      },
      {
        name: '90-Min Championship Padel Slot',
        description: 'Extended 3-set match slot on Court 1 or Court 2.',
        durationMinutes: 90,
        price: 680,
        priceNote: 'per court',
      },
    ],
    professionals: [
      {
        name: 'Court 1 — Panoramic Padel & Coach Marco',
        title: 'Show Court 1 (LED Floodlit)',
        bio: 'WPT-grade turf with optional pro coaching or casual match play.',
        photoUrl:
          'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Court 2 — Covered All-Weather Padel',
        title: 'Covered Championship Court',
        bio: 'Protected from wind and rain with high-bay LED lighting.',
        photoUrl:
          'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 8: Cedar Academic Learning Centre (Tuition) ──
  await createProviderBundle({
    ownerEmail: 'priya@bookit.com',
    aliasEmail: 'priya@timetrack.com',
    ownerName: 'Priya Govender',
    ownerPhone: '+27 31 555 0812',
    ownerRole: 'admin',
    name: 'Cedar Academic Learning Centre',
    category: 'Tuition',
    templateId: 'Tuition',
    tagline: '1-on-1 & small-group IEB/CAPS Mathematics, Physical Sciences & English tuition in Umhlanga.',
    about:
      'Personalised in-person and online video lessons led by vetted subject specialists helping Grade 8–12 learners master exams with confidence.',
    phone: '+27 31 561 3300',
    email: 'admissions@cedarlearning.co.za',
    website: '',
    street: '32 Lagoon Drive, Umhlanga Rocks',
    city: 'Durban',
    postcode: '4320',
    coverImage:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4900112244',
    registrationNumber: '2022/223344/07',
    services: [
      {
        name: '1-on-1 Matric Mathematics / Science Lesson',
        description: 'Focused 60-minute individual lesson with past-paper worked solutions.',
        durationMinutes: 60,
        price: 450,
      },
      {
        name: 'Diagnostic Assessment & Study Plan',
        description: 'Baseline topic evaluation and tailored termly roadmap.',
        durationMinutes: 60,
        price: 380,
      },
    ],
    professionals: [
      {
        name: 'Priya Govender',
        title: 'Senior Mathematics & AP Maths Tutor (MSc)',
        bio: '11 years preparing IEB and CAPS matriculants for distinction results.',
        photoUrl:
          'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 9: Olive & Ember Courtyard Bistro (Restaurants & Cafes) ──
  const bistro = await createProviderBundle({
    ownerEmail: 'luca@bookit.com',
    aliasEmail: 'luca@timetrack.com',
    ownerName: 'Luca Rossi',
    ownerPhone: '+27 21 555 0915',
    ownerRole: 'admin',
    name: 'Olive & Ember Courtyard Bistro',
    category: 'Restaurants & Cafes',
    templateId: 'Restaurants & Cafes',
    tagline: 'Wood-fired seasonal plates, Cape wines & courtyard sittings in Gardens, Cape Town.',
    about:
      'Book your table in our vine-covered courtyard, main dining room, or chef’s counter. Let us know your party size, occasion, and dietary preferences ahead of arrival.',
    phone: '+27 21 424 6610',
    email: 'tables@oliveandember.co.za',
    website: '',
    street: '78 Kloof Street, Gardens',
    city: 'Cape Town',
    postcode: '8001',
    coverImage:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4910223344',
    registrationNumber: '2021/445566/07',
    services: [
      {
        name: 'À La Carte Lunch / Dinner Table Reservation',
        description: '90-minute table sitting in your preferred dining section.',
        durationMinutes: 90,
        price: 0,
        priceNote: 'Complimentary reservation',
      },
      {
        name: 'Chef’s 5-Course Wood-Fired Tasting Sitting',
        description: 'Signature seasonal tasting menu with optional Swartland wine pairing.',
        durationMinutes: 120,
        price: 895,
        priceNote: 'per guest',
      },
    ],
    professionals: [
      {
        name: 'Covered Olive Courtyard Section',
        title: 'Al Fresco Courtyard (Tables 1–10)',
        bio: 'Heated vine courtyard ideal for long lunches and evening celebrations.',
        photoUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Main Hearth Dining Room & Chef Counter',
        title: 'Indoor Dining & Open Kitchen',
        bio: 'Front-row views of the wood-fired hearth and sommelier wine wall.',
        photoUrl:
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 10: Poppy & Plate Bespoke Events (Catering & Events) ──
  await createProviderBundle({
    ownerEmail: 'claire@bookit.com',
    aliasEmail: 'claire@timetrack.com',
    ownerName: 'Claire van Zyl',
    ownerPhone: '+27 11 555 1018',
    ownerRole: 'admin',
    name: 'Poppy & Plate Bespoke Events',
    category: 'Catering & Events',
    templateId: 'Catering & Events',
    tagline: 'Artisan harvest tables, plated private dining & corporate catering in Parkhurst.',
    about:
      'From intimate 20-guest courtyard dinners to 150-guest corporate launches, Poppy & Plate crafts seasonal menus with full Halaal-friendly, vegan, and gluten-free options.',
    phone: '+27 11 442 9900',
    email: 'events@poppyandplate.co.za',
    website: '',
    street: '24 4th Avenue, Parkhurst',
    city: 'Johannesburg',
    postcode: '2193',
    coverImage:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'enterprise',
    vatNumber: 'ZA4920334455',
    registrationNumber: '2020/998877/07',
    services: [
      {
        name: 'Artisan Grazing & Canapé Event Package',
        description: 'Abundant harvest table and 6 passed hot/cold canapés.',
        durationMinutes: 120,
        price: 420,
        priceNote: 'per guest (min 20)',
      },
      {
        name: 'Private Menu Tasting & Event Consultation',
        description: 'In-kitchen tasting of 4 seasonal dishes and event run-sheet planning.',
        durationMinutes: 60,
        price: 650,
      },
    ],
    professionals: [
      {
        name: 'Claire van Zyl',
        title: 'Executive Chef & Event Director',
        bio: '15 years curating luxury weddings, brand launches and private dining.',
        photoUrl:
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 11: The Courtyard Heritage Venue (Venues & Spaces) ──
  await createProviderBundle({
    ownerEmail: 'kabelo@bookit.com',
    aliasEmail: 'kabelo@timetrack.com',
    ownerName: 'Kabelo Molefe',
    ownerPhone: '+27 11 555 1122',
    ownerRole: 'admin',
    name: 'The Courtyard Heritage Venue',
    category: 'Venues & Spaces',
    templateId: 'Venues & Spaces',
    tagline: 'Daylit conference halls, executive boardrooms & glass courtyard hire in Melrose.',
    about:
      'Flexible half-day and full-day venue hire with backup solar power, high-speed fibre, 4K laser projection, and barista catering packages.',
    phone: '+27 11 268 5510',
    email: 'hire@courtyardvenue.co.za',
    website: '',
    street: '19 Oxford Road, Melrose',
    city: 'Johannesburg',
    postcode: '2196',
    coverImage:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'enterprise',
    vatNumber: 'ZA4930445566',
    registrationNumber: '2019/334455/07',
    services: [
      {
        name: 'The Glass Courtyard — Half-Day Hire',
        description: 'Up to 80 guests in Theatre, Banquet, or Cocktail layout with backup power.',
        durationMinutes: 120,
        price: 6500,
        priceNote: 'half-day',
      },
      {
        name: 'Heritage Executive Boardroom (Up to 18)',
        description: 'Acoustic boardroom with 85" 4K display, video bar and uncapped fibre.',
        durationMinutes: 120,
        price: 2800,
        priceNote: 'half-day',
      },
    ],
    professionals: [
      {
        name: 'Kabelo Molefe',
        title: 'Lead Venue & Technical Coordinator',
        bio: 'Oversees room layouts, AV staging and catering turnarounds.',
        photoUrl:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 12: Oakline Plumbing & Electrical (Home & Trade Services) ──
  await createProviderBundle({
    ownerEmail: 'hendrik@bookit.com',
    aliasEmail: 'hendrik@timetrack.com',
    ownerName: 'Hendrik Coetzee',
    ownerPhone: '+27 21 555 1230',
    ownerRole: 'admin',
    name: 'Oakline Plumbing & Electrical',
    category: 'Home & Trade Services',
    templateId: 'Home & Trade Services',
    tagline: 'PIRB-registered plumbers, master electricians & solar geyser call-outs in Cape Town.',
    about:
      'Book a guaranteed arrival window with upfront call-out rates. We handle burst geysers, leak detection, DB board upgrades, and electrical COC inspections.',
    phone: '+27 21 551 8900',
    email: 'dispatch@oaklinetrades.co.za',
    website: '',
    street: '52 Marine Drive, Paarden Eiland',
    city: 'Cape Town',
    postcode: '7405',
    coverImage:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4940556677',
    registrationNumber: '2020/667788/07',
    services: [
      {
        name: 'Plumbing / Geyser Diagnostic Call-Out',
        description: 'On-site fault diagnosis, pressure test and first 60 minutes labour.',
        durationMinutes: 60,
        price: 680,
      },
      {
        name: 'Electrical Fault Finding & DB Inspection',
        description: 'Master electrician call-out for tripping circuits, inverters or plugs.',
        durationMinutes: 60,
        price: 750,
      },
    ],
    professionals: [
      {
        name: 'Hendrik Coetzee',
        title: 'Master Plumber & Gas Specialist (PIRB)',
        bio: '16 years residential & commercial plumbing across Cape Town.',
        photoUrl:
          'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 13: Paw & Polish Pet Grooming Studio (Pet Services) ──
  await createProviderBundle({
    ownerEmail: 'taryn@bookit.com',
    aliasEmail: 'taryn@timetrack.com',
    ownerName: 'Taryn Jenkins',
    ownerPhone: '+27 11 555 1340',
    ownerRole: 'admin',
    name: 'Paw & Polish Pet Grooming Studio',
    category: 'Pet Services',
    templateId: 'Pet Services',
    tagline: 'Cage-free dog & cat grooming, warm hydro-baths & breed styling in Bryanston.',
    about:
      'Low-stress, one-on-one grooming using hypoallergenic botanical shampoos, quiet blow-dryers, and gentle handling tailored to your pet’s breed and temperament.',
    phone: '+27 11 706 4120',
    email: 'woof@pawandpolish.co.za',
    website: '',
    street: '63 Ballyclare Drive, Bryanston',
    city: 'Johannesburg',
    postcode: '2191',
    coverImage:
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4950667788',
    registrationNumber: '2022/889900/07',
    services: [
      {
        name: 'Full Breed Groom, Hydro-Bath & Styling',
        description: 'Warm hydro-bath, blow-dry, breed clip/scissor finish, nails and ear clean.',
        durationMinutes: 90,
        price: 460,
        priceNote: 'from (by size)',
      },
      {
        name: 'Express Wash, De-Shed & Tidy',
        description: 'Deep coat wash, undercoat brush-out, sanitary trim and nail clip.',
        durationMinutes: 60,
        price: 340,
      },
    ],
    professionals: [
      {
        name: 'Taryn Jenkins',
        title: 'Head Certified Pet Stylist',
        bio: 'Specialises in doodles, terriers, double-coated breeds and anxious rescues.',
        photoUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 14: Frame House Creative Studio (Photography & Creative Services) ──
  await createProviderBundle({
    ownerEmail: 'sibusiso@bookit.com',
    aliasEmail: 'sibusiso@timetrack.com',
    ownerName: 'Sibusiso Mabaso',
    ownerPhone: '+27 21 555 1450',
    ownerRole: 'admin',
    name: 'Frame House Creative Studio',
    category: 'Photography & Creative Services',
    templateId: 'Photography & Creative Services',
    tagline: 'Editorial portrait, brand campaign & golden-hour location shoots in Woodstock.',
    about:
      'Daylight loft studio and on-location photography production with tethered proofing, color-graded online galleries, and optional hair & makeup styling.',
    phone: '+27 21 447 3090',
    email: 'studio@framehouse.co.za',
    website: '',
    street: '66 Albert Road, Woodstock',
    city: 'Cape Town',
    postcode: '7925',
    coverImage:
      'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'standard',
    vatNumber: 'ZA4960778899',
    registrationNumber: '2021/123987/07',
    services: [
      {
        name: 'Executive Portrait & Personal Brand Shoot',
        description: '60-minute studio or location session with 15 retouched high-res portraits.',
        durationMinutes: 60,
        price: 2250,
      },
      {
        name: 'Couple / Family Golden Hour Location Shoot',
        description: '90-minute outdoor shoot with 40 colour-graded images in private gallery.',
        durationMinutes: 90,
        price: 2950,
      },
    ],
    professionals: [
      {
        name: 'Sibusiso Mabaso',
        title: 'Principal Commercial & Portrait Photographer',
        bio: 'Published editorial and brand photographer across Cape Town and Johannesburg.',
        photoUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Provider 15: Cedar Legal & Financial Advisory (Professional Consultations) ──
  await createProviderBundle({
    ownerEmail: 'nadia@bookit.com',
    aliasEmail: 'nadia@timetrack.com',
    ownerName: 'Adv. Nadia Abrahams',
    ownerPhone: '+27 11 555 1560',
    ownerRole: 'admin',
    name: 'Cedar Legal & Financial Advisory',
    category: 'Professional Consultations',
    templateId: 'Professional Consultations',
    tagline: 'Corporate commercial law, tax structuring & fiduciary estate consultations in Sandton.',
    about:
      'Book confidential in-person boardroom or Microsoft Teams consultations with senior legal and tax advisors, complete with upfront conflict check and document review.',
    phone: '+27 11 883 7400',
    email: 'chambers@cedaradvisory.co.za',
    website: '',
    street: '105 West Street, Sandton',
    city: 'Johannesburg',
    postcode: '2196',
    coverImage:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    billingTier: 'enterprise',
    vatNumber: 'ZA4970889900',
    registrationNumber: '2018/776655/07',
    services: [
      {
        name: 'Initial Commercial & Tax Structuring Consultation',
        description: '60-minute partner consultation via video call or Sandton boardroom.',
        durationMinutes: 60,
        price: 1950,
      },
      {
        name: 'Estate, Trust & Fiduciary Review Session',
        description: 'Comprehensive review of wills, family trusts and succession structures.',
        durationMinutes: 60,
        price: 2400,
      },
    ],
    professionals: [
      {
        name: 'Adv. Nadia Abrahams',
        title: 'Managing Partner — Corporate & Tax (LLB, HDip Tax)',
        bio: '17 years advising South African founders, family offices and corporate boards.',
        photoUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      },
    ],
  });

  // ── Create Sample Bookings for Sandton Clinic, Atelier Salon & Cape Auto ──
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  // 1. Today's confirmed booking at Sandton Clinic for Sipho
  const clinicTodaySlot = await prisma.slot.findFirst({
    where: {
      providerId: clinic.provider.id,
      date: today,
      startTime: '10:00',
      status: 'open',
    },
  });
  const b1 = await prisma.booking.create({
    data: {
      providerId: clinic.provider.id,
      providerName: clinic.provider.name,
      serviceId: clinic.services[0].id,
      serviceName: clinic.services[0].name,
      professionalId: clinic.professionals[0].id,
      professionalName: clinic.professionals[0].name,
      slotId: clinicTodaySlot?.id ?? null,
      customerId: sipho.id,
      customerName: sipho.fullName,
      customerEmail: sipho.email,
      customerPhone: sipho.phone || '+27 82 555 0142',
      date: today,
      startTime: '10:00',
      endTime: '10:30',
      price: clinic.services[0].price,
      notes: 'Annual blood pressure & wellness check.',
      metadata: {
        template_id: 'Healthcare',
        stage: 'In waiting room',
        resource_label: 'Consulting Room 1',
        patient_type: 'Returning patient',
        payment_method: 'Medical aid claim',
        medical_aid_scheme: 'Discovery Health',
        medical_aid_number: '94810234',
      } as Prisma.InputJsonValue,
      status: 'confirmed',
    },
  });
  if (clinicTodaySlot) {
    await prisma.slot.update({
      where: { id: clinicTodaySlot.id },
      data: { status: 'booked', bookingId: b1.id },
    });
  }

  // 2. Today's pending booking at Sandton Clinic for Lerato
  const clinicPendingSlot = await prisma.slot.findFirst({
    where: {
      providerId: clinic.provider.id,
      date: today,
      startTime: '14:00',
      status: 'open',
    },
  });
  const b2 = await prisma.booking.create({
    data: {
      providerId: clinic.provider.id,
      providerName: clinic.provider.name,
      serviceId: clinic.services[1].id,
      serviceName: clinic.services[1].name,
      professionalId: clinic.professionals[1].id,
      professionalName: clinic.professionals[1].name,
      slotId: clinicPendingSlot?.id ?? null,
      customerId: lerato.id,
      customerName: lerato.fullName,
      customerEmail: lerato.email,
      customerPhone: lerato.phone || '+27 83 555 0198',
      date: today,
      startTime: '14:00',
      endTime: '15:00',
      price: clinic.services[1].price,
      notes: 'Discovery Vitality executive screening.',
      metadata: {
        template_id: 'Healthcare',
        stage: 'Scheduled',
        resource_label: 'Consulting Room 2',
        patient_type: 'New patient',
        payment_method: 'Private / card',
      } as Prisma.InputJsonValue,
      status: 'pending',
    },
  });
  if (clinicPendingSlot) {
    await prisma.slot.update({
      where: { id: clinicPendingSlot.id },
      data: { status: 'booked', bookingId: b2.id },
    });
  }

  // 3. Completed booking yesterday at Sandton Clinic (for revenue KPI)
  await prisma.booking.create({
    data: {
      providerId: clinic.provider.id,
      providerName: clinic.provider.name,
      serviceId: clinic.services[1].id,
      serviceName: clinic.services[1].name,
      professionalId: clinic.professionals[0].id,
      professionalName: clinic.professionals[0].name,
      customerId: sipho.id,
      customerName: sipho.fullName,
      customerEmail: sipho.email,
      customerPhone: sipho.phone || '+27 82 555 0142',
      date: yesterday,
      startTime: '09:00',
      endTime: '10:00',
      price: new Prisma.Decimal(1450),
      status: 'completed',
    },
  });

  // 4. Tomorrow's confirmed booking at Atelier Salon for Sipho
  const salonTomorrowSlot = await prisma.slot.findFirst({
    where: {
      providerId: salon.provider.id,
      date: tomorrow,
      startTime: '11:00',
      status: 'open',
    },
  });
  const b4 = await prisma.booking.create({
    data: {
      providerId: salon.provider.id,
      providerName: salon.provider.name,
      serviceId: salon.services[0].id,
      serviceName: salon.services[0].name,
      professionalId: salon.professionals[0].id,
      professionalName: salon.professionals[0].name,
      slotId: salonTomorrowSlot?.id ?? null,
      customerId: sipho.id,
      customerName: sipho.fullName,
      customerEmail: sipho.email,
      customerPhone: sipho.phone || '+27 82 555 0142',
      date: tomorrow,
      startTime: '11:00',
      endTime: '11:45',
      price: salon.services[0].price,
      notes: 'Trim & scalp treatment.',
      metadata: {
        template_id: 'Hair, Beauty & Wellness',
        stage: 'Booked',
        resource_label: 'Chair 1',
        addons: [{ id: 'scalp_ritual', label: 'Express steam & scalp massage ritual', price: 180 }],
        addons_total: 180,
      } as Prisma.InputJsonValue,
      status: 'confirmed',
    },
  });
  if (salonTomorrowSlot) {
    await prisma.slot.update({
      where: { id: salonTomorrowSlot.id },
      data: { status: 'booked', bookingId: b4.id },
    });
  }

  // 5. Completed booking at Cape Auto Mechanics + Today's active workshop bay booking
  await prisma.booking.create({
    data: {
      providerId: mechanic.provider.id,
      providerName: mechanic.provider.name,
      serviceId: mechanic.services[1].id,
      serviceName: mechanic.services[1].name,
      professionalId: mechanic.professionals[0].id,
      professionalName: mechanic.professionals[0].name,
      customerId: lerato.id,
      customerName: lerato.fullName,
      customerEmail: lerato.email,
      customerPhone: lerato.phone || '+27 83 555 0198',
      date: yesterday,
      startTime: '09:00',
      endTime: '10:00',
      price: mechanic.services[1].price,
      metadata: {
        template_id: 'Automotive',
        stage: 'Ready for collection',
        resource_label: 'Bay 1 — Service Hoist',
        vehicle_reg: 'CAA 482-910',
        vehicle_make_model: 'VW Golf 8 GTI',
        vehicle_year: '2023',
        odometer_km: '45 200 km',
        transport_option: 'Drop & collect',
      } as Prisma.InputJsonValue,
      status: 'completed',
    },
  });

  const mechanicTodaySlot = await prisma.slot.findFirst({
    where: {
      providerId: mechanic.provider.id,
      date: today,
      startTime: '09:00',
      status: 'open',
    },
  });
  const b5 = await prisma.booking.create({
    data: {
      providerId: mechanic.provider.id,
      providerName: mechanic.provider.name,
      serviceId: mechanic.services[0].id,
      serviceName: mechanic.services[0].name,
      professionalId: mechanic.professionals[0].id,
      professionalName: mechanic.professionals[0].name,
      slotId: mechanicTodaySlot?.id ?? null,
      customerId: sipho.id,
      customerName: sipho.fullName,
      customerEmail: sipho.email,
      customerPhone: sipho.phone || '+27 82 555 0142',
      date: today,
      startTime: '09:00',
      endTime: '09:45',
      price: mechanic.services[0].price,
      notes: 'ABS sensor light on dashboard after rain.',
      metadata: {
        template_id: 'Automotive',
        stage: 'On hoist / In bay',
        resource_label: 'Bay 3 — Diagnostics & OBD',
        vehicle_reg: 'CA 719-044',
        vehicle_make_model: 'BMW 320d M-Sport',
        vehicle_year: '2022',
        odometer_km: '62 800 km',
        transport_option: 'Wait at workshop',
      } as Prisma.InputJsonValue,
      status: 'confirmed',
    },
  });
  if (mechanicTodaySlot) {
    await prisma.slot.update({
      where: { id: mechanicTodaySlot.id },
      data: { status: 'booked', bookingId: b5.id },
    });
  }

  // 6. Today's Padel Court booking at Southside Padel & Sports Club
  const padelTodaySlot = await prisma.slot.findFirst({
    where: {
      providerId: sportsClub.provider.id,
      date: today,
      startTime: '15:30',
      status: 'open',
    },
  });
  const b6 = await prisma.booking.create({
    data: {
      providerId: sportsClub.provider.id,
      providerName: sportsClub.provider.name,
      serviceId: sportsClub.services[0].id,
      serviceName: sportsClub.services[0].name,
      professionalId: sportsClub.professionals[0].id,
      professionalName: sportsClub.professionals[0].name,
      slotId: padelTodaySlot?.id ?? null,
      customerId: sipho.id,
      customerName: sipho.fullName,
      customerEmail: sipho.email,
      customerPhone: sipho.phone || '+27 82 555 0142',
      date: today,
      startTime: '15:30',
      endTime: '16:30',
      price: new Prisma.Decimal(690),
      notes: 'Doubles match — 4 players.',
      metadata: {
        template_id: 'Sport Facilities',
        stage: 'Court reserved',
        resource_label: 'Court 1 — Panoramic Padel',
        sport_type: 'Padel',
        match_type: 'Casual booking',
        addons: [
          { id: 'floodlights', label: 'Evening floodlights activation', price: 80 },
          { id: 'new_balls', label: 'New pressurised tube of 3 balls', price: 130 },
        ],
        addons_total: 210,
      } as Prisma.InputJsonValue,
      status: 'confirmed',
    },
  });
  if (padelTodaySlot) {
    await prisma.slot.update({
      where: { id: padelTodaySlot.id },
      data: { status: 'booked', bookingId: b6.id },
    });
  }

  // 7. Today's Courtyard Bistro table reservation at Olive & Ember
  const bistroTodaySlot = await prisma.slot.findFirst({
    where: {
      providerId: bistro.provider.id,
      date: today,
      startTime: '14:00',
      status: 'open',
    },
  });
  const b7 = await prisma.booking.create({
    data: {
      providerId: bistro.provider.id,
      providerName: bistro.provider.name,
      serviceId: bistro.services[1].id,
      serviceName: bistro.services[1].name,
      professionalId: bistro.professionals[0].id,
      professionalName: bistro.professionals[0].name,
      slotId: bistroTodaySlot?.id ?? null,
      customerId: lerato.id,
      customerName: lerato.fullName,
      customerEmail: lerato.email,
      customerPhone: lerato.phone || '+27 83 555 0198',
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      price: new Prisma.Decimal(3580),
      notes: 'Window table in courtyard please.',
      metadata: {
        template_id: 'Restaurants & Cafes',
        stage: 'Reserved',
        resource_label: 'Covered Courtyard',
        party_size: 4,
        sitting: 'Lunch',
        seating_area: 'Covered Courtyard',
        occasion_tags: ['Anniversary', 'Halaal-friendly'],
      } as Prisma.InputJsonValue,
      status: 'confirmed',
    },
  });
  if (bistroTodaySlot) {
    await prisma.slot.update({
      where: { id: bistroTodaySlot.id },
      data: { status: 'booked', bookingId: b7.id },
    });
  }

  // ── Seed Initial Audit Log Entries ──
  await prisma.auditLog.createMany({
    data: [
      {
        entity: 'Provider',
        entityId: clinic.provider.id,
        action: 'onboard',
        actorId: masterUser.id,
        actorEmail: masterUser.email,
        actorRole: 'master',
        justification: 'Onboarded flagship tenant Sandton Medical & Family Clinic',
        ipAddress: '196.21.104.12',
        providerId: clinic.provider.id,
      },
      {
        entity: 'Booking',
        entityId: b1.id,
        action: 'create',
        actorId: sipho.id,
        actorEmail: sipho.email,
        actorRole: 'customer',
        justification: `Booked "${b1.serviceName}" at ${clinic.provider.name}`,
        ipAddress: '105.224.88.41',
        providerId: clinic.provider.id,
      },
    ],
  });

  logger.info('[seed] BookIt! database seed completed successfully!');
}

main()
  .catch((err) => {
    logger.error({ err }, '[seed] Fatal seed error:');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
