"use client";

import React, { useState } from "react";
import { DashboardShell } from "./components/layout/dashboard-shell";
import {
  DashboardNavigationProvider,
  useDashboardNavigation,
} from "./components/navigation";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { KanoEaWorkspace } from "@/components/dashboard/kano-ea-workspace";
import { SurveyWizard } from "@/components/wizard/survey-wizard";
import { ReviewQueue } from "@/components/review/review-queue";
import { ResponsesTableView } from "@/components/responses/responses-table-view";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { FieldGuideView } from "@/components/field-guide/field-guide-view";

function DashboardContentRouter() {
  const { pathname, navigate } = useDashboardNavigation();
  const { user, role, setRole, language } = useAuth();

  const [activeEaCode, setActiveEaCode] = useState<string>("KAN-MUN-001");
  const [activeHhId, setActiveHhId] = useState<string | undefined>(undefined);

  const handleStartInterviewWithEa = (eaCode: string, hhId?: string) => {
    setActiveEaCode(eaCode);
    setActiveHhId(hhId);
    navigate("/wizard");
  };

  return (
    <DashboardShell>
      {pathname === "/wizard" ? (
        <SurveyWizard
          initialEaCode={activeEaCode}
          initialHhId={activeHhId}
          interviewerId={user.id}
          onComplete={() => navigate("/")}
          language={language}
        />
      ) : pathname === "/review" ? (
        <ReviewQueue
          currentUserId={user.id}
          role={role}
          language={language}
        />
      ) : pathname === "/responses" ? (
        <ResponsesTableView
          role={role}
          language={language}
        />
      ) : pathname === "/staff" ? (
        <AdminUsersView
          currentRole={role}
          onSwitchRole={setRole}
          language={language}
        />
      ) : pathname === "/guide" ? (
        <FieldGuideView language={language} />
      ) : (
        <KanoEaWorkspace
          language={language}
          onStartInterviewWithEa={handleStartInterviewWithEa}
        />
      )}
    </DashboardShell>
  );
}

export default function DashboardView() {
  return (
    <AuthProvider>
      <DashboardNavigationProvider>
        <DashboardContentRouter />
      </DashboardNavigationProvider>
    </AuthProvider>
  );
}
