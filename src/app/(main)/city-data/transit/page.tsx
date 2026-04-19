import TransitClient from "./TransitClient";

export const metadata = {
  title: "Transit - Knect",
  description: "LA Metro routes and transit information serving Compton, CA.",
};

export default function TransitPage() {
  return (
    <div className="min-h-screen bg-midnight text-white">
      <TransitClient />
    </div>
  );
}

