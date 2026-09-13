import { AudioSettings } from "@/components/settings/AudioSettings";
import { DisplaySettings } from "@/components/settings/DisplaySettings";
import { ExerciseOverridesSettings } from "@/components/settings/ExerciseOverridesSettings";
import { GymSettings } from "@/components/settings/GymSettings";
import { WeeklyPlanSettings } from "@/components/settings/WeeklyPlanSettings";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white font-industrial p-4">Ajustes</h1>
      <GymSettings />
      <WeeklyPlanSettings />
      <DisplaySettings />
      <AudioSettings />
      <ExerciseOverridesSettings />
    </div>
  );
}