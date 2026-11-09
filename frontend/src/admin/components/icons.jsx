import React from 'react';

const symbols = {
  Users: '◉', UserRound: '●', ShieldCheck: '✓', CarFront: '▰', Route: '⌁', Package: '▣', Wallet: '▤',
  Clock3: '◷', TrendingUp: '↗', RefreshCw: '↻', Search: '⌕', Check: '✓', X: '×', ArrowUpRight: '↗',
  Bell: '♢', Settings: '⚙', Download: '↓', CircleAlert: '!', ChartNoAxesCombined: '▥', MessageSquare: '▭',
  FileText: '▤', Shield: '⬡', Activity: '⌁', MapPin: '⌖', LayoutDashboard: '▦', ScrollText: '▤',
  Menu: '☰', LogOut: '↗', ChevronDown: '⌄', PanelLeftClose: '◧', ArrowRight: '→', LockKeyhole: '▣', Mail: '✉'
};
function makeIcon(name) {
  return function Icon({ size = 18, className = '', ...props }) {
    return <span aria-hidden="true" className={`ui-icon ${className}`} style={{ width: size, height: size, fontSize: Math.max(12, size), lineHeight: 1 }} {...props}>{symbols[name] || '•'}</span>;
  };
}
export const Users = makeIcon('Users');
export const UserRound = makeIcon('UserRound');
export const ShieldCheck = makeIcon('ShieldCheck');
export const CarFront = makeIcon('CarFront');
export const Route = makeIcon('Route');
export const Package = makeIcon('Package');
export const Wallet = makeIcon('Wallet');
export const Clock3 = makeIcon('Clock3');
export const TrendingUp = makeIcon('TrendingUp');
export const RefreshCw = makeIcon('RefreshCw');
export const Search = makeIcon('Search');
export const Check = makeIcon('Check');
export const X = makeIcon('X');
export const ArrowUpRight = makeIcon('ArrowUpRight');
export const Bell = makeIcon('Bell');
export const Settings = makeIcon('Settings');
export const Download = makeIcon('Download');
export const CircleAlert = makeIcon('CircleAlert');
export const ChartNoAxesCombined = makeIcon('ChartNoAxesCombined');
export const MessageSquare = makeIcon('MessageSquare');
export const FileText = makeIcon('FileText');
export const Shield = makeIcon('Shield');
export const Activity = makeIcon('Activity');
export const MapPin = makeIcon('MapPin');
export const LayoutDashboard = makeIcon('LayoutDashboard');
export const ScrollText = makeIcon('ScrollText');
export const Menu = makeIcon('Menu');
export const LogOut = makeIcon('LogOut');
export const ChevronDown = makeIcon('ChevronDown');
export const PanelLeftClose = makeIcon('PanelLeftClose');
export const ArrowRight = makeIcon('ArrowRight');
export const LockKeyhole = makeIcon('LockKeyhole');
export const Mail = makeIcon('Mail');
