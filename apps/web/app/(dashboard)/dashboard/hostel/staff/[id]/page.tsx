'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

type StaffAssignment = {
  id: string;
  hostelId?: string;
  userId?: string;
  createdAt?: string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

type Property = {
  id: string;
  name?: string;
};

export default function HostelStaffDetailsPage() {
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffAssignment | null>(null);
  const [hostelName, setHostelName] = useState('—');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    const loadStaffDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const propertiesResponse = await api.get<ApiResponse<Property[]>>(
          '/hostel/properties',
        );

        const properties = propertiesResponse.data;

        if (!properties.length) {
          setError('No hostel/property found.');
          return;
        }

        const hostelId = properties[0].id;

        const staffResponse = await api.get<
          ApiResponse<StaffAssignment[]>
        >(
          `/hostel/staff?hostelId=${encodeURIComponent(hostelId)}`,
        );

        const assignment = staffResponse.data.find(
          (member) => member.id === staffId,
        );

        if (!assignment) {
          setError('Staff member not found.');
          return;
        }

        setStaff(assignment);

        setSelectedRole(
          assignment.user?.role?.toUpperCase() === 'ADMIN'
            ? 'ADMIN'
            : 'STAFF',
        );

        setHostelName(properties[0].name || '—');
      } catch (err) {
        console.error(err);
        setError('Failed to load staff details.');
      } finally {
        setLoading(false);
      }
    };

    loadStaffDetails();
  }, [staffId]);

  const handleUpdateStaff = async () => {
    if (!staff) return;

    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');

      await api.patch(
        `/hostel/staff/${staff.id}?hostelId=${encodeURIComponent(
          staff.hostelId || '',
        )}`,
        {
          role: selectedRole,
        },
      );

      setEditing(false);

      setSaveSuccess('Staff role updated successfully.');

      setStaff({
        ...staff,
        user: {
          id: staff.user?.id,
          name: staff.user?.name,
          email: staff.user?.email,
          role: selectedRole,
        },
      });
    } catch (err) {
      console.error(err);
      setSaveError('Failed to update staff role.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStaff = async () => {
    if (!staff) return;

    const confirmed = window.confirm(
      `Remove ${staff.user?.name || 'this staff member'} from this hostel?`,
    );

    if (!confirmed) return;

    try {
      setRemoving(true);
      setRemoveError('');

      await api.delete(
        `/hostel/staff/${staff.id}?hostelId=${encodeURIComponent(
          staff.hostelId || '',
        )}`,
      );

      window.location.href = '/dashboard/hostel/staff';
    } catch (err) {
      console.error(err);
      setRemoveError('Failed to remove staff.');
    } finally {
      setRemoving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSaveError('');

    setSelectedRole(
      staff?.user?.role?.toUpperCase() === 'ADMIN'
        ? 'ADMIN'
        : 'STAFF',
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/hostel/staff"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Staff
          </Link>

          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Staff Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage hostel staff assignment details.
          </p>
        </div>

        {staff && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSaveError('');
                setSaveSuccess('');

                setSelectedRole(
                  staff.user?.role?.toUpperCase() === 'ADMIN'
                    ? 'ADMIN'
                    : 'STAFF',
                );
              }}
              disabled={editing || removing || saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={handleRemoveStaff}
              disabled={removing || saving}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removing ? 'Removing...' : 'Remove Staff'}
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {saveSuccess}
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Remove Error */}
      {removeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {removeError}
        </div>
      )}

      {/* General Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">
            Loading staff details...
          </p>
        </div>
      ) : staff ? (
        <>
          {/* Edit Staff Assignment */}
          {editing && (
            <div className="rounded-xl border bg-white p-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Edit Staff Assignment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the role assigned to this hostel staff member.
                </p>
              </div>

              <div className="mt-5 max-w-sm">
                <label
                  htmlFor="staff-role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>

                <select
                  id="staff-role"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSaveError('');
                    setSaveSuccess('');
                  }}
                  disabled={saving}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleUpdateStaff}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Staff Information */}
          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Staff Information
              </h2>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              {/* Staff ID */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Staff ID
                </p>

                <p className="mt-1 break-all text-sm font-medium text-gray-900">
                  {staff.id}
                </p>
              </div>

              {/* Name */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </p>

                <p className="mt-1 text-sm text-gray-900">
                  {staff.user?.name || '—'}
                </p>
              </div>

              {/* Email */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>

                <p className="mt-1 break-all text-sm text-gray-900">
                  {staff.user?.email || '—'}
                </p>
              </div>

              {/* Role */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Role
                </p>

                <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                  {staff.user?.role || '—'}
                </span>
              </div>

              {/* Hostel */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Hostel
                </p>

                <p className="mt-1 text-sm text-gray-900">
                  {hostelName}
                </p>
              </div>

              {/* Assigned On */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Assigned On
                </p>

                <p className="mt-1 text-sm text-gray-900">
                  {staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}