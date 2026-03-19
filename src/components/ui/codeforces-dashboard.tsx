"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarRange,
  Clock3,
  Flame,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";

import { Button } from "@/components/ui/button";

type DashboardData = {
  profile: {
    handle: string;
    name: string;
    rank: string;
    currentRating: number | null;
    maxRating: number | null;
    avatar: string | null;
  };
  metrics: {
    totalSolved: number;
    averageRatingChange: number;
    activeWindow: string;
    lastUpdatedAt: string;
  };
  streak: {
    current: number;
    longest: number;
    activeDays: number;
    calendar: Array<{
      date: string;
      count: number;
    }>;
  };
  ratingHistory: Array<{
    contest: string;
    shortDate: string;
    fullDate: string;
    rating: number;
    delta: number;
    rank: number;
  }>;
  solvedByRating: Array<{
    rating: string;
    solved: number;
    fill?: string;
  }>;
  recentContests: Array<{
    contestId: number;
    name: string;
    date: string;
    rank: number;
    delta: number;
    newRating: number;
  }>;
};

const chartColors = [
  "var(--chart-accent-1)",
  "var(--chart-accent-2)",
  "var(--chart-accent-3)",
  "var(--chart-accent-4)",
  "var(--chart-accent-5)",
  "var(--chart-accent-6)",
  "var(--chart-accent-7)",
];

function formatDelta(delta: number) {
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
}

type RatingChartPoint = DashboardData["ratingHistory"][number] & {
  pointKey: string;
  tickLabel: string;
};

function RatingChartTooltip({
  active,
  payload,
}: Partial<TooltipContentProps<TooltipValueType, string>>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const point = entry?.payload as RatingChartPoint | undefined;
  if (!point) return null;

  const ratingValue =
    typeof entry.value === "number" || typeof entry.value === "string"
      ? entry.value
      : point.rating;
  const isPositiveDelta = point.delta >= 0;

  return (
    <div className="min-w-64 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {point.fullDate}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
        {point.contest}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Rating</p>
          <p
            className="text-base font-bold"
            style={{ color: "var(--chart-accent-1)" }}
          >
            {ratingValue}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Delta</p>
          <p
            className={
              isPositiveDelta
                ? "text-base font-bold text-emerald-500"
                : "text-base font-bold text-rose-500"
            }
          >
            {point.delta >= 0 ? "+" : ""}
            {point.delta}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Rank</p>
          <p className="text-base font-semibold text-foreground">#{point.rank}</p>
        </div>
      </div>
    </div>
  );
}

type SolvedByRatingPoint = DashboardData["solvedByRating"][number];

function SolvedByRatingTooltip({
  active,
  payload,
}: Partial<TooltipContentProps<TooltipValueType, string>>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const point = entry?.payload as SolvedByRatingPoint | undefined;
  if (!point) return null;

  const solvedValue =
    typeof entry.value === "number" || typeof entry.value === "string"
      ? entry.value
      : point.solved;

  return (
    <div className="min-w-44 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Rating Bucket
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{point.rating}</p>
      <div className="mt-3">
        <p className="text-[11px] text-muted-foreground">Solved</p>
        <p
          className="text-base font-bold"
          style={{ color: "var(--chart-accent-1)" }}
        >
          {solvedValue}
        </p>
      </div>
    </div>
  );
}

function getStreakLevel(count: number) {
  if (count === 0) return "bg-muted/60";
  if (count <= 2) return "bg-cyan-200 dark:bg-cyan-900/70";
  if (count <= 5) return "bg-cyan-300 dark:bg-cyan-700/80";
  if (count <= 9) return "bg-cyan-400 dark:bg-cyan-500/85";
  return "bg-emerald-500 dark:bg-emerald-400";
}

function formatCalendarDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

type CalendarCell = {
  date: string;
  count: number;
} | null;

function getMondayIndex(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

function buildCalendarGrid(calendar: DashboardData["streak"]["calendar"]) {
  if (calendar.length === 0) {
    return { weeks: [] as CalendarCell[][], monthLabels: [] as string[] };
  }

  const firstDate = new Date(`${calendar[0].date}T00:00:00.000Z`);
  const lastDate = new Date(`${calendar[calendar.length - 1].date}T00:00:00.000Z`);

  const gridStart = new Date(firstDate);
  gridStart.setUTCDate(firstDate.getUTCDate() - getMondayIndex(firstDate));

  const gridEnd = new Date(lastDate);
  gridEnd.setUTCDate(lastDate.getUTCDate() + (6 - getMondayIndex(lastDate)));

  const calendarByDate = new Map(calendar.map((day) => [day.date, day]));
  const weeks: CalendarCell[][] = [];
  const monthLabels: string[] = [];

  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: CalendarCell[] = [];
    let weekLabel = "";

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const day = calendarByDate.get(dateKey) ?? null;

      if (!weekLabel && day) {
        weekLabel = new Intl.DateTimeFormat("en-US", {
          month: "short",
          timeZone: "UTC",
        }).format(cursor);
      }

      week.push(day);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const previousLabel = monthLabels[monthLabels.length - 1];
    monthLabels.push(weekLabel !== previousLabel ? weekLabel : "");
    weeks.push(week);
  }

  return { weeks, monthLabels };
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function CodeforcesDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialHandle = searchParams.get("handle") ?? "";
  const [inputValue, setInputValue] = useState(initialHandle);
  const [activeHandle, setActiveHandle] = useState(initialHandle);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard(handle: string) {
    const normalized = handle.trim();
    if (!normalized) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/codeforces?handle=${encodeURIComponent(normalized)}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as DashboardData & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to fetch Codeforces data.");
      }

      setData(payload);
      setActiveHandle(normalized);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to fetch Codeforces data.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialHandle) return;
    void loadDashboard(initialHandle);
  }, [initialHandle]);

  useEffect(() => {
    if (!activeHandle) return;

    const timer = window.setInterval(() => {
      void loadDashboard(activeHandle);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [activeHandle]);

  const contestCount = data?.ratingHistory.length ?? 0;
  const ratingChartData = useMemo(() => {
    if (!data) return [];

    return data.ratingHistory.map((point, index) => ({
      ...point,
      pointKey: `${point.fullDate}-${point.contest}-${index}`,
      tickLabel: point.shortDate,
    }));
  }, [data]);
  const chartCeiling = useMemo(() => {
    if (!data) return undefined;

    const historyMax = data.ratingHistory.reduce(
      (max, point) => Math.max(max, point.rating),
      Number.NEGATIVE_INFINITY,
    );
    const peak = Math.max(
      data.profile.maxRating ?? Number.NEGATIVE_INFINITY,
      historyMax,
    );

    if (!Number.isFinite(peak)) return undefined;

    return Math.ceil((peak + 50) / 50) * 50;
  }, [data]);
  const updatedLabel = useMemo(() => {
    if (!data?.metrics.lastUpdatedAt) return "";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data.metrics.lastUpdatedAt));
  }, [data?.metrics.lastUpdatedAt]);
  const streakCalendar = useMemo(
    () =>
      data
        ? buildCalendarGrid(data.streak.calendar)
        : { weeks: [] as CalendarCell[][], monthLabels: [] as string[] },
    [data],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = inputValue.trim();
    if (!normalized) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("handle", normalized);
    router.replace(`${pathname}?${params.toString()}`);
    void loadDashboard(normalized);
  }

  return (
    <section className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="overflow-hidden rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.28),transparent_52%),linear-gradient(140deg,rgba(255,255,255,0.95),rgba(240,249,255,0.9))] p-6 text-slate-900 shadow-2xl shadow-slate-200/60 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))] dark:text-white dark:shadow-slate-950/20 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300/90">
                Codeforces Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Enter a Codeforces handle, then inspect live profile performance.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300 md:text-base">
                The dashboard pulls live data for the selected ID and shows total
                solved problems, current rating, average rating change per contest,
                the most active submission window, rating trend, solved-by-rating
                breakdown, recent contests, and a submission streak calendar.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-xl flex-col gap-3 rounded-3xl border border-sky-200/60 bg-white/65 p-4 backdrop-blur md:flex-row dark:border-white/10 dark:bg-white/5"
            >
              <label className="sr-only" htmlFor="cf-handle">
                Codeforces handle
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  id="cf-handle"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Enter Codeforces handle"
                  className="h-12 w-full rounded-2xl border border-sky-200/70 bg-white/85 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:border-cyan-400"
                />
              </div>
              <Button type="submit" className="h-12 rounded-2xl px-6">
                Show Dashboard
              </Button>
            </form>
          </div>
        </div>

        {!activeHandle && !loading ? (
          <div className="rounded-4xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <p className="text-lg font-semibold">Enter a Codeforces ID to begin.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Example handles: `tourist`, `Benq`, `Petr`.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-4xl border border-border bg-card/70">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Fetching live Codeforces data...
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-4xl border border-rose-500/20 bg-rose-500/10 px-6 py-5 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {data ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-4xl border border-border/60 bg-card/90 p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-muted font-black uppercase text-primary">
                      {data.profile.handle.slice(0, 2)}
                      {data.profile.avatar ? null : (
                        <span className="sr-only">{data.profile.handle}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Handle</p>
                      <h2 className="text-3xl font-black tracking-tight">
                        {data.profile.handle}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {data.profile.name} - {data.profile.rank}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-border px-4 py-3 text-sm">
                      <p className="text-muted-foreground">Last updated</p>
                      <p className="font-semibold">{updatedLabel}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => void loadDashboard(activeHandle)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="mt-8 grid gap-6">
                  <div className="rounded-3xl border border-border/60 bg-muted/20 p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">Submission Streak Calendar</h3>
                        <p className="text-sm text-muted-foreground">
                          Last 140 days of Codeforces submission activity.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Less</span>
                        <span className="h-3 w-3 rounded-sm bg-muted/60" />
                        <span className="h-3 w-3 rounded-sm bg-cyan-200 dark:bg-cyan-900/70" />
                        <span className="h-3 w-3 rounded-sm bg-cyan-300 dark:bg-cyan-700/80" />
                        <span className="h-3 w-3 rounded-sm bg-cyan-400 dark:bg-cyan-500/85" />
                        <span className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
                        <span>More</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <div className="mt-6 grid grid-rows-7 gap-1.5 text-[11px] text-muted-foreground">
                        {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, index) => (
                          <span key={`${label}-${index}`} className="flex h-4 items-center">
                            {label}
                          </span>
                        ))}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="mb-2 grid gap-1.5 text-[11px] text-muted-foreground"
                          style={{
                            gridTemplateColumns: `repeat(${streakCalendar.weeks.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {streakCalendar.monthLabels.map((label, index) => (
                            <span key={`${label}-${index}`} className="truncate">
                              {label}
                            </span>
                          ))}
                        </div>

                        <div
                          className="grid gap-1.5"
                          style={{
                            gridTemplateColumns: `repeat(${streakCalendar.weeks.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {streakCalendar.weeks.map((week, weekIndex) => (
                            <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1.5">
                              {week.map((day, dayIndex) =>
                                day ? (
                                  <div
                                    key={day.date}
                                    title={`${formatCalendarDate(day.date)}: ${day.count} submissions`}
                                    className={`aspect-square w-full rounded-sm border border-border/40 ${getStreakLevel(day.count)}`}
                                  />
                                ) : (
                                  <div
                                    key={`empty-${weekIndex}-${dayIndex}`}
                                      className="aspect-square w-full rounded-sm opacity-0"
                                  />
                                ),
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Flame className="h-4 w-4 text-orange-400" />
                        Current streak
                      </div>
                      <p className="mt-3 text-4xl font-black tracking-tight">
                        {data.streak.current}
                      </p>
                      <p className="text-sm text-muted-foreground">consecutive days</p>
                    </div>
                    <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Sparkles
                          className="h-4 w-4"
                          style={{ color: "var(--chart-accent-1)" }}
                        />
                        Longest streak
                      </div>
                      <p className="mt-3 text-4xl font-black tracking-tight">
                        {data.streak.longest}
                      </p>
                      <p className="text-sm text-muted-foreground">best run recorded</p>
                    </div>
                    <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarRange className="h-4 w-4 text-emerald-400" />
                        Active days
                      </div>
                      <p className="mt-3 text-4xl font-black tracking-tight">
                        {data.streak.activeDays}
                      </p>
                      <p className="text-sm text-muted-foreground">days with submissions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Total Questions Done"
                  value={String(data.metrics.totalSolved)}
                  hint="Unique accepted problems from the fetched submission history."
                  icon={<Trophy className="h-5 w-5" />}
                />
                <MetricCard
                  label="Current Rating"
                  value={data.profile.currentRating?.toString() ?? "Unrated"}
                  hint={`Max rating: ${data.profile.maxRating ?? "N/A"}`}
                  icon={<Activity className="h-5 w-5" />}
                />
                <MetricCard
                  label="Average Rating Change"
                  value={formatDelta(data.metrics.averageRatingChange)}
                  hint={`Computed across ${contestCount} rated contests.`}
                  icon={<BarChart3 className="h-5 w-5" />}
                />
                <MetricCard
                  label="Most Active On CF"
                  value={data.metrics.activeWindow}
                  hint="Based on recent submission timestamps in UTC."
                  icon={<Clock3 className="h-5 w-5" />}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-4xl border border-border/60 bg-linear-to-b from-card to-muted/15 p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Current Rating Graph</h3>
                  <p className="text-sm text-muted-foreground">
                    Rating after each rated Codeforces contest. Peak rating is taken
                    from the live profile data.
                  </p>
                </div>
                <div className="h-85 w-full rounded-3xl border border-border/60 bg-background/45 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={ratingChartData}
                      margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                        opacity={0.6}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="pointKey"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                        tickFormatter={(_, index) =>
                          ratingChartData[index]?.tickLabel ?? ""
                        }
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                        domain={["dataMin - 50", chartCeiling ?? "dataMax + 50"]}
                      />
                      <Tooltip
                        cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                        content={<RatingChartTooltip />}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => (
                          <span className="text-sm text-muted-foreground">{value}</span>
                        )}
                      />
                      {typeof data.profile.maxRating === "number" ? (
                        <ReferenceLine
                          y={data.profile.maxRating}
                          stroke="var(--chart-accent-3)"
                          strokeDasharray="6 6"
                          label={{
                            value: `Max ${data.profile.maxRating}`,
                            fill: "var(--color-muted-foreground)",
                            fontSize: 12,
                            position: "insideTopRight",
                          }}
                        />
                      ) : null}
                      <Line
                        type="monotone"
                        dataKey="rating"
                        name="Current rating"
                        stroke="var(--chart-accent-1)"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          strokeWidth: 2,
                          fill: "var(--chart-accent-1)",
                          stroke: "var(--color-card)",
                        }}
                        activeDot={{
                          r: 7,
                          strokeWidth: 3,
                          fill: "var(--color-card)",
                          stroke: "var(--chart-accent-1)",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-4xl border border-border/60 bg-linear-to-b from-card to-muted/15 p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Questions Done By Rating</h3>
                  <p className="text-sm text-muted-foreground">
                    Unique accepted problems grouped by their Codeforces difficulty.
                  </p>
                </div>
                <div className="h-85 w-full rounded-3xl border border-border/60 bg-background/45 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.solvedByRating.map((entry, index) => ({
                        ...entry,
                        fill: chartColors[index % chartColors.length],
                      }))}
                      margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                        opacity={0.6}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="rating"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={36}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                        content={<SolvedByRatingTooltip />}
                      />
                      <Bar dataKey="solved" radius={[12, 12, 2, 2]} maxBarSize={54} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-border/60 bg-card/90 p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Swords className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Latest Contest Given</h3>
                  <p className="text-sm text-muted-foreground">
                    Recent Codeforces contests for the selected handle.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.recentContests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                    No rated contests found for this handle.
                  </div>
                ) : (
                  data.recentContests.map((contest) => (
                    <div
                      key={`${contest.contestId}-${contest.name}`}
                      className="grid gap-3 rounded-2xl border border-border/60 px-4 py-4 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr]"
                    >
                      <div>
                        <p className="font-semibold">{contest.name}</p>
                        <p className="text-sm text-muted-foreground">{contest.date}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Rank
                        </p>
                        <p className="font-medium">#{contest.rank}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Delta
                        </p>
                        <p
                          className={
                            contest.delta >= 0
                              ? "font-medium text-emerald-500"
                              : "font-medium text-rose-500"
                          }
                        >
                          {contest.delta >= 0 ? "+" : ""}
                          {contest.delta}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          New rating
                        </p>
                        <p className="font-medium">{contest.newRating}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
