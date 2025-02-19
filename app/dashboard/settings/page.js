import ButtonAccount from "@/components/ButtonAccount";
import CogUpload from "@/components/CogUpload";
import ReturnsUpload from "@/components/ReturnsUpload";
import OrdersUpload from "@/components/OrdersUpload";
import ShipmentUpload from "@/components/ShipmentUpload";

export default function Settings() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Settings</h1>

        <CogUpload />
        <ReturnsUpload />
        <OrdersUpload />
        <ShipmentUpload />
      </section>
    </main>
  );
}
