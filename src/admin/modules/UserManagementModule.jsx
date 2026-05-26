import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ScanLine, Search, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react';
import { adminAPI } from '../../api/adminAPI';
import toast from '../Toast';
import { useConfirm } from '../modals/ConfirmModal';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function UserManagementModule() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      const message = err.message || 'Хэрэглэгчдийн жагсаалт авахад алдаа гарлаа.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text))
    );
  }, [users, query]);

  const deleteUser = async (user) => {
    const ok = await confirm({
      title: 'Хэрэглэгч устгах уу?',
      message: `${user.name || user.email} хэрэглэгчийг бүртгэлээс устгах гэж байна.`,
      warning: 'Энэ үйлдлийг буцаах боломжгүй.',
      confirmText: 'Устгах',
      cancelText: 'Болих',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      setDeletingId(user._id);
      await adminAPI.deleteUser(user._id);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      toast.success('Хэрэглэгч амжилттай устгагдлаа');
    } catch (err) {
      toast.error(err.message || 'Хэрэглэгч устгахад алдаа гарлаа.');
    } finally {
      setDeletingId(null);
    }
  };

  const updateRole = async (user, role) => {
    if (user.role === role) return;
    try {
      setUpdatingRoleId(user._id);
      const data = await adminAPI.updateUserRole(user._id, role);
      setUsers((prev) => prev.map((item) => item._id === user._id ? { ...item, ...(data.user || {}), role } : item));
      toast.success('Хэрэглэгчийн эрх шинэчлэгдлээ');
    } catch (err) {
      toast.error(err.message || 'Хэрэглэгчийн эрх шинэчлэхэд алдаа гарлаа.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Хэрэглэгчийн удирдлага</h1>
              <p className="text-sm text-slate-400">Бүртгэлтэй хэрэглэгчдийг харах, устгах</p>
            </div>
          </div>
        </div>

        <button
          onClick={loadUsers}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Шинэчлэх
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Нийт хэрэглэгч</p>
          <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Admin эрхтэй</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{users.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Cashier эрхтэй</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{users.filter((u) => u.role === 'cashier').length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Нэр, имэйл, утсаар хайх..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500"
            />
          </div>
          <span className="text-sm text-slate-500">{filteredUsers.length} мөр</span>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/60">
              <tr>
                {['Хэрэглэгч', 'Утас', 'Эрх', 'Оноо', 'Бүртгэсэн', 'Үйлдэл'].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">Ачааллаж байна...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">Хэрэглэгч олдсонгүй.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.name || 'Нэргүй'}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{user.phone || '-'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                        : user.role === 'cashier'
                          ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-700/70 text-slate-300'
                    }`}>
                      {user.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                      {user.role === 'cashier' && <ScanLine className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{user.points || 0}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(event) => updateRole(user, event.target.value)}
                        disabled={updatingRoleId === user._id}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-amber-500 disabled:opacity-60"
                      >
                        <option value="user">user</option>
                        <option value="cashier">cashier</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={deletingId === user._id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Устгах
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
