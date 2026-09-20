import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Table } from 'lucide-react';
import { api } from '../services/api';

export default function DbInspectorModal({ isOpen, onClose }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableSchema, setTableSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDbInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const statusData = await api.getDbTables();
      setDbStatus(statusData);

      if (statusData.tables && statusData.tables.length > 0) {
        const schema = await api.describeTable(selectedTable);
        setTableSchema(schema);
      }
    } catch (err) {
      setError(err.message || 'Could not connect to MySQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDbInfo();
    }
  }, [isOpen, selectedTable]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '10px',
            borderRadius: '12px',
            color: '#34d399'
          }}>
            <Database size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>MySQL Database Inspector</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Target Database: <code style={{ color: '#34d399' }}>{dbStatus?.database || 'creator_platform'}</code> | User: <code style={{ color: '#818cf8' }}>creator_app</code>
            </p>
          </div>
        </div>

        {error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              Connection Warning
            </div>
            {error}
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Check your MySQL service status and settings in <code style={{ color: '#fff' }}>server/.env</code>:
              <br />
              <code>DB_HOST=localhost</code> | <code>DB_USER=creator_app</code> | <code>DB_NAME=creator_platform</code>
            </div>
          </div>
        ) : (
          <div>
            {/* Table selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Select Table to Inspect Schema:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['users', 'creator_profiles', 'brand_profiles', 'campaigns', 'campaign_applications', 'collaborations', 'messages', 'notifications', 'payments', 'social_accounts'].map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    style={{
                      background: selectedTable === tbl ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: selectedTable === tbl ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                      color: selectedTable === tbl ? '#818cf8' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Table */}
            <div style={{ background: 'rgba(10, 13, 20, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                  Schema for <code style={{ color: '#818cf8' }}>{selectedTable}</code>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  DESCRIBE {selectedTable};
                </span>
              </div>

              {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
                  <div>Executing DESCRIBE {selectedTable}...</div>
                </div>
              ) : tableSchema?.columns ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 16px' }}>Field</th>
                      <th style={{ padding: '10px 16px' }}>Type</th>
                      <th style={{ padding: '10px 16px' }}>Null</th>
                      <th style={{ padding: '10px 16px' }}>Key</th>
                      <th style={{ padding: '10px 16px' }}>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSchema.columns.map((col, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>{col.Field}</td>
                        <td style={{ padding: '10px 16px', color: '#c084fc' }}>{col.Type}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{col.Null}</td>
                        <td style={{ padding: '10px 16px', color: '#34d399' }}>{col.Key}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-dim)' }}>{col.Default || 'NULL'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No columns returned or table not yet described.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={fetchDbInfo} className="btn-secondary" style={{ marginRight: '8px' }}>
            <RefreshCw size={16} />
            Refresh Status
          </button>
          <button onClick={onClose} className="btn-primary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
