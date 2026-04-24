import TransitClient from "./TransitClient";

export const metadata = {
  title: "Transit - Culture",
  description: "LA Metro routes and transit information serving Compton, CA.",
};

export default function TransitPage() {
  return (
    <div className="culture-surface min-h-dvh">
      <TransitClient />
    </div>
  );
}

