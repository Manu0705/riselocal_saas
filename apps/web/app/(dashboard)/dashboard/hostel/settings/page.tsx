'use client';

import { useState } from 'react';

type SettingSection = 'hostel' | 'billing' | 'notifications' | 'operations';

export default function HostelSettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingSection>('hostel');

  const [hostelName, setHostelName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [currency, setCurrency] = useState('INR');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');

  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [complaintNotifications, setComplaintNotifications] = useState(true);
  const [announcementNotifications, setAnnouncementNotifications] =
    useState(true);

  const [autoRoomAllocation, setAutoRoomAllocation] = useState(false);
  const [requireCheckoutApproval, setRequireCheckoutApproval] =
    useState(true);

  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Backend settings API is not available yet.
    // Keep the current UI state ready for future API integration.
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground)',
          }}
        >
          Hostel Settings
        </h1>

        <p
          style={{
            margin: '6px 0 0',
            fontSize: 14,
            color: 'var(--muted-foreground)',
          }}
        >
          Configure hostel information, billing, notifications, and
          operational preferences.
        </p>
      </div>

      {/* Settings navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <SettingTab
          active={activeSection === 'hostel'}
          onClick={() => setActiveSection('hostel')}
        >
          Hostel
        </SettingTab>

        <SettingTab
          active={activeSection === 'billing'}
          onClick={() => setActiveSection('billing')}
        >
          Billing
        </SettingTab>

        <SettingTab
          active={activeSection === 'notifications'}
          onClick={() => setActiveSection('notifications')}
        >
          Notifications
        </SettingTab>

        <SettingTab
          active={activeSection === 'operations'}
          onClick={() => setActiveSection('operations')}
        >
          Operations
        </SettingTab>
      </div>

      {/* Settings content */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--background)',
          overflow: 'hidden',
        }}
      >
        {/* Hostel */}
        {activeSection === 'hostel' && (
          <SettingsCard
            title="Hostel Information"
            description="Basic information used throughout the Hostel Management module."
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 18,
              }}
              className="settings-grid"
            >
              <Field
                label="Hostel Name"
                value={hostelName}
                onChange={setHostelName}
                placeholder="Enter hostel name"
              />

              <Field
                label="Contact Phone"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="Enter contact number"
              />

              <Field
                label="Contact Email"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="Enter email address"
                type="email"
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--foreground)',
                  }}
                >
                  Currency
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={inputStyle}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--foreground)',
                  }}
                >
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter hostel address"
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: 'auto',
                    padding: '11px 12px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </SettingsCard>
        )}

        {/* Billing */}
        {activeSection === 'billing' && (
          <SettingsCard
            title="Billing Preferences"
            description="Configure fee and payment related preferences."
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <SettingRow
                title="Late Fee"
                description="Enable late fees for overdue hostel payments."
                control={
                  <Toggle
                    checked={lateFeeEnabled}
                    onChange={setLateFeeEnabled}
                  />
                }
              />

              {lateFeeEnabled && (
                <div
                  style={{
                    maxWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                  }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--foreground)',
                    }}
                  >
                    Late Fee Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={lateFeeAmount}
                    onChange={(e) => setLateFeeAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={inputStyle}
                  />
                </div>
              )}

              <div
                style={{
                  height: 1,
                  background: 'var(--border)',
                }}
              />

              <div
                style={{
                  padding: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--muted-foreground)',
                }}
              >
                Current currency: <strong>{currency}</strong>
              </div>
            </div>
          </SettingsCard>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <SettingsCard
            title="Notifications"
            description="Choose which hostel activities should generate notifications."
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <SettingRow
                title="Payment Notifications"
                description="Notify staff when payment activity occurs."
                control={
                  <Toggle
                    checked={paymentNotifications}
                    onChange={setPaymentNotifications}
                  />
                }
              />

              <SettingRow
                title="Complaint Notifications"
                description="Notify staff when a complaint is created or updated."
                control={
                  <Toggle
                    checked={complaintNotifications}
                    onChange={setComplaintNotifications}
                  />
                }
              />

              <SettingRow
                title="Announcement Notifications"
                description="Notify users when announcements are published."
                control={
                  <Toggle
                    checked={announcementNotifications}
                    onChange={setAnnouncementNotifications}
                  />
                }
              />
            </div>
          </SettingsCard>
        )}

        {/* Operations */}
        {activeSection === 'operations' && (
          <SettingsCard
            title="Operational Preferences"
            description="Configure how common hostel operations should behave."
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <SettingRow
                title="Automatic Room Allocation"
                description="Allow the system to use automatic room allocation when supported."
                control={
                  <Toggle
                    checked={autoRoomAllocation}
                    onChange={setAutoRoomAllocation}
                  />
                }
              />

              <SettingRow
                title="Checkout Approval"
                description="Require staff or management approval before completing checkout."
                control={
                  <Toggle
                    checked={requireCheckoutApproval}
                    onChange={setRequireCheckoutApproval}
                  />
                }
              />
            </div>
          </SettingsCard>
        )}
      </div>

      {/* Save area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          marginTop: 18,
        }}
      >
        {saved && (
          <span
            style={{
              fontSize: 13,
              color: 'var(--muted-foreground)',
            }}
          >
            Settings saved locally.
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          style={{
            minHeight: 42,
            padding: '0 20px',
            border: 'none',
            borderRadius: 8,
            background: 'var(--foreground)',
            color: 'var(--background)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          section {
            max-width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 650,
            color: 'var(--foreground)',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '5px 0 0',
            fontSize: 13,
            color: 'var(--muted-foreground)',
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
        padding: '16px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--foreground)',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--muted-foreground)',
          }}
        >
          {description}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--foreground)',
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function SettingTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '9px 14px',
        border: 'none',
        borderRadius: 7,
        background: active ? 'var(--foreground)' : 'transparent',
        color: active
          ? 'var(--background)'
          : 'var(--muted-foreground)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 44,
        height: 24,
        padding: 0,
        border: 'none',
        borderRadius: 999,
        background: checked
          ? 'var(--foreground)'
          : 'var(--muted-foreground)',
        cursor: 'pointer',
        opacity: checked ? 1 : 0.45,
        transition: 'opacity 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--background)',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};