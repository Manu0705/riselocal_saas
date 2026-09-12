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

  const [availableUsers, setAvailableUsers] = useState<AvailableStaffUser[]>([]);
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

      const response = await api.get<ApiResponse<AvailableStaffUser[]>>(
        '/hostel/staff/available-users',
      );

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
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
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Staff
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">
            Loading staff...
          </p>
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No staff members found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Name
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Email
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Role
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Added
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {member.user?.name || '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {member.user?.email || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                        {member.user?.role || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-5 py-4 text-right">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Staff
                </h2>

                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={adding}
                  className="text-xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Select an existing staff user to assign to this hostel.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
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
                <div>
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
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

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={adding}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddStaff}
                disabled={adding || !selectedUserId}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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