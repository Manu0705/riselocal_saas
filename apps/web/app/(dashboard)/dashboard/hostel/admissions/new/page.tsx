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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<
          ApiResponse<HostelProperty[]>
        >('/hostel/properties');

        const firstProperty = response.data?.[0];

        if (!firstProperty) {
          throw new Error('No hostel property found.');
        }

        setProperty(firstProperty);

        const roomsResponse = await api.get<
          ApiResponse<HostelRoom[]>
        >(
          `/hostel/rooms/vacancies?hostelId=${encodeURIComponent(
            firstProperty.id,
          )}`,
        );

        setRooms(roomsResponse.data ?? []);
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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

    try {
      setSaving(true);
      setError(null);

      await api.post('/hostel/students', {
        hostelId: property.id,
        roomId: selectedRoomId || undefined,
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

      window.location.href = '/dashboard/hostel/admissions';
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

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        style={{
          maxWidth: 800,
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <SectionTitle title="Student Information" />

        <div style={gridStyle}>
          <Field
            label="Admission Number"
            value={admissionNumber}
            onChange={setAdmissionNumber}
            required
          />

          <Field
            label="Student Name"
            value={name}
            onChange={setName}
            required
          />

          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            type="tel"
          />

          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
          />

          <Field
            label="Date of Birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            type="date"
          />

          <Field
            label="Admission Date"
            value={admissionDate}
            onChange={setAdmissionDate}
            type="date"
            required
          />

          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Room

            <select
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 8,
                padding: '11px 12px',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: 8,
                background: 'var(--bg, #ffffff)',
                color: 'var(--foreground, #111827)',
                fontSize: 14,
                fontWeight: 400,
              }}
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

          <div style={gridStyle}>
            <Field
              label="Contact Name"
              value={emergencyName}
              onChange={setEmergencyName}
            />

            <Field
              label="Contact Phone"
              value={emergencyPhone}
              onChange={setEmergencyPhone}
              type="tel"
            />

            <Field
              label="Relationship"
              value={emergencyRelation}
              onChange={setEmergencyRelation}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 28,
          }}
        >
          <Link
            href="/dashboard/hostel/admissions"
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              color: 'var(--foreground, #111827)',
            }}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: 8,
              background: 'var(--primary, #111827)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Creating...' : 'Create Admission'}
          </button>
        </div>
      </form>
    </div>
  );
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
    <label
      style={{
        display: 'block',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {label}
      {required ? ' *' : ''}

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 8,
          padding: '11px 12px',
          border: '1px solid var(--border, #d1d5db)',
          borderRadius: 8,
          background: 'var(--bg, #ffffff)',
          color: 'var(--foreground, #111827)',
          fontSize: 14,
          fontWeight: 400,
        }}
      />
    </label>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
};