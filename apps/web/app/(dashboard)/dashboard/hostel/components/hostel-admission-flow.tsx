'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  beds?: Array<{
    id: string;
    bedNumber: string;
    status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'INACTIVE';
  }>;
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
  temporaryPasskey?: string;
  alreadyConverted?: boolean;
  existingStudent?: boolean;
  bedReserved?: boolean;
};

type HostelEnquiry = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  createdAt: string;
  activities?: Array<{ type: string; timestamp: string }>;
};

type ModalStep = 'recipients' | 'ready';

type HostelAdmissionFlowProps = {
  embedded?: boolean;
  initialHostelId?: string;
  onClose?: () => void;
  onPropertyChange?: (hostelId: string) => void;
  onAdmissionCreated?: (studentId: string) => void;
};

function getAdmissionRequestStorageKey(hostelId: string, phone: string) {
  return `hostel-admission-request:${hostelId}:${phone.replace(/\D/g, '')}`;
}

export default function HostelAdmissionFlow({
  embedded = false,
  initialHostelId = '',
  onClose,
  onPropertyChange,
  onAdmissionCreated,
}: HostelAdmissionFlowProps) {
  const initialHostelIdRef = useRef(initialHostelId);
  const onPropertyChangeRef = useRef(onPropertyChange);
  const [properties, setProperties] = useState<HostelProperty[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState(initialHostelId);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [enquiries, setEnquiries] = useState<HostelEnquiry[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('');
  const [savingEnquiry, setSavingEnquiry] = useState(false);
  const [admissionRequestId, setAdmissionRequestId] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const admissionSubmitLock = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const [adminWhatsApp, setAdminWhatsApp] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('recipients');
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  const [temporaryPasskey, setTemporaryPasskey] = useState('');
  const [passkeyCopied, setPasskeyCopied] = useState(false);
  const [reissuingPasskey, setReissuingPasskey] = useState(false);
  const [admittingExistingStudent, setAdmittingExistingStudent] = useState(false);
  const [bedReserved, setBedReserved] = useState(false);

  useEffect(() => {
    onPropertyChangeRef.current = onPropertyChange;
  }, [onPropertyChange]);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<HostelProperty[]>>('/hostel/properties');
        const loadedProperties = response.data ?? [];
        setProperties(loadedProperties);
        const nextHostelId = loadedProperties.some(
          (property) => property.id === initialHostelIdRef.current,
        )
          ? initialHostelIdRef.current
          : (loadedProperties[0]?.id ?? '');
        setSelectedHostelId(nextHostelId);
        onPropertyChangeRef.current?.(nextHostelId);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load hostel properties.',
        );
      } finally {
        setLoading(false);
      }
    }
    void loadProperties();
  }, []);

  useEffect(() => {
    setSelectedHostelId(initialHostelId);
  }, [initialHostelId]);

  useEffect(() => {
    if (!selectedHostelId) {
      setRooms([]);
      setEnquiries([]);
      setSelectedRoomId('');
      setRoomsLoading(false);
      return;
    }

    let cancelled = false;
    setRooms([]);
    setSelectedRoomId('');
    setRoomsLoading(true);

    async function loadRooms() {
      try {
        const [roomResponse, enquiryResponse] = await Promise.all([
          api.get<ApiResponse<HostelRoom[]>>(
            `/hostel/rooms/vacancies?hostelId=${encodeURIComponent(selectedHostelId)}`,
          ),
          api.get<ApiResponse<HostelEnquiry[]>>(
            `/hostel/enquiries?hostelId=${encodeURIComponent(selectedHostelId)}`,
          ),
        ]);
        if (!cancelled) {
          setRooms(Array.isArray(roomResponse.data) ? roomResponse.data : []);
          setEnquiries(Array.isArray(enquiryResponse.data) ? enquiryResponse.data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load rooms for the selected property.',
          );
        }
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [selectedHostelId]);

  async function saveEnquiry() {
    if (!selectedHostelId || !name.trim() || !phone.trim()) {
      setError('Select a hostel and provide the enquiry name and phone number.');
      return;
    }

    try {
      setSavingEnquiry(true);
      setError(null);
      const response = await api.post<ApiResponse<{ leadId: string }>>('/hostel/enquiries', {
        hostelId: selectedHostelId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      const leadId = response.data?.leadId;
      const enquiriesResponse = await api.get<ApiResponse<HostelEnquiry[]>>(
        `/hostel/enquiries?hostelId=${encodeURIComponent(selectedHostelId)}`,
      );
      setEnquiries(Array.isArray(enquiriesResponse.data) ? enquiriesResponse.data : []);
      setSelectedEnquiryId(leadId ?? '');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save enquiry.');
    } finally {
      setSavingEnquiry(false);
    }
  }

  function selectEnquiry(leadId: string) {
    setSelectedEnquiryId(leadId);
    const enquiry = enquiries.find((item) => item.id === leadId);
    if (!enquiry) return;
    setName(enquiry.name);
    setPhone(enquiry.phone);
    setEmail(enquiry.email ?? '');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedHostelId) {
      setError('Select a hostel property before creating an admission.');
      return;
    }
    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      setError(
        'Enter a valid student phone number with 10 to 15 digits.',
      );
      return;
    }

    if (!admissionDate) {
      setError('Admission date is required.');
      return;
    }
    if (selectedEnquiryId && !enquiries.some((item) => item.id === selectedEnquiryId)) {
      setError('The selected enquiry is no longer available. Refresh and select it again.');
      return;
    }
    if (selectedRoomId && !selectedBedId) {
      setError('Select an available bed for the selected room.');
      return;
    }

    const requestStorageKey = selectedEnquiryId
      ? `hostel-enquiry-conversion-request:${selectedHostelId}:${selectedEnquiryId}`
      : getAdmissionRequestStorageKey(selectedHostelId, normalizedPhone);

    let requestId = '';

    try {
      requestId = sessionStorage.getItem(requestStorageKey) ?? '';
    } catch {
      // Use a component-generated ID if browser storage is unavailable.
    }

    requestId ||= globalThis.crypto.randomUUID();

    try {
      sessionStorage.setItem(requestStorageKey, requestId);
    } catch {
      // Keep the request ID in component state.
    }

    setAdmissionRequestId(requestId);

    // Collect the two WhatsApp recipients before creating the student.
    setModalStep('recipients');
    setCreatedStudent(null);
    setTemporaryPasskey('');
    setPasskeyCopied(false);
    setAdmittingExistingStudent(false);
    setBedReserved(false);
    setShowWhatsAppModal(true);
  }

  async function createAdmission() {
    // Prevent rapid double-clicks.
    if (admissionSubmitLock.current) return;

    // Validate before acquiring the lock.
    if (!selectedHostelId) {
      setError('Select a hostel property before creating an admission.');
      return;
    }

    if (!admissionRequestId) {
      setError('Admission request ID is missing. Please reopen the admission form and try again.');
      return;
    }

    const studentNumber = normalizeWhatsAppNumber(phone);
    const adminNumber = normalizeWhatsAppNumber(adminWhatsApp);

    if (!studentNumber) {
      setError('Enter the student WhatsApp number with country code, for example +91 9876543210.');
      return;
    }
    if (!adminNumber) {
      setError('Enter the admin WhatsApp number with country code, for example +91 9876543210.');
      return;
    }

    // Acquire the lock only after validation succeeds.
    admissionSubmitLock.current = true;

    try {
      setSaving(true);
      setError(null);
      const admissionPayload = {
        hostelId: selectedHostelId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        emergencyRelation: emergencyRelation.trim() || undefined,
        admissionDate,
        admissionRequestId,
        roomId: selectedRoomId || undefined,
        bedId: selectedBedId || undefined,
      };
      const studentResponse = selectedEnquiryId
        ? await api.post<ApiResponse<CreateStudentResult>>(
            `/hostel/enquiries/${encodeURIComponent(selectedEnquiryId)}/convert`,
            admissionPayload,
          )
        : await api.post<ApiResponse<CreateStudentResult>>('/hostel/students', admissionPayload);

      const created = studentResponse.data?.student;
      const passkey = studentResponse.data?.temporaryPasskey;

      // this issues still there but need to fix backend before this
      if (studentResponse.data?.alreadyConverted) {
        throw new Error(`This enquiry was already converted to admission ${created?.admissionNumber ?? ''}.`);
      }

      if (!created?.id || (!passkey && !studentResponse.data?.existingStudent)) {
        throw new Error(
          'The student was created, but the API did not return the temporary passkey. Do not retry creating the admission; check the API response first.',
        );
      }

      // The API has already confirmed that the admission was saved.
      setCreatedStudent(created);
      setTemporaryPasskey(passkey ?? '');
      setPasskeyCopied(false);
      setAdmittingExistingStudent(Boolean(studentResponse.data?.existingStudent));
      setBedReserved(studentResponse.data?.bedReserved ?? Boolean(selectedBedId));
      setModalStep('ready');

      // Post-save notifications must not turn a successful save into an API error.
      try {
        window.dispatchEvent(new Event('hostel:admission-created'));
        onAdmissionCreated?.(created.id);
      } catch (callbackError) {
        console.error(
          'Admission was saved, but a post-save UI callback failed.',
          callbackError,
        );
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create admission.');
    } finally {
      setSaving(false);
      admissionSubmitLock.current = false;
    }
  }

  async function reissuePasskey() {
    if (!createdStudent?.id) {
      setError('Student details are missing. Close this popup and reopen the existing admission.');
      return;
    }
    if (!selectedHostelId) {
      setError('Select the hostel property before regenerating the passkey.');
      return;
    }
    if (reissuingPasskey) return;

    try {
      setReissuingPasskey(true);
      setError(null);
      setPasskeyCopied(false);

      const response = await api.post<ApiResponse<{
        student?: CreatedStudent;
        temporaryPasskey?: string;
        passkeyReissued?: boolean;
      }>>(
        `/hostel/students/${encodeURIComponent(createdStudent.id)}/reissue-passkey?hostelId=${encodeURIComponent(selectedHostelId)}`,
        {},
      );

      const newPasskey = response.data?.temporaryPasskey;
      if (!response.success || !newPasskey) {
        throw new Error(response.message || 'The API did not return the regenerated passkey.');
      }

      // The plaintext passkey is kept only in component state for this one-time hand-off.
      setTemporaryPasskey(newPasskey);
      setAdmittingExistingStudent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to regenerate the student passkey.',
      );
    } finally {
      setReissuingPasskey(false);
    }
  }

  function openWhatsApp(recipient: 'student' | 'admin') {
    if (!createdStudent) return;

    const rawNumber = recipient === 'student' ? phone : adminWhatsApp;
    const number = normalizeWhatsAppNumber(rawNumber);
    if (!number) {
      setError(`The ${recipient} WhatsApp number is invalid.`);
      return;
    }

    const dateText = formatDate(createdStudent.admissionDate ?? admissionDate);
    const message = [
      recipient === 'student'
        ? `Hello ${createdStudent.name}, your hostel admission is confirmed.`
        : 'Hello Admin, a new hostel admission has been created.',
      '',
      `Admission Number: ${createdStudent.admissionNumber}`,
      `Student Name: ${createdStudent.name}`,
      `Admission Date: ${dateText}`,
      ...(temporaryPasskey ? [`Temporary Passkey: ${temporaryPasskey}`] : []),
      '',
      ...(temporaryPasskey
        ? ['Please keep this passkey confidential and change it after your first login.']
        : ['Contact your hostel administrator if you need help accessing your student account.']),
    ].join('\n');

    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function finishAdmission() {
    // Clear the one-time passkey from component state before leaving the page.
    setTemporaryPasskey('');
    setShowWhatsAppModal(false);
    if (embedded) {
      onClose?.();
      return;
    }
    window.location.href = '/dashboard/hostel/admissions';
  }

  let successTitle = 'Admission created successfully';
  let successDescription = 'Open each WhatsApp chat and press Send to deliver the message.';
  if (admittingExistingStudent) {
    successTitle = selectedEnquiryId
      ? 'Enquiry linked to existing student'
      : 'Admission already created';
    successDescription = selectedEnquiryId
      ? 'The enquiry history is preserved and linked to the existing student record.'
      : 'This request was already completed. The existing student record was returned.';
  } else if (bedReserved) {
    successDescription =
      'The admission was created and the selected bed is reserved. Complete check-in when the student arrives.';
  }

  if (loading) {
    return <div>Loading admission form...</div>;
  }

  return (
    <div className={embedded ? 'admission-flow-embedded' : undefined}>
      <div style={{ marginBottom: 24 }}>
        {embedded ? (
          <button type="button" onClick={onClose} style={cancelLinkStyle}>
            Close
          </button>
        ) : (
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
        )}

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

      {error && !showWhatsAppModal && <div style={errorStyle}>{error}</div>}

      <form
        onSubmit={(event) => handleSubmit(event)}
        style={{
          width: '100%',
          maxWidth: embedded ? 'none' : 800,
          boxSizing: 'border-box',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <SectionTitle title="Property & Room" />
        <div className="admission-form-grid" style={gridStyle}>
          <label style={fieldLabelStyle}>
            Hostel Property *
            <select
              value={selectedHostelId}
              onChange={(event) => {
                setError(null);
                setSelectedHostelId(event.target.value);
                setSelectedRoomId('');
                setSelectedBedId('');
                setSelectedEnquiryId('');
                onPropertyChange?.(event.target.value);
              }}
              required
              style={inputStyle}
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          {properties.length === 0 && (
            <p style={{ margin: 0, color: '#92400e', fontSize: 13 }}>
              Create a property in the Hostel Operations workspace before adding an admission.
            </p>
          )}
          {selectedHostelId && !roomsLoading && rooms.length === 0 && (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
              No rooms are currently available for this property. You can still create the admission
              and allocate a room later.
            </p>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <SectionTitle title="Student Information" />
          <p
            style={{
              margin: '-8px 0 16px',
              fontSize: 13,
              color: 'var(--muted, #6b7280)',
            }}
          >
            An admission number is assigned automatically when the admission is created.
          </p>

          <div className="admission-form-grid" style={gridStyle}>
            <label style={fieldLabelStyle}>
              Existing enquiry
              <select
                value={selectedEnquiryId}
                onChange={(event) => selectEnquiry(event.target.value)}
                disabled={!selectedHostelId || enquiries.length === 0}
                style={inputStyle}
              >
                <option value="">No enquiry selected</option>
                {enquiries.map((enquiry) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.name} · {enquiry.phone} · {enquiry.status}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Student Name" value={name} onChange={setName} required />
            <Field
              label="Student WhatsApp Number (include country code)"
              value={phone}
              onChange={setPhone}
              type="tel"
              required
            />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
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

            <label style={fieldLabelStyle}>
              Room
              <select
                value={selectedRoomId}
                onChange={(event) => {
                  setSelectedRoomId(event.target.value);
                  setSelectedBedId('');
                }}
                disabled={!selectedHostelId || rooms.length === 0}
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
            <label style={fieldLabelStyle}>
              Bed
              <select
                value={selectedBedId}
                onChange={(event) => setSelectedBedId(event.target.value)}
                disabled={!selectedRoomId || roomsLoading}
                style={inputStyle}
              >
                <option value="">Select available bed</option>
                {(rooms.find((room) => room.id === selectedRoomId)?.beds ?? [])
                  .filter((bed) => bed.status === 'AVAILABLE')
                  .map((bed) => (
                    <option key={bed.id} value={bed.id}>{bed.bedNumber}</option>
                  ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 28 }}>
            <SectionTitle title="Emergency Contact" />
            <div className="admission-form-grid" style={gridStyle}>
              <Field label="Contact Name" value={emergencyName} onChange={setEmergencyName} />
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
          {embedded ? (
            <button type="button" onClick={onClose} style={cancelLinkStyle}>
              Cancel
            </button>
          ) : (
            <Link href="/dashboard/hostel/admissions" style={cancelLinkStyle}>
              Cancel
            </Link>
          )}
          <button
            type="button"
            onClick={() => void saveEnquiry()}
            disabled={savingEnquiry || !selectedHostelId || !name.trim() || !phone.trim()}
            style={secondaryButtonStyle}
          >
            {savingEnquiry ? 'Saving enquiry...' : 'Save as Enquiry'}
          </button>
          <button type="submit" disabled={saving || !selectedHostelId} style={primaryButtonStyle}>
            {selectedEnquiryId ? 'Convert to Admission' : 'Create Admission'}
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
                    : successTitle}
                </h2>
                <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
                  {modalStep === 'recipients'
                    ? 'Enter both WhatsApp numbers before creating the student account.'
                    : successDescription}
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
                  <SummaryRow label="Admission Number" value="Assigned when admission is created" />
                  <SummaryRow label="Student Name" value={name.trim()} />
                  <SummaryRow label="Admission Date" value={formatDate(admissionDate)} />
                </div>

                <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
                  <Field
                    label="Admin WhatsApp Number (include country code)"
                    value={adminWhatsApp}
                    onChange={setAdminWhatsApp}
                    type="tel"
                    required
                  />
                </div>

                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280' }}>
                  The student WhatsApp message will be sent to the phone number in Student
                  Information. Include the country code there (for example, +91 9876543210).
                  The student account is created only after you confirm below.
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
                  <SummaryRow
                    label="Admission Number"
                    value={createdStudent?.admissionNumber ?? '—'}
                  />
                  <SummaryRow label="Student Name" value={createdStudent?.name || name} />
                  <SummaryRow
                    label="Admission Date"
                    value={formatDate(createdStudent?.admissionDate ?? admissionDate)}
                  />
                  <SummaryRow label="Student WhatsApp" value={phone} />
                  <SummaryRow label="Admin WhatsApp" value={adminWhatsApp} />
                </div>

                {temporaryPasskey ? (
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
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(temporaryPasskey);
                          setPasskeyCopied(true);
                        } catch {
                          setError('Could not copy the passkey. Select and copy it manually.');
                        }
                      }}
                      style={secondaryButtonStyle}
                    >
                      {passkeyCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : admittingExistingStudent ? (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#92400e' }}>
                      The previous passkey cannot be retrieved. Regenerate a new passkey to replace
                      the existing login credential, then share the new passkey with the student.
                    </p>
                    <button
                      type="button"
                      onClick={() => void reissuePasskey()}
                      disabled={reissuingPasskey || saving}
                      style={primaryButtonStyle}
                    >
                      {reissuingPasskey ? 'Regenerating passkey...' : 'Regenerate Passkey'}
                    </button>
                  </div>
                ) : null}

                {createdStudent ? (
                  <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={() => openWhatsApp('student')}
                      style={whatsAppButtonStyle}
                    >
                      Share with Student
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp('admin')}
                      style={whatsAppButtonStyle}
                    >
                      Forward to Admin
                    </button>
                  </div>
                ) : null}

                {temporaryPasskey ? (
                  <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280' }}>
                    WhatsApp opens with the message prepared. You must press Send in each chat. Keep
                    this passkey private.
                  </p>
                ) : createdStudent ? (
                  <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6b7280' }}>
                    WhatsApp opens with the admission details prepared. Review the message and press
                    Send in each chat.
                  </p>
                ) : null}

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
        .admission-flow-embedded {
          margin: 16px 0 24px;
          padding: 20px;
          border: 1px solid var(--card-border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
        }

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
      <strong style={{ fontSize: 13, textAlign: 'right', overflowWrap: 'anywhere' }}>
        {value}
      </strong>
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
