import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, ClipboardList, Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { servicesApi } from '@/api/services';
import { centersApi } from '@/api/centers';
import type { ID, LabTest, Service } from '@/types';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type TabKey = 'services' | 'tests';

export function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-2.5">
          <ClipboardList className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Услуги и анализы</h2>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('services')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'services'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          )}
        >
          Медицинские услуги
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'tests'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          )}
        >
          Анализы
        </button>
      </div>

      {activeTab === 'services' ? <ServicesTab /> : <TestsTab />}
    </div>
  );
}

interface ServiceFormState {
  code: string;
  name: string;
  description: string;
  durationMinDefault: number;
}
const emptyServiceForm: ServiceFormState = {
  code: '',
  name: '',
  description: '',
  durationMinDefault: 30,
};

function ServicesTab() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [pricingId, setPricingId] = useState<ID | null>(null);
  const [form, setForm] = useState<ServiceFormState>(emptyServiceForm);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.listServices(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      servicesApi.createService({
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        durationMinDefault: form.durationMinDefault,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setIsCreateOpen(false);
      setForm(emptyServiceForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      servicesApi.updateService(editingId!, {
        name: form.name,
        description: form.description || null,
        durationMinDefault: form.durationMinDefault,
      } as Partial<Service>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setEditingId(null);
      setForm(emptyServiceForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: ID) => servicesApi.removeService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const openEdit = (s: Service) => {
    setForm({
      code: s.code,
      name: s.name,
      description: s.description ?? '',
      durationMinDefault: s.durationMinDefault,
    });
    setEditingId(s.id);
  };

  const modalOpen = isCreateOpen || editingId !== null;
  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyServiceForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Добавить услугу
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Услуги пока не добавлены</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Код</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Длительность</th>
                <th className="px-4 py-3 text-left">Цены по центрам</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {services.map((s) => (
                <tr key={String(s.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.durationMinDefault} мин</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {s.prices && s.prices.length > 0
                      ? s.prices
                          .map(
                            (p) =>
                              `${p.center?.name ?? `#${p.centerId}`}: ${Number(p.price).toLocaleString('ru-RU')} ₽`,
                          )
                          .join(' · ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setPricingId(s.id)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                        title="Цены"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Деактивировать услугу "${s.name}"?`))
                            deleteMutation.mutate(s.id);
                        }}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        title="Деактивировать"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Редактировать услугу' : 'Добавить услугу'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) updateMutation.mutate();
            else createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Код" required>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              disabled={!!editingId}
              placeholder="CONS-THER"
              className={inputCls}
            />
          </Field>
          <Field label="Название" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Описание">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Длительность (мин)">
            <input
              type="number"
              value={form.durationMinDefault}
              onChange={(e) =>
                setForm({ ...form, durationMinDefault: Number(e.target.value) })
              }
              min={5}
              max={240}
              className={inputCls}
            />
          </Field>

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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {editingId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      {pricingId && (
        <PriceEditor
          kind="service"
          itemId={pricingId}
          itemName={services.find((s) => s.id === pricingId)?.name ?? ''}
          onClose={() => setPricingId(null)}
        />
      )}
    </div>
  );
}

interface TestFormState {
  code: string;
  name: string;
  description: string;
  sampleType: string;
  preparation: string;
}
const emptyTestForm: TestFormState = {
  code: '',
  name: '',
  description: '',
  sampleType: '',
  preparation: '',
};

function TestsTab() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [pricingId, setPricingId] = useState<ID | null>(null);
  const [form, setForm] = useState<TestFormState>(emptyTestForm);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => servicesApi.listTests(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      servicesApi.createTest({
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        sampleType: form.sampleType || undefined,
        preparation: form.preparation || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-tests'] });
      setIsCreateOpen(false);
      setForm(emptyTestForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      servicesApi.updateTest(editingId!, {
        name: form.name,
        description: form.description || null,
        sampleType: form.sampleType || null,
        preparation: form.preparation || null,
      } as Partial<LabTest>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-tests'] });
      setEditingId(null);
      setForm(emptyTestForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: ID) => servicesApi.removeTest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-tests'] }),
  });

  const openEdit = (t: LabTest) => {
    setForm({
      code: t.code,
      name: t.name,
      description: t.description ?? '',
      sampleType: t.sampleType ?? '',
      preparation: t.preparation ?? '',
    });
    setEditingId(t.id);
  };
  const modalOpen = isCreateOpen || editingId !== null;
  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyTestForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Добавить анализ
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Загрузка…</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Анализы пока не добавлены</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tests.map((t) => (
            <div key={String(t.id)} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-500" />
                    <p className="font-mono text-xs text-gray-400">{t.code}</p>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mt-1">{t.name}</h3>
                  {t.description && (
                    <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {t.sampleType && (
                      <span className="mr-3">
                        <span className="text-gray-400">Материал: </span>
                        {t.sampleType}
                      </span>
                    )}
                    {t.preparation && (
                      <span>
                        <span className="text-gray-400">Подготовка: </span>
                        {t.preparation}
                      </span>
                    )}
                  </div>
                  {t.prices && t.prices.length > 0 && (
                    <div className="text-xs text-gray-600 mt-2">
                      {t.prices
                        .map(
                          (p) =>
                            `${p.center?.name ?? `#${p.centerId}`}: ${Number(p.price).toLocaleString('ru-RU')} ₽`,
                        )
                        .join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPricingId(t.id)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                    title="Цены"
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                    title="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Деактивировать анализ "${t.name}"?`))
                        deleteMutation.mutate(t.id);
                    }}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Деактивировать"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Редактировать анализ' : 'Добавить анализ'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) updateMutation.mutate();
            else createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Код" required>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              disabled={!!editingId}
              placeholder="CBC"
              className={inputCls}
            />
          </Field>
          <Field label="Название" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Описание">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Биоматериал">
            <input
              value={form.sampleType}
              onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
              placeholder="Кровь из вены"
              className={inputCls}
            />
          </Field>
          <Field label="Подготовка">
            <input
              value={form.preparation}
              onChange={(e) => setForm({ ...form, preparation: e.target.value })}
              placeholder="Натощак"
              className={inputCls}
            />
          </Field>

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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {editingId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      {pricingId && (
        <PriceEditor
          kind="test"
          itemId={pricingId}
          itemName={tests.find((t) => t.id === pricingId)?.name ?? ''}
          onClose={() => setPricingId(null)}
        />
      )}
    </div>
  );
}

// ───────────────────── Price Editor ─────────────────────

function PriceEditor({
  kind,
  itemId,
  itemName,
  onClose,
}: {
  kind: 'service' | 'test';
  itemId: ID;
  itemName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [centerId, setCenterId] = useState('');
  const [price, setPrice] = useState('');

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const body = { centerId: Number(centerId), price: Number(price), currency: 'RUB' };
      return kind === 'service'
        ? servicesApi.setServicePrice(itemId, body)
        : servicesApi.setTestPrice(itemId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kind === 'service' ? ['services'] : ['lab-tests'] });
      setPrice('');
      setCenterId('');
    },
  });

  return (
    <Modal isOpen={true} onClose={onClose} title={`Цены: ${itemName}`} size="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-900">
          Установите цену для каждого центра. Старые цены автоматически деактивируются.
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex items-end gap-3"
        >
          <Field label="Центр" className="flex-1">
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Выберите…</option>
              {centers.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Цена (₽)" className="w-32">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min={0}
              step={50}
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {mutation.isPending ? '…' : 'Установить'}
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Закрыть
        </button>
      </div>
    </Modal>
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
