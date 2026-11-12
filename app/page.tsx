import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  Landmark,
  MapPin,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PortalLogo } from "@/components/portal-logo";

const citizenServices = [
  {
    icon: FileText,
    title: "Submit a grievance",
    description: "Tell us what happened, where it happened, and which public service is affected. Attach a supporting image or document if needed.",
  },
  {
    icon: SearchCheck,
    title: "Follow every update",
    description: "Use your secure Citizen account to find your reference number, check the assigned department, and follow case progress.",
  },
  {
    icon: MessageSquareText,
    title: "Be heard after resolution",
    description: "Read public case updates and share feedback when your grievance has been marked resolved.",
  },
];

const workflowSteps = [
  { number: "01", title: "Submit", text: "Describe your concern and receive a unique reference number." },
  { number: "02", title: "Review", text: "The CMO reviews the grievance and routes it to the relevant department." },
  { number: "03", title: "Action", text: "Department officers investigate, record progress, and report action taken." },
  { number: "04", title: "Resolve", text: "The CMO reviews the response and updates the case. You can then leave feedback." },
];

const staffFeatures = [
  {
    icon: Landmark,
    title: "CMO administration",
    description: "Review and route cases, monitor overdue grievances, add internal remarks, review department reports, and view district and department statistics.",
  },
  {
    icon: Building2,
    title: "Department workspaces",
    description: "Officers can investigate assigned cases, record progress with supporting PDFs, submit action reports, or forward cases to another department.",
  },
  {
    icon: HeartHandshake,
    title: "AI-assisted review",
    description: "CMO staff can request an advisory complaint summary, category, department, priority, and possible duplicate flags for human review.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <a
        className="sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-semibold text-teal-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>

      <div className="bg-[#123b36] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 text-xs sm:px-8">
          <p className="flex items-center gap-2 font-medium">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#f1c75b]" />
            Government of Kerala · Public Service Portal
          </p>
          <p className="hidden text-white/75 sm:block">A secure way to bring public service concerns to the right department</p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/65 shadow-sm shadow-slate-900/5 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 sm:px-8 xl:flex-nowrap">
          <Link aria-label="CM Kerala Public Service Portal home" className="flex min-w-0 items-center gap-3" href="/">
            <PortalLogo className="h-12 w-[72px] shrink-0" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold tracking-[0.16em] text-[#0f766e]">GOVERNMENT OF KERALA</span>
              <span className="mt-0.5 block text-sm font-semibold leading-5 text-slate-900 sm:text-base">Chief Minister&apos;s Public Service Portal</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-x-5 gap-y-2 overflow-x-auto border-t border-slate-100 pt-3 text-sm font-medium text-slate-600 xl:order-none xl:w-auto xl:flex-1 xl:justify-center xl:gap-4 xl:px-1 xl:border-0 xl:pt-0 xl:text-[13px]">
            <a className="whitespace-nowrap transition hover:text-[#0f766e]" href="#services">Citizen services</a>
            <a className="whitespace-nowrap transition hover:text-[#0f766e]" href="#how-it-works">How it works</a>
            <a className="whitespace-nowrap transition hover:text-[#0f766e]" href="#for-officials">For officials</a>
            <a className="whitespace-nowrap transition hover:text-[#0f766e]" href="#departments">Departments</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="rounded-lg px-2.5 py-2 text-sm font-semibold text-[#0f766e] transition hover:bg-teal-50"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-lg bg-[#0f766e] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <div id="main-content">
        <section className="relative isolate flex min-h-[760px] items-center overflow-hidden bg-[#123b36] sm:min-h-[820px] lg:min-h-[calc(100svh-110px)]">
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover object-center"
            fill
            priority
            sizes="100vw"
            src="/images/wallpaper.png"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-0 bg-gradient-to-r from-[#092c28]/95 via-[#123b36]/78 to-[#123b36]/35" />
          <div aria-hidden="true" className="absolute inset-0 -z-0 bg-gradient-to-t from-[#092c28]/55 via-transparent to-[#092c28]/15" />

          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:py-28">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                <ShieldCheck aria-hidden="true" size={15} className="text-emerald-200" />
                CITIZEN-FIRST · SECURE · ACCOUNTABLE
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.85rem]">
                Your voice can help make public services better.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                Submit a grievance to the Chief Minister&apos;s Public Service Portal and follow its journey from review to action by the concerned department.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#0b625c]"
                  href="/register"
                >
                  Register to submit a grievance
                  <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={17} />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                  href="/login"
                >
                  Sign in to your account
                </Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-white/75">
                Already submitted? Sign in to view your reference number and case updates.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[31rem]">
              <div className="absolute -left-5 top-16 hidden size-16 rounded-2xl border border-white/40 bg-white/20 shadow-lg shadow-black/10 backdrop-blur-md sm:grid sm:place-items-center">
                <MapPin aria-hidden="true" className="text-[#0f766e]" size={25} />
              </div>
              <div className="absolute -right-3 bottom-14 hidden size-16 rounded-2xl border border-white/40 bg-white/20 shadow-lg shadow-black/10 backdrop-blur-md sm:grid sm:place-items-center">
                <ClipboardCheck aria-hidden="true" className="text-[#0f766e]" size={25} />
              </div>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">Your grievance journey</p>
                    <p className="mt-1 text-sm text-slate-500">A clear path from submission to action</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[#0f766e]">
                    <UsersRound aria-hidden="true" size={20} />
                  </span>
                </div>
                <ol className="mt-6 space-y-0">
                  {workflowSteps.map((step, index) => (
                    <li className="relative flex gap-4 pb-6 last:pb-0" key={step.number}>
                      {index < workflowSteps.length - 1 && (
                        <span aria-hidden="true" className="absolute left-[17px] top-9 h-[calc(100%-1rem)] w-px bg-teal-100" />
                      )}
                      <span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#0f766e] text-white" : "border border-teal-100 bg-[#f4faf7] text-[#0f766e]"}`}>
                        {index === 0 ? <CheckCircle2 aria-hidden="true" size={17} /> : step.number}
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#f3f8f6] px-4 py-3">
                  <ShieldCheck aria-hidden="true" className="shrink-0 text-[#0f766e]" size={19} />
                  <p className="text-xs leading-5 text-slate-600">Your submissions are available to you and authorized staff through your account.</p>
                </div>
              </div>
            </div>
          </div>
          <a aria-label="Scroll to citizen services" className="absolute bottom-5 left-1/2 z-10 hidden w-fit -translate-x-1/2 items-center gap-2 text-xs font-medium text-white/80 transition hover:text-white md:flex" href="#services">
            Explore portal services <ArrowDown aria-hidden="true" size={14} />
          </a>
        </section>

        <section aria-labelledby="chief-minister-heading" className="overflow-hidden bg-[#f5f8f6] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
            <div className="px-7 py-9 sm:px-10 sm:py-12 lg:px-14">
              <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">A MESSAGE OF PUBLIC SERVICE</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl" id="chief-minister-heading">
                Hon&apos;ble Chief Minister
              </h2>
              <p className="mt-2 text-xl font-medium text-[#17665e]">Shri V. D. Satheesan</p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                The Chief Minister&apos;s Public Service Portal provides a channel for Citizens to bring public-service concerns forward and follow the review and action taken by the relevant authorities.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Each grievance receives a reference number and is handled through a structured process involving CMO review, department investigation, and a response.
              </p>
              <Link
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b625c]"
                href="/register"
              >
                Submit a grievance <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
            <div className="relative flex min-h-[340px] items-end justify-center overflow-hidden bg-gradient-to-br from-[#dcefe7] via-[#f2f7f4] to-[#e8f0ed] px-5 pt-8 sm:min-h-[440px] lg:min-h-[520px]">
              <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[78%] w-[78%] -translate-x-1/2 rounded-t-full bg-white/70" />
              <Image
                alt="Portrait of Shri V. D. Satheesan"
                className="relative z-10 max-h-[440px] w-auto max-w-full object-contain object-bottom sm:max-h-[500px]"
                height={1024}
                priority={false}
                sizes="(max-width: 1024px) 90vw, 42vw"
                src="/images/cmvd.png"
                width={433}
              />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-9">
            <TrustPoint title="One reference number" text="Keep a unique ID for your grievance." />
            <TrustPoint title="Department-led action" text="Cases are routed to the responsible department." />
            <TrustPoint title="Progress you can follow" text="Sign in to see status and public updates." />
          </div>
        </section>

        <section className="scroll-mt-28 bg-white px-5 py-16 sm:px-8 sm:py-20" id="services">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="SERVICES FOR CITIZENS"
              title="A simpler way to raise and follow concerns"
              description="Create an account to submit a grievance and keep its progress in one place."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {citizenServices.map((service, index) => {
                const Icon = service.icon;
                return (
                  <article className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-800/20 hover:shadow-xl hover:shadow-slate-900/5 sm:p-7" key={service.title}>
                    <span className="grid size-12 place-items-center rounded-xl bg-[#edf7f3] text-[#0f766e] transition group-hover:bg-[#0f766e] group-hover:text-white">
                      <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
                    </span>
                    <p className="mt-6 text-xs font-bold tracking-[0.14em] text-teal-700">0{index + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f4f8f6] p-5 sm:px-7 sm:py-6">
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                To protect your grievance details, tracking is available after signing in to the Citizen account used to submit it.
              </p>
              <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0f766e] hover:text-[#0b625c]" href="/login">
                Go to sign in <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 bg-[#f5f8f6] px-5 py-16 sm:px-8 sm:py-20" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="THE PROCESS"
              title="What happens after you submit"
              description="A grievance moves through review, department action, and a response from the CMO."
            />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step) => (
                <li className="relative rounded-2xl border border-slate-200 bg-white p-6" key={step.number}>
                  <span className="text-sm font-bold tracking-[0.12em] text-[#0f766e]">{step.number}</span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Case progress depends on the review and actions taken by the responsible officials. Notifications by email or SMS are not currently provided.
            </p>
          </div>
        </section>

        <section className="scroll-mt-28 bg-white px-5 py-16 sm:px-8 sm:py-20" id="for-officials">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="FOR GOVERNMENT OFFICIALS"
              title="Tools for coordinated case handling"
              description="Role-based workspaces support CMO review and department-level investigation."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {staffFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="rounded-2xl border border-slate-200 p-6 sm:p-7" key={feature.title}>
                    <span className="grid size-11 place-items-center rounded-xl bg-[#edf7f3] text-[#0f766e]">
                      <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              AI output is advisory only. Authorized staff must verify suggestions and make all case decisions. Staff access is assigned to their account role.
            </p>
          </div>
        </section>

        <section className="scroll-mt-28 border-y border-slate-200 bg-[#f8faf9] px-5 py-14 sm:px-8" id="departments">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">CONNECTED SERVICES</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Grievances can be routed to the relevant department.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">The CMO reviews submissions and assigns them for departmental action.</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "Public Works Department",
                "Health & Family Welfare",
                "General and Higher Education",
                "Local Self Government",
                "Revenue and Kerala Police",
                "Water Resources and Electricity",
                "Transport and Agriculture",
                "Food, Social Justice, Women & Child Development",
              ].map((department) => (
                <li className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-700" key={department}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />
                  {department}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#123b36] px-5 py-14 text-white sm:px-8 sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#bce4d5]">READY TO GET STARTED?</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Your concern deserves a clear path forward.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Register as a Citizen to submit a grievance, or sign in to follow an existing case.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#123b36] transition hover:bg-teal-50" href="/register">
                Create an account
              </Link>
              <Link className="rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#0d2f2c] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-[68px] place-items-center rounded-md bg-white p-1">
                  <PortalLogo className="h-full w-full" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-[#c2e9db]">GOVERNMENT OF KERALA</p>
                  <p className="mt-1 text-sm font-medium text-white">Chief Minister&apos;s Public Service Portal</p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                A digital portal for Citizens to submit public service grievances and follow updates from the responsible authorities.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Explore</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li><a className="hover:text-white" href="#services">Citizen services</a></li>
                <li><a className="hover:text-white" href="#how-it-works">How it works</a></li>
                <li><a className="hover:text-white" href="#departments">Departments</a></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Account access</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li><Link className="hover:text-white" href="/login">Citizen and staff sign in</Link></li>
                <li><Link className="hover:text-white" href="/register">Citizen registration</Link></li>
                <li><Link className="hover:text-white" href="/officer/register">Officer demo registration</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap justify-between gap-2 border-t border-white/15 pt-5 text-xs text-white/55">
            <p>Government of Kerala · Public Service Portal</p>
            <p>Designed for accessible, transparent grievance tracking</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.15rem]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

function TrustPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 sm:justify-center">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-[#0f766e]">
        <CheckCircle2 aria-hidden="true" size={17} />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}
