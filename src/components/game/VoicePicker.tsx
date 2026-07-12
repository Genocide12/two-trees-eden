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
import { Mic2, Cloud, Volume2, Sun, Moon } from 'lucide-react';

export default function VoicePicker() {
  const lang = useGame((s) => s.lang);
  const initAudio = useGame((s) => s.initAudio);
  const [open, setOpen] = useState(false);
  const [voicesRu, setVoicesRu] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesEn, setVoicesEn] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      tts.init();
      setVoicesRu(tts.getVoicesForLang('ru'));
      setVoicesEn(tts.getVoicesForLang('en'));
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // Preview a server voice (svetlana or dmitry)
  const previewServerVoice = (voiceKey: 'svetlana' | 'dmitry') => {
    initAudio();
    // For preview, set as default voice key
    tts.setDefaultVoiceKey(voiceKey);
    tts.setUseServerTts(true);
    const sample = lang === 'ru'
      ? 'Да будет свет. И стал свет.'
      : 'Let there be light. And there was light.';
    tts.speak(sample, lang, { side: null }, true);
  };

  // Pick a browser voice as fallback (also disables server TTS)
  const handlePickWebVoice = (langCode: 'ru' | 'en', name: string) => {
    initAudio();
    tts.setVoice(langCode, name);
    tts.setUseServerTts(false);
    const sample = langCode === 'ru' ? 'Да будет свет.' : 'Let there be light.';
    tts.speak(sample, langCode, { side: null }, true);
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
            {lang === 'ru' ? 'Голоса озвучки' : 'Narration voices'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Server TTS — automatic per-side assignment */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Cloud className="w-3 h-3" />
              {lang === 'ru' ? 'Серверные голоса (авто)' : 'Server voices (auto)'}
            </Label>
            <div className="space-y-1.5 text-xs text-muted-foreground/80 mb-2 leading-relaxed">
              {lang === 'ru'
                ? 'Голоса назначаются автоматически по стороне: Свет — Светлана (женский), Тьма — Дмитрий (мужской).'
                : 'Voices are auto-assigned by side: Light → Svetlana (female), Dark → Dmitry (male).'}
            </div>

            {/* Light voice preview */}
            <button
              onClick={() => previewServerVoice('svetlana')}
              className="w-full text-left px-3 py-2.5 rounded text-xs border border-border hover:border-[#c9a85a]/40 hover:bg-muted/40 transition-all flex items-center gap-3"
            >
              <Sun className="w-4 h-4 text-[#c9a85a] shrink-0" />
              <div className="flex-grow">
                <div className="font-serif text-[#c9a85a]">
                  {lang === 'ru' ? 'Светлана (Свет)' : 'Svetlana (Light)'}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {lang === 'ru' ? 'Женский · используется для Света' : 'Female · used for Light side'}
                </div>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>

            {/* Dark voice preview */}
            <button
              onClick={() => previewServerVoice('dmitry')}
              className="w-full text-left px-3 py-2.5 rounded text-xs border border-border hover:border-[#c45656]/40 hover:bg-muted/40 transition-all flex items-center gap-3"
            >
              <Moon className="w-4 h-4 text-[#c45656] shrink-0" />
              <div className="flex-grow">
                <div className="font-serif text-[#c45656]">
                  {lang === 'ru' ? 'Дмитрий (Тьма)' : 'Dmitry (Dark)'}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {lang === 'ru' ? 'Мужской · используется для Тьмы' : 'Male · used for Dark side'}
                </div>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          </div>

          <div className="border-t border-border/40 pt-3">
            <p className="text-[10px] text-muted-foreground/70 italic mb-2">
              {lang === 'ru'
                ? 'Или выбери браузерный голос (офлайн, качество зависит от ОС):'
                : 'Or pick a browser voice (offline, quality depends on OS):'}
            </p>
          </div>

          {/* Browser Russian voices */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              {lang === 'ru' ? 'Браузерные русские голоса' : 'Browser Russian voices'}
            </Label>
            {voicesRu.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {lang === 'ru' ? 'Не найдены в этом браузере.' : 'None found in this browser.'}
              </p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {voicesRu.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handlePickWebVoice('ru', v.name)}
                    className="w-full text-left px-3 py-2 rounded text-xs border border-border hover:border-[#c9a85a]/40 hover:bg-muted/40 transition-all"
                  >
                    <div className="font-serif">{v.name}</div>
                    <div className="text-[10px] text-muted-foreground">{v.lang}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Browser English voices */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              English browser voices
            </Label>
            {voicesEn.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">None found.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {voicesEn.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handlePickWebVoice('en', v.name)}
                    className="w-full text-left px-3 py-2 rounded text-xs border border-border hover:border-[#c9a85a]/40 hover:bg-muted/40 transition-all"
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
