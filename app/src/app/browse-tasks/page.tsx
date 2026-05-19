import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BrowseTasksPage } from "../../components/mainpage/pages/browse-tasks-page";

export default function BrowseTasks() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BrowseTasksPage />
    </Suspense>
  );
}
