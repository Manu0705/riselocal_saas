'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import MobilePageTitle from '../../components/mobile-page-title';

type HostelProperty = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
};

type HostelRoom = {
  id: string;
  roomNumber: string;
  capacity: number;
  occupancy: number;
  sharingType: string;
  vacancyStatus: string;
  isActive: boolean;
  status: string;
};

type HostelStudent = {
  id: string;
  admissionNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  admissionDate?: string;
  roomId: string | null;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
  status: string;
  outstandingAmount?: string | number;
};

type HostelPayment = {
  id: string;
  amount: string | number;
  currency: string;
  status: string;
  utr?: string | null;
  proofUrl?: string | null;
  upiVpa?: string | null;
  upiPayload?: string;
  receipt?: { receiptNumber: string; issuedAt: string } | null;
  createdAt: string;
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

type StudentPage = {
  items: HostelStudent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type RoomPage = {
  items: HostelRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type VacancySummary = {
  rooms: number;
  capacity: number;
  occupancy: number;
  vacancy: number;
  full: number;
  vacant: number;
  partial: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export default function HostelPage() {
  const [properties, setProperties] = useState<HostelProperty[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [vacancySummary, setVacancySummary] = useState<VacancySummary | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [allocationStudentId, setAllocationStudentId] = useState('');
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [studentPagination, setStudentPagination] = useState<StudentPage['pagination'] | null>(
    null,
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<HostelStudent | null>(null);
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentDateOfBirth, setEditStudentDateOfBirth] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editEmergencyRelation, setEditEmergencyRelation] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('DUE');
  const [editStudentStatus, setEditStudentStatus] = useState('ACTIVE');
  const [payments, setPayments] = useState<HostelPayment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activePayment, setActivePayment] = useState<HostelPayment | null>(null);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProperties() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<HostelProperty[]>>('/hostel/properties');
      setProperties(response.data);
      setSelectedHostelId((current) => current || response.data[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedHostelId) {
      setRooms([]);
      setStudents([]);
      return;
    }

    async function loadHostelData() {
      try {
        const query = `?hostelId=${encodeURIComponent(selectedHostelId)}`;
        const [roomResponse, summaryResponse] = await Promise.all([
          api.get<ApiResponse<RoomPage>>(`/hostel/rooms${query}`),
          api.get<ApiResponse<VacancySummary>>(`/hostel/rooms/vacancy-summary${query}`),
        ]);
        setRooms(
          Array.isArray(roomResponse.data?.items)
            ? roomResponse.data.items
            : [],
        );
        setVacancySummary(summaryResponse.data);
        setSelectedRoom((current) =>
          current
            ? (roomResponse.data.items?.find((room) => room.id === current.id) ?? null)
            : null,
        );
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : 'Failed to load hostel data');
      }
    }

    void loadHostelData();
  }, [selectedHostelId]);

  useEffect(() => {
    if (!selectedHostelId) {
      setStudents([]);
      setStudentPagination(null);
      return;
    }

    async function loadStudents() {
      try {
        const params = new URLSearchParams({
          hostelId: selectedHostelId,
          page: String(studentPage),
          limit: '10',
        });
        if (studentSearch.trim()) params.set('search', studentSearch.trim());
        if (paymentFilter) params.set('paymentStatus', paymentFilter);

        const response = await api.get<ApiResponse<StudentPage>>(`/hostel/students?${params}`);
        setStudents(response.data.items);
        setStudentPagination(response.data.pagination);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : 'Failed to load students');
      }
    }

    void loadStudents();
  }, [selectedHostelId, studentPage, studentSearch, paymentFilter]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null);
      return;
    }

    async function loadStudentDetails() {
      try {
        const response = await api.get<ApiResponse<HostelStudent>>(
          `/hostel/students/${selectedStudentId}`,
        );
        setSelectedStudent(response.data);
        setEditStudentName(response.data.name);
        setEditStudentPhone(response.data.phone ?? '');
        setEditStudentEmail(response.data.email ?? '');
        setEditStudentDateOfBirth(response.data.dateOfBirth?.slice(0, 10) ?? '');
        setEditEmergencyName(response.data.emergencyName ?? '');
        setEditEmergencyPhone(response.data.emergencyPhone ?? '');
        setEditEmergencyRelation(response.data.emergencyRelation ?? '');
        setEditPaymentStatus(response.data.paymentStatus);
        setEditStudentStatus(response.data.status);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : 'Failed to load student');
      }
    }

    void loadStudentDetails();
  }, [selectedStudentId]);

  useEffect(() => {
    async function loadPayments() {
      try {
        const query = selectedStudentId
          ? `?studentId=${encodeURIComponent(selectedStudentId)}`
          : '';
        const response = await api.get<ApiResponse<{ items: HostelPayment[] }>>(
          `/payments${query}`,
        );
        setPayments(response.data.items);
      } catch (loadError) {
        toast.error(loadError instanceof Error ? loadError.message : 'Failed to load payments');
      }
    }
    void loadPayments();
  }, [selectedStudentId]);

  useEffect(() => {
    if (!activePayment?.upiPayload) {
      setQrDataUrl('');
      return;
    }
    void QRCode.toDataURL(activePayment.upiPayload, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [activePayment?.upiPayload]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<HostelProperty>, { name: string }>(
        '/hostel/properties',
        { name },
      );
      setProperties((current) =>
        [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedHostelId(response.data.id);
      setName('');
      toast.success('Property added');
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Failed to add property');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHostelId || !roomNumber.trim() || !capacity.trim()) return;

    try {
      const response = await api.post<ApiResponse<HostelRoom>, Record<string, unknown>>(
        '/hostel/rooms',
        {
          hostelId: selectedHostelId,
          roomNumber,
          capacity: Number(capacity),
          sharingType: 'SINGLE',
        },
      );
      setRooms((current) => [...current, response.data]);
      setRoomNumber('');
      setCapacity('');
      toast.success('Room added');
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Failed to add room');
    }
  }

  async function allocateStudent(roomId: string) {
    if (!allocationStudentId) return;
    try {
      await api.post('/hostel/rooms/allocate', {
        hostelId: selectedHostelId,
        roomId,
        studentId: allocationStudentId,
      });
      setAllocationStudentId('');
      toast.success('Student allocated');
      const query = `?hostelId=${encodeURIComponent(selectedHostelId)}`;
      const response = await api.get<ApiResponse<RoomPage>>(
        `/hostel/rooms${query}`,
      );

      setRooms(
        Array.isArray(response.data?.items)
          ? response.data.items
          : [],
      );
    } catch (allocationError) {
      toast.error(allocationError instanceof Error ? allocationError.message : 'Allocation failed');
    }
  }

  async function deallocateStudent(roomId: string) {
    if (!selectedStudentId) return;
    try {
      await api.post('/hostel/rooms/deallocate', {
        hostelId: selectedHostelId,
        roomId,
        studentId: selectedStudentId,
      });
      toast.success('Student deallocated');
      setSelectedStudentId('');
      const query = `?hostelId=${encodeURIComponent(selectedHostelId)}`;
      const response = await api.get<ApiResponse<RoomPage>>(
        `/hostel/rooms${query}`,
      );

      setRooms(
        Array.isArray(response.data?.items)
          ? response.data.items
          : [],
      );
    } catch (deallocationError) {
      toast.error(
        deallocationError instanceof Error ? deallocationError.message : 'Deallocation failed',
      );
    }
  }

  async function autoAssignStudent() {
    if (!allocationStudentId) return;
    try {
      await api.post('/hostel/rooms/auto-assign', {
        hostelId: selectedHostelId,
        studentId: allocationStudentId,
      });
      setAllocationStudentId('');
      toast.success('Student auto-assigned');
      const query = `?hostelId=${encodeURIComponent(selectedHostelId)}`;
      const response = await api.get<ApiResponse<RoomPage>>(
        `/hostel/rooms${query}`,
      );

      setRooms(
        Array.isArray(response.data?.items)
          ? response.data.items
          : [],
      );
    } catch (assignmentError) {
      toast.error(
        assignmentError instanceof Error ? assignmentError.message : 'Auto-assignment failed',
      );
    }
  }

  async function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHostelId || !studentName.trim() || !admissionNumber.trim()) return;

    try {
      const response = await api.post<ApiResponse<HostelStudent>, Record<string, unknown>>(
        '/hostel/students',
        {
          hostelId: selectedHostelId,
          name: studentName,
          admissionNumber,
          phone: studentPhone || undefined,
          email: studentEmail || undefined,
          dateOfBirth: studentDateOfBirth || undefined,
        },
      );
      setStudents((current) => [...current, response.data]);
      setStudentPage(1);
      setStudentName('');
      setAdmissionNumber('');
      setStudentPhone('');
      setStudentEmail('');
      setStudentDateOfBirth('');
      toast.success('Student added');
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Failed to add student');
    }
  }

  async function handleStudentUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStudentId || !editStudentName.trim()) return;

    try {
      const response = await api.patch<ApiResponse<HostelStudent>, Record<string, unknown>>(
        `/hostel/students/${selectedStudentId}`,
        {
          name: editStudentName,
          phone: editStudentPhone || null,
          email: editStudentEmail || null,
          dateOfBirth: editStudentDateOfBirth || null,
          emergencyName: editEmergencyName || null,
          emergencyPhone: editEmergencyPhone || null,
          emergencyRelation: editEmergencyRelation || null,
          paymentStatus: editPaymentStatus,
          status: editStudentStatus,
        },
      );
      setSelectedStudent(response.data);
      setStudents((current) =>
        current.map((student) => (student.id === response.data.id ? response.data : student)),
      );
      toast.success('Student updated');
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Failed to update student');
    }
  }

  async function initiatePayment() {
    if (!selectedStudentId || !paymentAmount) return;
    try {
      const response = await api.post<
        ApiResponse<HostelPayment>,
        { studentId: string; amount: number }
      >('/payments/initiate', { studentId: selectedStudentId, amount: Number(paymentAmount) });
      setActivePayment(response.data);
      setPayments((current) => [response.data, ...current]);
      toast.success('Payment request created');
    } catch (paymentError) {
      toast.error(
        paymentError instanceof Error ? paymentError.message : 'Unable to initiate payment',
      );
    }
  }

  async function submitPayment() {
    if (!activePayment || !paymentUtr.trim()) return;
    setPaymentSubmitting(true);
    try {
      let proofUrl: string | undefined;
      if (paymentProof) {
        const uploadResponse = await api.upload<ApiResponse<{ url: string }>>(
          '/upload',
          paymentProof,
        );
        proofUrl = uploadResponse.data.url;
      }
      const response = await api.post<ApiResponse<HostelPayment>, Record<string, unknown>>(
        `/payments/${activePayment.id}/submit`,
        {
          utr: paymentUtr,
          transactionReferenceId: paymentReference || undefined,
          proofUrl,
          idempotencyKey: `submit-${activePayment.id}-${paymentUtr.trim()}`,
        },
      );
      setActivePayment(response.data);
      setPayments((current) =>
        current.map((payment) => (payment.id === response.data.id ? response.data : payment)),
      );
      toast.success('Payment submitted for verification');
    } catch (paymentError) {
      toast.error(
        paymentError instanceof Error ? paymentError.message : 'Unable to submit payment',
      );
    } finally {
      setPaymentSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 16, paddingBottom: 90 }}>
      <MobilePageTitle title="Hostel" />
      <p style={{ margin: '8px 0 20px', color: 'var(--muted)', fontSize: 14 }}>
        Manage properties, rooms, and students inside the current tenant.
      </p>

      {properties.length > 0 ? (
        <select
          aria-label="Select hostel"
          value={selectedHostelId}
          onChange={(event) => setSelectedHostelId(event.target.value)}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--background)',
            color: 'var(--text)',
          }}
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      ) : null}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <input
          aria-label="Property name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Property name"
          maxLength={120}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--background)',
            color: 'var(--text)',
          }}
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          title="Add property"
          aria-label="Add property"
          style={{
            width: 44,
            height: 44,
            border: 'none',
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: '#2563eb',
            color: '#ffffff',
            opacity: submitting || !name.trim() ? 0.55 : 1,
          }}
        >
          <Plus size={20} />
        </button>
      </form>

      {loading ? <p style={{ color: 'var(--muted)' }}>Loading properties...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {!loading && !error && properties.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No properties yet.</p>
      ) : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {properties.map((property) => (
          <article
            key={property.id}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              padding: 14,
              background: 'var(--card)',
            }}
          >
            <strong style={{ color: 'var(--text)' }}>{property.name}</strong>
            <div style={{ marginTop: 4, color: 'var(--muted)', fontSize: 13 }}>Active property</div>
          </article>
        ))}
      </div>

      {selectedHostelId ? (
        <>
          {vacancySummary ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 8,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <strong>{vacancySummary.vacancy}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>Vacancies</div>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <strong>
                  {vacancySummary.occupancy}/{vacancySummary.capacity}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>Occupied</div>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <strong>{vacancySummary.full}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>Full rooms</div>
              </div>
            </div>
          ) : null}
          <section style={{ marginTop: 24 }}>
            <h2 style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 18 }}>Rooms</h2>
            <form onSubmit={handleRoomSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <input
                aria-label="Room number"
                value={roomNumber}
                onChange={(event) => setRoomNumber(event.target.value)}
                placeholder="Room number"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <input
                aria-label="Room capacity"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="Capacity"
                inputMode="numeric"
                style={{
                  width: 100,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <button
                type="submit"
                disabled={!roomNumber.trim() || !capacity.trim()}
                style={{
                  padding: '0 14px',
                  border: 0,
                  borderRadius: 8,
                  background: '#2563eb',
                  color: '#fff',
                }}
              >
                Add
              </button>
            </form>
            {rooms.map((room) => (
              <div
                key={room.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRoom(room)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedRoom(room);
                }}
                style={{
                  padding: 12,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: 'var(--card)',
                }}
              >
                <strong style={{ color: 'var(--text)' }}>Room {room.roomNumber}</strong>
                <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 13 }}>
                  {room.occupancy}/{room.capacity} occupied · {room.vacancyStatus}
                </span>
              </div>
            ))}
            {selectedRoom ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  background: 'var(--card)',
                }}
              >
                <strong style={{ color: 'var(--text)' }}>
                  Room {selectedRoom.roomNumber} details
                </strong>
                <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>
                  {selectedRoom.occupancy} of {selectedRoom.capacity} occupied,{' '}
                  {selectedRoom.vacancyStatus.toLowerCase()}.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', }}>
                  <select
                    aria-label="Student to allocate"
                    value={allocationStudentId}
                    onChange={(event) => setAllocationStudentId(event.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: 9,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  >
                    <option value="">Select student</option>
                    {students
                      .filter((student) => !student.roomId)
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!allocationStudentId || selectedRoom.vacancyStatus === 'FULL'}
                    onClick={() => void allocateStudent(selectedRoom.id)}
                    style={{
                      padding: '0 10px',
                      border: 0,
                      borderRadius: 8,
                      background: '#2563eb',
                      color: '#fff',
                    }}
                  >
                    Allocate
                  </button>
                  <button
                    type="button"
                    disabled={!allocationStudentId}
                    onClick={() => void autoAssignStudent()}
                    style={{
                      padding: '0 10px',
                      border: 0,
                      borderRadius: 8,
                      background: '#0f766e',
                      color: '#fff',
                    }}
                  >
                    Auto-assign
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!selectedStudentId}
                  onClick={() => void deallocateStudent(selectedRoom.id)}
                  style={{
                    marginTop: 10,
                    padding: 9,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card)',
                    color: 'var(--text)',
                  }}
                >
                  Deallocate selected student
                </button>
              </div>
            ) : null}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 18 }}>Students</h2>
            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <input
                aria-label="Search students"
                value={studentSearch}
                onChange={(event) => {
                  setStudentSearch(event.target.value);
                  setStudentPage(1);
                }}
                placeholder="Search name, admission number, phone, or email"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <select
                aria-label="Filter payment status"
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value);
                  setStudentPage(1);
                }}
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              >
                <option value="">All payment statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="DUE">Due</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <form
              onSubmit={handleStudentSubmit}
              style={{ display: 'grid', gap: 8, marginBottom: 12 }}
            >
              <input
                aria-label="Student name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Student name"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <input
                aria-label="Admission number"
                value={admissionNumber}
                onChange={(event) => setAdmissionNumber(event.target.value)}
                placeholder="Admission number"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <input
                aria-label="Student phone"
                value={studentPhone}
                onChange={(event) => setStudentPhone(event.target.value)}
                placeholder="Phone"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <input
                aria-label="Student email"
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
                placeholder="Email"
                type="email"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <input
                aria-label="Student date of birth"
                value={studentDateOfBirth}
                onChange={(event) => setStudentDateOfBirth(event.target.value)}
                type="date"
                style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <button
                type="submit"
                disabled={!studentName.trim() || !admissionNumber.trim()}
                style={{
                  padding: 10,
                  border: 0,
                  borderRadius: 8,
                  background: '#2563eb',
                  color: '#fff',
                }}
              >
                Add student
              </button>
            </form>
            {students.map((student) => (
              <div
                key={student.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedStudentId(student.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedStudentId(student.id);
                }}
                style={{
                  padding: 12,
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: 'var(--card)',
                }}
              >
                <strong style={{ color: 'var(--text)' }}>{student.name}</strong>
                <span
                  style={{ display: 'block', marginTop: 4, color: 'var(--muted)', fontSize: 13 }}
                >
                  {student.admissionNumber} · {student.paymentStatus}
                </span>
              </div>
            ))}
            {studentPagination && studentPagination.totalPages > 1 ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage((page) => Math.max(1, page - 1))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card)',
                  }}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Page {studentPagination.page} of {studentPagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={studentPage >= studentPagination.totalPages}
                  onClick={() => setStudentPage((page) => page + 1)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card)',
                  }}
                >
                  Next
                </button>
              </div>
            ) : null}

            {selectedStudent ? (
              <form
                onSubmit={handleStudentUpdate}
                style={{ display: 'grid', gap: 8, marginTop: 18 }}
              >
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Student details</h3>
                <input
                  aria-label="Edit student name"
                  value={editStudentName}
                  onChange={(event) => setEditStudentName(event.target.value)}
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Edit student phone"
                  value={editStudentPhone}
                  onChange={(event) => setEditStudentPhone(event.target.value)}
                  placeholder="Phone"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Edit student email"
                  value={editStudentEmail}
                  onChange={(event) => setEditStudentEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Edit student date of birth"
                  value={editStudentDateOfBirth}
                  onChange={(event) => setEditStudentDateOfBirth(event.target.value)}
                  type="date"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Emergency contact name"
                  value={editEmergencyName}
                  onChange={(event) => setEditEmergencyName(event.target.value)}
                  placeholder="Emergency contact name"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Emergency contact phone"
                  value={editEmergencyPhone}
                  onChange={(event) => setEditEmergencyPhone(event.target.value)}
                  placeholder="Emergency contact phone"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <input
                  aria-label="Emergency contact relation"
                  value={editEmergencyRelation}
                  onChange={(event) => setEditEmergencyRelation(event.target.value)}
                  placeholder="Emergency contact relation"
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <select
                  aria-label="Edit payment status"
                  value={editPaymentStatus}
                  onChange={(event) => setEditPaymentStatus(event.target.value)}
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                >
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="DUE">Due</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <select
                  aria-label="Edit student status"
                  value={editStudentStatus}
                  onChange={(event) => setEditStudentStatus(event.target.value)}
                  style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <button
                  type="submit"
                  style={{
                    padding: 10,
                    border: 0,
                    borderRadius: 8,
                    background: '#2563eb',
                    color: '#fff',
                  }}
                >
                  Save student
                </button>
              </form>
            ) : null}

            {selectedStudent ? (
              <section style={{ marginTop: 24 }}>
                <h2 style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 18 }}>Payments</h2>
                <div
                  style={{
                    padding: 14,
                    border: '1px solid var(--card-border)',
                    borderRadius: 8,
                    background: 'var(--card)',
                  }}
                >
                  <strong style={{ color: 'var(--text)' }}>
                    Outstanding amount: INR{' '}
                    {Number(selectedStudent.outstandingAmount ?? 0).toFixed(2)}
                  </strong>
                  <p style={{ margin: '6px 0 12px', color: 'var(--muted)', fontSize: 13 }}>
                    Payment happens outside RiseLocal through your UPI app. It remains pending until
                    a staff member verifies it.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <input
                      aria-label="Payment amount"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder="Amount"
                      inputMode="decimal"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: 10,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    />
                    <button
                      type="button"
                      disabled={!paymentAmount}
                      onClick={() => void initiatePayment()}
                      style={{
                        padding: '0 12px',
                        border: 0,
                        borderRadius: 8,
                        background: '#2563eb',
                        color: '#fff',
                      }}
                    >
                      Pay now
                    </button>
                  </div>
                </div>

                {activePayment ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      border: '1px solid var(--card-border)',
                      borderRadius: 8,
                      background: 'var(--card)',
                    }}
                  >
                    <strong style={{ color: 'var(--text)' }}>UPI payment request</strong>
                    <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>
                      Use any compatible UPI application or scan the generic QR. Returning here or
                      uploading proof does not mark this payment as paid.
                    </p>
                    {qrDataUrl ? (
                      <Image
                        src={qrDataUrl}
                        alt="Generic UPI payment QR"
                        width={220}
                        height={220}
                        unoptimized
                        style={{ display: 'block', margin: '10px auto' }}
                      />
                    ) : null}
                    {activePayment.upiPayload ? (
                      <a
                        href={activePayment.upiPayload}
                        style={{ display: 'inline-block', marginBottom: 12, color: '#2563eb' }}
                      >
                        Open a supported UPI application
                      </a>
                    ) : null}
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input
                        aria-label="UTR"
                        value={paymentUtr}
                        onChange={(event) => setPaymentUtr(event.target.value)}
                        placeholder="UTR / transaction reference"
                        style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                      />
                      <input
                        aria-label="Optional transaction reference"
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                        placeholder="Optional reference ID"
                        style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                      />
                      <input
                        aria-label="Optional payment screenshot"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        disabled={paymentSubmitting || !paymentUtr.trim()}
                        onClick={() => void submitPayment()}
                        style={{
                          padding: 10,
                          border: 0,
                          borderRadius: 8,
                          background: '#0f766e',
                          color: '#fff',
                        }}
                      >
                        {paymentSubmitting ? 'Submitting...' : "I've completed payment"}
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ color: 'var(--text)', fontSize: 13 }}>
                        Payment status timeline
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {['INITIATED', 'SUBMITTED', 'VERIFYING', 'PAID'].map((step) => (
                          <span
                            key={step}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              background:
                                step === activePayment.status ? '#2563eb' : 'var(--background)',
                              color: step === activePayment.status ? '#fff' : 'var(--muted)',
                              border: '1px solid var(--card-border)',
                            }}
                          >
                            {step}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
                        Current status: {activePayment.status}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <strong style={{ color: 'var(--text)' }}>Payment history</strong>
                  {payments.map((payment) => (
                    <button
                      type="button"
                      key={payment.id}
                      onClick={() => setActivePayment(payment)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        marginTop: 8,
                        padding: 10,
                        border: '1px solid var(--card-border)',
                        borderRadius: 8,
                        background: 'var(--card)',
                        color: 'var(--text)',
                      }}
                    >
                      INR {Number(payment.amount).toFixed(2)} · {payment.status}{' '}
                      {payment.receipt ? `· Receipt ${payment.receipt.receiptNumber}` : ''}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
