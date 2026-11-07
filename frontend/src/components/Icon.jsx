import React from 'react';

// Lightweight text glyphs keep the interface accessible without rendering inline SVG artwork.
const GLYPHS = {
  Activity: '◌', ArrowDownLeft: '↙', ArrowDownToLine: '↓', ArrowRight: '→', ArrowUpRight: '↗',
  BadgeCheck: '✓', Bell: '•', BriefcaseBusiness: '▣', CarFront: '▱', Check: '✓', CheckCircle2: '✓',
  ChevronDown: '⌄', CircleDollarSign: '$', Clock3: '◷', Eye: '◉', EyeOff: '⊘', FileBadge: '▤',
  KeyRound: '⌑', LayoutDashboard: '▦', LoaderCircle: '◌', LockKeyhole: '▣', LogOut: '↪', Mail: '✉',
  MapPin: '●', MapPinned: '⌖', Menu: '☰', MessageSquareText: '▤', Navigation: '➤', Package: '▧',
  Phone: '⌕', Printer: '▤', RefreshCw: '↻', Route: '⌁', Save: '↓', Settings: '⚙', ShieldCheck: '✓',
  Star: '★', ThumbsUp: '+', TrendingUp: '↗', UserRound: '●', X: '×'
};

function makeGlyph(name) {
  function Glyph({ size = 16, className = '', fill, strokeWidth, ...props }) {
    return <span
      aria-hidden="true"
      className={`glyph glyph-${name.toLowerCase()} ${className}`.trim()}
      style={{ fontSize: typeof size === 'number' ? `${size}px` : size, lineHeight: 1, fontWeight: strokeWidth > 2 ? 700 : 500, ...(fill && fill !== 'none' ? { color: 'currentColor' } : {}) }}
      {...props}
    >{GLYPHS[name] || '·'}</span>;
  }
  Glyph.displayName = name;
  return Glyph;
}

export const Activity = makeGlyph('Activity');
export const ArrowDownLeft = makeGlyph('ArrowDownLeft');
export const ArrowDownToLine = makeGlyph('ArrowDownToLine');
export const ArrowRight = makeGlyph('ArrowRight');
export const ArrowUpRight = makeGlyph('ArrowUpRight');
export const BadgeCheck = makeGlyph('BadgeCheck');
export const Bell = makeGlyph('Bell');
export const BriefcaseBusiness = makeGlyph('BriefcaseBusiness');
export const CarFront = makeGlyph('CarFront');
export const Check = makeGlyph('Check');
export const CheckCircle2 = makeGlyph('CheckCircle2');
export const ChevronDown = makeGlyph('ChevronDown');
export const CircleDollarSign = makeGlyph('CircleDollarSign');
export const Clock3 = makeGlyph('Clock3');
export const Eye = makeGlyph('Eye');
export const EyeOff = makeGlyph('EyeOff');
export const FileBadge = makeGlyph('FileBadge');
export const KeyRound = makeGlyph('KeyRound');
export const LayoutDashboard = makeGlyph('LayoutDashboard');
export const LoaderCircle = makeGlyph('LoaderCircle');
export const LockKeyhole = makeGlyph('LockKeyhole');
export const LogOut = makeGlyph('LogOut');
export const Mail = makeGlyph('Mail');
export const MapPin = makeGlyph('MapPin');
export const MapPinned = makeGlyph('MapPinned');
export const Menu = makeGlyph('Menu');
export const MessageSquareText = makeGlyph('MessageSquareText');
export const Navigation = makeGlyph('Navigation');
export const Package = makeGlyph('Package');
export const Phone = makeGlyph('Phone');
export const Printer = makeGlyph('Printer');
export const RefreshCw = makeGlyph('RefreshCw');
export const Route = makeGlyph('Route');
export const Save = makeGlyph('Save');
export const Settings = makeGlyph('Settings');
export const ShieldCheck = makeGlyph('ShieldCheck');
export const Star = makeGlyph('Star');
export const ThumbsUp = makeGlyph('ThumbsUp');
export const TrendingUp = makeGlyph('TrendingUp');
export const UserRound = makeGlyph('UserRound');
export const X = makeGlyph('X');
