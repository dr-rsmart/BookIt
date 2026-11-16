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
import { DEFAULT_WORKING_HOURS } from './serializers.js';
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
      status: 'confirmed',
    },
  });
  if (salonTomorrowSlot) {
    await prisma.slot.update({
      where: { id: salonTomorrowSlot.id },
      data: { status: 'booked', bookingId: b4.id },
    });
  }

  // 5. Completed booking at Cape Auto Mechanics
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
      status: 'completed',
    },
  });

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
