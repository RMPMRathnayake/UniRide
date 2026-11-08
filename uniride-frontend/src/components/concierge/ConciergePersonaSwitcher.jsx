import React, { useState } from 'react';
import { User, ChevronDown, Check, ShieldCheck, Bike, Sparkles } from 'lucide-react';

export const DEMO_ACTORS = [
  {
    id: 'cust-ruvini',
    role: 'customer',
    name: 'Ruvini Thackshila',
    badge: 'Customer',
    phone: '+94 77 234 5678',
    campus: 'South Eastern University, Oluvil',
    avatar: '👩‍🎓',
  },
  {
    id: 'cust-kamal',
    role: 'customer',
    name: 'Kamal Jayasinghe',
    badge: 'Customer',
    phone: '+94 71 987 6543',
    campus: 'South Eastern University, Oluvil',
    avatar: '👨‍🎓',
  },
  {
    id: 'rider-1',
    role: 'rider',
    name: 'Kasun Perera',
    badge: 'Student Rider',
    phone: '+94 77 812 3401',
    vehicle: 'Honda Dio 110 • WP BJM-4821',
    avatar: '🛵',
  },
  {
    id: 'rider-2',
    role: 'rider',
    name: 'Nadeesha Silva',
    badge: 'Student Rider',
    phone: '+94 71 445 9920',
    vehicle: 'TVS Ntorq 125 • SG KQ-9012',
    avatar: '🛵',
  },
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Campus Support Admin',
    badge: 'Support Admin',
    phone: '+94 11 234 5000',
    avatar: '🛡️',
  },
];

export default function ConciergePersonaSwitcher({
  currentActor,
  onSelectActor,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  const actor = currentActor || DEMO_ACTORS[0];

  return (
    <div className={`ue-persona-switcher-wrap ${className}`} style={{ position: 'relative', zIndex: 60 }}>
      <button
        type="button"
        className="ue-persona-pill-btn"
        onClick={() => setOpen(!open)}
        title="Switch local demonstration persona (Customer vs Student Rider)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0D253F',
          color: '#ffffff',
          padding: '7px 14px',
          borderRadius: '9999px',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(13, 37, 63, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3B5F')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#0D253F')}
      >
        <span style={{ fontSize: '15px' }}>{actor.avatar}</span>
        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actor.name.split(' ')[0]} ({actor.badge})
        </span>
        <ChevronDown size={14} color="#F59E0B" />
      </button>

      {open && (
        <>
          <div
            className="ue-persona-backdrop"
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 61 }}
          />
          <div
            className="ue-persona-dropdown"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '290px',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(13, 37, 63, 0.15)',
              border: '1px solid #E2E8F0',
              padding: '12px',
              zIndex: 62,
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B45309', fontWeight: 800 }}>
                Demo Identity Registry
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Switch between Customer & Rider to evaluate two-sided marketplace flow.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {DEMO_ACTORS.map((act) => {
                const isSelected = act.id === actor.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      onSelectActor(act);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #F59E0B' : '1px solid transparent',
                      background: isSelected ? '#FEF3C7' : '#F8FAFC',
                      color: isSelected ? '#92400E' : '#0D253F',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{act.avatar}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                          {act.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {act.badge} {act.vehicle ? `• ${act.vehicle.split('•')[0]}` : ''}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="#D97706" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
