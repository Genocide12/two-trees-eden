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
import { Mic2, Cloud, Volume2 } from 'lucide-react';

export default function VoicePicker() {
  const lang = useGame((s) => s.lang);
  const initAudio = useGame((s) => s.initAudio);
  const [open, setOpen] = useState(false);
  const [useServer, setUseServer] = useState(true);
  const [voicesRu, setVoicesRu] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesEn, setVoicesEn] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!open) return;
    // Defer setState to next tick to avoid cascading renders warning
    const t = setTimeout(() => {
      tts.init();
      setVoicesRu(tts.getVoicesForLang('ru'));
      setVoicesEn(tts.getVoicesForLang('en'));
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const handlePickWebVoice = (langCode: 'ru' | 'en', name: string) => {
    initAudio();
    tts.setVoice(langCode, name);
    tts.setUseServerTts(false);
    setUseServer(false);
    const sample = langCode === 'ru' ? 'Да будет свет.' : 'Let there be light.';
    tts.speak(sample, langCode, { rate: 0.95 }, true);
  };

  const handlePickServer = () => {
    initAudio();
    tts.setUseServerTts(true);
    setUseServer(true);
    const sample = lang === 'ru' ? 'Да будет свет. И стал свет.' : 'Let there be light.';
    tts.speak(sample, lang, { rate: 0.95 }, true);
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Server TTS option */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Cloud className="w-3 h-3" />
              {lang === 'ru' ? 'Серверный голос (рекомендуется)' : 'Server voice (recommended)'}
            </Label>
            <button
              onClick={handlePickServer}
              className={`w-full text-left px-3 py-2.5 rounded text-xs border transition-all ${
                useServer
                  ? 'border-[#c9a85a] bg-[#c9a85a]/10 text-[#c9a85a]'
                  : 'border-border hover:border-[#c9a85a]/40 hover:bg-muted/40'
              }`}
            >
              <div className="font-serif flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5" />
                {lang === 'ru' ? 'Естественный русский (онлайн)' : 'Natural Russian (online)'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {lang === 'ru'
                  ? 'Качественный женский голос. Требует интернет.'
                  : 'High-quality female voice. Requires internet.'}
              </div>
            </button>
          </div>

          <div className="border-t border-border/40 pt-3">
            <p className="text-[10px] text-muted-foreground/70 italic mb-2">
              {lang === 'ru'
                ? 'Или выбери голос браузера (офлайн, качество зависит от ОС):'
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
              <div className="space-y-1 max-h-40 overflow-y-auto">
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
              <div className="space-y-1 max-h-40 overflow-y-auto">
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
