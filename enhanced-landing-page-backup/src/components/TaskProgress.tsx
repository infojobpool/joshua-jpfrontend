import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface TaskProgressProps {
    taskStatus: boolean;
    isTaskPoster: boolean;
    markAsComplete: () => void;
  }
  
  export function TaskProgress({ taskStatus, isTaskPoster, markAsComplete }: TaskProgressProps) {
    if (!taskStatus) return null;
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Progress</CardTitle>
          <CardDescription>Track the progress of this task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Task assigned</span>
            </div>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
              </div>
              <span>In progress</span>
            </div>
            <span className="text-sm text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground"></div>
              <span>Completed</span>
            </div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground"></div>
              <span>Payment</span>
            </div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground"></div>
              <span>Reviewed</span>
            </div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={markAsComplete}>
            {isTaskPoster ? "Mark as Complete" : "Request Completion"}
          </Button>
        </CardFooter>
      </Card>
    );
  }