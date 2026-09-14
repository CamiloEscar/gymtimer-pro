import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <h1 className="text-2xl font-bold text-white font-industrial">Historial</h1>
      <HistoryList />
    </div>
  );
}