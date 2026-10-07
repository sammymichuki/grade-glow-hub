import React, { useState } from 'react';
import { Award, CalendarDays, MessageSquareText, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { ParentService } from '../services/parentService';
import { shortDate } from '../services/portalDates';
import { PortalLocale, WeeklyDigest } from '../types/parentPortal';

interface WeeklyDigestCardProps {
  digest: WeeklyDigest;
}

const DeltaBadge: React.FC<{ value: number }> = ({ value }) => {
  const tone = value > 0 ? 'bg-emerald-100 text-emerald-800' : value < 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {value > 0 ? `+${value}` : value} vs last week
    </span>
  );
};

export const WeeklyDigestCard: React.FC<WeeklyDigestCardProps> = ({ digest }) => {
  const [locale, setLocale] = useState<PortalLocale>('en');
  const message = ParentService.renderDigestMessage(digest, locale);

  const stats = [
    { label: 'Modules Completed', value: String(digest.modulesCompleted) },
    { label: 'Average Score', value: `${digest.averageScore}%` },
    { label: 'Attendance', value: `${digest.attendanceRate}%` },
    { label: 'Homework Done', value: `${digest.homeworkCompletionRate}%` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
      <div className="bg-gradient-to-r from-education-primary via-teal-600 to-emerald-600 px-5 sm:px-6 py-4 text-white space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <CalendarDays className="h-4 w-4" />
            Weekly Digest · {digest.childFirstName}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/15 p-1 backdrop-blur-sm" role="group" aria-label="Digest language">
            <button
              type="button"
              aria-pressed={locale === 'en'}
              onClick={() => setLocale('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${locale === 'en' ? 'bg-white text-education-primary' : 'text-white/80 hover:text-white'}`}
            >
              EN
            </button>
            <button
              type="button"
              aria-pressed={locale === 'sw'}
              onClick={() => setLocale('sw')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${locale === 'sw' ? 'bg-white text-education-primary' : 'text-white/80 hover:text-white'}`}
            >
              SW
            </button>
          </div>
        </div>
        <p className="text-sm text-emerald-50">
          {shortDate(digest.windowStart)} – {shortDate(digest.windowEnd)} · Week-over-week score change
        </p>
      </div>

      <div className="px-5 sm:px-6 py-4 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <DeltaBadge value={digest.scoreTrend} />
          <span className="text-xs text-gray-500">
            {digest.previousAverageScore}% → {digest.averageScore}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2" data-testid="digest-strengths">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Strengths
            </h4>
            {digest.strengths.length === 0 ? (
              <p className="text-xs text-emerald-900/70">No standout subjects this week yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {digest.strengths.map(line => (
                  <li key={line} className="text-xs font-medium text-emerald-900 flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2" data-testid="digest-weaknesses">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" /> Areas to Improve
            </h4>
            {digest.weaknesses.length === 0 ? (
              <p className="text-xs text-amber-900/70">No weak subjects detected — keep the momentum.</p>
            ) : (
              <ul className="space-y-1.5">
                {digest.weaknesses.map(line => (
                  <li key={line} className="text-xs font-medium text-amber-900 flex items-start gap-1.5">
                    <span className="text-amber-600 mt-0.5">!</span>
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2" data-testid="teacher-notes">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">Teacher Notes</h4>
          {digest.teacherNotes.length === 0 ? (
            <p className="text-xs text-gray-500">No notes from instructors this week.</p>
          ) : (
            <ul className="space-y-2">
              {digest.teacherNotes.map(note => (
                <li key={note.id} className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                  <p className="text-xs text-gray-700 leading-relaxed">{note.note}</p>
                  <p className="text-[10px] font-semibold text-gray-400 mt-1">
                    {note.teacherName} · {note.subject} · {shortDate(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-education-primary/25 bg-education-primary/5 p-4 space-y-2" data-testid="digest-message-preview">
          <h4 className="text-xs font-bold uppercase tracking-wider text-education-primary flex items-center gap-1.5">
            <MessageSquareText className="h-3.5 w-3.5" />
            {locale === 'en' ? 'Dispatch Preview (EN)' : 'Ujumbe wa Mwendesha (SW)'}
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
};
