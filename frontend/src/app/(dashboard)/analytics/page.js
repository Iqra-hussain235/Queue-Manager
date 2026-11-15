"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { apiError } from "../../../services/api";
import { ErrorNotice, Loading } from "../../../components/common/Notice";

const colors = ["#3568e8", "#13a37c", "#e7a532", "#8d67db", "#e15d57"];
const isoDay = (date) => date.toISOString().slice(0, 10);

function dateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return { from: isoDay(start), to: isoDay(end) };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(dateRange(7));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setBusy(true);
    api.get("/analytics/overview", { params: range })
      .then(({ data: response }) => { if (active) { setData(response.data); setError(""); } })
      .catch((requestError) => { if (active) setError(apiError(requestError)); })
      .finally(() => active && setBusy(false));
    return () => { active = false; };
  }, [range]);

  if (error) return <ErrorNotice message={error} />;
  if (!data) return <Loading />;
  const overview = data.overview;
  const compact = (value) => `${Math.round((value || 0) / 60)} min`;
  const stats = [
    ["Total queues", overview.totalQueues],
    ["Tokens today", overview.totalTokensToday],
    ["Currently waiting", overview.currentlyWaiting],
    ["Currently serving", overview.currentlyServing],
    ["Completed", overview.completedTokens],
    ["Cancelled", overview.cancelledTokens],
    ["Avg. waiting time", compact(overview.averageWaitingTimeSeconds)],
    ["Avg. service time", compact(overview.averageServiceTimeSeconds)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Analytics</h2><p className="mt-1 text-sm text-muted">Performance insights from your queue activity.</p></div>
        <div className="flex flex-wrap items-end gap-2">
          {[["Today", 1], ["7 days", 7], ["30 days", 30]].map(([label, days]) => {
            const selected = dateRange(days);
            return <button key={label} onClick={() => setRange(selected)} className={`btn ${range.from === selected.from ? "btn-primary" : "btn-secondary"}`}>{label}</button>;
          })}
          <label className="text-xs text-muted">From<input className="field mt-1" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
          <label className="text-xs text-muted">To<input className="field mt-1" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
          {busy && <span className="pb-2 text-xs text-muted">Updating…</span>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="card p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-bold">{value ?? 0}</p></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Queue length trend" subtitle="Tokens active at the end of each day">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data.queueLength}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="queueLength" name="Queue length" stroke="#3568e8" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily token statistics" subtitle="Tokens created and service outcomes by event date">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.tokenStatistics}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="created" fill="#3568e8" radius={[4, 4, 0, 0]} /><Bar dataKey="completed" fill="#13a37c" radius={[4, 4, 0, 0]} /><Bar dataKey="cancelled" fill="#e15d57" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Average waiting time by queue" subtitle="Calculated from creation and call timestamps">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.waitingTime} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(value) => `${Math.round(value / 60)}m`} /><YAxis dataKey="queueName" type="category" width={100} /><Tooltip formatter={(value) => compact(value)} /><Bar dataKey="averageWaitingTimeSeconds" name="Average wait" fill="#8d67db" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Token status distribution" subtitle="Current status across all queue history">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.tokenDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`}>{data.tokenDistribution.map((entry, index) => <Cell key={entry.status} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return <section className="card p-5"><div className="mb-4"><h3 className="font-bold">{title}</h3><p className="mt-1 text-xs text-muted">{subtitle}</p></div><div className="h-[280px]">{children}</div></section>;
}
