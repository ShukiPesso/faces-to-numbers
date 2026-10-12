import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Share2 } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Button,
  DurationBadge,
  Markdown,
  PhotoFrame,
  QuoteBlock,
  SectionHeading,
  ShareButton,
  SourceList,
} from '@/components/primitives';
import { t } from '@/lib/i18n';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Button', () => {
  it('renders a button of type button by default and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>פעולה בדיקה</Button>);
    const el = screen.getByRole('button', { name: 'פעולה בדיקה' });
    expect(el).toHaveAttribute('type', 'button');
    await userEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an anchor with href; external adds target, rel and hidden note', () => {
    render(
      <Button variant="link" href="https://example.org/x" external>
        קישור בדיקה
      </Button>,
    );
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a).toHaveTextContent(t('common.externalLink'));
  });

  it('internal anchor has no target', () => {
    render(<Button href="/tour">פנימי</Button>);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });

  it('supports pressed, busy (ignores clicks), icon end and fullWidth', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Button pressed icon={Share2} iconPosition="end" fullWidth>
          מצב
        </Button>
        <Button busy onClick={onClick} variant="primary">
          טוען
        </Button>
        <Button variant="quiet" icon={Share2}>
          שקט
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'מצב' })).toHaveAttribute('aria-pressed', 'true');
    const busy = screen.getByRole('button', { name: 'טוען' });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(busy);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('SectionHeading / DurationBadge', () => {
  it('renders the right heading level, id and eyebrow', () => {
    render(
      <>
        <SectionHeading level={2} id="a" eyebrow="תווית">
          כותרת א
        </SectionHeading>
        <SectionHeading level={3}>כותרת ב</SectionHeading>
      </>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'כותרת א' })).toHaveAttribute('id', 'a');
    expect(screen.getByRole('heading', { level: 3, name: 'כותרת ב' })).toBeInTheDocument();
    expect(screen.getByText('תווית')).toBeInTheDocument();
  });

  it('shows formatted minutes', () => {
    render(<DurationBadge minutes={15} />);
    expect(screen.getByText('15 דקות')).toBeInTheDocument();
  });
});

describe('CT-MD-01 Markdown', () => {
  it('renders bold and lists, with data-inline-text wrapper', () => {
    const { container } = render(
      <Markdown>{'פסקה **מודגש**\n\n- אחד\n- שניים\n\n1. ראשון\n2. שני'}</Markdown>,
    );
    expect(container.firstElementChild).toHaveAttribute('data-inline-text');
    expect(container.querySelector('strong')).toHaveTextContent('מודגש');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(container.querySelector('ol')).not.toBeNull();
  });

  it('does not render raw HTML or images as elements; headings become paragraphs', () => {
    const { container } = render(
      <Markdown>
        {'# כותרת\n\n<script>alert(1)</script>\n\n<b>גולמי</b>\n\n![x](https://e.org/a.png)'}
      </Markdown>,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByText('כותרת').tagName).toBe('P');
  });

  it('external links open in a new tab safely; internal ones do not', () => {
    render(<Markdown>{'[חוץ](https://example.org) [פנים](/tour) *הדגשה*'}</Markdown>);
    const ext = screen.getByRole('link', { name: /חוץ/ });
    expect(ext).toHaveAttribute('target', '_blank');
    expect(ext).toHaveAttribute('rel', 'noopener noreferrer');
    expect(ext).toHaveTextContent(t('common.externalLink'));
    const internal = screen.getByRole('link', { name: 'פנים' });
    expect(internal).not.toHaveAttribute('target');
  });

  it('read variant renders', () => {
    const { container } = render(<Markdown variant="read">פסקה</Markdown>);
    expect(container.firstElementChild).toHaveAttribute('data-inline-text');
    expect(screen.getByText('פסקה')).toBeInTheDocument();
  });
});

describe('CT-QUOTE-01 QuoteBlock', () => {
  it('renders figure, blockquote and figcaption with by, text verbatim', () => {
    const { container } = render(
      <QuoteBlock quote={{ text: 'ציטוט בדיקה', by: 'דמות בדיקה 1' }} />,
    );
    expect(container.querySelector('figure > blockquote')).toHaveTextContent('„ציטוט בדיקה”');
    expect(container.querySelector('figure > figcaption')).toHaveTextContent('— דמות בדיקה 1');
    expect(screen.getByText(t('person.quote'))).toBeInTheDocument();
  });

  it('can hide the label', () => {
    render(<QuoteBlock quote={{ text: 'ציטוט בדיקה', by: 'דמות בדיקה 1' }} showLabel={false} />);
    expect(screen.queryByText(t('person.quote'))).toBeNull();
  });
});

describe('CT-PHOTO-01 PhotoFrame', () => {
  it('pending shows placeholder and never an img, even with referenceUrl', () => {
    const { container } = render(
      <PhotoFrame
        name="דמות בדיקה 1"
        photo={{ status: 'pending', referenceUrl: 'https://example.org/ref.jpg' }}
      />,
    );
    expect(screen.getByTestId('photo-placeholder')).toHaveTextContent(t('photo.pending'));
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('example.org');
  });

  it('cleared shows local image with alt and credit, ignoring referenceUrl', () => {
    const { container } = render(
      <PhotoFrame
        name="דמות בדיקה 1"
        photo={{
          status: 'cleared',
          src: '/photos/test-1.webp',
          alt: 'תמונת בדיקה',
          credit: 'צלם בדיקה',
          referenceUrl: 'https://example.org/ref.jpg',
        }}
      />,
    );
    const img = screen.getByRole('img', { name: 'תמונת בדיקה' });
    expect(img).toHaveAttribute('src', '/photos/test-1.webp');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText(t('photo.credit', { credit: 'צלם בדיקה' }))).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('example.org');
  });

  it('falls back to a placeholder with the alt text when the image fails', () => {
    render(
      <PhotoFrame
        name="דמות בדיקה 1"
        photo={{
          status: 'cleared',
          src: '/photos/test-1.webp',
          alt: 'תמונת בדיקה',
          credit: 'צלם בדיקה',
        }}
      />,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('photo-placeholder')).toHaveTextContent('תמונת בדיקה');
  });
});

describe('CT-SRC-01 SourceList', () => {
  it('renders title, external link and host in bdi ltr', () => {
    const { container } = render(
      <SourceList
        sources={[
          { title: 'מקור בדיקה א (אתר)', url: 'https://www.example.org/a' },
          { title: 'מקור בדיקה ב', url: 'https://example.com/b' },
        ]}
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://www.example.org/a');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(links[0]).toHaveTextContent('מקור בדיקה א (אתר)');
    const bdi = container.querySelector('bdi[dir="ltr"]');
    expect(bdi).toHaveTextContent('www.example.org');
  });

  it('renders nothing for an empty list and tolerates an unparsable url', () => {
    const { container, rerender } = render(<SourceList sources={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SourceList sources={[{ title: 'מקור בדיקה', url: 'not a url' }]} />);
    expect(container.querySelector('bdi')).toHaveTextContent('not a url');
  });
});

describe('ShareButton', () => {
  it('uses navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    render(<ShareButton />);
    await userEvent.click(screen.getByTestId('share-button'));
    expect(share).toHaveBeenCalledWith({ title: document.title, url: location.href });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('stays silent when the user cancels the native sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
    vi.stubGlobal('navigator', { share });
    render(<ShareButton />);
    await userEvent.click(screen.getByTestId('share-button'));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('copies the link, announces it and clears after 3 seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ShareButton />);
    fireEvent.click(screen.getByTestId('share-button'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t('share.copied')));
    expect(writeText).toHaveBeenCalledWith(location.href);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows the failure message on any error', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<ShareButton />);
    await userEvent.click(screen.getByTestId('share-button'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t('share.failed')));
  });
});
