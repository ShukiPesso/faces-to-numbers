import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { routerFutureFlags } from '@/app/router';
import { afterEach, describe, expect, it } from 'vitest';
import { DriveBanner } from '@/components/tour/DriveBanner';
import { NavLinks } from '@/components/tour/NavLinks';
import { PersonCard } from '@/components/tour/PersonCard';
import { ProgressStepper } from '@/components/tour/ProgressStepper';
import { StationCard } from '@/components/tour/StationCard';
import { getTour } from '@/content';
import type { GeoPoint, Person, Station } from '@/content/schema';
import { t } from '@/lib/i18n';
import { googleMapsUrl, wazeUrl } from '@/lib/links';

afterEach(cleanup);

// Fictional fixtures only (Conventions §1.11).
function makeStation(n: number, over: Partial<Station> = {}): Station {
  const letter = ['א', 'ב', 'ג'][n - 1] ?? 'ד';
  return {
    id: `test-${n}`,
    order: n,
    sourceFile: `content-source/stations/0${n}_test-${n}.md`,
    slug: `test-${n}`,
    title: `תחנת בדיקה ${letter}`,
    subtitle: `כתובת בדיונית ${letter}`,
    kind: 'stop',
    durationMin: 10,
    location: null,
    radiusM: 300,
    background: 'טקסט רקע בדיוני של תחנה.',
    talkingPoints: ['נקודת שיחה בדיונית.'],
    personIds: [],
    companionPersonIds: [],
    sensitivity: 'standard',
    silenceMoment: null,
    driverWarning: false,
    sources: [],
    ...over,
  };
}

function makePerson(over: Partial<Person> = {}): Person {
  return {
    id: 'test-person-1',
    order: 1,
    sourceFile: 'content-source/people/01_test-person-1.md',
    name: 'דמות בדיקה 1',
    honorific: 'הי״ד',
    pronoun: 'he',
    subtitle: 'תיאור בדיוני קצר',
    stationIds: ['test-1'],
    opening: 'משפט פתיחה בדיוני של דמות הבדיקה.',
    oct7: 'טקסט בדיוני ארוך מספיק.',
    oct7Sensitivity: 'standard',
    personality: 'טקסט בדיוני ארוך מספיק.',
    past: 'טקסט בדיוני ארוך מספיק.',
    quote: { text: 'ציטוט בדיוני', by: 'מקור בדיוני' },
    guideLevels: {
      s30: 'טקסט בדיוני ארוך מספיק.',
      m2: 'טקסט בדיוני ארוך מספיק.',
      m5: 'טקסט בדיוני ארוך מספיק.',
    },
    photo: { status: 'pending' },
    consent: { family: 'not_contacted' },
    sources: [{ title: 'מקור בדיוני', url: 'https://example.com/x' }],
    ...over,
  };
}

const inRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter future={routerFutureFlags}>{ui}</MemoryRouter>);

describe('CT-CARD-01 StationCard', () => {
  it('shows order, title, subtitle, duration, kind, link and no visited mark by default', () => {
    const station = makeStation(2);
    inRouter(<StationCard station={station} visited={false} />);
    const card = screen.getByTestId('station-card-test-2');
    expect(card).toHaveAttribute('href', '/station/test-2');
    expect(card).toHaveTextContent(station.title);
    expect(card).toHaveTextContent(station.subtitle);
    expect(card).toHaveTextContent('10 דקות');
    expect(card).toHaveTextContent(t('tour.kind.stop'));
    expect(card).toHaveTextContent(
      t('tour.stationOf', { n: 2, total: getTour().stationIds.length }),
    );
    expect(card).not.toHaveTextContent(t('tour.visited'));
  });

  it('shows the visited mark and the drive label', () => {
    inRouter(
      <StationCard station={makeStation(1, { kind: 'drive', driverWarning: true })} visited />,
    );
    const card = screen.getByTestId('station-card-test-1');
    expect(card).toHaveTextContent(t('tour.visited'));
    expect(card).toHaveTextContent(t('tour.kind.drive'));
  });

  it('marks the current card with aria-current', () => {
    inRouter(<StationCard station={makeStation(1)} visited={false} current />);
    expect(screen.getByTestId('station-card-test-1')).toHaveAttribute('aria-current', 'step');
  });
});

describe('CT-PCARD-01 PersonCard', () => {
  it('shows name with honorific, subtitle, opening and a link to the story', () => {
    const person = makePerson();
    render(<PersonCard person={person} variant="primary" />);
    const card = screen.getByTestId('person-card-test-person-1');
    expect(
      within(card).getByRole('heading', { level: 3, name: 'דמות בדיקה 1 הי״ד' }),
    ).toBeInTheDocument();
    expect(card).toHaveTextContent(person.subtitle);
    expect(card).toHaveTextContent(person.opening);
    const link = within(card).getByRole('link', {
      name: t('person.toStory', { name: person.name }),
    });
    expect(link).toHaveAttribute('href', '#/person/test-person-1');
    expect(within(card).getAllByRole('link')).toHaveLength(1);
    expect(card).not.toHaveTextContent(t('person.companion'));
  });

  it('shows the companion label only for the companion variant; no trailing space without honorific', () => {
    render(<PersonCard person={makePerson({ honorific: undefined })} variant="companion" />);
    const card = screen.getByTestId('person-card-test-person-1');
    expect(card).toHaveTextContent(t('person.companion'));
    expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe('דמות בדיקה 1');
  });
});

describe('CT-NAVL-01 NavLinks', () => {
  const verified: GeoPoint = {
    lat: 31.4,
    lng: 34.5,
    verified: true,
    verifiedBy: 'fixture',
    verifiedAt: '2026-01-01',
  };

  it('renders Waze and Google external links for a verified location', () => {
    render(<NavLinks location={verified} />);
    const waze = screen.getByTestId('nav-waze');
    const google = screen.getByTestId('nav-google');
    expect(waze).toHaveAttribute('href', wazeUrl(verified));
    expect(google).toHaveAttribute('href', googleMapsUrl(verified));
    for (const a of [waze, google]) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(waze).toHaveTextContent(t('station.navigateWaze'));
    expect(google).toHaveTextContent(t('station.navigateGoogle'));
    expect(screen.queryByTestId('location-unverified')).toBeNull();
  });

  it('renders text and no links for an unverified location', () => {
    render(<NavLinks location={{ lat: 31.4, lng: 34.5, verified: false }} />);
    expect(screen.getByTestId('location-unverified')).toHaveTextContent(
      t('station.locationUnverified'),
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByTestId('nav-waze')).toBeNull();
    expect(screen.queryByTestId('nav-google')).toBeNull();
  });

  it('renders text and no links for a null location', () => {
    render(<NavLinks location={null} />);
    expect(screen.getByTestId('location-unverified')).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('CT-DRIVE-01 DriveBanner', () => {
  it('shows the warning in a note', () => {
    render(<DriveBanner />);
    const banner = screen.getByRole('note');
    expect(banner).toBe(screen.getByTestId('driver-warning'));
    expect(banner).toHaveTextContent(t('drive.warning'));
  });
});

describe('CT-STEP-01 ProgressStepper', () => {
  const stations = [makeStation(1), makeStation(2), makeStation(3)];

  it('renders one linked item per station with accessible names and states', () => {
    inRouter(<ProgressStepper stations={stations} visitedIds={['test-1']} currentId="test-2" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/station/test-1');
    expect(links[0]).toHaveAccessibleName(
      new RegExp(
        `${t('tour.stationOf', { n: 1, total: 3 })}.*${stations[0]?.title}.*${t('tour.visited')}`,
      ),
    );
    expect(links[1]).toHaveAttribute('aria-current', 'step');
    expect(links[1]).not.toHaveAccessibleName(new RegExp(t('tour.visited')));
    expect(links[2]).not.toHaveAttribute('aria-current');
  });

  it('uses aria-current page when requested and the compact variant', () => {
    inRouter(
      <ProgressStepper
        stations={stations}
        visitedIds={['test-3']}
        currentId="test-1"
        variant="compact"
        currentIs="page"
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    expect(links[2]).toHaveAccessibleName(new RegExp(t('tour.visited')));
  });
});
