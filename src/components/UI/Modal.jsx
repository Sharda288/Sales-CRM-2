export default function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>x</button></div>{children}</div></div>;
}
