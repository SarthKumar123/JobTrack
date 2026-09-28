import { CheckSquare } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TaskList from "@/components/TaskList";
export default function FollowUps({
  tasks,
  pending,
  taskFilter,
  setTaskFilter,
  apps,
  complete,
}) {
  const visibleTasks = tasks
    .filter((task) => (taskFilter === "Completed" ? task.done : !task.done))
    .sort((first, second) => first.date.localeCompare(second.date));
  return (
    <>
      <Tabs value={taskFilter} onValueChange={setTaskFilter}>
        <TabsList>
          <TabsTrigger value="Pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="Completed">
            Completed ({tasks.filter((t) => t.done).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <article className="panel full-tasks">
        <TaskList list={visibleTasks} apps={apps} complete={complete} />
        {visibleTasks.length === 0 && (
          <div className="empty">
            <CheckSquare />
            <h2>
              {taskFilter === "Pending"
                ? "All caught up"
                : "No completed tasks yet"}
            </h2>
            <p>
              {taskFilter === "Pending"
                ? "Your next steps are clear."
                : "Complete a follow-up to see it here."}
            </p>
          </div>
        )}
      </article>
    </>
  );
}
