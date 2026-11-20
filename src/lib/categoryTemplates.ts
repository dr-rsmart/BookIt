/**
 * BookIt! 13 Industry Category Templates Engine
 * ---------------------------------------------
 * Implements the 13 category templates from "13 unique category templates.jpeg",
 * customer booking intake configurations ("Screenshots/Booking/*.jpeg"),
 * and business dashboard workspace definitions ("<Category> 1.jpeg").
 *
 * Fits directly into BookIt's existing multi-tenant Provider, Service,
 * Professional, Slot, and Booking domain while maintaining 100% backward
 * compatibility with existing categories (Doctor, Dentist, Salon, Spa & Wellness,
 * Mechanic, Fitness, Other).
 */

import {
  Scissors,
  Stethoscope,
  Dumbbell,
  Trophy,
  GraduationCap,
  UtensilsCrossed,
  ChefHat,
  Building2,
  Hammer,
  Car,
  PawPrint,
  Camera,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import type {
  CategoryTemplateId,
  BookingMetadata,
  BookingAddonSelection,
  BookingRecord,
} from '../../contracts';

export interface CategoryTerminology {
  teamSingular: string;
  teamPlural: string;
  serviceSingular: string;
  servicePlural: string;
  resourceSingular: string;
  resourcePlural: string;
  customerSingular: string;
  customerPlural: string;
  bookingSingular: string;
  bookingPlural: string;
  scheduleTitle: string;
  servicesNavLabel: string;
  teamNavLabel: string;
  bookingsNavLabel: string;
  bookCtaLabel: string;
}

export interface CategoryTemplateSpec {
  id: CategoryTemplateId;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  legacyCategories: string[];
  terminology: CategoryTerminology;
  /** The 5 terminology summary pills shown on the template picker card */
  terminologyPills: [string, string, string, string, string];
  /** The 3 capability chips shown at the bottom of the template picker card */
  featureChips: [string, string, string];
  /** Operational stages for the provider dashboard workspace board */
  operationalStages: [string, string, string, string];
  /** Default resource / room / bay / table labels for this category */
  defaultResources: string[];
  /** Optional ZAR add-ons customers can select during booking */
  addons: BookingAddonSelection[];
  /** Wizard 4-step labels tailored to this category */
  wizardSteps: [string, string, string, string];
  /** Dashboard KPI card descriptors (4 cards) */
  kpiCards: [
    { label: string; hint: string },
    { label: string; hint: string },
    { label: string; hint: string },
    { label: string; hint: string },
  ];
  /** Right-hand operational context panel title in Dashboard Overview */
  sidePanelTitle: string;
  sidePanelSubtitle: string;
}

export const CATEGORY_TEMPLATES: CategoryTemplateSpec[] = [
  {
    id: 'Hair, Beauty & Wellness',
    title: 'Hair, Beauty & Wellness',
    subtitle: 'Stylist & treatment bookings',
    Icon: Scissors,
    legacyCategories: ['Salon', 'Spa & Wellness'],
    terminology: {
      teamSingular: 'Stylist',
      teamPlural: 'Stylists',
      serviceSingular: 'Treatment',
      servicePlural: 'Treatments & menu',
      resourceSingular: 'Salon chair',
      resourcePlural: 'Salon chairs',
      customerSingular: 'Client',
      customerPlural: 'Clients',
      bookingSingular: 'Appointment',
      bookingPlural: 'Appointments',
      scheduleTitle: "Today's Salon Diary",
      servicesNavLabel: 'Treatment menu',
      teamNavLabel: 'Stylists',
      bookingsNavLabel: 'Appointments',
      bookCtaLabel: 'Book a treatment',
    },
    terminologyPills: ['Stylists', 'Treatment', 'Salon chair', 'Client', 'Appointment'],
    featureChips: ['Stylist chairs', 'Duration & price', 'Treatment menu'],
    operationalStages: ['Booked', 'In chair', 'Processing & finish', 'Completed'],
    defaultResources: ['Chair 1', 'Chair 2', 'Chair 3', 'Treatment Suite A'],
    addons: [
      { id: 'bond_gloss', label: 'Bond-building botanical gloss', price: 280 },
      { id: 'scalp_ritual', label: 'Express steam & scalp massage ritual', price: 180 },
      { id: 'brow_tint', label: 'Brow shape & tint add-on', price: 160 },
    ],
    wizardSteps: ['Treatment', 'Stylist', 'Time slot', 'Client & confirm'],
    kpiCards: [
      { label: 'Appointments today', hint: 'stylist chairs & suites active' },
      { label: 'Upcoming bookings', hint: 'confirmed on treatment diary' },
      { label: 'Awaiting confirmation', hint: 'new client requests' },
      { label: "Today's salon revenue", hint: 'treatments & retail add-ons' },
    ],
    sidePanelTitle: 'Chair & suite utilisation',
    sidePanelSubtitle: 'Active treatment stations and formula notes',
  },
  {
    id: 'Healthcare',
    title: 'Healthcare',
    subtitle: 'Clinical & practitioner schedules',
    Icon: Stethoscope,
    legacyCategories: ['Doctor', 'Dentist'],
    terminology: {
      teamSingular: 'Practitioner',
      teamPlural: 'Practitioners',
      serviceSingular: 'Consultation',
      servicePlural: 'Consultations & rates',
      resourceSingular: 'Consulting room',
      resourcePlural: 'Consulting rooms',
      customerSingular: 'Patient',
      customerPlural: 'Patients',
      bookingSingular: 'Appointment',
      bookingPlural: 'Appointments',
      scheduleTitle: "Today's Clinical Diary",
      servicesNavLabel: 'Consultations & tariffs',
      teamNavLabel: 'Practitioners',
      bookingsNavLabel: 'Patient bookings',
      bookCtaLabel: 'Book a consultation',
    },
    terminologyPills: ['Practitioners', 'Consultation', 'Consulting room', 'Patient', 'Appointment'],
    featureChips: ['Room schedule', 'Medical aid / private', 'Appointment length'],
    operationalStages: ['Scheduled', 'In waiting room', 'In consultation', 'Completed'],
    defaultResources: ['Consulting Room 1', 'Consulting Room 2', 'Consulting Room 3', 'Procedure Room'],
    addons: [],
    wizardSteps: ['Consultation', 'Practitioner', 'Time slot', 'Patient & medical aid'],
    kpiCards: [
      { label: 'Patients today', hint: 'across active consulting rooms' },
      { label: 'Upcoming consultations', hint: 'scheduled ahead' },
      { label: 'In waiting room / pending', hint: 'awaiting practitioner' },
      { label: 'Completed billing', hint: 'medical aid & private tariffs' },
    ],
    sidePanelTitle: 'Waiting room & medical aid split',
    sidePanelSubtitle: 'Live patient queue and scheme verification',
  },
  {
    id: 'Fitness & Classes',
    title: 'Fitness & Classes',
    subtitle: 'Group classes & personal sessions',
    Icon: Dumbbell,
    legacyCategories: ['Fitness'],
    terminology: {
      teamSingular: 'Instructor',
      teamPlural: 'Instructors',
      serviceSingular: 'Class / session',
      servicePlural: 'Classes & sessions',
      resourceSingular: 'Studio',
      resourcePlural: 'Studios',
      customerSingular: 'Member',
      customerPlural: 'Members',
      bookingSingular: 'Spot',
      bookingPlural: 'Class spots',
      scheduleTitle: 'Class Timetable & Roster',
      servicesNavLabel: 'Classes & passes',
      teamNavLabel: 'Instructors',
      bookingsNavLabel: 'Class roster',
      bookCtaLabel: 'Reserve a spot',
    },
    terminologyPills: ['Instructors', 'Class / session', 'Studio', 'Member', 'Spot'],
    featureChips: ['Class capacity', 'Studio / zone', 'Drop-in / pass'],
    operationalStages: ['Spot reserved', 'Checked in', 'In class', 'Attended'],
    defaultResources: ['Studio 1 — Reformer', 'Studio 2 — Sweat / HIIT', 'Mind & Body Loft'],
    addons: [
      { id: 'grip_socks', label: 'Studio grip socks pair', price: 120 },
      { id: 'towel_electrolyte', label: 'Chilled towel & electrolyte water', price: 65 },
    ],
    wizardSteps: ['Class / session', 'Instructor', 'Timetable & spot', 'Pass & confirm'],
    kpiCards: [
      { label: 'Spots booked today', hint: 'across scheduled classes' },
      { label: 'Upcoming class spots', hint: 'reserved for this week' },
      { label: 'Waitlist & pending', hint: 'members awaiting a spot' },
      { label: 'Drop-in & pass revenue', hint: 'completed sessions' },
    ],
    sidePanelTitle: 'Studio capacity & passes',
    sidePanelSubtitle: 'Reformer/mat spots and member pass usage',
  },
  {
    id: 'Sport Facilities',
    title: 'Sport Facilities',
    subtitle: 'Courts, fields & lanes',
    Icon: Trophy,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Coach / court',
      teamPlural: 'Coaches / staff',
      serviceSingular: 'Court / lane',
      servicePlural: 'Courts & hire rates',
      resourceSingular: 'Court',
      resourcePlural: 'Courts',
      customerSingular: 'Player',
      customerPlural: 'Players',
      bookingSingular: 'Slot',
      bookingPlural: 'Court slots',
      scheduleTitle: 'Courts & Field Grid',
      servicesNavLabel: 'Courts & hire rates',
      teamNavLabel: 'Coaches & staff',
      bookingsNavLabel: 'Court slots',
      bookCtaLabel: 'Book a court slot',
    },
    terminologyPills: ['Coaches / staff', 'Court / lane', 'Court', 'Player', 'Slot'],
    featureChips: ['Court / field grid', 'Floodlights / equipment', 'Peak & off-peak'],
    operationalStages: ['Court reserved', 'Checked in / Lights on', 'On court', 'Completed'],
    defaultResources: ['Court 1 — Panoramic Padel', 'Court 2 — Panoramic Padel', 'Court 3 — Covered Padel', 'Centre Tennis Court'],
    addons: [
      { id: 'floodlights', label: 'Evening floodlights activation', price: 80 },
      { id: 'racquet_hire', label: '2 × Carbon padel racquets hire', price: 140 },
      { id: 'new_balls', label: 'New pressurised tube of 3 balls', price: 130 },
    ],
    wizardSteps: ['Sport & court', 'Court / coach', 'Court slot', 'Equipment & confirm'],
    kpiCards: [
      { label: 'Court slots today', hint: 'padel, tennis & turf active' },
      { label: 'Upcoming court bookings', hint: 'peak & off-peak slots' },
      { label: 'Open matches / pending', hint: 'looking for players' },
      { label: "Today's court revenue", hint: 'court hire, lights & gear' },
    ],
    sidePanelTitle: 'Equipment, lights & peak hours',
    sidePanelSubtitle: 'Floodlight schedule and racquet/ball desk',
  },
  {
    id: 'Tuition',
    title: 'Tuition',
    subtitle: '1-on-1 & small-group lessons',
    Icon: GraduationCap,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Tutor',
      teamPlural: 'Tutors',
      serviceSingular: 'Lesson',
      servicePlural: 'Subjects & lesson packs',
      resourceSingular: 'Room / online',
      resourcePlural: 'Rooms / online',
      customerSingular: 'Student',
      customerPlural: 'Students',
      bookingSingular: 'Lesson',
      bookingPlural: 'Lessons',
      scheduleTitle: 'Lesson Schedule',
      servicesNavLabel: 'Subjects & lesson packs',
      teamNavLabel: 'Tutors',
      bookingsNavLabel: 'Lessons',
      bookCtaLabel: 'Book a lesson',
    },
    terminologyPills: ['Tutors', 'Lesson', 'Room / online', 'Student', 'Lesson'],
    featureChips: ['Subject & level', 'Online / in-person', 'Lesson pack'],
    operationalStages: ['Scheduled', 'In lesson', 'Homework / notes', 'Completed'],
    defaultResources: ['Room A — Maths & Science', 'Room B — Languages', 'Online Video Classroom'],
    addons: [
      { id: 'past_paper_pack', label: 'Printed IEB / CAPS past-paper workbook', price: 150 },
      { id: 'diagnostic_report', label: 'Written diagnostic progress report', price: 220 },
    ],
    wizardSteps: ['Subject & lesson', 'Tutor', 'Lesson slot', 'Student & delivery mode'],
    kpiCards: [
      { label: 'Lessons today', hint: 'in-person & online classroom' },
      { label: 'Upcoming lessons', hint: '1-on-1 & small-group' },
      { label: 'Trial lessons / pending', hint: 'new student assessments' },
      { label: 'Completed tuition fees', hint: 'single lessons & packs' },
    ],
    sidePanelTitle: 'Delivery mode & lesson packs',
    sidePanelSubtitle: 'Online vs in-person split and student notes',
  },
  {
    id: 'Restaurants & Cafes',
    title: 'Restaurants & Cafes',
    subtitle: 'Table reservations & sittings',
    Icon: UtensilsCrossed,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Host / section',
      teamPlural: 'Hosts / sections',
      serviceSingular: 'Sitting',
      servicePlural: 'Sittings & experiences',
      resourceSingular: 'Table',
      resourcePlural: 'Tables',
      customerSingular: 'Guest',
      customerPlural: 'Guests',
      bookingSingular: 'Reservation',
      bookingPlural: 'Reservations',
      scheduleTitle: 'Floor & Sittings',
      servicesNavLabel: 'Sittings & menus',
      teamNavLabel: 'Hosts & sections',
      bookingsNavLabel: 'Reservations',
      bookCtaLabel: 'Reserve a table',
    },
    terminologyPills: ['Hosts / sections', 'Sitting', 'Table', 'Guest', 'Reservation'],
    featureChips: ['Table & party size', 'Sitting times', 'Dietary notes'],
    operationalStages: ['Reserved', 'Seated / Drinks', 'Mains / Course 2', 'Bill & Turned'],
    defaultResources: ['Main Dining Room', 'Covered Courtyard', "Chef's Counter", 'Private Dining Room'],
    addons: [
      { id: 'welcome_mcc', label: 'MCC Cap Classique arrival toast', price: 320 },
      { id: 'celebration_plate', label: 'Artisan celebration cake & candle', price: 380 },
    ],
    wizardSteps: ['Sitting & menu', 'Dining section', 'Sitting time', 'Party & dietary notes'],
    kpiCards: [
      { label: 'Reservations today', hint: 'lunch & dinner sittings' },
      { label: 'Upcoming tables', hint: 'confirmed table bookings' },
      { label: 'Large parties / pending', hint: 'awaiting floor allocation' },
      { label: 'Tasting & pre-book value', hint: 'set menus & experiences' },
    ],
    sidePanelTitle: 'Floor sections & dietary alerts',
    sidePanelSubtitle: 'Covers booked, celebrations and kitchen flags',
  },
  {
    id: 'Catering & Events',
    title: 'Catering & Events',
    subtitle: 'Quotes, tastings & event dates',
    Icon: ChefHat,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Coordinator',
      teamPlural: 'Coordinators',
      serviceSingular: 'Package',
      servicePlural: 'Packages & menus',
      resourceSingular: 'Event date',
      resourcePlural: 'Event dates',
      customerSingular: 'Client',
      customerPlural: 'Clients',
      bookingSingular: 'Event booking',
      bookingPlural: 'Event bookings',
      scheduleTitle: 'Events & Quotes Pipeline',
      servicesNavLabel: 'Packages & menus',
      teamNavLabel: 'Coordinators',
      bookingsNavLabel: 'Event bookings',
      bookCtaLabel: 'Book event / tasting',
    },
    terminologyPills: ['Coordinators', 'Package', 'Event date', 'Client', 'Event booking'],
    featureChips: ['Guest count', 'Menu / package tier', 'Event date & setup'],
    operationalStages: ['Date hold / Quote', 'Tasting & Menu locked', 'Kitchen prep & load', 'Event delivered'],
    defaultResources: ['Full-Service Brigade A', 'Harvest & Platter Team B', 'Tasting Kitchen'],
    addons: [
      { id: 'waitstaff_bar', label: 'Dedicated waitstaff & mobile bar team', price: 2400 },
      { id: 'stoneware_linen', label: 'Artisan stoneware, glassware & linen hire', price: 1650 },
    ],
    wizardSteps: ['Menu package', 'Coordinator', 'Event date & time', 'Guest count & dietary'],
    kpiCards: [
      { label: 'Events & tastings today', hint: 'active catering runs' },
      { label: 'Upcoming event dates', hint: 'locked on production calendar' },
      { label: 'Quotes awaiting deposit', hint: 'provisional date holds' },
      { label: 'Confirmed event revenue', hint: 'packages & staffing add-ons' },
    ],
    sidePanelTitle: 'Event run sheet & dietary counts',
    sidePanelSubtitle: 'Guest headcount, Halaal/vegan split and setup times',
  },
  {
    id: 'Venues & Spaces',
    title: 'Venues & Spaces',
    subtitle: 'Room hire & day bookings',
    Icon: Building2,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Coordinator',
      teamPlural: 'Coordinators',
      serviceSingular: 'Space / package',
      servicePlural: 'Spaces & hire rates',
      resourceSingular: 'Hall / room',
      resourcePlural: 'Halls & rooms',
      customerSingular: 'Hirer',
      customerPlural: 'Hirers',
      bookingSingular: 'Hire booking',
      bookingPlural: 'Hire bookings',
      scheduleTitle: 'Venue Calendar & Spaces',
      servicesNavLabel: 'Spaces & hire rates',
      teamNavLabel: 'Coordinators',
      bookingsNavLabel: 'Hire bookings',
      bookCtaLabel: 'Book venue space',
    },
    terminologyPills: ['Coordinators', 'Space / package', 'Hall / room', 'Hirer', 'Hire booking'],
    featureChips: ['Room capacity & layout', 'Half-day / full-day', 'AV & catering add-ons'],
    operationalStages: ['Provisional hold', 'Deposit & Layout locked', 'Room setup ready', 'Hire completed'],
    defaultResources: ['The Glass Courtyard', 'Heritage Boardroom', 'Founders Hall', 'Roof Terrace'],
    addons: [
      { id: 'av_pa_pack', label: '4K Laser Projector, wireless mics & PA', price: 950 },
      { id: 'barista_tea', label: 'All-day artisan coffee, tea & pastries', price: 1450 },
      { id: 'buffet_lunch', label: 'Harvest working lunch buffet', price: 3200 },
    ],
    wizardSteps: ['Space / package', 'Coordinator', 'Hire date & slot', 'Layout & AV add-ons'],
    kpiCards: [
      { label: 'Spaces booked today', hint: 'halls, boardrooms & courtyard' },
      { label: 'Upcoming room hires', hint: 'half-day & full-day bookings' },
      { label: 'Provisional holds', hint: 'awaiting confirmation' },
      { label: 'Venue hire revenue', hint: 'room hire, AV & catering' },
    ],
    sidePanelTitle: 'Room layouts & AV checklist',
    sidePanelSubtitle: 'Seating configuration and catering setup',
  },
  {
    id: 'Home & Trade Services',
    title: 'Home & Trade Services',
    subtitle: 'Call-outs & on-site quotes',
    Icon: Hammer,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Technician',
      teamPlural: 'Technicians',
      serviceSingular: 'Call-out / job',
      servicePlural: 'Call-outs & rate card',
      resourceSingular: 'Service area',
      resourcePlural: 'Service areas',
      customerSingular: 'Customer',
      customerPlural: 'Customers',
      bookingSingular: 'Call-out',
      bookingPlural: 'Call-outs',
      scheduleTitle: 'Dispatch Board',
      servicesNavLabel: 'Call-outs & rate card',
      teamNavLabel: 'Technicians',
      bookingsNavLabel: 'Call-outs',
      bookCtaLabel: 'Book a call-out',
    },
    terminologyPills: ['Technicians', 'Call-out / job', 'Service area', 'Customer', 'Call-out'],
    featureChips: ['Suburb / call-out zone', 'Arrival window', 'Call-out fee'],
    operationalStages: ['Queued', 'Dispatched / En route', 'On site', 'Job signed off'],
    defaultResources: ['Northern Suburbs Zone', 'Central & City Bowl', 'Southern Suburbs Zone', 'Emergency Rapid Van'],
    addons: [
      { id: 'sameday_priority', label: 'Same-day priority dispatch surcharge', price: 250 },
      { id: 'coc_report', label: 'Compliance inspection & written report', price: 450 },
    ],
    wizardSteps: ['Call-out / trade', 'Technician', 'Arrival window', 'Address & job details'],
    kpiCards: [
      { label: 'Call-outs today', hint: 'scheduled across service zones' },
      { label: 'Upcoming jobs', hint: 'booked arrival windows' },
      { label: 'Unassigned / priority', hint: 'needs dispatch confirmation' },
      { label: 'Completed job revenue', hint: 'call-outs & signed-off work' },
    ],
    sidePanelTitle: 'Suburb zones & arrival windows',
    sidePanelSubtitle: 'Field technician dispatch and urgency queue',
  },
  {
    id: 'Automotive',
    title: 'Automotive',
    subtitle: 'Workshop bays & service bookings',
    Icon: Car,
    legacyCategories: ['Mechanic'],
    terminology: {
      teamSingular: 'Technician',
      teamPlural: 'Technicians',
      serviceSingular: 'Service / repair',
      servicePlural: 'Services & bay rates',
      resourceSingular: 'Workshop bay',
      resourcePlural: 'Workshop bays',
      customerSingular: 'Vehicle owner',
      customerPlural: 'Vehicle owners',
      bookingSingular: 'Workshop booking',
      bookingPlural: 'Workshop bookings',
      scheduleTitle: 'Workshop Bay Board',
      servicesNavLabel: 'Services & bay rates',
      teamNavLabel: 'Technicians',
      bookingsNavLabel: 'Workshop bookings',
      bookCtaLabel: 'Book workshop bay',
    },
    terminologyPills: ['Technicians', 'Service / repair', 'Workshop bay', 'Vehicle owner', 'Workshop booking'],
    featureChips: ['Vehicle reg & make', 'Bay allocation', 'Drop-off & collection'],
    operationalStages: ['Checked in', 'On hoist / In bay', 'Parts / Road test', 'Ready for collection'],
    defaultResources: ['Bay 1 — Service Hoist', 'Bay 2 — Service Hoist', 'Bay 3 — Diagnostics & OBD', 'Bay 4 — Brakes & Tyres'],
    addons: [
      { id: 'wheel_alignment', label: '3D 4-Wheel Laser Alignment check', price: 480 },
      { id: 'aircon_sanitize', label: 'Aircon antibacterial flush & gas check', price: 390 },
    ],
    wizardSteps: ['Service / repair', 'Technician', 'Drop-off slot', 'Vehicle reg & confirm'],
    kpiCards: [
      { label: 'Vehicles in today', hint: 'allocated across workshop bays' },
      { label: 'Upcoming bay bookings', hint: 'scheduled services & repairs' },
      { label: 'Awaiting approval', hint: 'new vehicle bookings' },
      { label: 'Workshop revenue', hint: 'completed job cards' },
    ],
    sidePanelTitle: 'Workshop bays & vehicle job cards',
    sidePanelSubtitle: 'Registrations, hoist allocation and collection status',
  },
  {
    id: 'Pet Services',
    title: 'Pet Services',
    subtitle: 'Grooming, boarding & vet care',
    Icon: PawPrint,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Groomer / carer',
      teamPlural: 'Groomers / carers',
      serviceSingular: 'Groom / stay',
      servicePlural: 'Grooming & boarding',
      resourceSingular: 'Kennel / table',
      resourcePlural: 'Kennels & tables',
      customerSingular: 'Pet owner',
      customerPlural: 'Pet owners',
      bookingSingular: 'Booking',
      bookingPlural: 'Pet bookings',
      scheduleTitle: 'Grooming & Boarding Board',
      servicesNavLabel: 'Grooming & boarding',
      teamNavLabel: 'Groomers & carers',
      bookingsNavLabel: 'Pet bookings',
      bookCtaLabel: 'Book pet session',
    },
    terminologyPills: ['Groomers / carers', 'Groom / stay', 'Kennel / table', 'Pet owner', 'Booking'],
    featureChips: ['Pet breed & size', 'Coat / temperament notes', 'Single slot or multi-day'],
    operationalStages: ['Checked in', 'Bath & Blow-dry', 'Clip & Styling', 'Ready for pick-up'],
    defaultResources: ['Table 1 — Small & Toy', 'Table 2 — Medium & Large', 'Table 3 — Cat & Quiet Suite', 'Luxury Day Kennel'],
    addons: [
      { id: 'deshed_mask', label: 'Undercoat de-shedding & oatmeal mask', price: 160 },
      { id: 'dental_paw_balm', label: 'Enzymatic teeth clean & organic paw balm', price: 110 },
      { id: 'tick_flea_rinse', label: 'Botanical tick & flea conditioning rinse', price: 120 },
    ],
    wizardSteps: ['Groom / stay', 'Groomer / carer', 'Arrival slot', 'Pet profile & confirm'],
    kpiCards: [
      { label: 'Pets in today', hint: 'grooming tables & day suites' },
      { label: 'Upcoming pet bookings', hint: 'grooms & boarding stays' },
      { label: 'Awaiting confirmation', hint: 'new pet profiles' },
      { label: "Today's pet revenue", hint: 'completed grooms & add-ons' },
    ],
    sidePanelTitle: 'Kennel & grooming table status',
    sidePanelSubtitle: 'Breed size brackets and temperament handling notes',
  },
  {
    id: 'Photography & Creative Services',
    title: 'Photography & Creative Services',
    subtitle: 'Studio & location shoots',
    Icon: Camera,
    legacyCategories: [],
    terminology: {
      teamSingular: 'Photographer',
      teamPlural: 'Photographers',
      serviceSingular: 'Shoot package',
      servicePlural: 'Shoot packages',
      resourceSingular: 'Studio / location',
      resourcePlural: 'Studios & locations',
      customerSingular: 'Client',
      customerPlural: 'Clients',
      bookingSingular: 'Shoot',
      bookingPlural: 'Shoots',
      scheduleTitle: 'Shoot Calendar & Edit Pipeline',
      servicesNavLabel: 'Packages & add-ons',
      teamNavLabel: 'Photographers',
      bookingsNavLabel: 'Shoots',
      bookCtaLabel: 'Book a shoot',
    },
    terminologyPills: ['Photographers', 'Shoot package', 'Studio / location', 'Client', 'Shoot'],
    featureChips: ['Studio vs on-location', 'Deliverables & edits', 'Weather backup'],
    operationalStages: ['Shoot booked', 'On set / Shooting', 'Culling & Retouching', 'Gallery delivered'],
    defaultResources: ['Cyclorama Studio A', 'Natural Light Loft B', 'On-Location Mobile Rig'],
    addons: [
      { id: 'extra_retouched', label: '+10 High-end retouched images', price: 950 },
      { id: 'hmua_artist', label: 'On-set Hair & Makeup Artist (HMUA)', price: 1400 },
      { id: 'express_48h', label: 'Express 48-hour gallery turnaround', price: 850 },
    ],
    wizardSteps: ['Shoot package', 'Photographer', 'Date & call time', 'Location & creative add-ons'],
    kpiCards: [
      { label: 'Shoots today', hint: 'in-studio & on-location' },
      { label: 'Upcoming shoots', hint: 'confirmed call times' },
      { label: 'In editing / pending', hint: 'galleries & new inquiries' },
      { label: 'Completed shoot value', hint: 'packages & creative add-ons' },
    ],
    sidePanelTitle: 'Deliverables & studio vs location',
    sidePanelSubtitle: 'Call times, golden hour flags and retouching queue',
  },
  {
    id: 'Professional Consultations',
    title: 'Professional Consultations',
    subtitle: 'Legal, financial & advisory',
    Icon: Briefcase,
    legacyCategories: ['Other'],
    terminology: {
      teamSingular: 'Advisor',
      teamPlural: 'Advisors',
      serviceSingular: 'Consultation',
      servicePlural: 'Consultations & rates',
      resourceSingular: 'Meeting room / call',
      resourcePlural: 'Meeting rooms / calls',
      customerSingular: 'Client',
      customerPlural: 'Clients',
      bookingSingular: 'Consultation',
      bookingPlural: 'Consultations',
      scheduleTitle: 'Practice Diary',
      servicesNavLabel: 'Practice areas & rates',
      teamNavLabel: 'Advisors',
      bookingsNavLabel: 'Consultations',
      bookCtaLabel: 'Book a consultation',
    },
    terminologyPills: ['Advisors', 'Consultation', 'Meeting room / call', 'Client', 'Consultation'],
    featureChips: ['Video or in-person', 'Matter / reference', 'Retainer / hourly'],
    operationalStages: ['Intake & Conflict check', 'Docs reviewed', 'In consultation', 'Completed & Billed'],
    defaultResources: ['Boardroom 1 (In-person)', 'Partner Suite 2', 'Microsoft Teams / Zoom Video'],
    addons: [
      { id: 'doc_pack_review', label: 'Pre-consultation document pack review', price: 950 },
      { id: 'written_memo', label: 'Written advisory summary & action memo', price: 1250 },
    ],
    wizardSteps: ['Consultation', 'Advisor', 'Date & time', 'Format & matter intake'],
    kpiCards: [
      { label: 'Consultations today', hint: 'boardroom & video advisory' },
      { label: 'Upcoming consultations', hint: 'scheduled client matters' },
      { label: 'Conflict check / pending', hint: 'awaiting intake clearance' },
      { label: 'Completed fee revenue', hint: 'advisory & retainer sessions' },
    ],
    sidePanelTitle: 'Matter intake & meeting format',
    sidePanelSubtitle: 'Video vs in-person split and conflict-check status',
  },
];

/**
 * Resolves any provider category or explicit template_id to one of the 13 CategoryTemplateSpecs.
 */
export function resolveCategoryTemplate(
  categoryOrTemplateId?: string | null,
  explicitTemplateId?: string | null,
): CategoryTemplateSpec {
  const candidates = [explicitTemplateId, categoryOrTemplateId].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    // 1. Direct template ID match
    const direct = CATEGORY_TEMPLATES.find(
      (t) => t.id.toLowerCase() === trimmed.toLowerCase(),
    );
    if (direct) return direct;

    // 2. Legacy category match (e.g. 'Doctor' -> 'Healthcare', 'Salon' -> 'Hair, Beauty & Wellness')
    const byLegacy = CATEGORY_TEMPLATES.find((t) =>
      t.legacyCategories.some((leg) => leg.toLowerCase() === trimmed.toLowerCase()),
    );
    if (byLegacy) return byLegacy;
  }

  // Fallback to Professional Consultations (which also maps 'Other')
  return CATEGORY_TEMPLATES[CATEGORY_TEMPLATES.length - 1];
}

/**
 * Returns all database category values that match a selected category filter
 * (so filtering by "Healthcare" matches "Healthcare", "Doctor", "Dentist", and vice-versa).
 */
export function getMatchingCategoriesForFilter(filterValue?: string | null): string[] {
  if (!filterValue || !filterValue.trim()) return [];
  const trimmed = filterValue.trim();

  const template = CATEGORY_TEMPLATES.find(
    (t) => t.id.toLowerCase() === trimmed.toLowerCase(),
  );
  if (template) {
    return Array.from(new Set([template.id, ...template.legacyCategories]));
  }

  const parentTemplate = CATEGORY_TEMPLATES.find((t) =>
    t.legacyCategories.some((leg) => leg.toLowerCase() === trimmed.toLowerCase()),
  );
  if (parentTemplate) {
    // If user clicked a specific legacy pill like 'Doctor', match 'Doctor' and 'Healthcare'
    return Array.from(new Set([trimmed, parentTemplate.id]));
  }

  return [trimmed];
}

/**
 * Formats a BookingRecord's structured `metadata` into concise, human-readable badges
 * for display on BookingRow (provider dashboard), CustomerBookingCard (My Bookings),
 * and the CategoryWorkspaceBoard.
 */
export function formatBookingMetadataBadges(
  metadata?: BookingMetadata | null,
): Array<{ label: string; highlight?: boolean }> {
  if (!metadata || typeof metadata !== 'object') return [];
  const badges: Array<{ label: string; highlight?: boolean }> = [];

  if (metadata.stage) {
    badges.push({ label: String(metadata.stage), highlight: true });
  }
  if (metadata.resource_label) {
    badges.push({ label: String(metadata.resource_label) });
  }

  // Automotive
  if (metadata.vehicle_reg) {
    badges.push({
      label: `Reg: ${metadata.vehicle_reg}${metadata.vehicle_make_model ? ` · ${metadata.vehicle_make_model}` : ''}`,
      highlight: true,
    });
  } else if (metadata.vehicle_make_model) {
    badges.push({ label: String(metadata.vehicle_make_model) });
  }
  if (metadata.transport_option) {
    badges.push({ label: String(metadata.transport_option) });
  }

  // Healthcare
  if (metadata.payment_method) {
    const scheme = metadata.medical_aid_scheme ? ` (${metadata.medical_aid_scheme})` : '';
    badges.push({ label: `${metadata.payment_method}${scheme}`, highlight: true });
  }
  if (metadata.patient_type) {
    badges.push({ label: String(metadata.patient_type) });
  }

  // Fitness & Classes
  if (metadata.spot_number) {
    badges.push({ label: `Spot #${metadata.spot_number}`, highlight: true });
  }
  if (metadata.pass_type) {
    badges.push({ label: String(metadata.pass_type) });
  }

  // Sport Facilities
  if (metadata.sport_type) {
    badges.push({ label: String(metadata.sport_type), highlight: true });
  }
  if (metadata.match_type) {
    badges.push({ label: String(metadata.match_type) });
  }

  // Tuition
  if (metadata.subject) {
    badges.push({
      label: `${metadata.subject}${metadata.academic_level ? ` (${metadata.academic_level})` : ''}`,
      highlight: true,
    });
  }
  if (metadata.delivery_mode) {
    badges.push({ label: String(metadata.delivery_mode) });
  }
  if (metadata.lesson_pack) {
    badges.push({ label: String(metadata.lesson_pack) });
  }

  // Restaurants & Cafes
  if (metadata.party_size) {
    badges.push({ label: `Table for ${metadata.party_size}`, highlight: true });
  }
  if (metadata.sitting) {
    badges.push({ label: `${metadata.sitting} sitting` });
  }
  if (metadata.seating_area) {
    badges.push({ label: String(metadata.seating_area) });
  }
  if (Array.isArray(metadata.occasion_tags) && metadata.occasion_tags.length > 0) {
    badges.push({ label: metadata.occasion_tags.join(', ') });
  }

  // Catering & Events / Venues
  if (metadata.event_type) {
    badges.push({ label: String(metadata.event_type), highlight: true });
  }
  if (metadata.guest_count) {
    badges.push({ label: `${metadata.guest_count} guests`, highlight: true });
  }
  if (metadata.service_style) {
    badges.push({ label: String(metadata.service_style) });
  }
  if (metadata.hire_duration) {
    badges.push({ label: String(metadata.hire_duration) });
  }
  if (metadata.room_layout) {
    badges.push({ label: `${metadata.room_layout} layout` });
  }

  // Home & Trade Services
  if (metadata.trade_category) {
    badges.push({ label: String(metadata.trade_category), highlight: true });
  }
  if (metadata.urgency_tier) {
    badges.push({ label: String(metadata.urgency_tier) });
  }
  if (metadata.suburb || metadata.service_address) {
    badges.push({ label: String(metadata.suburb || metadata.service_address) });
  }
  if (metadata.arrival_window) {
    badges.push({ label: `Window: ${metadata.arrival_window}` });
  }

  // Pet Services
  if (metadata.pet_name) {
    const details = [metadata.pet_species, metadata.pet_breed, metadata.pet_size]
      .filter(Boolean)
      .join(' · ');
    badges.push({
      label: `Pet: ${metadata.pet_name}${details ? ` (${details})` : ''}`,
      highlight: true,
    });
  }
  if (Array.isArray(metadata.temperament_tags) && metadata.temperament_tags.length > 0) {
    badges.push({ label: metadata.temperament_tags.join(', ') });
  }

  // Photography & Creative Services
  if (metadata.location_mode) {
    badges.push({
      label: `${metadata.location_mode}${metadata.golden_hour ? ' · Golden Hour' : ''}`,
      highlight: true,
    });
  }

  // Professional Consultations
  if (metadata.practice_area) {
    badges.push({ label: String(metadata.practice_area), highlight: true });
  }
  if (metadata.meeting_format) {
    badges.push({ label: String(metadata.meeting_format) });
  }
  if (metadata.entity_name) {
    badges.push({ label: `Entity: ${metadata.entity_name}` });
  }
  if (metadata.counterparty_name) {
    badges.push({ label: `Conflict check: ${metadata.counterparty_name}` });
  }

  // Add-ons
  if (Array.isArray(metadata.addons) && metadata.addons.length > 0) {
    badges.push({
      label: `+${metadata.addons.length} add-on${metadata.addons.length === 1 ? '' : 's'}: ${metadata.addons.map((a) => a.label).join(', ')}`,
    });
  }

  return badges;
}

/**
 * Computes the effective operational stage for a booking within a category template.
 */
export function getBookingOperationalStage(
  booking: BookingRecord,
  template: CategoryTemplateSpec,
): string {
  if (booking.metadata?.stage && typeof booking.metadata.stage === 'string') {
    return booking.metadata.stage;
  }
  if (booking.status === 'completed') {
    return template.operationalStages[3];
  }
  if (booking.status === 'pending') {
    return template.operationalStages[0];
  }
  return template.operationalStages[1];
}
