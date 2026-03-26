import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: 'Ожидает',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  confirmed: {
    label: 'Подтверждён',
    classes: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  in_progress: {
    label: 'В процессе',
    classes: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  completed: {
    label: 'Завершён',
    classes: 'bg-green-100 text-green-800 border-green-300',
  },
  cancelled: {
    label: 'Отменён',
    classes: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  no_show: {
    label: 'Неявка',
    classes: 'bg-red-100 text-red-800 border-red-300',
  },
  ready: {
    label: 'Готов',
    classes: 'bg-green-100 text-green-800 border-green-300',
  },
  active: {
    label: 'Активен',
    classes: 'bg-blue-100 text-blue-800 border-blue-300',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
