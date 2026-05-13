import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!promptEvent) {
    return null;
  }

  return (
    <button
      className="install-button status-pill"
      type="button"
      onClick={() => {
        promptEvent.prompt();
        promptEvent.userChoice.finally(() => setPromptEvent(null));
      }}
    >
      <Download size={16} aria-hidden="true" />
      安装到设备
    </button>
  );
}
