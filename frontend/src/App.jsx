import Header from "./components/layout/Header";
import HomeSection from "./components/sections/HomeSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import WorkspaceSection from "./components/sections/WorkspaceSection";
import Toast from "./components/ui/Toast";
import { useMedicalAssistant } from "./hooks/useMedicalAssistant";

function App() {
  const assistant = useMedicalAssistant();

  return (
    <div className="min-h-screen bg-clinic-surface text-clinic-ink">
      <Header />
      <main>
        <HomeSection />
        <FeaturesSection />
        <WorkspaceSection assistant={assistant} />
      </main>
      {assistant.toast && <Toast toast={assistant.toast} onClose={assistant.dismissToast} />}
    </div>
  );
}

export default App;
