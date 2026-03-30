import BusinessForm from "../BusinessForm";

export default function NewBusinessPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Add Business</h1>
        <p className="text-sm text-txt-secondary">
          Create a new business listing
        </p>
      </div>
      <BusinessForm />
    </div>
  );
}
