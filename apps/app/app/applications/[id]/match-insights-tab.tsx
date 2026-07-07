export function MatchInsightsTab({ insights }: { insights: any }) {
  if (!insights) {
    return (
      <div className="p-6 border border-neutral-200 rounded bg-neutral-50 text-sm text-neutral-500">
        No match insights yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {insights.keyword_match && (
        <div className="p-6 border border-neutral-200 rounded bg-neutral-50">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            Keyword match
          </div>
          <div className="font-serif text-3xl mb-3">
            {insights.keyword_match.matched} / {insights.keyword_match.total}
          </div>
          <div className="space-y-2 text-sm">
            {insights.keyword_match.full_matches?.length > 0 && (
              <div>
                <span className="text-status-strong font-medium">Full matches: </span>
                <span className="text-neutral-700">
                  {insights.keyword_match.full_matches.join(", ")}
                </span>
              </div>
            )}
            {insights.keyword_match.partial_matches?.length > 0 && (
              <div>
                <span className="text-status-reach font-medium">Partial: </span>
                <span className="text-neutral-700">
                  {insights.keyword_match.partial_matches.join(", ")}
                </span>
              </div>
            )}
            {insights.keyword_match.gaps?.length > 0 && (
              <div>
                <span className="text-status-skip font-medium">Gaps: </span>
                <span className="text-neutral-700">
                  {insights.keyword_match.gaps.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {insights.strengths && (
        <div>
          <h3 className="font-serif text-xl mb-4">Strengths</h3>
          <div className="space-y-4">
            {insights.strengths.map((s: any, i: number) => (
              <div key={i} className="p-4 border-l-4 border-status-strong bg-status-strong/5">
                <div className="font-medium mb-1">{s.title}</div>
                <div className="text-sm text-neutral-700 mb-2">{s.detail}</div>
                {s.evidence && (
                  <div className="text-xs text-neutral-500 italic">Evidence: {s.evidence}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.gaps && (
        <div>
          <h3 className="font-serif text-xl mb-4">Gaps</h3>
          <div className="space-y-4">
            {insights.gaps.map((g: any, i: number) => (
              <div key={i} className="p-4 border-l-4 border-status-reach bg-status-reach/5">
                <div className="font-medium mb-1">{g.title}</div>
                <div className="text-sm text-neutral-700 mb-2">{g.detail}</div>
                {g.close_strategy && (
                  <div className="text-xs text-neutral-500">Close by: {g.close_strategy}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.make_or_break && (
        <div className="p-6 border border-brand bg-brand/5 rounded">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            Make or break
          </div>
          <div className="text-lg">{insights.make_or_break}</div>
        </div>
      )}

      {insights.next_action && (
        <div className="p-6 border border-neutral-200 rounded">
          <div className="text-xs uppercase tracking-widest text-brand mb-2">
            Next action
          </div>
          <div>{insights.next_action}</div>
        </div>
      )}
    </div>
  );
}
