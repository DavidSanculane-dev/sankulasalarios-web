import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-medium mb-4">sankulaSalarios</h1>
      <p className="text-gray-600 mb-6">
        Sistema de gestão de assiduidade multi-terminal (ZKTeco, Hikvision, Suprema).
      </p>
      <Link href="/dashboard" className="text-blue-600 underline">
        Ir para o dashboard →
      </Link>
    </main>
  );
}
