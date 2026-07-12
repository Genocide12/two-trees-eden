'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/lib/game/store';
import { tts } from '@/lib/game/tts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic2 } from 'lucide-react';

export default function VoicePicker() {
  const lang = useGame((s) => s.lang);
  const setVoice = useGame((s) => s.setVoice);
  const voiceRu = useGame((s) => s.voiceRu);
  const voiceEn = useGame((s) => s.voiceEn);
  const initAudio = useGame((s) => s.initAudio);
  const [open, setOpen] = useState(false);
  const [voicesRu, setVoicesRu] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesEn, setVoicesEn] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!open) return;
    // Load voices when dialog opens
    let attempts = 0;
    const load = () => {
      tts.init();
      setVoicesRu(tts.getVoicesForLang('ru'));
      setVoicesEn(tts.getVoicesForLang('en'));
      attempts++;
      if (voicesRu.length === 0 && attempts < 5) {
        setTimeout(load, 300);
      }
    };
    load();
  }, [open]);

  const handlePick = (langCode: 'ru' | 'en', name: string) => {
    initAudio();
    setVoice(langCode, name);
    // Preview the voice
    const sample = langCode === 'ru'
      ? 'Да будет свет. И стал свет.'
      : 'Let there be light. And there was light.';
    tts.speak(sample, langCode, { rate: 0.95 }, true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-[#c9a85a] h-8 w-8 p-0"
          aria-label="Voice settings"
          onClick={() => initAudio()}
        >
          <Mic2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-[#c9a85a]/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#c9a85a] flex items-center gap-2">
            <Mic2 className="w-5 h-5" />
            {lang === 'ru' ? 'Голос озвучки' : 'Narration voice'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === 'ru'
              ? 'Выбери голос для озвучки важных событий. Список зависит от браузера и ОС. Если русский голос плохой — попробуй Chrome или Edge, или установи дополнительные голоса в системе.'
              : 'Choose a voice for narrating important events. The list depends on your browser and OS. If Russian voice sounds bad — try Chrome or Edge, or install additional system voices.'}
          </p>

          {/* Russian voice */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Русский голос
            </Label>
            {voicesRu.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {lang === 'ru'
                  ? 'Русские голоса не найдены в этом браузере.'
                  : 'No Russian voices found in this browser.'}
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {voicesRu.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handlePick('ru', v.name)}
                    className={`w-full text-left px-3 py-2 rounded text-xs border transition-all ${
                      voiceRu === v.name
                        ? 'border-[#c9a85a] bg-[#c9a85a]/10 text-[#c9a85a]'
                        : 'border-border hover:border-[#c9a85a]/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-serif">{v.name}</div>
                    <div className="text-[10px] text-muted-foreground">{v.lang}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* English voice */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              English voice
            </Label>
            {voicesEn.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No English voices found.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {voicesEn.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handlePick('en', v.name)}
                    className={`w-full text-left px-3 py-2 rounded text-xs border transition-all ${
                      voiceEn === v.name
                        ? 'border-[#c9a85a] bg-[#c9a85a]/10 text-[#c9a85a]'
                        : 'border-border hover:border-[#c9a85a]/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-serif">{v.name}</div>
                    <div className="text-[10px] text-muted-foreground">{v.lang}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
