import { Suspense } from "react";
import { WaitingSwitch } from "./WaitingSwitch";

export default function Page() {
  return <Suspense><WaitingSwitch /></Suspense>;
}
