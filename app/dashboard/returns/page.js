import ButtonAccount from "@/components/ButtonAccount";
import AmazonReturns from "@/components/AmazonReturns";

export const dynamic = "force-dynamic";

export default async function Returns() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-[1200px] mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">
          Returns Analysis
        </h1>
      </section>

      <section className="mt-8">
        <AmazonReturns />
      </section>
    </main>
  );
}
