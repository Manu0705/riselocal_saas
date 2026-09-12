'use client';

import { useEffect, useState } from 'react';
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

type AvailableStaffUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

export default function HostelStaffPage() {
  const [staff, setStaff] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availableUsers, setAvailableUsers] = useState<
    AvailableStaffUser[]
  >([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        setError('');

        const propertiesResponse = await api.get<
          ApiResponse<Array<{ id: string; name?: string }>>
        >('/hostel/properties');

        const properties = propertiesResponse.data;

        if (!properties.length) {
          setStaff([]);
          return;
        }

        const hostelId = properties[0].id;

        const response = await api.get<ApiResponse<StaffAssignment[]>>(
          `/hostel/staff?hostelId=${encodeURIComponent(hostelId)}`,
        );

        setStaff(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load staff.');
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const openAddModal = async () => {
    try {
      setAddError('');
      setSelectedUserId('');
      setShowAddModal(true);

      const response = await api.get<
        ApiResponse<AvailableStaffUser[]>
      >('/hostel/staff/available-users');

      setAvailableUsers(response.data);
    } catch (err) {
      console.error(err);
      setAddError('Failed to load available staff users.');
    }
  };

  const closeAddModal = () => {
    if (adding) return;

    setShowAddModal(false);
    setSelectedUserId('');
    setAddError('');
  };

  const handleAddStaff = async () => {
    if (!selectedUserId) {
      setAddError('Please select a staff user.');
      return;
    }

    try {
      setAdding(true);
      setAddError('');

      const propertiesResponse = await api.get<
        ApiResponse<Array<{ id: string; name?: string }>>
      >('/hostel/properties');

      const properties = propertiesResponse.data;

      if (!properties.length) {
        setAddError('No hostel/property found.');
        return;
      }

      const hostelId = properties[0].id;

      await api.post('/hostel/staff', {
        hostelId,
        userId: selectedUserId,
        role: 'STAFF',
      });

      setShowAddModal(false);
      setSelectedUserId('');

      const response = await api.get<ApiResponse<StaffAssignment[]>>(
        `/hostel/staff?hostelId=${encodeURIComponent(hostelId)}`,
      );

      setStaff(response.data);
    } catch (err) {
      console.error(err);
      setAddError('Failed to add staff.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            Staff
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage hostel staff members and their roles.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
        >
          Add Staff
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="w-full rounded-xl border bg-white p-4 sm:p-6">
          <p className="text-sm text-gray-500">
            Loading staff...
          </p>
        </div>
      ) : staff.length === 0 ? (
        <div className="w-full rounded-xl border bg-white p-6 text-center sm:p-8">
          <p className="text-sm text-gray-500">
            No staff members found.
          </p>
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-white">
          <div className="w-full min-w-0 overflow-x-auto">
            <table className="min-w-[640px] text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-600 sm:px-4">
                    Name
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-600 sm:px-4">
                    Email
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-600 sm:px-4">
                    Role
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-600 sm:px-4">
                    Added
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-gray-600 sm:px-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900 sm:px-4 sm:py-4">
                      {member.user?.name || '—'}
                    </td>

                    <td className="px-3 py-3 text-gray-600 sm:px-4 sm:py-4">
                      <span className="whitespace-nowrap">
                        {member.user?.email || '—'}
                      </span>
                    </td>

                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                        {member.user?.role || '—'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-gray-600 sm:px-4 sm:py-4">
                      {member.createdAt
                        ? new Date(
                            member.createdAt,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-right sm:px-4 sm:py-4">
                      <a
                        href={`/dashboard/hostel/staff/${member.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4">
          <div className="my-auto flex max-h-[calc(100vh-24px)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-32px)]">
            {/* Modal Header */}
            <div className="shrink-0 border-b px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-lg font-semibold text-gray-900">
                  Add Staff
                </h2>

                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={adding}
                  aria-label="Close add staff dialog"
                  className="shrink-0 text-xl leading-none text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed"
                >
                  ×
                </button>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Select an existing staff user to assign to this
                hostel.
              </p>
            </div>

            {/* Modal Content */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {addError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {addError}
                </div>
              )}

              {availableUsers.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">
                  No available staff users found.
                </div>
              ) : (
                <div className="min-w-0">
                  <label
                    htmlFor="staff-user"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Staff User
                  </label>

                  <select
                    id="staff-user"
                    value={selectedUserId}
                    onChange={(event) =>
                      setSelectedUserId(event.target.value)
                    }
                    disabled={adding}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">
                      Select staff user
                    </option>

                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email || user.id}
                        {user.email && user.name
                          ? ` — ${user.email}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={adding}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddStaff}
                disabled={adding || !selectedUserId}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {adding ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}