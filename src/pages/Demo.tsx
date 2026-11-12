/**
 * Platform Simulator Page (`/demo`)
 * ---------------------------------
 * Modeled after TimeTrack's Platform Simulator (`Demo.tsx`).
 * Allows the Platform Master to 1-click launch any persona (Master, Clinic Admin,
 * Salon Manager, Mechanic Manager, or Customer) and preview their experience.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Scissors,
  Wrench,
  User,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { masterApi } from '../services/api';
import { Button, Spinner } from '../components/ui';

const DEMO_PERSONAS = [
  {
    email: 'master@smartpatel.co.za',
    label: 'Platform Master',
    roleBadge: 'master',
    targetPath: '/master',
    description:
      'Root governance over all South African businesses, onboarding, tenant suspension & audit trail.',
    icon: ShieldCheck,
  },
  {
    email: 'admin@bookit.com',
    label: 'Diana Prince — Sandton Medical Clinic',
    roleBadge: 'admin (Doctor)',
    targetPath: '/dashboard',
    description:
      'Flagship medical practice owner in Sandton: manage GP consultations, doctors, slots & today’s schedule.',
    icon: Stethoscope,
  },
  {
    email: 'thabo@bookit.com',
    label: 'Thabo Mokoena — Atelier Hair & Beauty',
    roleBadge: 'manager (Salon)',
    targetPath: '/dashboard',
    description:
      'Rosebank salon manager: manage stylists, balayage & manicure rates, open slots & customer reminders.',
    icon: Scissors,
  },
  {
    email: 'ayesha@bookit.com',
    label: 'Ayesha Pillay — Cape Auto Precision',
    roleBadge: 'manager (Mechanic)',
    targetPath: '/dashboard',
    description:
      'Cape Town RMI workshop manager: manage diagnostic bays, technicians, service bookings & revenue.',
    icon: Wrench,
  },
  {
    email: 'sipho@bookit.com',
    label: 'Sipho Ndlovu — Customer Account',
    roleBadge: 'customer',
    targetPath: '/my-bookings',
    description:
      'Customer portal: browse businesses across South Africa, book open slots, view reminders & cancel visits.',
    icon: User,
  },
];

export default function Demo() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const handleLaunch = async (email: string, targetPath: string) => {
    setLoadingEmail(email);
    try {
      const res = await masterApi.demoLogin(email);
      toast.success(res.message);
      await refresh();
      navigate(targetPath);
    } catch (err: any) {
      toast.error(err.message || 'Simulator launch failed');
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-5 sm:py-10">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Operator Sandbox
          </span>
        </div>
        <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
          Platform Simulator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Simulate multi-tenant business owners and customer personas with one click.
        </p>
      </div>

      <div className="flex items-start gap-3.5 rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:gap-4 sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-sm">
          <h4 className="font-display text-base text-foreground">
            Exclusive Operator Simulator Access
          </h4>
          <p className="mt-1 text-muted-foreground">
            In compliance with TimeTrack & BookIt! security standards, quick-login demo
            accounts are hidden from the public login page and can only be launched from an
            authenticated Master Operator session.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {DEMO_PERSONAS.map((persona) => {
          const Icon = persona.icon;
          const isBusy = loadingEmail === persona.email;

          return (
            <div
              key={persona.email}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >
              <div>
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg text-foreground">{persona.label}</h3>
                    <p className="break-all text-xs text-muted-foreground">
                      {persona.email} · <span className="text-primary">{persona.roleBadge}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{persona.description}</p>
              </div>

              <Button
                onClick={() => handleLaunch(persona.email, persona.targetPath)}
                disabled={loadingEmail !== null}
                className="mt-6 h-11 w-full rounded-full"
              >
                {isBusy ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 border-primary-foreground" />
                    Launching Persona…
                  </>
                ) : (
                  <>
                    Launch Persona <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
