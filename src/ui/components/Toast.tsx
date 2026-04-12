import { useGameStore } from '../../data/state';

export function Toast() {
  const { toastMessage, toastVisible } = useGameStore();

  return (
    <div className={`toast ${toastVisible ? 'show' : ''}`}>
      <div className="toast-text pixel-text">
        {toastMessage.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
