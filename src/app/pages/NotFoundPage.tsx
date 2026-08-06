import { NoIndexSeo } from "../components/Seo";

export default function NotFoundPage() {
  return (
    <>
      <NoIndexSeo
        title="Página no encontrada | El Molino"
        description="La página solicitada no existe."
      />

      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          La página que buscás no existe o fue eliminada.
        </p>
        <a href="/" className="mt-6 underline">
          Volver al inicio
        </a>
      </main>
    </>
  );
}