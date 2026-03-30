import ResourceForm from "../ResourceForm";

export default function NewResourcePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Add Resource</h1>
        <p className="text-sm text-txt-secondary">
          Create a new community resource
        </p>
      </div>
      <ResourceForm />
    </div>
  );
}
