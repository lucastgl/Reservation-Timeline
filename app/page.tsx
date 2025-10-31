"use client";
import Image from "next/image";
import ReservationGrid from "../components/ReservationGrid";

import { useState } from "react";
import type { Task, Columns as ColumnType } from "../components/types";
import { Column } from "../components/Column";

const COLUMNS: ColumnType[] = [
  { id: "TO_DO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
]

const INITIAL_TASKS: Task[] = [
  { 
    id: "1", 
    title: "Task 1", 
    description: "This is task 1",
    status: "TO_DO" 
  },
  { 
    id: "2", 
    title: "Task 2", 
    description: "This is task 2",
    status: "IN_PROGRESS"
  },
  { 
    id: "3", 
    title: "Task 3", 
    description: "This is task 3",
    status: "DONE"
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  return (
    <div className="flex min-h-screen w-screen ">
      <main className="flex min-h-screen w-full flex-col">
        {/* <ReservationGrid /> */}
        <div className="flex gap-8">
          {COLUMNS.map((column) => {
            return (
              <Column 
                key={column.id} 
                column={column} 
                tasks={tasks.filter(task => task.status === column.id)} />
            );
          })}
        </div>
      </main>
    </div>
  );
}
