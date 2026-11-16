export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;
  return <div className="toast" role="status"><div><strong>{toast.title}</strong><p>{toast.message}</p></div><button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button></div>;
}
