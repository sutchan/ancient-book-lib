// components/reader/useSpeechSynthesis.ts v1.18.1
"use client";

import { useState, useEffect, useCallback } from "react";
import { toSimplified } from "@/lib/t2s";

export function useSpeechSynthesis(pageParagraphs: string[], simple: boolean, chapterIdx: number, pageIdx: number) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [chapterIdx, pageIdx]);

  const handleToggleSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("当前浏览器不支持语音朗读功能（Web Speech API）。");
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeaking) {
      if (synth.paused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      synth.cancel();
      const rawText = pageParagraphs.map((p) => (simple ? toSimplified(p) : p)).join("。");
      if (!rawText.trim()) return;

      const utterance = new SpeechSynthesisUtterance(rawText);
      utterance.lang = "zh-CN";
      utterance.rate = 0.95;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      synth.speak(utterance);
    }
  }, [isSpeaking, pageParagraphs, simple]);

  const handleStopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    handleToggleSpeech,
    handleStopSpeech,
  };
}
