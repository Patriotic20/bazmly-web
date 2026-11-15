import { Suspense } from "react";
import { DishWizard } from "./DishWizard";

export default function Page() {
  return <Suspense><DishWizard /></Suspense>;
}
