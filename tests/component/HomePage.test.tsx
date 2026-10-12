import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getStations, getTour } from '@/content';
import { formatMinutes } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getVisited, markVisited } from '@/lib/storage';
import { HomePage } from '@/pages/HomePage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.title = '';
});

describe('HomePage', () => {
  it('shows the title, subtitle, counts and content text', () => {
    const tour = getTour();
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: tour.title })).toBeTruthy();
    expect(screen.getByText(tour.subtitle)).toBeTruthy();
    expect(screen.getByText(t('home.stationsCount', { n: getStations().length }))).toBeTruthy();
    expect(
      screen.getByText(t('home.totalDuration', { duration: formatMinutes(tour.totalDurationMin) })),
    ).toBeTruthy();
    const firstParagraph = (text: string): string => text.split('\n\n')[0] ?? text;
    expect(screen.getByText(firstParagraph(tour.intro))).toBeTruthy();
    expect(screen.getByText(firstParagraph(tour.message))).toBeTruthy();
    for (const item of [...tour.safety, ...tour.howTo]) {
      expect(screen.getByText(item)).toBeTruthy();
    }
    expect(screen.getByRole('heading', { level: 2, name: t('home.messageTitle') })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: t('home.safetyTitle') })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: t('home.howToTitle') })).toBeTruthy();
  });

  it('sets the document title through useDocumentTitle', () => {
    render(<HomePage />);
    expect(document.title).toBe(getTour().title);
  });

  it('first visit: start button targets the first station, no resume or reset', () => {
    render(<HomePage />);
    const start = screen.getByTestId('start-tour');
    expect(start.textContent).toBe(t('home.start'));
    expect(start.getAttribute('href')).toBe(`#/station/${getStations()[0]?.slug}`);
    expect(screen.queryByTestId('resume-tour')).toBeNull();
    expect(screen.queryByTestId('reset-progress')).toBeNull();
  });

  it('places the start button after the intro and before the safety section', () => {
    render(<HomePage />);
    const start = screen.getByTestId('start-tour');
    const safety = screen.getByRole('heading', { level: 2, name: t('home.safetyTitle') });
    expect(start.compareDocumentPosition(safety) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('with progress: resume targets order 4, and reset removes it', () => {
    for (const id of ['sderot', 'route-232', 'observers-hill']) markVisited(id);
    const fourth = getStations().find((s) => s.order === 4);
    render(<HomePage />);
    const resume = screen.getByTestId('resume-tour');
    expect(resume.textContent).toBe(t('home.resume', { n: 4 }));
    expect(resume.getAttribute('href')).toBe(`#/station/${fourth?.slug}`);
    expect(screen.queryByTestId('start-tour')).toBeNull();

    fireEvent.click(screen.getByTestId('reset-progress'));
    expect(getVisited()).toEqual([]);
    expect(screen.queryByTestId('resume-tour')).toBeNull();
    expect(screen.queryByTestId('reset-progress')).toBeNull();
    expect(screen.getByTestId('start-tour')).toBeTruthy();
  });
});
