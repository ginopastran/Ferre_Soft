export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No hay conexión a internet</h1>
        <p>La aplicación está en modo offline.</p>
        <p>Algunas funcionalidades pueden estar limitadas.</p>
      </div>
    </div>
  );
}
