import { Suspense } from "react";
import { Orders } from "./Orders";

export default function Page() {
  return <Suspense><Orders /></Suspense>;
}
