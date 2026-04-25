import { permanentRedirect } from "next/navigation";

export default function NewReelLegacyRedirect() {
  permanentRedirect("/moments/new");
}
