import { AudioSettings } from "@/components/settings/AudioSettings";
import { DisplaySettings } from "@/components/settings/DisplaySettings";
import { ExerciseOverridesSettings } from "@/components/settings/ExerciseOverridesSettings";
import { GymSettings } from "@/components/settings/GymSettings";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white font-industrial p-4">Configuración</h1>
      <GymSettings />
      <DisplaySettings />
      <AudioSettings />
      <ExerciseOverridesSettings />
    </div>
  );
}