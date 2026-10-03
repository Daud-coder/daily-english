"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav, NavTab } from "@/components/layout/BottomNav";
import { TeacherChat } from "@/components/teacher/TeacherChat";
import { TodayLesson } from "@/components/today/TodayLesson";
import { Vocabulary } from "@/components/words/Vocabulary";
import { ProgressScreen } from "@/components/progress/ProgressScreen";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("teacher");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as NavTab;
      if (tab && ["today", "teacher", "words", "progress"].includes(tab)) {
        setCurrentTab(tab);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {currentTab === "teacher" && <TeacherChat />}
        {currentTab === "today" && (
          <div className="flex-1 overflow-y-auto">
            <TodayLesson />
          </div>
        )}
        {currentTab === "words" && (
          <div className="flex-1 overflow-y-auto">
            <Vocabulary />
          </div>
        )}
        {currentTab === "progress" && (
          <div className="flex-1 overflow-y-auto">
            <ProgressScreen />
          </div>
        )}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
