import { TaskCard } from './Card';
import { Column as ColumnType, Task } from './types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

type ColumnProps = {
    column: ColumnType,
    tasks: Task[]
};

export function Column({ column, tasks }: ColumnProps) {

    const {setNodeRef} = useDroppable({id: column.id})
    
    return (
        <div className='w-80 flex flex-col rounded-lg bg-neutral-800 p-4 justify-center items-center'>
            <h2 className='mb-4 font-semibold text-neutral-100 '>
                {column.title}
            </h2>
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className='flex flex-1 flex-col gap-4 min-h-[200px] w-full'>
                    {tasks.map(task => {
                        return(
                            <TaskCard key={task.id} task={task} />
                        )
                    })}
                </div>
            </SortableContext>
        </div>
    )

}