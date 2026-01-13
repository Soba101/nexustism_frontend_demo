import { Toast } from '@/components/ui/wrappers';

interface ToastContainerProps {
  toasts: Array<{id: number, msg: string, type: 'success' | 'info' | 'error'}>;
  onClose: (id: number) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => (
  <div className="fixed bottom-4 right-4 z-[60] flex flex-col space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className="pointer-events-auto">
        <Toast message={t.msg} type={t.type} onClose={() => onClose(t.id)} />
      </div>
    ))}
  </div>
);
