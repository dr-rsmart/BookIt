/**
 * Category Template Picker (`13 unique category templates.jpeg`)
 * --------------------------------------------------------------
 * Renders the 13 industry category templates with their 5 domain terminology
 * mappings (Team · Service · Resource · Customer · Booking) and 3 capability
 * chips. Can be rendered inline or inside a modal dialog.
 */

import { useState, type ReactNode } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import {
  CATEGORY_TEMPLATES,
  resolveCategoryTemplate,
  cn,
  type CategoryTemplateSpec,
} from '../../lib/utils';
import { Button } from '../ui';

export function CategoryTemplateGrid({
  selectedTemplateId,
  onSelect,
}: {
  selectedTemplateId: string;
  onSelect: (template: CategoryTemplateSpec) => void;
}) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORY_TEMPLATES.map((tpl) => {
        const Icon = tpl.Icon;
        const isSelected = tpl.id === selectedTemplateId;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl)}
            className={cn(
              'group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition duration-200',
              isSelected
                ? 'border-primary bg-primary/[0.04] shadow-[0_14px_34px_-24px_rgba(225,0,100,0.55)] ring-1 ring-primary/40'
                : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/30',
            )}
          >
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                      isSelected
                        ? 'border-primary/30 bg-primary text-primary-foreground'
                        : 'border-border bg-secondary/70 text-primary group-hover:border-primary/30',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold leading-snug text-foreground">
                      {tpl.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tpl.subtitle}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* 5 Terminology Mapping Nouns */}
              <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                {tpl.terminologyPills.map((noun, idx) => (
                  <span key={`${tpl.id}-noun-${idx}`} className="inline-flex items-center gap-1.5">
                    {idx > 0 && <span className="text-border">·</span>}
                    <span className="font-medium text-foreground/85">{noun}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Feature / Capability Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
              {tpl.featureChips.map((chip) => (
                <span
                  key={chip}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                    isSelected
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/80 bg-background text-muted-foreground',
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CategoryTemplatePickerModal({
  currentCategory,
  currentTemplateId,
  onSelectTemplate,
  trigger,
}: {
  currentCategory?: string | null;
  currentTemplateId?: string | null;
  onSelectTemplate: (template: CategoryTemplateSpec) => void | Promise<void>;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeTemplate = resolveCategoryTemplate(currentCategory, currentTemplateId);
  const ActiveIcon = activeTemplate.Icon;

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => setOpen(true)}
        >
          <ActiveIcon className="h-3.5 w-3.5 text-primary" />
          <span>Template: {activeTemplate.title}</span>
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Category template"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header matching `13 unique category templates.jpeg` */}
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  13 Industry Templates
                </div>
                <h2 className="mt-1 font-display text-xl text-foreground sm:text-2xl">
                  Category template
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Booking page, terminology & workspace adapt to your business type
                </p>
              </div>
              <button
                type="button"
                aria-label="Close template picker"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable 13-template grid */}
            <div className="overflow-y-auto p-4 sm:p-6">
              <CategoryTemplateGrid
                selectedTemplateId={activeTemplate.id}
                onSelect={async (tpl) => {
                  await onSelectTemplate(tpl);
                  setOpen(false);
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-secondary/30 px-5 py-3.5 text-xs text-muted-foreground sm:px-7">
              <span>
                Active template: <strong className="text-foreground">{activeTemplate.title}</strong>{' '}
                ({activeTemplate.terminologyPills.join(' · ')})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
