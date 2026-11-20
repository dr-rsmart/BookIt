/**
 * Business Profile Form (`MP` in Base44)
 * --------------------------------------
 * Used for both initial business creation ("List your business")
 * and editing in `/dashboard/profile`.
 */

import { useState, type FormEvent } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Label,
  WorkingHoursEditor,
  ImageUpload,
} from '../ui';
import {
  CATEGORY_TEMPLATES,
  resolveCategoryTemplate,
  defaultWorkingHours,
} from '../../lib/utils';
import { CategoryTemplatePickerModal } from './CategoryTemplatePicker';
import type { ProviderRecord, WorkingHoursDay } from '../../../contracts';

const DEFAULT_VALUES = {
  name: '',
  category: 'Hair, Beauty & Wellness',
  template_id: 'Hair, Beauty & Wellness',
  tagline: '',
  about: '',
  phone: '',
  email: '',
  website: '',
  street: '',
  city: '',
  postcode: '',
  country: 'South Africa',
  cover_image: '',
};

export default function BusinessForm({
  initial,
  submitLabel = 'Save changes',
  allowCategorySelect = false,
  onCoverImageChange,
  onSubmit,
}: {
  initial?: Partial<ProviderRecord> | null;
  submitLabel?: string;
  allowCategorySelect?: boolean;
  onCoverImageChange?: (url: string) => void | Promise<void>;
  onSubmit: (data: Partial<ProviderRecord>) => Promise<void>;
}) {
  const [fields, setFields] = useState(() => {
    const initCat = initial?.category ?? DEFAULT_VALUES.category;
    const resolvedTpl = resolveCategoryTemplate(initCat, initial?.template_id);
    return {
      name: initial?.name ?? DEFAULT_VALUES.name,
      category: initCat,
      template_id: resolvedTpl.id,
      tagline: initial?.tagline ?? DEFAULT_VALUES.tagline,
      about: initial?.about ?? DEFAULT_VALUES.about,
      phone: initial?.phone ?? DEFAULT_VALUES.phone,
      email: initial?.email ?? DEFAULT_VALUES.email,
      website: initial?.website ?? DEFAULT_VALUES.website,
      street: initial?.street ?? DEFAULT_VALUES.street,
      city: initial?.city ?? DEFAULT_VALUES.city,
      postcode: initial?.postcode ?? DEFAULT_VALUES.postcode,
      country: initial?.country ?? DEFAULT_VALUES.country,
      cover_image: initial?.cover_image ?? DEFAULT_VALUES.cover_image,
    };
  });

  const [workingHours, setWorkingHours] = useState<WorkingHoursDay[]>(
    initial?.working_hours?.length ? initial.working_hours : defaultWorkingHours(),
  );
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof DEFAULT_VALUES, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const activeTemplate = resolveCategoryTemplate(fields.category, fields.template_id);
  const TemplateIcon = activeTemplate.Icon;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<ProviderRecord> = {
        ...fields,
        working_hours: workingHours,
      };
      if (!allowCategorySelect && initial?.id) {
        delete payload.category;
        delete payload.template_id;
      }
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <section className="space-y-4 rounded-3xl border border-primary/25 bg-primary/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Assigned category template
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {allowCategorySelect
                ? 'Booking page, terminology & workspace adapt to your business type.'
                : 'Categories are pre-set by Platform Master accounts based on your pricing tier. Request a Master administrator to change your category.'}
            </p>
          </div>
          {allowCategorySelect ? (
            <CategoryTemplatePickerModal
              currentCategory={fields.category}
              currentTemplateId={fields.template_id}
              onSelectTemplate={(tpl) => {
                setFields((prev) => ({
                  ...prev,
                  template_id: tpl.id,
                  category: tpl.id,
                }));
              }}
              trigger={
                <Button type="button" variant="outline" size="sm" className="rounded-full gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Choose from 13 templates
                </Button>
              }
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Master-managed
            </span>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <TemplateIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {activeTemplate.title}
              </p>
              <p className="text-xs text-muted-foreground">{activeTemplate.subtitle}</p>
              <p className="mt-1.5 text-xs font-medium text-foreground/80">
                {activeTemplate.terminologyPills.join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeTemplate.featureChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-foreground">The basics</h2>
        <div>
          <Label htmlFor="name">Business name</Label>
          <Input
            id="name"
            required
            value={fields.name}
            onChange={(e) => setField('name', e.target.value)}
            className="mt-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            {allowCategorySelect ? (
              <Select
                id="category"
                value={activeTemplate.id}
                onChange={(e) => {
                  const newCat = e.target.value;
                  const resolved = resolveCategoryTemplate(newCat, newCat);
                  setFields((prev) => ({
                    ...prev,
                    category: resolved.id,
                    template_id: resolved.id,
                  }));
                }}
                className="mt-2"
              >
                {CATEGORY_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title} — {tpl.subtitle}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="mt-2 flex h-11 items-center justify-between rounded-md border border-input bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground sm:h-9">
                <span className="truncate font-medium text-foreground">{activeTemplate.title}</span>
                <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Set by Master
                </span>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={fields.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="tagline">Short tagline</Label>
          <Input
            id="tagline"
            value={fields.tagline}
            onChange={(e) => setField('tagline', e.target.value)}
            placeholder="What makes your place worth visiting"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            rows={4}
            value={fields.about}
            onChange={(e) => setField('about', e.target.value)}
            className="mt-2"
          />
        </div>
        <ImageUpload
          label="Cover photo"
          value={fields.cover_image}
          onChange={(url) => {
            setField('cover_image', url);
            if (onCoverImageChange) {
              void onCoverImageChange(url);
            }
          }}
        />
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-foreground">Where to find you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="street">Street address</Label>
            <Input
              id="street"
              value={fields.street}
              onChange={(e) => setField('street', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={fields.city}
              onChange={(e) => setField('city', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              value={fields.postcode}
              onChange={(e) => setField('postcode', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={fields.country}
              onChange={(e) => setField('country', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="email">Contact email</Label>
            <Input
              id="email"
              value={fields.email}
              onChange={(e) => setField('email', e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={fields.website}
              onChange={(e) => setField('website', e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-foreground">Working hours</h2>
        <WorkingHoursEditor value={workingHours} onChange={setWorkingHours} />
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
