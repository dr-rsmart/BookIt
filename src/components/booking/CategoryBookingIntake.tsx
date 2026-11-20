/**
 * Category-Specific Booking Intake & Add-ons (`Screenshots/Booking/*.jpeg`)
 * -------------------------------------------------------------------------
 * Renders industry-tailored intake widgets and optional ZAR add-ons inside
 * BookIt's 4-step booking wizard based on the provider's CategoryTemplateSpec.
 */

import { Check, Plus } from 'lucide-react';
import { Input, Label, Select } from '../ui';
import {
  cn,
  formatZAR,
  type CategoryTemplateSpec,
} from '../../lib/utils';
import type { BookingMetadata, BookingAddonSelection } from '../../../contracts';

function PillSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiTagSelector({
  options,
  selected = [],
  onChange,
}: {
  options: string[];
  selected?: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {active && <Check className="h-3 w-3" />}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

export default function CategoryBookingIntake({
  template,
  metadata,
  onChange,
}: {
  template: CategoryTemplateSpec;
  metadata: BookingMetadata;
  onChange: (next: BookingMetadata) => void;
}) {
  const updateField = <K extends keyof BookingMetadata>(key: K, value: BookingMetadata[K]) => {
    onChange({
      ...metadata,
      template_id: template.id,
      [key]: value,
    });
  };

  const selectedAddons: BookingAddonSelection[] = Array.isArray(metadata.addons)
    ? metadata.addons
    : [];

  const toggleAddon = (addon: BookingAddonSelection) => {
    const exists = selectedAddons.some((a) => a.id === addon.id);
    const nextAddons = exists
      ? selectedAddons.filter((a) => a.id !== addon.id)
      : [...selectedAddons, addon];
    const addonsTotal = nextAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    onChange({
      ...metadata,
      template_id: template.id,
      addons: nextAddons,
      addons_total: addonsTotal,
    });
  };

  const TemplateIcon = template.Icon;

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TemplateIcon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base text-foreground">
              {template.title} details
            </h3>
            <p className="text-xs text-muted-foreground">
              {template.featureChips.join(' · ')}
            </p>
          </div>
        </div>

        {/* Preferred Resource / Room / Bay / Table selector */}
        {template.defaultResources.length > 0 && (
          <div className="w-full sm:w-auto">
            <Select
              aria-label={`Preferred ${template.terminology.resourceSingular}`}
              value={String(metadata.resource_label || '')}
              onChange={(e) => updateField('resource_label', e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">
                Any available {template.terminology.resourceSingular.toLowerCase()}
              </option>
              {template.defaultResources.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* 1. Healthcare Intake */}
      {template.id === 'Healthcare' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Patient status</Label>
              <PillSelector
                options={['New patient', 'Returning patient']}
                value={metadata.patient_type || 'Returning patient'}
                onChange={(val) => updateField('patient_type', val)}
              />
            </div>
            <div>
              <Label>Consultation billing</Label>
              <PillSelector
                options={['Medical aid claim', 'Private / card']}
                value={metadata.payment_method || 'Medical aid claim'}
                onChange={(val) => updateField('payment_method', val)}
              />
            </div>
          </div>

          {(metadata.payment_method || 'Medical aid claim') === 'Medical aid claim' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="med-scheme">Medical aid scheme</Label>
                <Input
                  id="med-scheme"
                  placeholder="e.g. Discovery Health, Bonitas, Gems"
                  value={metadata.medical_aid_scheme || ''}
                  onChange={(e) => updateField('medical_aid_scheme', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="med-number">Membership number (optional)</Label>
                <Input
                  id="med-number"
                  placeholder="For faster reception check-in"
                  value={metadata.medical_aid_number || ''}
                  onChange={(e) => updateField('medical_aid_number', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Automotive Intake */}
      {template.id === 'Automotive' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="veh-reg">Vehicle registration</Label>
              <Input
                id="veh-reg"
                placeholder="e.g. CA 482-910 or GP 12 XX"
                value={metadata.vehicle_reg || ''}
                onChange={(e) => updateField('vehicle_reg', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="veh-make">Make & model</Label>
              <Input
                id="veh-make"
                placeholder="e.g. VW Polo 1.0 TSI / Toyota Hilux"
                value={metadata.vehicle_make_model || ''}
                onChange={(e) => updateField('vehicle_make_model', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="veh-year">Year</Label>
              <Input
                id="veh-year"
                placeholder="e.g. 2022"
                value={metadata.vehicle_year || ''}
                onChange={(e) => updateField('vehicle_year', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="veh-odo">Approx. odometer (km)</Label>
              <Input
                id="veh-odo"
                placeholder="e.g. 60 000 km"
                value={metadata.odometer_km || ''}
                onChange={(e) => updateField('odometer_km', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Drop-off & transport option</Label>
            <PillSelector
              options={['Drop & collect', 'Wait at workshop', 'Need local shuttle']}
              value={metadata.transport_option || 'Drop & collect'}
              onChange={(val) => updateField('transport_option', val)}
            />
          </div>
        </div>
      )}

      {/* 3. Fitness & Classes Intake */}
      {template.id === 'Fitness & Classes' && (
        <div className="space-y-4">
          <div>
            <Label>Choose your studio spot / station</Label>
            <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-7">
              {Array.from({ length: 14 }, (_, i) => i + 1).map((spotNum) => {
                const isSelected = Number(metadata.spot_number || 4) === spotNum;
                return (
                  <button
                    key={spotNum}
                    type="button"
                    onClick={() => updateField('spot_number', spotNum)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border py-2 text-xs font-medium transition',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-secondary/40 text-foreground hover:border-primary/40',
                    )}
                  >
                    <span>Spot {spotNum}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Booking pass option</Label>
            <PillSelector
              options={['Single drop-in', 'Use class pack', 'First-timer intro offer']}
              value={metadata.pass_type || 'Single drop-in'}
              onChange={(val) => updateField('pass_type', val)}
            />
          </div>
        </div>
      )}

      {/* 4. Sport Facilities Intake */}
      {template.id === 'Sport Facilities' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Sport / facility</Label>
              <PillSelector
                options={['Padel', 'Tennis', 'Squash', '5-a-Side Turf']}
                value={metadata.sport_type || 'Padel'}
                onChange={(val) => updateField('sport_type', val)}
              />
            </div>
            <div>
              <Label>Match format</Label>
              <PillSelector
                options={['Casual booking', 'Open match — find players', 'Coaching session']}
                value={metadata.match_type || 'Casual booking'}
                onChange={(val) => updateField('match_type', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Tuition Intake */}
      {template.id === 'Tuition' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tuition-subject">Subject</Label>
              <Select
                id="tuition-subject"
                value={metadata.subject || 'Mathematics'}
                onChange={(e) => updateField('subject', e.target.value)}
                className="mt-1.5"
              >
                {[
                  'Mathematics',
                  'Physical Sciences',
                  'English & Literature',
                  'Accounting',
                  'Life Sciences',
                  'Coding & Computer Science',
                ].map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tuition-level">Academic level</Label>
              <Select
                id="tuition-level"
                value={metadata.academic_level || 'Matric (Grade 10–12 IEB/CAPS)'}
                onChange={(e) => updateField('academic_level', e.target.value)}
                className="mt-1.5"
              >
                {[
                  'Primary (Grade 4–7)',
                  'Junior High (Grade 8–9)',
                  'Matric (Grade 10–12 IEB/CAPS)',
                  'Cambridge IGCSE / A-Level',
                  'University / Tertiary',
                ].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Lesson delivery mode</Label>
              <PillSelector
                options={['In-person at centre', 'Online video classroom']}
                value={metadata.delivery_mode || 'In-person at centre'}
                onChange={(val) => updateField('delivery_mode', val)}
              />
            </div>
            <div>
              <Label>Lesson option</Label>
              <PillSelector
                options={['Single lesson', 'Trial assessment', '5-lesson pack', '10-lesson pack']}
                value={metadata.lesson_pack || 'Single lesson'}
                onChange={(val) => updateField('lesson_pack', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Restaurants & Cafes Intake */}
      {template.id === 'Restaurants & Cafes' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Party size (guests)</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => {
                  const active = Number(metadata.party_size || 2) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('party_size', num)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40',
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Sitting</Label>
              <PillSelector
                options={['Lunch', 'Dinner', 'Breakfast / Brunch']}
                value={metadata.sitting || 'Dinner'}
                onChange={(val) => updateField('sitting', val)}
              />
            </div>
          </div>

          <div>
            <Label>Seating area preference</Label>
            <PillSelector
              options={['Main Dining Room', 'Covered Courtyard', "Chef's Counter", 'Private Dining Room']}
              value={metadata.seating_area || 'Covered Courtyard'}
              onChange={(val) => {
                updateField('seating_area', val);
              }}
            />
          </div>

          <div>
            <Label>Occasion & dietary notes</Label>
            <MultiTagSelector
              options={[
                'Birthday',
                'Anniversary',
                'Business meal',
                'Halaal-friendly',
                'Vegetarian / Vegan',
                'Gluten-free',
                'High chair needed',
              ]}
              selected={metadata.occasion_tags || []}
              onChange={(tags) => updateField('occasion_tags', tags)}
            />
          </div>
        </div>
      )}

      {/* 7. Catering & Events Intake */}
      {template.id === 'Catering & Events' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat-event-type">Event type</Label>
              <Select
                id="cat-event-type"
                value={metadata.event_type || 'Private celebration / dinner'}
                onChange={(e) => updateField('event_type', e.target.value)}
                className="mt-1.5"
              >
                {[
                  'Private celebration / dinner',
                  'Corporate function / launch',
                  'Wedding reception',
                  'Menu tasting & consultation',
                ].map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="cat-guests">Estimated guest count</Label>
              <Input
                id="cat-guests"
                type="number"
                min="10"
                max="500"
                value={metadata.guest_count ?? 40}
                onChange={(e) => updateField('guest_count', Number(e.target.value) || 20)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Service style</Label>
            <PillSelector
              options={['Drop-off harvest platters', 'Staffed buffet & stations', 'Full-service plated']}
              value={metadata.service_style || 'Staffed buffet & stations'}
              onChange={(val) => updateField('service_style', val)}
            />
          </div>
          <div>
            <Label htmlFor="cat-venue">Event venue / delivery address</Label>
            <Input
              id="cat-venue"
              placeholder="Venue name or street address in South Africa"
              value={metadata.venue_address || ''}
              onChange={(e) => updateField('venue_address', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      {/* 8. Venues & Spaces Intake */}
      {template.id === 'Venues & Spaces' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Hire duration</Label>
              <PillSelector
                options={[
                  'Half-day AM (08:00–12:30)',
                  'Half-day PM (13:30–17:30)',
                  'Full-day (08:00–17:00)',
                  'Evening event',
                ]}
                value={metadata.hire_duration || 'Half-day AM (08:00–12:30)'}
                onChange={(val) => updateField('hire_duration', val)}
              />
            </div>
            <div>
              <Label htmlFor="venue-guests">Expected attendees</Label>
              <Input
                id="venue-guests"
                type="number"
                min="2"
                max="300"
                value={metadata.guest_count ?? 25}
                onChange={(e) => updateField('guest_count', Number(e.target.value) || 10)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Room seating layout</Label>
            <PillSelector
              options={['Boardroom', 'Theatre', 'Banquet', 'Classroom', 'Cocktail / Standing']}
              value={metadata.room_layout || 'Boardroom'}
              onChange={(val) => updateField('room_layout', val)}
            />
          </div>
        </div>
      )}

      {/* 9. Home & Trade Services Intake */}
      {template.id === 'Home & Trade Services' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Trade category</Label>
              <PillSelector
                options={['Plumbing & Geysers', 'Electrical & DB', 'Gas & Solar', 'General Maintenance']}
                value={metadata.trade_category || 'Plumbing & Geysers'}
                onChange={(val) => updateField('trade_category', val)}
              />
            </div>
            <div>
              <Label>Call-out urgency</Label>
              <PillSelector
                options={['Standard call-out', 'Same-day priority', 'Emergency 2-hr response']}
                value={metadata.urgency_tier || 'Standard call-out'}
                onChange={(val) => updateField('urgency_tier', val)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="trade-suburb">Suburb & street address</Label>
              <Input
                id="trade-suburb"
                placeholder="e.g. 14 Oak Ave, Claremont"
                value={metadata.service_address || ''}
                onChange={(e) => updateField('service_address', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="trade-prop">Property type & access</Label>
              <Select
                id="trade-prop"
                value={metadata.property_type || 'Free-standing house'}
                onChange={(e) => updateField('property_type', e.target.value)}
                className="mt-1.5"
              >
                {[
                  'Free-standing house',
                  'Security estate (gate code required)',
                  'Apartment / sectional title',
                  'Commercial premises',
                ].map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Preferred arrival window</Label>
            <PillSelector
              options={['Morning (08:00–11:00)', 'Midday (11:00–14:00)', 'Afternoon (14:00–17:00)']}
              value={metadata.arrival_window || 'Morning (08:00–11:00)'}
              onChange={(val) => updateField('arrival_window', val)}
            />
          </div>
        </div>
      )}

      {/* 10. Pet Services Intake */}
      {template.id === 'Pet Services' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="pet-name">Pet’s name</Label>
              <Input
                id="pet-name"
                placeholder="e.g. Milo"
                value={metadata.pet_name || ''}
                onChange={(e) => updateField('pet_name', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pet-breed">Breed</Label>
              <Input
                id="pet-breed"
                placeholder="e.g. Golden Retriever / Cavapoo"
                value={metadata.pet_breed || ''}
                onChange={(e) => updateField('pet_breed', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Species</Label>
              <PillSelector
                options={['Dog', 'Cat']}
                value={metadata.pet_species || 'Dog'}
                onChange={(val) => updateField('pet_species', val)}
              />
            </div>
          </div>
          <div>
            <Label>Size & weight bracket</Label>
            <PillSelector
              options={['Small (<10 kg)', 'Medium (10–25 kg)', 'Large (25–40 kg)', 'Giant (40 kg+)']}
              value={metadata.pet_size || 'Medium (10–25 kg)'}
              onChange={(val) => updateField('pet_size', val)}
            />
          </div>
          <div>
            <Label>Temperament & handling notes</Label>
            <MultiTagSelector
              options={[
                'Friendly with groomers',
                'First groom / puppy',
                'Anxious with dryer',
                'Senior pet — gentle support',
                'Long / double coat',
              ]}
              selected={metadata.temperament_tags || []}
              onChange={(tags) => updateField('temperament_tags', tags)}
            />
          </div>
        </div>
      )}

      {/* 11. Photography & Creative Services Intake */}
      {template.id === 'Photography & Creative Services' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Shoot location mode</Label>
              <PillSelector
                options={['In-studio', 'On-location']}
                value={metadata.location_mode || 'In-studio'}
                onChange={(val) => updateField('location_mode', val)}
              />
            </div>
            <div>
              <Label>Lighting preference</Label>
              <PillSelector
                options={['Standard daylight / studio', 'Golden Hour outdoor slot']}
                value={metadata.golden_hour ? 'Golden Hour outdoor slot' : 'Standard daylight / studio'}
                onChange={(val) =>
                  updateField('golden_hour', val === 'Golden Hour outdoor slot')
                }
              />
            </div>
          </div>
          {metadata.location_mode === 'On-location' && (
            <div>
              <Label htmlFor="shoot-loc">On-location address or landmark</Label>
              <Input
                id="shoot-loc"
                placeholder="e.g. Clifton 4th Beach / Company offices in Sandton"
                value={metadata.shoot_location_address || ''}
                onChange={(e) => updateField('shoot_location_address', e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}
        </div>
      )}

      {/* 12. Professional Consultations Intake */}
      {template.id === 'Professional Consultations' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Practice area</Label>
              <PillSelector
                options={[
                  'Corporate & Commercial',
                  'Tax & Structuring',
                  'Estate & Trust Planning',
                  'General Advisory',
                ]}
                value={metadata.practice_area || 'Corporate & Commercial'}
                onChange={(val) => updateField('practice_area', val)}
              />
            </div>
            <div>
              <Label>Meeting format</Label>
              <PillSelector
                options={['Video call (Teams / Zoom)', 'In-person boardroom', 'Phone consultation']}
                value={metadata.meeting_format || 'Video call (Teams / Zoom)'}
                onChange={(val) => updateField('meeting_format', val)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="prof-entity">Client / entity name</Label>
              <Input
                id="prof-entity"
                placeholder="Individual or company name"
                value={metadata.entity_name || ''}
                onChange={(e) => updateField('entity_name', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="prof-counterparty">Counterparty (for conflict check)</Label>
              <Input
                id="prof-counterparty"
                placeholder="Optional opposing / contracting party"
                value={metadata.counterparty_name || ''}
                onChange={(e) => updateField('counterparty_name', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optional Category Add-ons (for templates that define ZAR add-ons) */}
      {template.addons.length > 0 && (
        <div className="space-y-2.5 border-t border-border/60 pt-4">
          <Label>Optional {template.title.toLowerCase()} add-ons</Label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {template.addons.map((addon) => {
              const checked = selectedAddons.some((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border p-3 text-left text-xs transition',
                    checked
                      ? 'border-primary bg-primary/[0.06] text-foreground shadow-sm'
                      : 'border-border bg-secondary/25 text-muted-foreground hover:border-primary/35 hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background',
                      )}
                    >
                      {checked ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                    </span>
                    {addon.label}
                  </span>
                  <span className="shrink-0 font-display text-xs font-semibold text-foreground">
                    {addon.price > 0 ? `+${formatZAR(addon.price)}` : 'Included'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
