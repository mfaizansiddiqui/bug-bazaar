import { Flex, Typography } from 'antd'
import './brand-logo.scss'

interface BrandLogoProps {
  /** Hide the wordmark and show only the mark, e.g. on narrow phones. */
  compact?: boolean
  /** Light wordmark for dark backgrounds (the ink header). */
  inverse?: boolean
}

/**
 * The Bug Bazaar logo: a friendly bug on a rounded tile, plus the wordmark.
 * The mark is decorative (aria-hidden) because the wordmark, or the surrounding link's
 * label in compact mode, already names the shop. Colors come from SCSS variables.
 */
export function BrandLogo({ compact = false, inverse = false }: BrandLogoProps) {
  const tone = inverse ? ' brand-logo__wordmark--inverse' : ''
  const accentTone = inverse ? ' brand-logo__accent--inverse' : ''
  return (
    <Flex align="center" gap={10} className="brand-logo">
      <svg
        className="brand-logo__mark"
        viewBox="0 0 32 32"
        width="32"
        height="32"
        aria-hidden="true"
        focusable="false"
      >
        <rect className="brand-logo__tile" width="32" height="32" rx="5" />
        <g className="brand-logo__lines">
          <path d="M14.2 7.6 C13.4 5.8 12.2 4.8 10.6 4.5" />
          <path d="M17.8 7.6 C18.6 5.8 19.8 4.8 21.4 4.5" />
          <path d="M9.6 15.2 L6.6 13.6 M9 19.6 H6 M9.8 23.6 L7 25.6" />
          <path d="M22.4 15.2 L25.4 13.6 M23 19.6 H26 M22.2 23.6 L25 25.6" />
        </g>
        <circle className="brand-logo__bug" cx="16" cy="10" r="3.3" />
        <ellipse className="brand-logo__bug" cx="16" cy="19.4" rx="6.9" ry="8" />
        <path className="brand-logo__seam" d="M16 12.2 V27" />
        <circle className="brand-logo__spot" cx="12.9" cy="17.2" r="1.5" />
        <circle className="brand-logo__spot" cx="19.1" cy="17.2" r="1.5" />
        <circle className="brand-logo__spot" cx="13.3" cy="22.6" r="1.25" />
        <circle className="brand-logo__spot" cx="18.7" cy="22.6" r="1.25" />
      </svg>
      {!compact && (
        <Typography.Text className={`brand-logo__wordmark${tone}`}>
          The Bug{' '}
          <Typography.Text className={`brand-logo__accent${accentTone}`}>Bazaar</Typography.Text>
        </Typography.Text>
      )}
    </Flex>
  )
}
