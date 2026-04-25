import { permanentRedirect } from "next/navigation";

export default function ReelsLegacyRedirect() {
  permanentRedirect("/moments");
}
