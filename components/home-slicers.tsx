'use client';

import { useMemo, useState } from 'react';

const periods = ['Last 30 days', 'Last 12 months', 'All time'] as const;
const scopes = ['All India', 'North', 'West', 'South', 'East'] as const;
const types = ['All issue types', 'Water', 'Roads', 'Power', 'Health', 'Housing'] as const;

export default function HomeSlicers() {
  const [period, setPeriod] = useState<(typeof periods)[number]>('Last 12 months');
  const [scope, setScope] = useState<(typeof scopes)[number]>('All India');
  const [type, setType] = useState<(typeof types)[number]>('All issue types');

  const selection = useMemo(() => `${scope} · ${period} · ${type}`, [period, scope, type]);

  return (
    <div className="filterbar">
      <b>Explore public service data</b>
      <select className="filter" value={scope} onChange={e => setScope(e.target.value as (typeof scopes)[number])}>
        {scopes.map(option => <option key={option}>{option}</option>)}
      </select>
      <select className="filter" value={period} onChange={e => setPeriod(e.target.value as (typeof periods)[number])}>
        {periods.map(option => <option key={option}>{option}</option>)}
      </select>
      <select className="filter" value={type} onChange={e => setType(e.target.value as (typeof types)[number])}>
        {types.map(option => <option key={option}>{option}</option>)}
      </select>
      <span className="muted" style={{ fontSize: 12 }}>{selection}</span>
    </div>
  );
}
