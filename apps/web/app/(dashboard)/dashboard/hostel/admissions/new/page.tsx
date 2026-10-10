'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

type HostelProperty = {
  id: string;
  name: string;
};

type HostelRoom = {
  id: string;
  roomNumber?: string | null;
  floor?: string | number | null;
  capacity?: number | null;
  occupied?: number | null;
  occupiedBeds?: number | null;
  vacant?: number | null;
  vacantBeds?: number | null;
  status?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type CreatedStudent = {
  id: string;
  admissionNumber: string;
  name: string;
  admissionDate?: string | Date | null;
  phone?: string | null;
};

type CreateStudentResult = {
  student: CreatedStudent;
  temporaryPasskey: string;
};

type ModalStep = 'recipients' | 'ready';

export default function NewAdmissionPage() {
  const [property, setProperty] = useState<HostelProperty | null>(null);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [admissionNumber, setAdmissionNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const [studentWhatsApp, setStudentWhatsApp] = useState('');
  const [adminWhatsApp, setAdminWhatsApp] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomWarning, setRoomWarning] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('recipients');
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  const [temporaryPasskey, setTemporaryPasskey] = useState('');

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<HostelProperty[]>>(
          '/hostel/properties',
        );
        const firstProperty = response.data?.[0];

        if (!firstProperty) {
          throw new Error('No hostel property found.');
        }

        setProperty(firstProperty);

        const roomsResponse = await api.get<ApiResponse<HostelRoom[]>>(
          `/hostel/rooms/vacancies?hostelId=${encodeURIComponent(firstProperty.id)}`,
        );

        setRooms(
          Array.isArray(roomsResponse.data) ? roomsResponse.data : [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load hostel property.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProperty();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!property) {
      setError('Hostel property is not available.');
      return;
    }
    if (!admissionNumber.trim()) {
      setError('Admission number is required.');
      return;
    }
    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }
    if (!admissionDate) {
      setError('Admission date is required.');
      return;
    }

    // Collect the two WhatsApp recipients before creating the student.
    setModalStep('recipients');
    setCreatedStudent(null);
    setTemporaryPasskey('');
    setRoomWarning(null);
    setShowWhatsAppModal(true);
  }

  async function createAdmission() {
    if (!property) {
      setError('Hostel property is not available.');
      return;
    }

    const studentNumber = normalizeWhatsAppNumber(studentWhatsApp);
    const adminNumber = normalizeWhatsAppNumber(adminWhatsApp);

    if (!studentNumber) {
      setError('Enter the student WhatsApp number with country code, for example +91 9876543210.');
      return;
    }
    if (!adminNumber) {
      setError('Enter the admin WhatsApp number with country code, for example +91 9876543210.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setRoomWarning(null);

      const studentResponse = await api.post<
        ApiResponse<CreateStudentResult>
      >('/hostel/students', {
        hostelId: property.id,
        admissionNumber: admissionNumber.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        emergencyRelation: emergencyRelation.trim() || undefined,
        admissionDate,
      });

      const created = studentResponse.data?.student;
      const passkey = studentResponse.data?.temporaryPasskey;

      if (!created?.id || !passkey) {
        throw new Error(
          'The student was created, but the API did not return the temporary passkey. Do not retry creating the admission; check the API response first.',
        );
      }

      // Keep the passkey only in component memory for the WhatsApp hand-off.
      setCreatedStudent(created);
      setTemporaryPasskey(passkey);
      setModalStep('ready');

      if (selectedRoomId) {
        try {
          await api.post('/hostel/rooms/allocate', {
            hostelId: property.id,
            roomId: selectedRoomId,
            studentId: created.id,
          });
        } catch (allocationError) {
          setRoomWarning(
            allocationError instanceof Error
              ? `Admission created, but room allocation failed: ${allocationError.message}`
              : 'Admission created, but room allocation failed. Please allocate the room from the admissions page.',
          );
        }
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to create admission.',
      );
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp(recipient: 'student' | 'admin') {
    if (!createdStudent || !temporaryPasskey) return;

    const rawNumber = recipient === 'student' ? studentWhatsApp : adminWhatsApp;
    const number = normalizeWhatsAppNumber(rawNumber);
    if (!number) {
      setError(`The ${recipient} WhatsApp number is invalid.`);
      return;
    }

    const dateText = formatDate(
      createdStudent.admissionDate ?? admissionDate,
    );
    const message = [
      recipient === 'student'
        ? `Hello ${createdStudent.name}, your hostel admission is confirmed.`
        : 'Hello Admin, a new hostel admission has been created.',
      '',
      `Admission Number: ${createdStudent.admissionNumber || admissionNumber.trim()}`,
      `Student Name: ${createdStudent.name}`,
      `Admission Date: ${dateText}`,
      `Temporary Passkey: ${temporaryPasskey}`,
      '',
      'Please keep this passkey confidential and change it after your first login.',
    ].join('\n');

    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function finishAdmission() {
    // Clear the one-time passkey from component state before leaving the page.
    setTemporaryPasskey('');
    setShowWhatsAppModal(false);
    window.location.href = '/dashboard/hostel/admissions';
  }

  if (loading) {
    return <div>Loading admission form...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/hostel/admissions"
          style={{
            fontSize: 13,
            textDecoration: 'none',
            color: 'var(--muted, #6b7280)',
          }}
        >
          ← Back to Admissions
        </Link>

        <h1
          style={{
            margin: '12px 0 0',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          New Admission
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Register a new student in the hostel.
        </p>
      </div>

      {error && !showWhatsAppModal && (
        <div style={errorStyle}>{error}</div>
      )}

      <form
        onSubmit={(event) => handleSubmit(event)}
        style={{
          width: '100%',
          maxWidth: 800,
          boxSizing: 'border-box',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <SectionTitle title="Student Information" />

        <div className="admission-form-grid" style={gridStyle}>
          <Field label="Admission Number" value={admissionNumber} onChange={setAdmissionNumber} required />
          <Field label="Student Name" value={name} onChange={setName} required />
          <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          <Field label="Admission Date" value={admissionDate} onChange={setAdmissionDate} type="date" required />

          <label style={fieldLabelStyle}>
            Room
            <select
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              style={inputStyle}
            >
              <option value="">No room assigned</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber ?? '—'}
                  {room.floor != null ? ` · Floor ${room.floor}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 28 }}>
          <SectionTitle title="Emergency Contact" />
          <div className="admission-form-grid" style={gridStyle}>
            <Field label="Contact Name" value={emergencyName} onChange={setEmergencyName} />
            <Field label="Contact Phone" value={emergencyPhone} onChange={setEmergencyPhone} type="tel" />
            <Field label="Relationship" value={emergencyRelation} onChange={setEmergencyRelation} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/dashboard/hostel/admissions" style={cancelLinkStyle}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            Create Admission
          </button>
        </div>
      </form>

      {showWhatsAppModal && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowWhatsAppModal(false);
              setError(null);
            }
          }}
          style={overlayStyle}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-modal-title"
            style={modalStyle}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={whatsAppIconStyle}>WA</div>
              <div style={{ flex: 1 }}>
                <h2 id="whatsapp-modal-title" style={{ margin: 0, fontSize: 21 }}>
                  {modalStep === 'recipients'
                    ? 'Admission WhatsApp details'
                    : 'Admission created successfully'}
                </h2>
                <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
                  {modalStep === 'recipients'
                    ? 'Enter both WhatsApp numbers before creating the student account.'
                    : 'Open each WhatsApp chat and press Send to deliver the message.'}
                </p>
              </div>
              {!saving && (
                <button
                  type="button"
                  aria-label="Close popup"
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setError(null);
                  }}
                  style={closeButtonStyle}
                >
                  ×
                </button>
              )}
            </div>

            {error && <div style={{ ...errorStyle, marginTop: 16 }}>{error}</div>}

            {modalStep === 'recipients' ? (
              <>
                <div style={summaryStyle}>
                  <SummaryRow label="Admission Number" value={admissionNumber.trim()} />
                  <SummaryRow label="Student Name" value={name.trim()} />
                  <SummaryRow label="Admission Date" value={formatDate(admissionDate)} />
                </div>

                <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
                  <Field
                    label="Student WhatsApp Number (include country code)"
                    value={studentWhatsApp}
                    onChange={setStudentWhatsApp}
                    type="tel"
                    required
                  />
                  <Field
                    label="Admin WhatsApp Number (include country code)"
                    value={adminWhatsApp}
                    onChange={setAdminWhatsApp}
                    type="tel"
                    required
                  />
                </div>

                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280' }}>
                  Example: +91 9876543210. The student account is created only after you confirm below.
                </p>

                <div style={modalActionsStyle}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setShowWhatsAppModal(false);
                      setError(null);
                    }}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void createAdmission()}
                    style={primaryButtonStyle}
                  >
                    {saving ? 'Creating admission...' : 'Confirm & Create'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={summaryStyle}>
                  <SummaryRow label="Admission Number" value={createdStudent?.admissionNumber || admissionNumber} />
                  <SummaryRow label="Student Name" value={createdStudent?.name || name} />
                  <SummaryRow label="Admission Date" value={formatDate(createdStudent?.admissionDate ?? admissionDate)} />
                  <SummaryRow label="Student WhatsApp" value={studentWhatsApp} />
                  <SummaryRow label="Admin WhatsApp" value={adminWhatsApp} />
                </div>

                <div style={passkeyBoxStyle}>
                  <div>
                    <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
                      TEMPORARY PASSKEY
                    </div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
                      {temporaryPasskey}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(temporaryPasskey);
                    }}
                    style={secondaryButtonStyle}
                  >
                    Copy
                  </button>
                </div>

                {roomWarning && (
                  <div style={{ ...errorStyle, marginTop: 12 }}>{roomWarning}</div>
                )}

                <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => openWhatsApp('student')}
                    style={whatsAppButtonStyle}
                  >
                    Open WhatsApp — Student
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsApp('admin')}
                    style={whatsAppButtonStyle}
                  >
                    Open WhatsApp — Admin
                  </button>
                </div>

                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280' }}>
                  WhatsApp opens with the message prepared. You must press Send in each chat. Keep this passkey private.
                </p>

                <div style={modalActionsStyle}>
                  <button type="button" onClick={finishAdmission} style={primaryButtonStyle}>
                    Finish & View Admissions
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 520px) {
          .admission-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function normalizeWhatsAppNumber(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  // wa.me requires an international number without +, spaces, or punctuation.
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(`${value}`.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2
      style={{
        margin: 0,
        marginBottom: 16,
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--foreground, #111827)',
      }}
    >
      {title}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      {required ? ' *' : ''}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0' }}>
      <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 13, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</strong>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  minWidth: 0,
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  minWidth: 0,
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  marginTop: 8,
  padding: '11px 12px',
  border: '1px solid var(--border, #d1d5db)',
  borderRadius: 8,
  background: 'var(--bg, #ffffff)',
  color: 'var(--foreground, #111827)',
  fontSize: 14,
  fontWeight: 400,
};

const errorStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 14,
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 10,
  fontSize: 14,
};

const cancelLinkStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--border, #d1d5db)',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 14,
  color: 'var(--foreground, #111827)',
  display: 'inline-flex',
  alignItems: 'center',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--primary, #111827)',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(15, 23, 42, 0.58)',
  overflowY: 'auto',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 540,
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  boxSizing: 'border-box',
  padding: 24,
  borderRadius: 16,
  background: '#ffffff',
  color: '#111827',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.25)',
};

const whatsAppIconStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: '#dcfce7',
  color: '#166534',
  fontWeight: 800,
};

const closeButtonStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#6b7280',
  fontSize: 28,
  lineHeight: 1,
  cursor: 'pointer',
};

const summaryStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '10px 14px',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#f9fafb',
};

const passkeyBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 16,
  padding: 16,
  border: '1px solid #bbf7d0',
  borderRadius: 10,
  background: '#f0fdf4',
  color: '#14532d',
};

const whatsAppButtonStyle: React.CSSProperties = {
  padding: '12px 14px',
  border: 'none',
  borderRadius: 9,
  background: '#15803d',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 22,
};
