"use client";
import ReservationGrid from "../components/ReservationGrid";
import { mockReservations } from "../mocks/mockReservas";

import { useState } from "react";
import type { Task, Column as ColumnType } from "../components/types";
import { Column } from "../components/Column";
import { DndContext, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

const COLUMNS: ColumnType[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "Task 1",
    description: "This is task 1",
    status: "TODO",
  },
  {
    id: "2",
    title: "Task 2",
    description: "This is task 2",
    status: "IN_PROGRESS",
  },
  {
    id: "3",
    title: "Task 3",
    description: "This is task 3",
    status: "DONE",
  },
  {
    id: "4",
    title: "Task 4",
    description: "This is task 4",
    status: "TODO",
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((task) => task.id === activeId);
    const overTask = tasks.find((task) => task.id === overId);

    if (!activeTask) return;

    // Si estamos arrastrando sobre otra tarea (reordenamiento)
    if (overTask) {
      const activeIndex = tasks.findIndex((task) => task.id === activeId);
      const overIndex = tasks.findIndex((task) => task.id === overId);

      if (activeTask.status !== overTask.status) {
        // Mover a otra columna
        activeTask.status = overTask.status;
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      } else {
        // Reordenar dentro de la misma columna
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    } else {
      // Si estamos arrastrando sobre una columna vacía
      const newStatus = overId as Task["status"];
      if (activeTask.status !== newStatus) {
        setTasks(
          tasks.map((task) =>
            task.id === activeId ? { ...task, status: newStatus } : task
          )
        );
      }
    }
  }

  function handDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((task) => task.id === activeId);

    if (!activeTask) return;

    // Si soltamos sobre una columna (no sobre otra tarea)
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    
    if (isOverColumn) {
      const newStatus = overId as Task["status"];
      if (activeTask.status !== newStatus) {
        setTasks(
          tasks.map((task) =>
            task.id === activeId ? { ...task, status: newStatus } : task
          )
        );
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-screen justify-center items-center">
      <ReservationGrid reservations={mockReservations} />
      {/* <div className="flex gap-8">
        <DndContext onDragEnd={handDragEnd} onDragOver={handleDragOver}>
          {COLUMNS.map((column) => {
            return (
              <Column
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.status === column.id)}
              />
            );
          })}
        </DndContext>
      </div> */}
    </div>
  );
}
