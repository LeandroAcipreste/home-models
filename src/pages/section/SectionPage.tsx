import { Link } from "react-router-dom";

export type SectionPageProps = {
  title: string;
};

export default function SectionPage({ title }: SectionPageProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 pb-28 text-zinc-100 sm:pb-24">
      <h1 className="text-center text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="max-w-md text-center text-sm text-zinc-500">
        Conteúdo desta seção em breve.
      </p>
      <Link
        to="/"
        className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
