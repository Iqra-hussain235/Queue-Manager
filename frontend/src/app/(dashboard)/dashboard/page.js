"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, ListChecks, Plus, Users } from "lucide-react";
import api, { apiError } from "../../../services/api";
import { EmptyState, ErrorNotice, Loading } from "../../../components/common/Notice";
import StatusBadge from "../../../components/common/StatusBadge";

const cards = [
  ["Total queues", "totalQueues", ListChecks],
  ["Tokens today", "totalTokensToday", Users],
  ["Currently waiting", "currentlyWaiting", Clock3],
  ["In service", "currentlyServing", ArrowRight],
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [queues, setQueues] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/analytics/overview"), api.get("/queues")])
      .then(async ([analytics, queueResponse]) => {
        const ownedQueues = queueResponse.data.data;
        const recentResponses = await Promise.all(ownedQueues.slice(0, 5).map((queue) =>
          api.get(`/queues/${queue.id}/tokens`, { params: { page: 1, limit: 3, sort: "createdAt", order: "DESC" } }),
        ));
        if (!active) return;
        setData(analytics.data.data);
        setQueues(ownedQueues);
        setRecent(recentResponses.flatMap((response) => response.data.data).slice(0, 6));
      })
      .catch((requestError) => active && setError(apiError(requestError)));
    return () => { active = false; };
  }, []);

  if (error) return <ErrorNotice message={error} />;
  if (!data) return <Loading />;
  const overview = data.overview;

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, key, Icon]) => (
          <div className="card p-5" key={key}>
            <div className="flex items-center justify-between"><span className="text-sm text-muted">{label}</span><Icon size={18} className="text-brand" /></div>
            <p className="mt-4 text-3xl font-bold">{overview[key] ?? 0}</p>
            <p className="mt-1 text-xs text-muted">{key === "totalTokensToday" ? "New tokens issued today" : "Across your queues"}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="card p-5">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Your queues</h2><p className="mt-1 text-sm text-muted">A live snapshot of your service desks</p></div><Link href="/queues" className="text-sm font-semibold text-brand">Manage queues <ArrowRight className="ml-1 inline" size={15} /></Link></div>
          {queues.length === 0 ? <EmptyState title="No queues yet" description="Create your first queue to start issuing tokens." action={<Link href="/queues" className="btn btn-primary"><Plus size={16} />Create queue</Link>} /> :
            <div className="space-y-3">{queues.slice(0, 5).map((queue) => (
              <Link key={queue.id} href={`/queues/${queue.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:border-blue-200">
                <div><p className="font-semibold">{queue.name}</p><p className="mt-1 text-xs text-muted">{queue.stats.waiting} waiting · {queue.stats.serving} serving</p></div>
                <span className={`badge ${queue.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{queue.status.toLowerCase()}</span>
              </Link>
            ))}</div>}
        </section>
        <section className="card p-5">
          <div className="mb-5"><h2 className="font-bold">Recent token activity</h2><p className="mt-1 text-sm text-muted">Latest updates across your queues</p></div>
          {recent.length === 0 ? <EmptyState title="No token activity" description="Issued tokens will appear here." /> :
            <div className="space-y-4">{recent.map((token) => (
              <div key={token.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{token.personName}</p><p className="mt-1 text-xs text-muted">{token.tokenNumber} · {new Date(token.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
                <StatusBadge status={token.status} />
              </div>
            ))}</div>}
        </section>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Completed tokens", overview.completedTokens], ["Avg. waiting", `${Math.round((overview.averageWaitingTimeSeconds || 0) / 60)} min`], ["Avg. service", `${Math.round((overview.averageServiceTimeSeconds || 0) / 60)} min`]].map(([label, value]) => (
          <div key={label} className="card p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>
        ))}
      </div>
    </div>
  );
}
