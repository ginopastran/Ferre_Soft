import { RubroList } from "./components/RubroList";

export default function RubrosPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-cyan-gradient">
        Administración de Rubros
      </h1>
      <RubroList />
    </div>
  );
}
