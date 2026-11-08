import React, { useState, useEffect } from 'react';
import { X, Receipt, ShieldCheck, Download, Loader2 } from 'lucide-react';

export default function ReceiptModal({ orderId, actor, onClose }) {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const headers = {};
    if (actor?.id) headers['X-Demo-Actor-Id'] = actor.id;

    fetch(`/api/concierge/orders/${orderId}/receipt`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `HTTP ${res.status}`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        const blob = await res.blob();
        return {
          directBlobUrl: URL.createObjectURL(blob),
          contentType,
        };
      })
      .then((data) => {
        setReceiptData(data);
      })
      .catch((err) => {
        console.error('Fetch receipt error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [orderId, actor?.id]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} color="#0D253F" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0D253F' }}>
              Store Paper Receipt ({orderId})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, textAlign: 'center' }}>
          {loading && (
            <div style={{ padding: '40px 0', color: '#64748B' }}>
              <Loader2 size={32} className="ue-spin" style={{ margin: '0 auto 12px' }} color="#0D253F" />
              <div>Loading verified receipt image...</div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '14px', borderRadius: '10px', fontSize: '13px' }}>
              <strong>Could not load receipt:</strong> {error}
            </div>
          )}

          {receiptData && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                <ShieldCheck size={14} color="#B45309" /> Magic-Byte Validated Store Receipt
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '260px',
                }}
              >
                <img
                  src={
                    receiptData.directBlobUrl ||
                    receiptData.receiptUrl ||
                    (receiptData.base64
                      ? `data:${receiptData.contentType || 'image/png'};base64,${receiptData.base64}`
                      : '')
                  }
                  alt="Store Receipt"
                  style={{
                    maxHeight: '420px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(13, 37, 63, 0.1)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0D253F',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(13, 37, 63, 0.15)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1B3B5F')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0D253F')}
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
