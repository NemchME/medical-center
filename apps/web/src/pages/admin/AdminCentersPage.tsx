import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { centersApi } from '@/api/centers';
import type { ClinicCenter, ID } from '@/types';
import Modal from '@/components/ui/Modal';

interface CenterFormState {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
}

const emptyForm: CenterFormState = {
  code: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  timezone: 'Europe/Moscow',
};

export function AdminCentersPage() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<CenterFormState>(emptyForm);

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      centersApi.create({
        code: form.code,
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        timezone: form.timezone || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centers'] });
      setIsCreateOpen(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      centersApi.update(editingId!, {
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        timezone: form.timezone || undefined,
      } as Partial<ClinicCenter>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centers'] });
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: ID) => centersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['centers'] }),
  });

  const openEdit = (c: ClinicCenter) => {
    setForm({
      code: c.code,
      name: c.name,
      address: c.address ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      timezone: c.timezone ?? 'Europe/Moscow',
    });
    setEditingId(c.id);
  };

  const modalOpen = isCreateOpen || editingId !== null;
  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };
  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMsg =
    (createMutation.error as any)?.response?.data?.message ??
    (updateMutation.error as any)?.response?.data?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-2.5">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Клинические центры</h2>
            <p className="text-sm text-gray-500">Всего: {centers.length}</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Добавить центр
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <div
              key={String(center.id)}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-400">{center.code}</p>
                  <h3 className="text-base font-semibold text-gray-900 mt-0.5">{center.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(center)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                    title="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Деактивировать центр "${center.name}"?`))
                        deleteMutation.mutate(center.id);
                    }}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Деактивировать"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {center.address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span>{center.address}</span>
                  </div>
                )}
                {center.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span>{center.phone}</span>
                  </div>
                )}
                {center.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-purple-500" />
                    <span>{center.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Редактировать центр' : 'Добавить центр'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Код" required>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                disabled={!!editingId}
                placeholder="MSK-01"
                className={inputCls}
              />
            </Field>
            <Field label="Часовой пояс">
              <input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Название" required className="sm:col-span-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Адрес" className="sm:col-span-2">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Телефон">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          {errorMsg && <div className="text-sm text-red-600">Ошибка: {errorMsg}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-purple-700"
            >
              {isPending ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-gray-50';

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
