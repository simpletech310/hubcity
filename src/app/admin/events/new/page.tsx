import EventForm from "../EventForm";

export default function NewEventPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">New Event</h1>
        <p className="text-sm text-txt-secondary">
          Create a new community event
        </p>
      </div>
      <EventForm />
    </div>
  );
}
