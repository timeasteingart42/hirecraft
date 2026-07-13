export function MatchInsightsTab({ insights }: { insights: any }) {
  if (!insights) {
    return (
      <div className="card-inset p-8 text-sm text-neutral-500 italic">
        No match insights yet.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {insights.keyword_match && (
        <div className="card p-8">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-baseline">
            <div className="pr-8 md:border-r border-neutral-150">
              <div className="eyebrow mb-3">Keyword match</div>
              <div className="font-serif text-4xl tabular-nums">
                {insights.keyword_match.matched}
                <span className="text-neutral-400"> / {insights.keyword_match.total}</span>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {insights.keyword_match.full_matches?.length > 0 && (
                <MatchRow
                  label="Full matches"
                  items={insights.keyword_match.full_matches}
                  tone="strong"
                />
              )}
              {insights.keyword_match.partial_matches?.length > 0 && (
                <MatchRow
                  label="Partial"
                  items={insights.keyword_match.partial_matches}
                  tone="reach"
                />
              )}
              {insights.keyword_match.gaps?.length > 0 && (
                <MatchRow
                  label="Gaps"
                  items={insights.keyword_match.gaps}
                  tone="skip"
                />
              )}
            </dl>
          </div>
        </div>
      )}

      {insights.strengths?.length > 0 && (
        <div>
          <h3 className="font-serif text-xl mb-5">Strengths</h3>
          <div className="space-y-3">
            {insights.strengths.map((s: any, i: number) => (
              <div
                key={i}
                className="card px-6 py-5 border-l-2 border-l-status-strong"
              >
                <div className="font-medium mb-1">{s.title}</div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                  {s.detail}
                </p>
                {s.evidence && (
                  <div className="text-xs text-neutral-400 italic">
                    Evidence · {s.evidence}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.gaps?.length > 0 && (
        <div>
          <h3 className="font-serif text-xl mb-5">Gaps</h3>
          <div className="space-y-3">
            {insights.gaps.map((g: any, i: number) => (
              <div
                key={i}
                className="card px-6 py-5 border-l-2 border-l-status-reach"
              >
                <div className="font-medium mb-1">{g.title}</div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                  {g.detail}
                </p>
                {g.close_strategy && (
                  <div className="text-xs text-neutral-400">
                    Close by · {g.close_strategy}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.make_or_break && (
        <div className="card-inset px-8 py-7 border-l-2 border-l-ink">
          <div className="eyebrow mb-2">Make or break</div>
          <p className="font-serif text-lg leading-snug text-ink">
            {insights.make_or_break}
          </p>
        </div>
      )}

      {insights.next_action && (
        <div className="card px-6 py-5">
          <div className="eyebrow mb-2">Next action</div>
          <p className="text-sm text-neutral-700">{insights.next_action}</p>
        </div>
      )}
    </div>
  );
}

function MatchRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "strong" | "reach" | "skip";
}) {
  const dotClass = {
    strong: "bg-status-strong",
    reach: "bg-status-reach",
    skip: "bg-status-skip",
  }[tone];
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        {label}
      </dt>
      <dd className="text-neutral-700 leading-relaxed">{items.join(", ")}</dd>
    </div>
  );
}
